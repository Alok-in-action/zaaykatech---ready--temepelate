'use server';

import { createClient } from '@/lib/supabase/server';
import { CategorySchema, CategoryInput } from '@/validations/menu';
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
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { authorized: false, error: 'Forbidden: You do not own this restaurant.', supabase, profile };
  }

  return { authorized: true, error: null, supabase, profile };
}

/**
 * 1. Creates a new category.
 */
export async function createCategory(restaurantId: string, input: CategoryInput) {
  const parseResult = CategorySchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid category data', details: parseResult.error.format() };
  }

  const authCheck = await verifyRestaurantOwnership(restaurantId);
  if (!authCheck.authorized || !authCheck.supabase) {
    return { success: false, error: authCheck.error };
  }

  const supabase = authCheck.supabase;
  const data = parseResult.data;
  const slug = slugify(data.name) || 'category';

  // Determine next position
  const { data: lastCat } = await supabase
    .from('menu_categories')
    .select('position')
    .eq('restaurant_id', restaurantId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (lastCat?.position ?? -1) + 1;

  const { data: category, error } = await supabase
    .from('menu_categories')
    .insert({
      restaurant_id: restaurantId,
      name: data.name,
      slug,
      description: data.description || null,
      position: nextPos,
      is_active: data.is_active,
    })
    .select('*')
    .single();

  if (error || !category) {
    return { success: false, error: error?.message || 'Failed to create category' };
  }

  return { success: true, category };
}

/**
 * 2. Updates an existing category.
 */
export async function updateCategory(categoryId: string, input: CategoryInput) {
  const parseResult = CategorySchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid category data', details: parseResult.error.format() };
  }

  const supabase = await createClient();
  const { data: existingCat } = await supabase
    .from('menu_categories')
    .select('id, restaurant_id')
    .eq('id', categoryId)
    .single();

  if (!existingCat) {
    return { success: false, error: 'Category not found.' };
  }

  const authCheck = await verifyRestaurantOwnership(existingCat.restaurant_id);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const data = parseResult.data;
  const slug = slugify(data.name) || 'category';

  const { error } = await supabase
    .from('menu_categories')
    .update({
      name: data.name,
      slug,
      description: data.description || null,
      is_active: data.is_active,
    })
    .eq('id', categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Deletes a category with empty safeguard check.
 */
export async function deleteCategory(categoryId: string, cascadeDeleteItems = false) {
  const supabase = await createClient();
  const { data: existingCat } = await supabase
    .from('menu_categories')
    .select('id, restaurant_id, name')
    .eq('id', categoryId)
    .single();

  if (!existingCat) {
    return { success: false, error: 'Category not found.' };
  }

  const authCheck = await verifyRestaurantOwnership(existingCat.restaurant_id);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  // Check if items exist inside this category
  const { count: itemCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (itemCount && itemCount > 0 && !cascadeDeleteItems) {
    return {
      success: false,
      error: `Category "${existingCat.name}" contains ${itemCount} dish(es). Deleting it will also remove all items inside it.`,
      requiresConfirmation: true,
      itemCount,
    };
  }

  const { error } = await supabase.from('menu_categories').delete().eq('id', categoryId);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 4. Toggles category active status.
 */
export async function toggleCategoryActive(categoryId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: existingCat } = await supabase
    .from('menu_categories')
    .select('id, restaurant_id')
    .eq('id', categoryId)
    .single();

  if (!existingCat) return { success: false, error: 'Category not found.' };

  const authCheck = await verifyRestaurantOwnership(existingCat.restaurant_id);
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const { error } = await supabase
    .from('menu_categories')
    .update({ is_active: isActive })
    .eq('id', categoryId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * 5. Reorders categories sequentially.
 */
export async function reorderCategories(restaurantId: string, categoryIds: string[]) {
  const authCheck = await verifyRestaurantOwnership(restaurantId);
  if (!authCheck.authorized || !authCheck.supabase) {
    return { success: false, error: authCheck.error };
  }

  const supabase = authCheck.supabase;

  // Update positions sequentially
  const updatePromises = categoryIds.map((id, index) =>
    supabase.from('menu_categories').update({ position: index }).eq('id', id).eq('restaurant_id', restaurantId)
  );

  await Promise.all(updatePromises);
  return { success: true };
}
