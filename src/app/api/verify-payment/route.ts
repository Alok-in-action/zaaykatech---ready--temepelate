import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/verify-payment
 * Verifies Razorpay checkout signature.
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature.
 * Return success only if signatures match.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Accept standard parameter names (both snake_case and camelCase)
    const orderId = body.razorpay_order_id || body.order_id || body.orderId;
    const paymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
    const signature = body.razorpay_signature || body.signature;
    const restaurantId = body.restaurant_id || body.restaurantId;

    // 1. Missing fields check -> return 400
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
        },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["']|["']$/g, '');
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay Key Secret is not configured on server' },
        { status: 500 }
      );
    }

    // 2. Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // 3. Compare generated signature with razorpay_signature using timingSafeEqual
    let isMatch = false;
    try {
      const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
      const signatureBuf = Buffer.from(signature, 'utf-8');
      if (expectedBuf.length === signatureBuf.length) {
        isMatch = crypto.timingSafeEqual(expectedBuf, signatureBuf);
      }
    } catch {
      isMatch = false;
    }

    // 4. Signature mismatch -> return 400, do NOT mark as paid
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Signature verification failed. The payment could not be authenticated.',
        },
        { status: 400 }
      );
    }

    // 5. If linked to a restaurant, idempotently update restaurant subscription status
    if (restaurantId && restaurantId !== '00000000-0000-0000-0000-000000000000') {
      try {
        const supabase = createServiceClient();
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id, subscription_end_date, published_at')
          .eq('id', restaurantId)
          .single();

        if (restaurant) {
          const now = new Date();
          const baseDate =
            restaurant.subscription_end_date && new Date(restaurant.subscription_end_date) > now
              ? new Date(restaurant.subscription_end_date)
              : now;
          const newEndDate = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);

          await supabase
            .from('restaurants')
            .update({
              site_status: 'active',
              subscription_end_date: newEndDate.toISOString(),
            })
            .eq('id', restaurantId);
        }
      } catch (dbErr) {
        console.warn('Note: Signature verified, but could not update restaurant record:', dbErr);
      }
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (err: any) {
    console.error('Error in /api/verify-payment:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while verifying payment' },
      { status: 500 }
    );
  }
}
