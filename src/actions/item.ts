'use server';

import { createClient } from '@/lib/supabase/server';
import { MenuItemSchema, MenuItemInput } from '@/validations/menu';
import { slugify } from '@/lib/utils';

/**
 * Helper to authenticate user and verify restaurant ownership.
 */
async function verifyRestaurantOwnership(restaurantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'Unauthorized. Please sign in.', supabase, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) {
    return { authorized: false, error: 'Profile not found.', supabase, profile: null };
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { authorized: false, error: 'Forbidden: You do not own this restaurant.', supabase, profile };
  }

  return { authorized: true, error: null, supabase, profile };
}

/**
 * 1. Creates a new menu item.
 */
export async function createMenuItem(restaurantId: string, input: MenuItemInput) {
  const parseResult = MenuItemSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid dish payload', details: parseResult.error.format() };
  }

  const authCheck = await verifyRestaurantOwnership(restaurantId);
  if (!authCheck.authorized || !authCheck.supabase) {
    return { success: false, error: authCheck.error };
  }

  const supabase = authCheck.supabase;
  const data = parseResult.data;

  // Verify category belongs to this restaurant
  const { data: cat } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('id', data.categoryId)
    .eq('restaurant_id', restaurantId)
    .single();

  if (!cat) {
    return { success: false, error: 'Selected category does not exist in this restaurant.' };
  }

  const slug = slugify(data.name) || 'dish';

  // Find next position within this category
  const { data: lastItem } = await supabase
    .from('menu_items')
    .select('position')
    .eq('restaurant_id', restaurantId)
    .eq('category_id', data.categoryId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (lastItem?.position ?? -1) + 1;

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({
      restaurant_id: restaurantId,
      category_id: data.categoryId,
      name: data.name,
      slug,
      description: data.description || null,
      price_paise: data.pricingMode === 'single' ? data.price_paise : null,
      variant_prices: data.pricingMode === 'variants' ? data.variant_prices : null,
      image_url: data.image_url || null,
      tags: data.tags || [],
      allergens: data.allergens || [],
      is_veg: data.is_veg,
      is_available: data.is_available,
      is_signature: data.is_signature,
      is_most_ordered: data.is_most_ordered,
      is_monsoon: data.is_monsoon,
      custom_tag: data.custom_tag || null,
      position: nextPos,
    })
    .select('*')
    .single();

  if (error || !item) {
    return { success: false, error: error?.message || 'Failed to create menu item.' };
  }

  return { success: true, item };
}

/**
 * 2. Updates an existing menu item.
 */
export async function updateMenuItem(itemId: string, input: MenuItemInput) {
  const parseResult = MenuItemSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid dish payload', details: parseResult.error.format() };
  }

  const supabase = await createClient();
  const { data: existingItem } = await supabase
    .from('menu_items')
    .select('id, restaurant_id')
    .eq('id', itemId)
    .single();

  if (!existingItem) {
    return { success: false, error: 'Menu item not found.' };
  }

  const authCheck = await verifyRestaurantOwnership(existingItem.restaurant_id);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const data = parseResult.data;
  const slug = slugify(data.name) || 'dish';

  const { error } = await supabase
    .from('menu_items')
    .update({
      category_id: data.categoryId,
      name: data.name,
      slug,
      description: data.description || null,
      price_paise: data.pricingMode === 'single' ? data.price_paise : null,
      variant_prices: data.pricingMode === 'variants' ? data.variant_prices : null,
      image_url: data.image_url || null,
      tags: data.tags || [],
      allergens: data.allergens || [],
      is_veg: data.is_veg,
      is_available: data.is_available,
      is_signature: data.is_signature,
      is_most_ordered: data.is_most_ordered,
      is_monsoon: data.is_monsoon,
      custom_tag: data.custom_tag || null,
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Deletes a menu item.
 */
export async function deleteMenuItem(itemId: string) {
  const supabase = await createClient();
  const { data: existingItem } = await supabase
    .from('menu_items')
    .select('id, restaurant_id')
    .eq('id', itemId)
    .single();

  if (!existingItem) return { success: false, error: 'Item not found.' };

  const authCheck = await verifyRestaurantOwnership(existingItem.restaurant_id);
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 4. Toggles item availability in real-time.
 */
export async function toggleItemAvailability(itemId: string, isAvailable: boolean) {
  const supabase = await createClient();
  const { data: existingItem } = await supabase
    .from('menu_items')
    .select('id, restaurant_id')
    .eq('id', itemId)
    .single();

  if (!existingItem) return { success: false, error: 'Item not found.' };

  const authCheck = await verifyRestaurantOwnership(existingItem.restaurant_id);
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 5. Reorders items strictly within a single category.
 */
export async function reorderMenuItems(categoryId: string, itemIds: string[]) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from('menu_categories')
    .select('id, restaurant_id')
    .eq('id', categoryId)
    .single();

  if (!category) return { success: false, error: 'Category not found.' };

  const authCheck = await verifyRestaurantOwnership(category.restaurant_id);
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const updatePromises = itemIds.map((id, index) =>
    supabase
      .from('menu_items')
      .update({ position: index })
      .eq('id', id)
      .eq('category_id', categoryId)
  );

  await Promise.all(updatePromises);
  return { success: true };
}
