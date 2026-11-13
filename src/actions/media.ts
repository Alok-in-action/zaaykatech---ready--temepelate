'use server';

import { createClient } from '@/lib/supabase/server';
import { MediaUploadRequestSchema } from '@/validations/restaurant';
import { createPresignedUploadUrl, verifyR2ObjectExists } from '@/lib/storage/r2';

export async function requestMediaUploadUrl(input: {
  restaurantId: string;
  fileType: string;
  fileSize: number;
  purpose: 'logo' | 'hero' | 'poster' | 'dish';
}) {
  const parseResult = MediaUploadRequestSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid upload request payload' };
  }

  const { restaurantId, fileType, fileSize, purpose } = parseResult.data;

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

  // 3. Generate short-lived presigned URL
  try {
    const uploadData = await createPresignedUploadUrl({
      restaurantId,
      purpose,
      fileType,
      fileSize,
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
  purpose: 'logo' | 'hero' | 'poster';
}) {
  const { restaurantId, key, publicUrl, purpose } = params;

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

  // 3. Verify upload actually completed in R2
  const exists = await verifyR2ObjectExists(key);
  if (!exists) {
    return { success: false, error: 'Uploaded file could not be verified in storage.' };
  }

  // 4. Update restaurant branding JSONB
  const currentBranding = (restaurant.branding as Record<string, unknown>) || {};
  let updatedBranding = { ...currentBranding };

  if (purpose === 'logo') {
    updatedBranding.logo_url = publicUrl;
  } else if (purpose === 'hero') {
    updatedBranding.hero_media_url = publicUrl;
  } else if (purpose === 'poster') {
    updatedBranding.hero_poster_url = publicUrl;
  }

  const { error: updateError } = await supabase
    .from('restaurants')
    .update({ branding: updatedBranding })
    .eq('id', restaurantId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, publicUrl };
}
