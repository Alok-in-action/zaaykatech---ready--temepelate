import assert from 'node:assert';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import QRCode from 'qrcode';
import { slugify } from '../src/lib/utils';
import {
  RestaurantBrandingSchema,
  MediaUploadRequestSchema,
  RestaurantThemeSchema,
} from '../src/validations/restaurant';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  createPresignedUploadUrl,
} from '../src/lib/storage/r2';

async function runPhase2Tests() {
  console.log('--- STARTING ZAAYKATECH PHASE 2 VERIFICATION TESTS ---');

  // ============================================================================
  // TEST 1: SLUG GENERATION & SANITIZATION
  // ============================================================================
  console.log('\n[TEST 1] Testing Slug Generation & Invariant Rules:');

  const slug1 = slugify('The Royal Chai & Bakery!');
  assert.strictEqual(slug1, 'the-royal-chai-bakery', 'Slug must be clean kebab-case without punctuation');

  const slug2 = slugify('   Café 9:50 Pune - Special   ');
  assert.strictEqual(slug2, 'caf-950-pune-special', 'Slug must handle accents and symbols cleanly');

  const slug3 = slugify('100% Organic Brews');
  assert.strictEqual(slug3, '100-organic-brews', 'Slug must support numbers');

  console.log('  ✓ Slug normalization and special character stripping verified');

  // ============================================================================
  // TEST 2: CLOUDFLARE R2 UPLOAD VALIDATION & SIZE LIMITS (CORRECTION 3 & 4)
  // ============================================================================
  console.log('\n[TEST 2] Testing Cloudflare R2 Upload Validation & Size Limits:');

  const testRestaurantId = '11111111-1111-1111-1111-111111111111';

  // 2.1 Max video size is 50MB (Correction 3)
  assert.strictEqual(MAX_VIDEO_SIZE_BYTES, 50 * 1024 * 1024, 'Video size limit must be 50 MB');
  assert.strictEqual(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024, 'Image size limit must be 5 MB');
  console.log('  ✓ Video limit 50MB and Image limit 5MB verified');

  // 2.2 Reject video over 50MB
  let videoTooLargeThrown = false;
  try {
    await createPresignedUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'hero',
      fileType: 'video/mp4',
      fileSize: 52 * 1024 * 1024, // 52 MB
    });
  } catch (err: unknown) {
    videoTooLargeThrown = true;
    assert.ok((err as Error).message.includes('50 MB'), 'Error must specify 50 MB limit');
  }
  assert.strictEqual(videoTooLargeThrown, true, 'Oversized video (>50MB) must be rejected');
  console.log('  ✓ Oversized video (>50MB) rejected successfully');

  // 2.3 Reject image over 5MB
  let imageTooLargeThrown = false;
  try {
    await createPresignedUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'logo',
      fileType: 'image/png',
      fileSize: 6 * 1024 * 1024, // 6 MB
    });
  } catch (err: unknown) {
    imageTooLargeThrown = true;
    assert.ok((err as Error).message.includes('5 MB'), 'Error must specify 5 MB limit');
  }
  assert.strictEqual(imageTooLargeThrown, true, 'Oversized image (>5MB) must be rejected');
  console.log('  ✓ Oversized image (>5MB) rejected successfully');

  // 2.4 Reject dangerous/unsupported file types
  let invalidMimeThrown = false;
  try {
    await createPresignedUploadUrl({
      restaurantId: testRestaurantId,
      purpose: 'logo',
      fileType: 'application/x-msdownload',
      fileSize: 1024,
    });
  } catch (err: unknown) {
    invalidMimeThrown = true;
  }
  assert.strictEqual(invalidMimeThrown, true, 'Non-allowed MIME type must be rejected');
  console.log('  ✓ Non-allowed MIME type rejected successfully');

  // 2.5 Safe presigned key format
  const presigned = await createPresignedUploadUrl({
    restaurantId: testRestaurantId,
    purpose: 'logo',
    fileType: 'image/png',
    fileSize: 100 * 1024,
  });
  assert.ok(
    presigned.key.startsWith(`restaurants/${testRestaurantId}/logo/`),
    'Object key must follow restaurants/{restaurantId}/logo/ format'
  );
  assert.strictEqual(presigned.expiresInSeconds, 300, 'Presigned URL must expire in 300s (5m)');
  console.log('  ✓ Presigned key and 300s expiration verified');

  // ============================================================================
  // TEST 3: HERO VIDEO POSTER REQUIREMENT (CORRECTION 3)
  // ============================================================================
  console.log('\n[TEST 3] Testing Hero Video Poster Enforcement in Zod Schema:');

  // 3.1 Video without poster must fail validation
  const invalidVideoBranding = RestaurantBrandingSchema.safeParse({
    hero_media_type: 'video',
    hero_media_url: 'https://media.zaaykatech.com/video.mp4',
    hero_poster_url: '', // Missing poster
  });
  assert.strictEqual(invalidVideoBranding.success, false, 'Video without poster image must fail validation');
  console.log('  ✓ Video without poster image rejected as invalid');

  // 3.2 Video with poster must pass validation
  const validVideoBranding = RestaurantBrandingSchema.safeParse({
    hero_media_type: 'video',
    hero_media_url: 'https://media.zaaykatech.com/video.mp4',
    hero_poster_url: 'https://media.zaaykatech.com/poster.jpg',
  });
  assert.strictEqual(validVideoBranding.success, true, 'Video with poster image must pass validation');
  console.log('  ✓ Video with poster image accepted');

  // 3.3 Still image without poster must pass validation
  const validImageBranding = RestaurantBrandingSchema.safeParse({
    hero_media_type: 'image',
    hero_media_url: 'https://media.zaaykatech.com/image.jpg',
  });
  assert.strictEqual(validImageBranding.success, true, 'Still image hero does not require poster');
  console.log('  ✓ Image hero without poster accepted');

  // ============================================================================
  // TEST 4: THEME VALIDATION & CARD STYLES
  // ============================================================================
  console.log('\n[TEST 4] Testing Theme Customizer Zod Schema:');

  const validTheme = RestaurantThemeSchema.safeParse({
    primary_color: '#8B4A27',
    accent_color: '#D2691E',
    background_color: '#FAF8F5',
    card_style: 'warm_editorial',
  });
  assert.strictEqual(validTheme.success, true, 'Valid theme palette must pass');

  const invalidHexTheme = RestaurantThemeSchema.safeParse({
    primary_color: 'not-a-color',
  });
  assert.strictEqual(invalidHexTheme.success, false, 'Invalid hex color must fail');
  console.log('  ✓ Theme hex colors and card styles validated');

  // ============================================================================
  // TEST 5: QR CODE GENERATION & SVG EXPORT
  // ============================================================================
  console.log('\n[TEST 5] Testing QR Code Generation:');

  const testUrl = 'https://zaaykatech.com/r/the-royal-chai-co';
  const qrDataUrl = await QRCode.toDataURL(testUrl, { width: 512, margin: 2 });
  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'QR data URL must be valid base64 PNG');

  const qrSvg = await QRCode.toString(testUrl, { type: 'svg', margin: 2 });
  assert.ok(qrSvg.includes('<svg') && qrSvg.includes('</svg>'), 'QR SVG output must be valid SVG markup');
  console.log('  ✓ High-resolution PNG and Vector SVG QR code generation verified');

  console.log('\n--- ALL ZAAYKATECH PHASE 2 TESTS PASSED (100%) ---\n');
}

runPhase2Tests().catch((err) => {
  console.error('\n❌ Phase 2 test execution failed:', err);
  process.exit(1);
});
