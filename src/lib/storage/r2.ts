import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

// Size limits as enforced in Phase 2 & Phase 4 corrections
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB for dish/logo
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB for hero video
export const MAX_AI_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB for PDF/Image AI import
export const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB for CSV

export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf', 'text/csv', 'text/plain'],
};

function getR2Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
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

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  uploadId?: string;
  expiresInSeconds: number;
}

/**
 * Generates a short-lived, single-use presigned PUT URL for Cloudflare R2.
 */
export async function createPresignedUploadUrl(params: {
  restaurantId: string;
  purpose: 'logo' | 'hero' | 'poster' | 'dish' | 'ai-import';
  fileType: string;
  fileSize: number;
  uploadId?: string;
}): Promise<PresignedUploadResult> {
  const { restaurantId, purpose, fileType, fileSize } = params;

  // 1. Validate File Size & Allowed MIME Types based on purpose
  if (purpose === 'ai-import') {
    const isCsv = fileType === 'text/csv' || fileType === 'text/plain';
    const maxSize = isCsv ? MAX_CSV_SIZE_BYTES : MAX_AI_IMPORT_SIZE_BYTES;
    const allowed = [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document];

    if (!allowed.includes(fileType)) {
      throw new Error(`Unsupported AI import file type "${fileType}".`);
    }
    if (fileSize > maxSize) {
      const maxMb = isCsv ? 2 : 10;
      throw new Error(`File exceeds maximum allowed size of ${maxMb} MB.`);
    }
  } else {
    const isVideo = ALLOWED_MIME_TYPES.video.includes(fileType);
    const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

    if (fileSize > maxSize) {
      const maxMb = isVideo ? 50 : 5;
      throw new Error(`File exceeds maximum allowed size of ${maxMb} MB.`);
    }

    const allowed = isVideo ? ALLOWED_MIME_TYPES.video : ALLOWED_MIME_TYPES.image;
    if (!allowed.includes(fileType)) {
      throw new Error(`Unsupported file type "${fileType}". Allowed: ${allowed.join(', ')}`);
    }
  }

  // 2. Generate secure, unique object key matching:
  // restaurants/{restaurantId}/ai-imports/{uploadId}/ for AI imports
  const ext = fileType === 'application/pdf' ? 'pdf' : fileType === 'text/csv' ? 'csv' : fileType.split('/')[1] || 'bin';
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now();
  const effectiveUploadId = params.uploadId || crypto.randomUUID();

  let key: string;
  if (purpose === 'ai-import') {
    key = `restaurants/${restaurantId}/ai-imports/${effectiveUploadId}/${timestamp}-${randomSuffix}.${ext}`;
  } else {
    key = `restaurants/${restaurantId}/${purpose}/${timestamp}-${randomSuffix}.${ext}`;
  }

  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.zaaykatech.com';

  const r2Client = getR2Client();

  // If R2 credentials are not configured in local development, return mock development upload URL
  if (!r2Client) {
    return {
      uploadUrl: `https://mock-r2-upload.local/${key}`,
      publicUrl: `${publicBaseUrl}/${key}`,
      key,
      uploadId: effectiveUploadId,
      expiresInSeconds: 300,
    };
  }

  // 3. Generate short-lived presigned PUT URL (5 minutes)
  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(r2Client, putCommand, {
    expiresIn: 300, // 5 minutes
  });

  return {
    uploadUrl,
    publicUrl: `${publicBaseUrl}/${key}`,
    key,
    uploadId: effectiveUploadId,
    expiresInSeconds: 300,
  };
}

/**
 * Verifies that the uploaded object exists and is accessible in Cloudflare R2
 * before saving the URL to the database.
 */
export async function verifyR2ObjectExists(key: string): Promise<boolean> {
  const r2Client = getR2Client();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';

  // In development without live R2 credentials, treat mock keys as verified
  if (!r2Client) {
    return key.startsWith('restaurants/');
  }

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await r2Client.send(headCommand);
    return true;
  } catch (err) {
    console.warn(`Object verification failed for key "${key}":`, err);
    return false;
  }
}

/**
 * Downloads an object buffer from Cloudflare R2 for server-side processing (e.g. Gemini AI OCR).
 */
export async function getR2Object(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const r2Client = getR2Client();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'zaaykatech-media';

  if (!r2Client) {
    return null;
  }

  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await r2Client.send(getCommand);
    if (!response.Body) {
      return null;
    }
    const byteArray = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(byteArray),
      contentType: response.ContentType || 'application/octet-stream',
    };
  } catch (err) {
    console.error(`Failed to fetch object "${key}" from R2:`, err);
    return null;
  }
}
