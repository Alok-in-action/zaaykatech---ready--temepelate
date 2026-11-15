import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Restaurant, SiteStatus } from '@/types/database';

export type OwnerLifecycleState =
  | 'no_restaurant'
  | 'onboarding_in_progress'
  | 'offline'
  | 'trial_active'
  | 'grace_period'
  | 'subscription_active'
  | 'expired'
  | 'error';

export interface OwnerLifecycleResult {
  state: OwnerLifecycleState;
  restaurant: Restaurant | null;
  profileId: string | null;
  step: number;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  isGracePeriod: boolean;
  isExpired: boolean;
  isLive: boolean;
  siteStatus: SiteStatus;
  error?: string;
}

/**
 * Evaluates the full owner lifecycle state for the current authenticated owner.
 * Strictly resolves only non-archived restaurants (`archived_at IS NULL`).
 * Wrapped in React.cache to deduplicate across layout and page rendering in a single request.
 */
export const getOwnerLifecycle = cache(async function getOwnerLifecycle(
  providedProfileId?: string
): Promise<OwnerLifecycleResult> {
  const supabase = await createClient();
  let profileId: string | null = providedProfileId || null;

  if (!profileId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        state: 'no_restaurant',
        restaurant: null,
        profileId: null,
        step: 1,
        trialEndsAt: null,
        subscriptionEndDate: null,
        daysRemaining: null,
        hoursRemaining: null,
        isGracePeriod: false,
        isExpired: false,
        isLive: false,
        siteStatus: 'draft',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return {
        state: 'no_restaurant',
        restaurant: null,
        profileId: null,
        step: 1,
        trialEndsAt: null,
        subscriptionEndDate: null,
        daysRemaining: null,
        hoursRemaining: null,
        isGracePeriod: false,
        isExpired: false,
        isLive: false,
        siteStatus: 'draft',
      };
    }

    profileId = profile.id;
  }

  // Fetch the single active restaurant for this owner
  const { data: restaurantData, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_profile_id', profileId)
    .is('archived_at', null)
    .maybeSingle();

  // Return a retryable error when the restaurant query fails; return no_restaurant only after a successful empty lookup.
  if (error) {
    return {
      state: 'error',
      restaurant: null,
      profileId,
      step: 1,
      trialEndsAt: null,
      subscriptionEndDate: null,
      daysRemaining: null,
      hoursRemaining: null,
      isGracePeriod: false,
      isExpired: false,
      isLive: false,
      siteStatus: 'draft',
      error: `Failed to load restaurant lifecycle: ${error.message}`,
    };
  }

  if (!restaurantData) {
    return {
      state: 'no_restaurant',
      restaurant: null,
      profileId,
      step: 1,
      trialEndsAt: null,
      subscriptionEndDate: null,
      daysRemaining: null,
      hoursRemaining: null,
      isGracePeriod: false,
      isExpired: false,
      isLive: false,
      siteStatus: 'draft',
    };
  }

  const restaurant = restaurantData as unknown as Restaurant;
  const now = new Date();
  const gracePeriodHours = Number(process.env.GRACE_PERIOD_HOURS || 24);

  // 1. Honor explicit administrative or owner suspension override
  if (restaurant.status === 'suspended' || restaurant.site_status === 'suspended') {
    return {
      state: 'expired',
      restaurant,
      profileId,
      step: 5,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: restaurant.subscription_end_date,
      daysRemaining: 0,
      hoursRemaining: 0,
      isGracePeriod: false,
      isExpired: true,
      isLive: false,
      siteStatus: 'suspended',
    };
  }

  // 2. Completed but unpublished restaurant: "offline" state
  // Keeps full dashboard access without returning to onboarding
  if (restaurant.onboarding_status === 'completed' && restaurant.status !== 'published') {
    return {
      state: 'offline',
      restaurant,
      profileId,
      step: 5,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: restaurant.subscription_end_date,
      daysRemaining: null,
      hoursRemaining: null,
      isGracePeriod: false,
      isExpired: false,
      isLive: false,
      siteStatus: restaurant.site_status === 'preview' ? 'preview' : 'draft',
    };
  }

  // 3. Incomplete onboarding check
  if (restaurant.onboarding_status !== 'completed') {
    return {
      state: 'onboarding_in_progress',
      restaurant,
      profileId,
      step: restaurant.onboarding_current_step || 1,
      trialEndsAt: null,
      subscriptionEndDate: null,
      daysRemaining: null,
      hoursRemaining: null,
      isGracePeriod: false,
      isExpired: false,
      isLive: false,
      siteStatus: 'draft',
    };
  }

  // 4. Honor preview override
  if (restaurant.status === 'preview' || restaurant.site_status === 'preview') {
    return {
      state: 'offline',
      restaurant,
      profileId,
      step: 5,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: restaurant.subscription_end_date,
      daysRemaining: null,
      hoursRemaining: null,
      isGracePeriod: false,
      isExpired: false,
      isLive: false,
      siteStatus: 'preview',
    };
  }

  // 2. Paid Subscription check
  if (restaurant.subscription_end_date) {
    const subEnd = new Date(restaurant.subscription_end_date);
    const subGraceEnd = new Date(subEnd.getTime() + gracePeriodHours * 60 * 60 * 1000);

    if (subEnd >= now) {
      const days = Math.max(0, Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        state: 'subscription_active',
        restaurant,
        profileId,
        step: 5,
        trialEndsAt: restaurant.trial_ends_at,
        subscriptionEndDate: restaurant.subscription_end_date,
        daysRemaining: days,
        hoursRemaining: days * 24,
        isGracePeriod: false,
        isExpired: false,
        isLive: true,
        siteStatus: 'active',
      };
    }

    if (now <= subGraceEnd) {
      const hours = Math.max(0, Math.ceil((subGraceEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
      return {
        state: 'grace_period',
        restaurant,
        profileId,
        step: 5,
        trialEndsAt: restaurant.trial_ends_at,
        subscriptionEndDate: restaurant.subscription_end_date,
        daysRemaining: 0,
        hoursRemaining: hours,
        isGracePeriod: true,
        isExpired: false,
        isLive: true,
        siteStatus: 'payment_overdue',
      };
    }

    return {
      state: 'expired',
      restaurant,
      profileId,
      step: 5,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: restaurant.subscription_end_date,
      daysRemaining: 0,
      hoursRemaining: 0,
      isGracePeriod: false,
      isExpired: true,
      isLive: false,
      siteStatus: 'expired',
    };
  }

  // 3. Free Trial check
  if (restaurant.trial_ends_at) {
    const trialEnd = new Date(restaurant.trial_ends_at);
    const trialGraceEnd = new Date(trialEnd.getTime() + gracePeriodHours * 60 * 60 * 1000);

    if (now <= trialEnd) {
      const hours = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const days = Math.max(0, Math.ceil(hours / 24));
      return {
        state: 'trial_active',
        restaurant,
        profileId,
        step: 5,
        trialEndsAt: restaurant.trial_ends_at,
        subscriptionEndDate: null,
        daysRemaining: days,
        hoursRemaining: hours,
        isGracePeriod: false,
        isExpired: false,
        isLive: true,
        siteStatus: hours <= 4 ? 'trial_ending' : 'trialing',
      };
    }

    if (now <= trialGraceEnd) {
      const hours = Math.max(0, Math.ceil((trialGraceEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
      return {
        state: 'grace_period',
        restaurant,
        profileId,
        step: 5,
        trialEndsAt: restaurant.trial_ends_at,
        subscriptionEndDate: null,
        daysRemaining: 0,
        hoursRemaining: hours,
        isGracePeriod: true,
        isExpired: false,
        isLive: true,
        siteStatus: 'grace_period',
      };
    }

    return {
      state: 'expired',
      restaurant,
      profileId,
      step: 5,
      trialEndsAt: restaurant.trial_ends_at,
      subscriptionEndDate: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      isGracePeriod: false,
      isExpired: true,
      isLive: false,
      siteStatus: 'expired',
    };
  }

  // Fallback: published but neither subscription nor trial_ends_at is set.
  // Return non-live expired state instead of fabricating "24 hours left".
  return {
    state: 'expired',
    restaurant,
    profileId,
    step: 5,
    trialEndsAt: null,
    subscriptionEndDate: null,
    daysRemaining: 0,
    hoursRemaining: 0,
    isGracePeriod: false,
    isExpired: true,
    isLive: false,
    siteStatus: 'expired',
  };
});
