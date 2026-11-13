import crypto from 'node:crypto';

export const YEARLY_PLAN_PRICE_PAISE = 299900; // ₹2,999 in paise
export const YEARLY_PLAN_DURATION_DAYS = 365;

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Creates an order in Razorpay for a restaurant subscription.
 */
export async function createRazorpayOrder(params: {
  restaurantId: string;
  amountPaise?: number;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  const rawKeyId = process.env.RAZORPAY_KEY_ID?.trim();
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const amount = params.amountPaise || YEARLY_PLAN_PRICE_PAISE;
  const receipt = params.receipt || `rcpt_${params.restaurantId.slice(0, 8)}_${Date.now()}`;

  // If Razorpay keys are not configured or placeholder in development, return a mock order
  if (!rawKeyId || !rawKeySecret || rawKeyId === 'placeholder_razorpay_key_id') {
    return {
      id: `order_mock_${Date.now()}`,
      amount,
      currency: 'INR',
      receipt,
      status: 'created',
    };
  }

  const keyId = rawKeyId.replace(/^["']|["']$/g, '');
  const keySecret = rawKeySecret.replace(/^["']|["']$/g, '');

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        restaurantId: params.restaurantId,
        ...params.notes,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(
        'Razorpay authentication failed (401): Invalid Key ID or Key Secret. Please verify your Razorpay API keys.'
      );
    }
    throw new Error(`Razorpay Order creation failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Verifies Razorpay checkout payment signature using HMAC SHA-256.
 * Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["']|["']$/g, '');
  if (!secret || secret === 'placeholder_razorpay_key_secret') {
    // In mock/test development environment
    return params.signature.startsWith('mock_sig_') || params.signature.length > 10;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(params.signature, 'utf-8')
  );
}

/**
 * Verifies Razorpay webhook signature using HMAC SHA-256.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}
