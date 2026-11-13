import assert from 'node:assert';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { mediaStorage } from '../src/lib/storage';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_AI_IMPORT_SIZE_BYTES,
  MAX_CSV_SIZE_BYTES,
  StoragePurpose,
} from '../src/lib/storage/types';
import {
  createPresignedUploadUrl,
  verifyR2ObjectExists,
  deleteStorageObject,
} from '../src/lib/storage/r2';

async function runStorageVerification() {
  console.log('================================================================');
  console.log('   ZAAYKATECH SUPABASE STORAGE & TENANT ISOLATION TESTS');
  console.log('================================================================\n');

  const testRestaurantId = '99999999-9999-9999-9999-999999999999';
  const testItemId = 'item-8888-8888';

  // ---------------------------------------------------------------------------
  // TEST 1: CONSTANTS & SIZE LIMITS
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] Verifying Storage Constants & Size Limits:');
  assert.strictEqual(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024, 'Image size limit must be 5 MB');
  assert.strictEqual(MAX_VIDEO_SIZE_BYTES, 50 * 1024 * 1024, 'Video size limit must be 50 MB');
  assert.strictEqual(MAX_AI_IMPORT_SIZE_BYTES, 10 * 1024 * 1024, 'AI/Document size limit must be 10 MB');
  assert.strictEqual(MAX_CSV_SIZE_BYTES, 2 * 1024 * 1024, 'CSV size limit must be 2 MB');
  console.log('  ✓ Image limit: 5 MB, Video limit: 50 MB, Document limit: 10 MB, CSV limit: 2 MB');

  // ---------------------------------------------------------------------------
  // TEST 2: TENANT-SCOPED PATH ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying Tenant-Scoped Paths:');

  const purposes: { purpose: StoragePurpose; mimeType: string; itemId?: string; expectedFolder: string }[] = [
    { purpose: 'logo', mimeType: 'image/png', expectedFolder: `restaurants/${testRestaurantId}/logo/` },
    { purpose: 'hero', mimeType: 'video/mp4', expectedFolder: `restaurants/${testRestaurantId}/hero/` },
    { purpose: 'hero-poster', mimeType: 'image/jpeg', expectedFolder: `restaurants/${testRestaurantId}/hero-poster/` },
    { purpose: 'menu-item', mimeType: 'image/webp', itemId: testItemId, expectedFolder: `restaurants/${testRestaurantId}/menu-items/${testItemId}/` },
    { purpose: 'qr', mimeType: 'image/png', expectedFolder: `restaurants/${testRestaurantId}/qr/` },
    { purpose: 'ai-import', mimeType: 'application/pdf', expectedFolder: `restaurants/${testRestaurantId}/ai-imports/` },
  ];

  for (const p of purposes) {
    const uploadMeta = await mediaStorage.getUploadUrl({
      restaurantId: testRestaurantId,
      purpose: p.purpose,
      fileType: p.mimeType,
      fileSize: 1024,
      itemId: p.itemId,
    });

    assert.ok(
      uploadMeta.key.startsWith(p.expectedFolder),
      `Key ${uploadMeta.key} must start with tenant path: ${p.expectedFolder}`
    );
    assert.ok(uploadMeta.uploadUrl.length > 0, 'Upload URL must not be empty');
    assert.ok(uploadMeta.publicUrl.includes('zaaykatech-media'), 'Public URL must target zaaykatech-media');
    console.log(`  ✓ Purpose '${p.purpose}' => ${uploadMeta.key}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: SIZE VALIDATION & REJECTIONS
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Size & Type Limit Rejections:');

  // Reject image > 5 MB
  let rejected = false;
  try {
    await mediaStorage.getUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'logo',
      fileType: 'image/png',
      fileSize: 6 * 1024 * 1024,
    });
  } catch (err: any) {
    rejected = true;
    assert.match(err.message, /exceeds maximum allowed size/, 'Must reject oversized image');
  }
  assert.ok(rejected, 'Should have thrown for image > 5MB');
  console.log('  ✓ Image > 5 MB correctly rejected');

  // Reject video > 50 MB
  rejected = false;
  try {
    await mediaStorage.getUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'hero',
      fileType: 'video/mp4',
      fileSize: 52 * 1024 * 1024,
    });
  } catch (err: any) {
    rejected = true;
    assert.match(err.message, /exceeds maximum allowed size/, 'Must reject oversized video');
  }
  assert.ok(rejected, 'Should have thrown for video > 50MB');
  console.log('  ✓ Video > 50 MB correctly rejected');

  // Reject unsupported MIME type
  rejected = false;
  try {
    await mediaStorage.getUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'logo',
      fileType: 'application/x-msdownload',
      fileSize: 1024,
    });
  } catch (err: any) {
    rejected = true;
    assert.match(err.message, /Unsupported file type/, 'Must reject disallowed MIME type');
  }
  assert.ok(rejected, 'Should have thrown for disallowed MIME');
  console.log('  ✓ Disallowed MIME types correctly rejected');

  // ---------------------------------------------------------------------------
  // TEST 4: DIRECT UPLOAD, PUBLIC URL, VERIFICATION & DELETION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 4] Live Supabase Storage Lifecycle:');

  const testBuffer = Buffer.from('ZaaykaTech Supabase Storage Live Verification Test Content');
  const testKey = `restaurants/${testRestaurantId}/qr/verification-test-${Date.now()}.png`;

  console.log(`  Target key: ${testKey}`);

  // 4.1 Direct Upload
  const uploadRes = await mediaStorage.uploadFile({
    key: testKey,
    fileBuffer: testBuffer,
    contentType: 'image/png',
  });
  assert.ok(uploadRes.publicUrl.includes('zaaykatech-media'), 'Public URL must reference zaaykatech-media bucket');
  console.log(`  ✓ Upload succeeded. Public URL: ${uploadRes.publicUrl}`);

  // 4.2 Verify upload exists
  const exists = await mediaStorage.verifyUpload(testKey);
  assert.strictEqual(exists, true, 'Uploaded file must exist');
  console.log(`  ✓ verifyUpload confirmed existence`);

  // 4.3 Public URL retrieval
  const publicUrl = mediaStorage.getPublicUrl(testKey);
  assert.strictEqual(publicUrl, uploadRes.publicUrl, 'Public URL method must return consistent URL');
  console.log(`  ✓ getPublicUrl confirmed: ${publicUrl}`);

  // 4.4 Delete file
  const deleted = await mediaStorage.deleteFile(testKey);
  assert.strictEqual(deleted, true, 'deleteFile must return true on success');
  console.log(`  ✓ deleteFile executed`);

  // 4.5 Verify deletion
  const postDeleteCheck = await mediaStorage.verifyUpload(testKey);
  assert.strictEqual(postDeleteCheck, false, 'Deleted file must not exist in storage');
  console.log(`  ✓ verifyUpload confirmed object was deleted`);

  // ---------------------------------------------------------------------------
  // TEST 5: BACKWARD COMPATIBLE R2 WRAPPERS DELEGATION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Backward Compatible R2 Export Wrappers:');

  const presigned = await createPresignedUploadUrl({
    restaurantId: testRestaurantId,
    purpose: 'hero-poster',
    fileName: 'poster-test.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
  });

  assert.ok(presigned.key.includes(`/hero-poster/`), 'Presigned key must match hero-poster purpose');
  assert.ok(presigned.uploadUrl.length > 0, 'Presigned upload URL must be returned');
  assert.ok(presigned.publicUrl.includes('zaaykatech-media'), 'Presigned publicUrl must point to zaaykatech-media');
  console.log('  ✓ createPresignedUploadUrl delegated smoothly to Supabase Storage');

  // Verify non-existent file check with verifyR2ObjectExists
  const r2Check = await verifyR2ObjectExists('non-existent-file-path-12345.png');
  assert.strictEqual(r2Check, false, 'Non-existent file must return false');
  console.log('  ✓ verifyR2ObjectExists wrapper delegated smoothly');

  console.log('\n================================================================');
  console.log('  ALL STORAGE VERIFICATION TESTS PASSED SUCCESSFULLY! (5/5)');
  console.log('================================================================\n');
}

runStorageVerification().catch((err) => {
  console.error('\n❌ Storage verification failed:', err);
  process.exit(1);
});
