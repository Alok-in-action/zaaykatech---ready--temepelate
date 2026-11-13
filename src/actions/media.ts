'use server';

import { createClient } from '@/lib/supabase/server';
import { MediaUploadRequestSchema } from '@/validations/restaurant';
import {
  createPresignedUploadUrl,
  verifyMediaUpload,
  deleteMediaFile,
  type StoragePurpose,
} from '@/lib/storage';

export async function requestMediaUploadUrl(input: {
  restaurantId: string;
  fileType: string;
  fileSize: number;
  purpose: 'logo' | 'hero' | 'poster' | 'hero-poster' | 'dish' | 'menu-item' | 'qr';
  itemId?: string;
}) {
  const parseResult = MediaUploadRequestSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid upload request payload: ' + parseResult.error.issues[0]?.message };
  }

  const { restaurantId, fileType, fileSize, purpose, itemId } = parseResult.data;

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  // 2. Authorize ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Profile not found.' };
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden: You do not own this restaurant.' };
  }

  // 3. Generate tenant-scoped signed upload URL
  try {
    const uploadData = await createPresignedUploadUrl({
      restaurantId,
      purpose: purpose as any,
      fileType,
      fileSize,
      itemId,
    });

    return {
      success: true,
      data: uploadData,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to generate upload URL',
    };
  }
}

export async function verifyAndCommitMedia(params: {
  restaurantId: string;
  key: string;
  publicUrl: string;
  purpose: 'logo' | 'hero' | 'poster' | 'hero-poster' | 'dish' | 'menu-item' | 'qr';
  itemId?: string;
}) {
  const { restaurantId, key, publicUrl, purpose, itemId } = params;

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  // 2. Authorize ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Profile not found.' };
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, branding')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden.' };
  }

  // 3. Verify upload exists in Supabase Storage
  const exists = await verifyMediaUpload(key);
  if (!exists) {
    return { success: false, error: 'Uploaded file could not be verified in storage.' };
  }

  // 4. Update restaurant branding JSONB or menu_item image_url
  const currentBranding = (restaurant.branding as Record<string, unknown>) || {};
  const updatedBranding = { ...currentBranding };

  if (purpose === 'logo') {
    updatedBranding.logo_url = publicUrl;
  } else if (purpose === 'hero') {
    updatedBranding.hero_media_url = publicUrl;
  } else if (purpose === 'poster' || purpose === 'hero-poster') {
    updatedBranding.hero_poster_url = publicUrl;
  }

  if (purpose === 'logo' || purpose === 'hero' || purpose === 'poster' || purpose === 'hero-poster') {
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ branding: updatedBranding })
      .eq('id', restaurantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  } else if ((purpose === 'dish' || purpose === 'menu-item') && itemId) {
    const { error: itemError } = await supabase
      .from('menu_items')
      .update({ image_url: publicUrl })
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId);

    if (itemError) {
      return { success: false, error: itemError.message };
    }
  } else if (purpose === 'qr') {
    await supabase
      .from('qr_codes')
      .update({ asset_url: publicUrl })
      .eq('restaurant_id', restaurantId);
  }

  return { success: true, publicUrl };
}

/**
 * Deletes a media file from Supabase Storage and clears its URL in the database.
 */
export async function deleteMediaAsset(params: {
  restaurantId: string;
  key: string;
  purpose: 'logo' | 'hero' | 'poster' | 'hero-poster' | 'dish' | 'menu-item' | 'qr';
  itemId?: string;
}) {
  const { restaurantId, key, purpose, itemId } = params;

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
    .single();

  if (!profile) {
    return { success: false, error: 'Profile not found.' };
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, branding')
    .eq('id', restaurantId)
    .single();

  if (!restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Forbidden.' };
  }

  // Ensure key belongs to this restaurant
  if (!key.startsWith(`restaurants/${restaurantId}/`)) {
    return { success: false, error: 'Cross-restaurant access forbidden.' };
  }

  // Delete from storage
  await deleteMediaFile(key);

  // Clear URL in database
  const currentBranding = (restaurant.branding as Record<string, unknown>) || {};
  const updatedBranding = { ...currentBranding };

  if (purpose === 'logo') {
    updatedBranding.logo_url = null;
  } else if (purpose === 'hero') {
    updatedBranding.hero_media_url = null;
  } else if (purpose === 'poster' || purpose === 'hero-poster') {
    updatedBranding.hero_poster_url = null;
  }

  if (purpose === 'logo' || purpose === 'hero' || purpose === 'poster' || purpose === 'hero-poster') {
    await supabase
      .from('restaurants')
      .update({ branding: updatedBranding })
      .eq('id', restaurantId);
  } else if ((purpose === 'dish' || purpose === 'menu-item') && itemId) {
    await supabase
      .from('menu_items')
      .update({ image_url: null })
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId);
  }

  return { success: true };
}
