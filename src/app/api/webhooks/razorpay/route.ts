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

    // We process successful payment captures and order payments
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ received: true, skipped: 'No payment entity' });
      }

      const paymentId = paymentEntity.id;
      const amountPaise = paymentEntity.amount;
      const restaurantId = paymentEntity.notes?.restaurantId;

      if (!restaurantId) {
        console.warn('Webhook received payment without restaurantId in notes:', paymentId);
        return NextResponse.json({ received: true, skipped: 'No restaurantId' });
      }

      const serviceClient = createServiceClient();

      // 3. Idempotency Check: check if already processed
      const { data: existingPayment } = await serviceClient
        .from('payments')
        .select('id, status')
        .eq('external_payment_id', paymentId)
        .maybeSingle();

      if (existingPayment && existingPayment.status === 'succeeded') {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // 4. Record payment in payments table
      await serviceClient.from('payments').insert({
        restaurant_id: restaurantId,
        provider: 'razorpay',
        external_payment_id: paymentId,
        idempotency_key: paymentId,
        amount_paise: amountPaise || YEARLY_PLAN_PRICE_PAISE,
        status: 'succeeded',
        raw_webhook_payload: event,
      });

      // 5. Fetch restaurant to compute new subscription dates
      const { data: restaurant } = await serviceClient
        .from('restaurants')
        .select('id, slug, subscription_end_date, published_at')
        .eq('id', restaurantId)
        .single();

      if (!restaurant) {
        console.error('Restaurant not found for webhook activation:', restaurantId);
        return NextResponse.json({ received: true, error: 'Restaurant not found' });
      }

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

      // 6. Ensure default plan exists
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

      if (planId) {
        await serviceClient.from('subscriptions').insert({
          restaurant_id: restaurantId,
          plan_id: planId,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: newEndDate.toISOString(),
          renewal_amount_paise: YEARLY_PLAN_PRICE_PAISE,
          payment_provider: 'razorpay',
          external_payment_id: paymentId,
        });
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
