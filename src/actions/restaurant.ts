'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  CreateRestaurantSchema,
  RestaurantDetailsSchema,
  RestaurantBrandingSchema,
  RestaurantThemeSchema,
  RestaurantContactSchema,
  RestaurantAddressSchema,
  RestaurantSocialLinksSchema,
  CreateRestaurantInput,
} from '@/validations/restaurant';
import { Restaurant, MenuCategory, MenuItem } from '@/types/database';
import { slugify } from '@/lib/utils';
import crypto from 'node:crypto';

/**
 * Ensures slug uniqueness by appending incremental counter if taken.
 */
async function generateUniqueSlug(
  baseName: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const baseSlug = slugify(baseName) || 'restaurant';
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

/**
 * 1. Creates a new restaurant for an authenticated owner.
 * Sets:
 * - status = 'draft'
 * - site_status = 'trialing'
 * - trial_ends_at = now + TRIAL_DURATION_HOURS (default 24h)
 * - published_at = null
 * - onboarding_source = 'self_serve'
 * Creates a unique slug and QR short code record.
 * Does NOT auto-create categories.
 */
export async function createRestaurant(input: CreateRestaurantInput) {
  const parseResult = CreateRestaurantSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      details: parseResult.error.format(),
    };
  }

  const data = parseResult.data;

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  // 2. Fetch or create owner profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error: profileErr } = await supabase
      .from('profiles')
      .insert({
        auth_user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Restaurant Owner',
        phone: user.phone || null,
        role: 'restaurant_owner',
      })
      .select('id')
      .single();

    if (profileErr || !newProfile) {
      return { success: false, error: 'Failed to initialize owner profile.' };
    }
    profile = newProfile;
  }

  // 3. Generate unique slug (immutable)
  const slug = await generateUniqueSlug(data.name, supabase);

  // 4. Calculate trial expiration
  const trialHours = Number(process.env.TRIAL_DURATION_HOURS || 24);
  const trialEndsAt = new Date(Date.now() + trialHours * 60 * 60 * 1000).toISOString();

  // 5. Insert restaurant record
  const { data: restaurant, error: restErr } = await supabase
    .from('restaurants')
    .insert({
      owner_profile_id: profile.id,
      name: data.name,
      slug,
      status: 'draft',
      site_status: 'trialing',
      trial_ends_at: trialEndsAt,
      published_at: null, // Nullable with NO default timestamp
      onboarding_source: 'self_serve',
      branding: data.branding,
      contact: data.contact,
      address: data.address,
      social_links: data.social_links,
      theme: data.theme,
    })
    .select('*')
    .single();

  if (restErr || !restaurant) {
    return { success: false, error: restErr?.message || 'Failed to create restaurant.' };
  }

  // 6. Generate QR code record
  const shortCode = crypto.randomBytes(4).toString('hex');
  await supabase.from('qr_codes').insert({
    restaurant_id: restaurant.id,
    short_code: shortCode,
    scan_count: 0,
  });

  // 7. Set newly created restaurant as active
  const cookieStore = await cookies();
  cookieStore.set('zaaykatech_active_restaurant', restaurant.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return {
    success: true,
    restaurant,
  };
}

/**
 * 2. Updates restaurant details, contact, and address.
 */
export async function updateRestaurantDetails(
  restaurantId: string,
  input: {
    name?: string;
    tagline?: string;
    contact?: unknown;
    address?: unknown;
    social_links?: unknown;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found.' };

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  const updates: Record<string, unknown> = {};

  if (input.name) {
    updates.name = input.name.trim();
  }
  if (input.contact) {
    const parsed = RestaurantContactSchema.safeParse(input.contact);
    if (parsed.success) updates.contact = parsed.data;
  }
  if (input.address) {
    const parsed = RestaurantAddressSchema.safeParse(input.address);
    if (parsed.success) updates.address = parsed.data;
  }
  if (input.social_links) {
    const parsed = RestaurantSocialLinksSchema.safeParse(input.social_links);
    if (parsed.success) updates.social_links = parsed.data;
  }

  const { error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 3. Updates branding and theme.
 */
export async function updateBrandingAndTheme(
  restaurantId: string,
  branding: unknown,
  theme: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found.' };

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  const parsedBranding = RestaurantBrandingSchema.safeParse(branding);
  if (!parsedBranding.success) {
    return {
      success: false,
      error: 'Invalid branding configuration',
      details: parsedBranding.error.format(),
    };
  }

  const parsedTheme = RestaurantThemeSchema.safeParse(theme);
  if (!parsedTheme.success) {
    return {
      success: false,
      error: 'Invalid theme configuration',
      details: parsedTheme.error.format(),
    };
  }

  const { error } = await supabase
    .from('restaurants')
    .update({
      branding: parsedBranding.data,
      theme: parsedTheme.data,
    })
    .eq('id', restaurantId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 4. Publishes the restaurant.
 * Publishing rules:
 * - Requires at least one active category AND at least one available menu item.
 * - Prevents publishing empty menus with a clear error.
 * - Sets published_at ONLY on the first successful publish.
 */
export async function publishRestaurantAction(restaurantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found.' };

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, published_at')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  // 1. Guard against publishing empty menu
  const { count: catCount } = await supabase
    .from('menu_categories')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true);

  const { count: itemCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true);

  if (!catCount || catCount === 0 || !itemCount || itemCount === 0) {
    return {
      success: false,
      error: 'Cannot publish an empty menu. Please add at least one category and one available menu item before publishing.',
    };
  }

  // 2. Set published_at only if this is the first publish
  const publishedAt = restaurant.published_at || new Date().toISOString();

  const { error } = await supabase
    .from('restaurants')
    .update({
      status: 'published',
      published_at: publishedAt,
    })
    .eq('id', restaurantId);

  if (error) return { success: false, error: error.message };

  return { success: true, publishedAt };
}

/**
 * 5. Unpublishes the restaurant.
 * Unpublish rules:
 * - Sets status = 'draft'
 * - Preserves previous published_at and all menu data
 * - Public menu becomes unavailable immediately
 */
export async function unpublishRestaurantAction(restaurantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found.' };

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  const { error } = await supabase
    .from('restaurants')
    .update({
      status: 'draft',
    })
    .eq('id', restaurantId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 6. Fetches all restaurants owned by the current authenticated user.
 */
export async function getOwnerRestaurants(): Promise<{
  success: boolean;
  error?: string;
  restaurants: Restaurant[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.', restaurants: [] };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Profile not found.', restaurants: [] };
  }

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message, restaurants: [] };
  }

  return {
    success: true,
    restaurants: (restaurants || []) as unknown as Restaurant[],
  };
}

/**
 * 7. Fetches a specific restaurant for the authenticated owner, verifying ownership.
 * If restaurantId is omitted, returns the active restaurant (from cookie or most recent).
 */
export async function getOwnerRestaurant(restaurantId?: string): Promise<{
  success: boolean;
  error?: string;
  restaurant: Restaurant | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.', restaurant: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Profile not found.', restaurant: null };
  }

  let targetId = restaurantId;

  // If no targetId or fallback zero uuid, check cookie
  if (!targetId || targetId === '00000000-0000-0000-0000-000000000000') {
    const cookieStore = await cookies();
    const cookieActiveId = cookieStore.get('zaaykatech_active_restaurant')?.value;
    if (cookieActiveId && cookieActiveId !== '00000000-0000-0000-0000-000000000000') {
      targetId = cookieActiveId;
    }
  }

  let query = supabase
    .from('restaurants')
    .select('*')
    .eq('owner_profile_id', profile.id);

  if (targetId && targetId !== '00000000-0000-0000-0000-000000000000') {
    query = query.eq('id', targetId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data: restaurant, error } = await query.maybeSingle();

  if (error) {
    return { success: false, error: error.message, restaurant: null };
  }

  if (!restaurant) {
    return { success: false, error: 'Restaurant not found or you do not own it.', restaurant: null };
  }

  return {
    success: true,
    restaurant: restaurant as unknown as Restaurant,
  };
}

/**
 * 8. Fetches menu categories and items for an owned restaurant.
 */
export async function getOwnerMenuData(restaurantId: string): Promise<{
  success: boolean;
  error?: string;
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.', categories: [], items: [] };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Profile not found.', categories: [], items: [] };
  }

  // Strict ownership check
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.', categories: [], items: [] };
  }

  const { data: categories, error: catErr } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('position', { ascending: true });

  if (catErr) {
    return { success: false, error: catErr.message, categories: [], items: [] };
  }

  const { data: items, error: itemErr } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('position', { ascending: true });

  if (itemErr) {
    return { success: false, error: itemErr.message, categories: [], items: [] };
  }

  return {
    success: true,
    categories: (categories || []) as unknown as MenuCategory[],
    items: (items || []) as unknown as MenuItem[],
  };
}

/**
 * 9. Sets the active restaurant ID cookie for the authenticated owner.
 */
export async function setActiveRestaurantAction(restaurantId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: 'Profile not found.' };
  }

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .eq('owner_profile_id', profile.id)
    .maybeSingle();

  if (!restaurant) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('zaaykatech_active_restaurant', restaurantId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath('/owner', 'layout');
  revalidatePath('/owner');

  return { success: true };
}

/**
 * 10. Signs out of Supabase and clears any active restaurant cache/cookies.
 */
export async function signOutAction(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete('zaaykatech_active_restaurant');
  return { success: true };
}
