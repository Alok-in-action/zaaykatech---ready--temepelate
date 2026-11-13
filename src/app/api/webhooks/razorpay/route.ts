import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  verifyRazorpayWebhookSignature,
  YEARLY_PLAN_PRICE_PAISE,
  YEARLY_PLAN_DURATION_DAYS,
} from '@/lib/payments/razorpay';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // 1. Verify cryptographic webhook signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Razorpay webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Handle failed payments
    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const paymentId = paymentEntity?.id || `failed_${Date.now()}`;
      const restaurantId = paymentEntity?.notes?.restaurantId;
      const amountPaise = paymentEntity?.amount || YEARLY_PLAN_PRICE_PAISE;

      if (restaurantId) {
        const serviceClient = createServiceClient();

        // Validate restaurant exists before writing to database
        const { data: restCheck } = await serviceClient
          .from('restaurants')
          .select('id')
          .eq('id', restaurantId)
          .maybeSingle();

        if (restCheck) {
          const idempotencyKey = `failed_${paymentId}`;

          const { data: existingPayment } = await serviceClient
            .from('payments')
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();

          if (!existingPayment) {
            await serviceClient.from('payments').insert({
              restaurant_id: restaurantId,
              provider: 'razorpay',
              external_payment_id: paymentId,
              idempotency_key: idempotencyKey,
              amount_paise: amountPaise,
              status: 'failed',
              raw_webhook_payload: event,
            });

            await serviceClient.from('audit_logs').insert({
              restaurant_id: restaurantId,
              action: 'payment_failed_webhook',
              metadata: {
                payment_id: paymentId,
                error_code: paymentEntity?.error_code,
                error_description: paymentEntity?.error_description,
                error_reason: paymentEntity?.error_reason,
              },
            });
          }
        }
      }

      return NextResponse.json({ received: true, event: 'payment.failed', status: 'recorded' });
    }

    // We process successful payment captures and order payments
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ error: 'No payment entity in webhook payload' }, { status: 400 });
      }

      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const currency = paymentEntity.currency;
      const amountPaise = paymentEntity.amount;
      const restaurantId = paymentEntity.notes?.restaurantId;

      // 3. Validate payment ID and Order/Payment relationship
      if (!paymentId || typeof paymentId !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid payment id' }, { status: 400 });
      }

      if (!orderId || typeof orderId !== 'string' || !orderId.startsWith('order_')) {
        console.warn('Webhook rejected: Payment missing valid order_id relationship:', { paymentId, orderId });
        return NextResponse.json({ error: 'Missing or invalid order relationship' }, { status: 400 });
      }

      // 4. Validate expected currency (must be INR)
      if (!currency || currency.toUpperCase() !== 'INR') {
        console.warn('Webhook rejected: Invalid currency:', { paymentId, currency });
        return NextResponse.json({ error: 'Invalid currency: expected INR' }, { status: 400 });
      }

      // 5. Validate expected amount (must be positive integer, minimum ₹1 / 100 paise)
      if (!amountPaise || typeof amountPaise !== 'number' || amountPaise < 100) {
        console.warn('Webhook rejected: Invalid payment amount:', { paymentId, amountPaise });
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      const expectedAmount = paymentEntity.notes?.expectedAmount
        ? Number(paymentEntity.notes.expectedAmount)
        : null;
      if (expectedAmount && amountPaise < expectedAmount) {
        console.warn('Webhook rejected: Amount paid is less than expected:', {
          paymentId,
          amountPaise,
          expectedAmount,
        });
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      // 6. Validate restaurant existence
      if (!restaurantId || typeof restaurantId !== 'string') {
        console.warn('Webhook received payment without restaurantId in notes:', paymentId);
        return NextResponse.json({ error: 'Missing restaurantId in payment notes' }, { status: 400 });
      }

      const serviceClient = createServiceClient();

      const { data: restaurant, error: restError } = await serviceClient
        .from('restaurants')
        .select('id, slug, subscription_end_date, published_at')
        .eq('id', restaurantId)
        .maybeSingle();

      if (restError || !restaurant) {
        console.error('Webhook rejected: Restaurant not found for webhook activation:', restaurantId);
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }

      // 7. Idempotency Check & Database-level uniqueness for payments
      const { data: existingPayment } = await serviceClient
        .from('payments')
        .select('id, status')
        .eq('external_payment_id', paymentId)
        .maybeSingle();

      if (existingPayment && existingPayment.status === 'succeeded') {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // 8. Record payment in payments table
      if (!existingPayment) {
        const { error: insertPayErr } = await serviceClient.from('payments').insert({
          restaurant_id: restaurantId,
          provider: 'razorpay',
          external_payment_id: paymentId,
          idempotency_key: paymentId,
          amount_paise: amountPaise,
          status: 'succeeded',
          raw_webhook_payload: event,
        });

        if (insertPayErr && !insertPayErr.message.includes('duplicate')) {
          console.error('Failed to insert payment record:', insertPayErr.message);
        }
      } else {
        await serviceClient
          .from('payments')
          .update({
            status: 'succeeded',
            amount_paise: amountPaise,
            raw_webhook_payload: event,
          })
          .eq('id', existingPayment.id);
      }

      // 9. Compute subscription duration dates
      const now = new Date();
      let baseDate = now;
      if (restaurant.subscription_end_date) {
        const existingEnd = new Date(restaurant.subscription_end_date);
        if (existingEnd > now) {
          baseDate = existingEnd;
        }
      }

      const newEndDate = new Date(baseDate.getTime() + YEARLY_PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const formattedEndDate = newEndDate.toISOString().split('T')[0];

      // 10. Ensure default plan exists
      let planId: string | null = null;
      const { data: planData } = await serviceClient
        .from('plans')
        .select('id')
        .eq('slug', 'yearly-launch')
        .maybeSingle();

      if (planData) {
        planId = planData.id;
      } else {
        const { data: createdPlan } = await serviceClient
          .from('plans')
          .insert({
            name: 'Yearly Pro Plan',
            slug: 'yearly-launch',
            price_paise: YEARLY_PLAN_PRICE_PAISE,
            duration_days: YEARLY_PLAN_DURATION_DAYS,
            features: { unlimited_items: true, ai_import: true, custom_branding: true },
            is_active: true,
          })
          .select('id')
          .single();
        if (createdPlan) planId = createdPlan.id;
      }

      // 11. Database-level uniqueness for subscriptions
      if (planId) {
        const { data: existingSub } = await serviceClient
          .from('subscriptions')
          .select('id')
          .eq('external_payment_id', paymentId)
          .maybeSingle();

        if (!existingSub) {
          await serviceClient.from('subscriptions').insert({
            restaurant_id: restaurantId,
            plan_id: planId,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: newEndDate.toISOString(),
            renewal_amount_paise: amountPaise,
            payment_provider: 'razorpay',
            external_payment_id: paymentId,
          });
        }
      }

      // 7. Update restaurant status and subscription_end_date
      // Reactivates the same public QR menu URL immediately
      await serviceClient
        .from('restaurants')
        .update({
          subscription_end_date: formattedEndDate,
          site_status: 'active',
          status: restaurant.published_at ? 'published' : 'draft',
        })
        .eq('id', restaurantId);

      // 8. Log audit log
      await serviceClient.from('audit_logs').insert({
        restaurant_id: restaurantId,
        action: 'subscription_activated_webhook',
        metadata: {
          payment_id: paymentId,
          amount_paise: amountPaise,
          subscription_end_date: formattedEndDate,
        },
      });

      revalidatePath(`/r/${restaurant.slug}`);
      revalidatePath('/owner/billing');
      revalidatePath('/owner/settings');

      return NextResponse.json({ received: true, activated: true, endDate: formattedEndDate });
    }

    return NextResponse.json({ received: true, skipped: 'Unprocessed event' });
  } catch (err: any) {
    console.error('Razorpay webhook handling error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
