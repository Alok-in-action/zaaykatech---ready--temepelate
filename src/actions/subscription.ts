'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  YEARLY_PLAN_PRICE_PAISE,
  YEARLY_PLAN_DURATION_DAYS,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
} from '@/lib/payments/razorpay';
import { revalidatePath } from 'next/cache';

/**
 * Creates a Razorpay checkout order for the yearly subscription.
 */
export async function createSubscriptionOrder(restaurantId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in to upgrade.' };
  }

  // Resolve authenticated user's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return { success: false, error: 'Unauthorized: Owner profile not found.' };
  }

  // Verify ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, name, slug')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (restError || !restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Unauthorized: You do not own this restaurant.' };
  }

  try {
    const order = await createRazorpayOrder({
      restaurantId,
      amountPaise: YEARLY_PLAN_PRICE_PAISE,
      notes: {
        ownerProfileId: profile.id,
        restaurantSlug: restaurant.slug,
      },
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || process.env.RAZORPAY_KEY_ID?.trim() || '';

    return {
      success: true,
      data: {
        orderId: order.id,
        amountPaise: order.amount,
        currency: order.currency,
        keyId,
        restaurantName: restaurant.name,
        userEmail: user.email || '',
      },
    };
  } catch (err: any) {
    console.error('Failed to create Razorpay order:', err);
    return { success: false, error: err.message || 'Could not initiate checkout.' };
  }
}

/**
 * Idempotently activates or extends a yearly subscription after verified payment.
 */
export async function activateSubscriptionPayment(params: {
  restaurantId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { restaurantId, orderId, paymentId, signature } = params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Resolve authenticated user's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return { success: false, error: 'Unauthorized: Owner profile not found.' };
  }

  // 1. Verify ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, slug, subscription_end_date, published_at')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (restError || !restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Unauthorized: You do not own this restaurant.' };
  }

  // 2. Verify Razorpay cryptographic signature
  const isSignatureValid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature,
  });

  if (!isSignatureValid) {
    return { success: false, error: 'Invalid payment signature. Transaction could not be verified.' };
  }

  // 3. Process idempotent activation with service role
  const serviceClient = createServiceClient();

  // Check if this payment was already processed
  const { data: existingPayment } = await serviceClient
    .from('payments')
    .select('id, status')
    .eq('external_payment_id', paymentId)
    .maybeSingle();

  if (existingPayment && existingPayment.status === 'succeeded') {
    return {
      success: true,
      message: 'Subscription already active.',
      data: {
        subscriptionEndDate: restaurant.subscription_end_date || '',
        status: 'active',
      },
    };
  }

  // Record payment in payments table
  await serviceClient.from('payments').insert({
    restaurant_id: restaurantId,
    provider: 'razorpay',
    external_payment_id: paymentId,
    idempotency_key: paymentId,
    amount_paise: YEARLY_PLAN_PRICE_PAISE,
    status: 'succeeded',
    raw_webhook_payload: { orderId, paymentId, signature },
  });

  // Calculate new subscription end date:
  // If restaurant has an active subscription in the future, extend from that date; otherwise, from now.
  const now = new Date();
  let baseDate = now;
  if (restaurant.subscription_end_date) {
    const existingEnd = new Date(restaurant.subscription_end_date);
    if (existingEnd > now) {
      baseDate = existingEnd;
    }
  }

  const newEndDate = new Date(baseDate.getTime() + YEARLY_PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const formattedEndDate = newEndDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Ensure yearly plan exists or get its id
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

  // Insert subscription record if planId is available
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

  // Update restaurant status and subscription_end_date
  // Immediately reactivates the same public QR menu URL
  const { error: updateError } = await serviceClient
    .from('restaurants')
    .update({
      subscription_end_date: formattedEndDate,
      site_status: 'active',
      status: restaurant.published_at ? 'published' : 'draft',
    })
    .eq('id', restaurantId);

  if (updateError) {
    console.error('Failed to update restaurant subscription status:', updateError);
    return {
      success: false,
      error: `Failed to update restaurant subscription: ${updateError.message}`,
    };
  }

  // Log audit event
  await serviceClient.from('audit_logs').insert({
    actor_id: profile.id,
    restaurant_id: restaurantId,
    action: 'subscription_activated',
    metadata: {
      payment_id: paymentId,
      order_id: orderId,
      amount_paise: YEARLY_PLAN_PRICE_PAISE,
      subscription_end_date: formattedEndDate,
    },
  });

  revalidatePath('/owner/billing');
  revalidatePath('/owner/settings');
  revalidatePath(`/r/${restaurant.slug}`);

  return {
    success: true,
    data: {
      subscriptionEndDate: formattedEndDate,
      status: 'active',
    },
  };
}

/**
 * Retrieves the current subscription and trial status for the restaurant.
 */
export async function getSubscriptionStatus(restaurantId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, status, site_status, trial_ends_at, subscription_end_date, published_at')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (error || !restaurant) {
    return { success: false, error: 'Restaurant not found' };
  }

  return {
    success: true,
    data: {
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      status: restaurant.status,
      siteStatus: restaurant.site_status,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: restaurant.subscription_end_date,
      publishedAt: restaurant.published_at,
    },
  };
}
