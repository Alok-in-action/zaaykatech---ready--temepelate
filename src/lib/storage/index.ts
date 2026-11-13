import { MediaStorage, UploadUrlOptions, UploadUrlResult } from './types';
import { SupabaseStorageProvider } from './supabase';

// Modular storage instance: easily switchable between Supabase Storage and Cloudflare R2
export const mediaStorage: MediaStorage = new SupabaseStorageProvider();

export async function createPresignedUploadUrl(params: {
  restaurantId: string;
  purpose: 'logo' | 'hero' | 'hero-poster' | 'poster' | 'dish' | 'menu-item' | 'qr' | 'ai-import';
  fileType: string;
  fileSize: number;
  uploadId?: string;
  itemId?: string;
}): Promise<UploadUrlResult> {
  const normalizedPurpose =
    params.purpose === 'poster'
      ? 'hero-poster'
      : params.purpose === 'dish'
      ? 'menu-item'
      : params.purpose;

  return mediaStorage.getUploadUrl({
    restaurantId: params.restaurantId,
    purpose: normalizedPurpose,
    fileType: params.fileType,
    fileSize: params.fileSize,
    itemId: params.itemId,
    uploadId: params.uploadId,
  });
}

export async function verifyMediaUpload(key: string): Promise<boolean> {
  return mediaStorage.verifyUpload(key);
}

export function getMediaPublicUrl(key: string): string {
  return mediaStorage.getPublicUrl(key);
}

export async function deleteMediaFile(key: string): Promise<boolean> {
  return mediaStorage.deleteFile(key);
}

export async function getMediaFileBuffer(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return mediaStorage.getFileBuffer(key);
}

export * from './types';
export { SupabaseStorageProvider } from './supabase';
