import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
import { SupabaseStorageProvider } from './supabase';

export {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_AI_IMPORT_SIZE_BYTES,
  MAX_CSV_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};

function getR2Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    accountId === 'placeholder_r2_account_id'
  ) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Cloudflare R2 Storage Implementation of MediaStorage.
 */
export class R2StorageProvider implements MediaStorage {
  async getUploadUrl(options: UploadUrlOptions): Promise<UploadUrlResult> {
    const { restaurantId, purpose, fileType, fileSize, itemId, uploadId } = options;

    const isVideo = ALLOWED_MIME_TYPES.video.includes(fileType);
    const maxSize =
      purpose === 'ai-import'
        ? fileType === 'text/csv'
          ? MAX_CSV_SIZE_BYTES
          : MAX_AI_IMPORT_SIZE_BYTES
        : isVideo
        ? MAX_VIDEO_SIZE_BYTES
        : MAX_IMAGE_SIZE_BYTES;

    if (fileSize > maxSize) {
      throw new Error(`File exceeds maximum size.`);
    }

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
    let folder = purpose as string;
    if (purpose === 'menu-item') folder = `menu-items/${itemId || crypto.randomUUID()}`;
    if (purpose === 'ai-import') folder = `ai-imports/${uploadId || crypto.randomUUID()}`;

    const key = `restaurants/${restaurantId}/${folder}/${timestamp}-${randomSuffix}.${ext}`;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.zaaykatech.com';

    const r2Client = getR2Client();
    if (!r2Client) {
      // Fallback to Supabase Storage if R2 is unconfigured
      const supabaseProvider = new SupabaseStorageProvider();
      return supabaseProvider.getUploadUrl(options);
    }

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 300 });
    return {
      uploadUrl,
      publicUrl: `${publicBaseUrl}/${key}`,
      key,
      uploadId: options.uploadId,
      expiresInSeconds: 300,
    };
  }

  async uploadFile(params: {
    key: string;
    fileBuffer: Buffer;
    contentType: string;
  }): Promise<{ publicUrl: string; key: string }> {
    const r2Client = getR2Client();
    if (!r2Client) {
      const supabaseProvider = new SupabaseStorageProvider();
      return supabaseProvider.uploadFile(params);
    }

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      Body: params.fileBuffer,
      ContentType: params.contentType,
    });
    await r2Client.send(putCommand);
    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.zaaykatech.com';
    return { publicUrl: `${publicBaseUrl}/${params.key}`, key: params.key };
  }

  async verifyUpload(key: string): Promise<boolean> {
    const r2Client = getR2Client();
    if (!r2Client) {
      const supabaseProvider = new SupabaseStorageProvider();
      return supabaseProvider.verifyUpload(key);
    }

    try {
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
      const headCommand = new HeadObjectCommand({ Bucket: bucketName, Key: key });
      await r2Client.send(headCommand);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.zaaykatech.com';
    return `${publicBaseUrl}/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    const r2Client = getR2Client();
    if (!r2Client) {
      const supabaseProvider = new SupabaseStorageProvider();
      return supabaseProvider.deleteFile(key);
    }

    try {
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
      const deleteCommand = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
      await r2Client.send(deleteCommand);
      return true;
    } catch {
      return false;
    }
  }

  async getFileBuffer(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const r2Client = getR2Client();
    if (!r2Client) {
      const supabaseProvider = new SupabaseStorageProvider();
      return supabaseProvider.getFileBuffer(key);
    }

    try {
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
      const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const response = await r2Client.send(getCommand);
      if (!response.Body) return null;
      const byteArray = await response.Body.transformToByteArray();
      return {
        buffer: Buffer.from(byteArray),
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
}

// Active storage provider: uses Supabase Storage unless R2 is explicitly configured
const activeProvider: MediaStorage =
  process.env.STORAGE_PROVIDER === 'r2' && getR2Client()
    ? new R2StorageProvider()
    : new SupabaseStorageProvider();

export async function createPresignedUploadUrl(params: {
  restaurantId: string;
  purpose: 'logo' | 'hero' | 'poster' | 'hero-poster' | 'dish' | 'menu-item' | 'qr' | 'ai-import';
  fileType?: string;
  contentType?: string;
  fileSize?: number;
  sizeBytes?: number;
  fileName?: string;
  uploadId?: string;
  itemId?: string;
}): Promise<UploadUrlResult> {
  const normalizedPurpose =
    params.purpose === 'poster'
      ? 'hero-poster'
      : params.purpose === 'dish'
      ? 'menu-item'
      : params.purpose;

  const fileType = params.fileType || params.contentType || '';
  const fileSize = params.fileSize ?? params.sizeBytes ?? 0;

  return activeProvider.getUploadUrl({
    restaurantId: params.restaurantId,
    purpose: normalizedPurpose,
    fileType,
    fileSize,
    itemId: params.itemId,
    uploadId: params.uploadId,
  });
}

export async function verifyR2ObjectExists(key: string): Promise<boolean> {
  return activeProvider.verifyUpload(key);
}

export async function getR2Object(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return activeProvider.getFileBuffer(key);
}

export async function deleteStorageObject(key: string): Promise<boolean> {
  return activeProvider.deleteFile(key);
}
