export type StoragePurpose =
  | 'logo'
  | 'hero'
  | 'hero-poster'
  | 'menu-item'
  | 'qr'
  | 'ai-import';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_AI_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  poster: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  qr: ['image/png', 'image/svg+xml'],
  document: ['application/pdf', 'text/csv', 'text/plain'],
};

export interface UploadUrlOptions {
  restaurantId: string;
  purpose: StoragePurpose;
  fileType: string;
  fileSize: number;
  itemId?: string; // For restaurants/{restaurantId}/menu-items/{itemId}/
  uploadId?: string; // For restaurants/{restaurantId}/ai-imports/{uploadId}/
}

export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  uploadId?: string;
  expiresInSeconds?: number;
}

/**
 * Modular MediaStorage Interface.
 * Allows transparent swapping between Supabase Storage and Cloudflare R2.
 */
export interface MediaStorage {
  getUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult>;
  uploadFile(params: {
    key: string;
    fileBuffer: Buffer;
    contentType: string;
  }): Promise<{ publicUrl: string; key: string }>;
  verifyUpload(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  deleteFile(key: string): Promise<boolean>;
  getFileBuffer(key: string): Promise<{ buffer: Buffer; contentType: string } | null>;
}
