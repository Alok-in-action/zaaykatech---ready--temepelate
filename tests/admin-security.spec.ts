import { test, expect } from '@playwright/test';
import path from 'node:path';

const ARTIFACT_SCREENSHOTS_DIR =
  process.env.APP_DATA_DIR
    ? path.join(process.env.APP_DATA_DIR, 'brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots')
    : '/Users/alokkhamora/.gemini/antigravity/brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots';

test.describe('Platform Admin Security & Observability Suite', () => {
  test('Signed-out visitor is redirected to /login?next=/admin when accessing /admin', async ({
    page,
  }) => {
    // Clear cookies to ensure strictly signed-out state
    await page.context().clearCookies();
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Expect redirect to login with next parameter
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test('Direct access to /api/admin/* endpoints is rejected with 401 for unauthenticated callers', async ({
    request,
  }) => {
    const endpoints = [
      '/api/admin/overview',
      '/api/admin/restaurants',
      '/api/admin/payments',
      '/api/admin/health',
    ];

    for (const ep of endpoints) {
      const res = await request.get(ep);
      expect(res.status(), `Endpoint ${ep} should reject unauthenticated caller with 401`).toBe(401);

      // Verify no-cache security headers
      const cacheControl = res.headers()['cache-control'];
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('private');
    }
  });

  test('Non-admin authenticated account receives 403 Access Denied when accessing /admin', async ({
    page,
  }) => {
    // Navigate with non-admin owner credentials
    await page.setExtraHTTPHeaders({
      'x-test-owner-role': 'restaurant_owner',
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Should display the Access Denied security boundary component
    const accessDeniedHeading = page.locator('h1:has-text("Operator Access Required")');
    await expect(accessDeniedHeading).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Platform Security Boundary')).toBeVisible();
    await expect(page.locator('a:has-text("Return to Restaurant Dashboard")')).toBeVisible();
  });

  test('Authorized platform operator can view Overview and all 7 sections at 1280px & 390px', async ({
    page,
  }) => {
    // Set test operator credentials
    await page.setExtraHTTPHeaders({
      'x-test-admin-role': 'platform_admin',
    });

    // 1. Desktop 1280px verification
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify Brand, Badge & Overview heading
    await expect(page.locator('text=Platform Admin').first()).toBeVisible();
    await expect(page.locator('h1:has-text("Platform Overview")')).toBeVisible();

    // Verify key metric sections exist
    await expect(page.locator('text=Tenant & Subscription Lifecycles')).toBeVisible();
    await expect(page.locator('text=Revenue & Payment Collections')).toBeVisible();
    await expect(page.locator('text=Renewal & Expiry Horizons')).toBeVisible();
    await expect(page.locator('text=Storage, OCR & Security Operations')).toBeVisible();

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'admin-overview-1280px.png'),
      fullPage: false,
    });

    // 2. Restaurants Section
    await page.goto('/admin/restaurants', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Registered Restaurants")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search by restaurant"]')).toBeVisible();

    // 3. Payments Section
    await page.goto('/admin/payments', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Payments & Subscriptions")')).toBeVisible();
    await expect(page.locator('text=Gross Live Revenue')).toBeVisible();

    // 4. Storage Section
    await page.goto('/admin/storage', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Storage & Database Usage")')).toBeVisible();
    await expect(page.locator('text=Provider Dashboard Required')).toBeVisible();

    // 5. Imports Section
    await page.goto('/admin/imports', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("OCR & Menu Import Jobs")')).toBeVisible();
    await expect(page.locator('text=Local Tesseract + PDF.js')).toBeVisible();

    // 6. Security Section
    await page.goto('/admin/security', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Security & Rate Limits")')).toBeVisible();
    await expect(page.locator('text=Menu AI / OCR Extraction')).toBeVisible();

    // 7. Health Section
    await page.goto('/admin/health', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("System & Infrastructure Health")')).toBeVisible();
    await expect(page.locator('text=Postgres Database')).toBeVisible();

    // 8. Mobile 390px Viewport Verification
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow, 'Admin overview must not overflow horizontally on 390px').toBe(
      false
    );

    // Capture Mobile Screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'admin-overview-390px.png'),
      fullPage: false,
    });
  });

  test('Owner dashboard routes and existing public routes remain unaffected', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Marketing home page
    const homeRes = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(homeRes?.status()).toBe(200);

    // 2. Owner portal auth gate
    await page.context().clearCookies();
    await page.goto('/owner', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
