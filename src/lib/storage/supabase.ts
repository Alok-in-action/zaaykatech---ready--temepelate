import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'node:crypto';
import {
  MediaStorage,
  UploadUrlOptions,
  UploadUrlResult,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_AI_IMPORT_SIZE_BYTES,
  MAX_CSV_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from './types';

export const SUPABASE_STORAGE_BUCKET = 'zaaykatech-media';

export class SupabaseStorageProvider implements MediaStorage {
  private bucketName: string;

  constructor(bucketName: string = SUPABASE_STORAGE_BUCKET) {
    this.bucketName = bucketName;
  }

  /**
   * Generates a signed upload PUT URL with tenant-scoped isolation.
   * Paths:
   *   restaurants/{restaurantId}/logo/
   *   restaurants/{restaurantId}/hero/
   *   restaurants/{restaurantId}/hero-poster/
   *   restaurants/{restaurantId}/menu-items/{itemId}/
   *   restaurants/{restaurantId}/qr/
   *   restaurants/{restaurantId}/ai-imports/{uploadId}/
   */
  async getUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult> {
    const { restaurantId, purpose, fileType, fileSize, itemId, uploadId } = options;

    // 1. Validate File Size & Allowed MIME Types based on purpose
    if (purpose === 'hero') {
      const isVideo = ALLOWED_MIME_TYPES.video.includes(fileType);
      const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

      if (fileSize > maxSize) {
        const maxMb = isVideo ? 50 : 5;
        throw new Error(`File exceeds maximum allowed size of ${maxMb} MB.`);
      }

      const allowed = [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.video];
      if (!allowed.includes(fileType)) {
        throw new Error(`Unsupported hero media type "${fileType}". Allowed: ${allowed.join(', ')}`);
      }
    } else if (purpose === 'ai-import') {
      const isCsv = fileType === 'text/csv' || fileType === 'text/plain';
      const maxSize = isCsv ? MAX_CSV_SIZE_BYTES : MAX_AI_IMPORT_SIZE_BYTES;
      const allowed = [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document];

      if (!allowed.includes(fileType)) {
        throw new Error(`Unsupported AI/OCR import file type "${fileType}".`);
      }
      if (fileSize > maxSize) {
        const maxMb = isCsv ? 2 : 10;
        throw new Error(`File exceeds maximum allowed size of ${maxMb} MB.`);
      }
    } else {
      // logo, hero-poster, menu-item, qr
      if (fileSize > MAX_IMAGE_SIZE_BYTES) {
        throw new Error(`Image exceeds maximum allowed size of 5 MB.`);
      }
      const allowed = purpose === 'qr'
        ? [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.qr]
        : ALLOWED_MIME_TYPES.image;

      if (!allowed.includes(fileType)) {
        throw new Error(`Unsupported file type "${fileType}". Allowed: ${allowed.join(', ')}`);
      }
    }

    // 2. Generate secure tenant-scoped key
    const ext =
      fileType === 'application/pdf'
        ? 'pdf'
        : fileType === 'text/csv'
        ? 'csv'
        : fileType === 'image/svg+xml'
        ? 'svg'
        : fileType.split('/')[1] || 'bin';

    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString('hex');

    let folderPath: string;
    let effectiveUploadId: string | undefined = undefined;

    switch (purpose) {
      case 'logo':
        folderPath = 'logo';
        break;
      case 'hero':
        folderPath = 'hero';
        break;
      case 'hero-poster':
        folderPath = 'hero-poster';
        break;
      case 'menu-item':
        folderPath = `menu-items/${itemId || crypto.randomUUID()}`;
        break;
      case 'qr':
        folderPath = 'qr';
        break;
      case 'ai-import':
        effectiveUploadId = uploadId || crypto.randomUUID();
        folderPath = `ai-imports/${effectiveUploadId}`;
        break;
      default:
        folderPath = 'misc';
    }

    const key = `restaurants/${restaurantId}/${folderPath}/${timestamp}-${randomSuffix}.${ext}`;

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.storage
      .from(this.bucketName)
      .createSignedUploadUrl(key);

    if (error || !data) {
      throw new Error(`Failed to generate signed upload URL from Supabase Storage: ${error?.message}`);
    }

    const publicUrl = this.getPublicUrl(key);

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      key,
      uploadId: effectiveUploadId,
      expiresInSeconds: 300,
    };
  }

  /**
   * Direct server-side upload for system-generated assets (e.g. QR codes or OCR buffers).
   */
  async uploadFile(params: {
    key: string;
    fileBuffer: Buffer;
    contentType: string;
  }): Promise<{ publicUrl: string; key: string }> {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.storage
      .from(this.bucketName)
      .upload(params.key, params.fileBuffer, {
        contentType: params.contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(params.key);
    return { publicUrl, key: params.key };
  }

  /**
   * Verifies that the uploaded object exists and is accessible.
   */
  async verifyUpload(key: string): Promise<boolean> {
    const serviceClient = createServiceClient();
    try {
      const { data, error } = await serviceClient.storage.from(this.bucketName).info(key);
      if (error || !data) {
        return false;
      }
      return typeof data.size === 'number' && data.size > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generates public CDN delivery URL for an object.
   */
  getPublicUrl(key: string): string {
    const serviceClient = createServiceClient();
    const { data } = serviceClient.storage.from(this.bucketName).getPublicUrl(key);
    return data.publicUrl;
  }

  /**
   * Deletes an object from Supabase Storage.
   */
  async deleteFile(key: string): Promise<boolean> {
    const serviceClient = createServiceClient();
    try {
      const { error } = await serviceClient.storage.from(this.bucketName).remove([key]);
      return !error;
    } catch (err) {
      console.warn(`Failed to delete storage file "${key}":`, err);
      return false;
    }
  }

  /**
   * Fetches an object buffer for server-side processing (e.g. OCR).
   */
  async getFileBuffer(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const serviceClient = createServiceClient();
    try {
      const { data, error } = await serviceClient.storage.from(this.bucketName).download(key);
      if (error || !data) {
        return null;
      }
      const arrayBuffer = await data.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: data.type || 'application/octet-stream',
      };
    } catch (err) {
      console.error(`Failed to download object "${key}" from Supabase Storage:`, err);
      return null;
    }
  }
}
