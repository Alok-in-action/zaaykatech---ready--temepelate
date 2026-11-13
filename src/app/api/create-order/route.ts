import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

/**
 * POST /api/create-order
 * Creates a Razorpay order via Razorpay API.
 * Request: { amount (paise), currency, receipt, notes }
 * Minimum amount: 100 paise
 * Return: { order_id, amount, currency }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const notes = body.notes || {};

    // 1. Validate amount >= 100 paise
    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1)' },
        { status: 400 }
      );
    }

    const rawKeyId = process.env.RAZORPAY_KEY_ID?.trim();
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!rawKeyId || !rawKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) not configured' },
        { status: 500 }
      );
    }

    const keyId = rawKeyId.replace(/^["']|["']$/g, '');
    const keySecret = rawKeySecret.replace(/^["']|["']$/g, '');

    // 2. Call Razorpay API: POST https://api.razorpay.com/v1/orders
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt,
        notes,
      }),
    });

    // 3. Handle auth failures (return 401)
    if (response.status === 401) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Razorpay authentication failed: Invalid Key ID or Key Secret.',
          details: errData,
        },
        { status: 401 }
      );
    }

    // 4. Handle other Razorpay API errors (return 500)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errData.error?.description || 'Failed to create order with Razorpay',
          details: errData,
        },
        { status: 500 }
      );
    }

    const order = await response.json();

    // 5. Return: { order_id, amount, currency } along with public key
    return NextResponse.json({
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    });
  } catch (err: any) {
    console.error('Error in /api/create-order:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while creating order' },
      { status: 500 }
    );
  }
}
