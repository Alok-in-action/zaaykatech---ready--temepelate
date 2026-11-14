import { test, expect } from '@playwright/test';

test.describe('Public Menu & Owner Regression Suite', () => {
  test('Capture After Screenshots of Owner Portal at 390px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // /owner (redirects to /login or /owner/onboarding when unauthenticated)
    const res = await page.goto('/owner');
    expect(res?.status()).toBeLessThan(400);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: testInfo.outputPath('after-owner-390px.png'),
      fullPage: true,
    });
  });

  test('Public Menu at /r/demo - 390px Mobile Viewport', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.goto('/r/demo');
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    // Verify no horizontal overflow
    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalScroll).toBe(true);

    // Verify restaurant header is rendered
    const headerTitle = page.locator('header');
    await expect(headerTitle).toBeVisible();

    // Verify categories with font-script headers (h2/h3)
    const scriptHeadings = page.locator('h2.font-script, h3.font-script');
    const headingCount = await scriptHeadings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Verify currency symbol ₹ is present on prices
    const prices = page.locator('text=/₹\\d+/');
    const priceCount = await prices.count();
    expect(priceCount).toBeGreaterThan(0);

    // Verify ZaaykaTech credit in footer
    const creditLink = page.locator('footer a[href="https://zaaykatech.com"]');
    await expect(creditLink).toBeVisible();

    // Capture screenshot at 390px
    await page.screenshot({
      path: testInfo.outputPath('saas-menu-390px.png'),
      fullPage: true,
    });
  });

  test('Real Restaurant with Custom Categories at /r/chai-point - 390px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.goto('/r/chai-point');
    if (!res || res.status() === 404) {
      test.skip(true, 'Live database tenant /r/chai-point is not available');
      return;
    }
    expect(res.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    // Verify no horizontal overflow on real restaurant
    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalScroll).toBe(true);

    // Verify header with restaurant name
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify custom Indian restaurant categories (Thali, Drinks, Soup, etc.)
    const scriptHeadings = page.locator('h2.font-script, h3.font-script');
    const headingCount = await scriptHeadings.count();
    expect(headingCount).toBeGreaterThan(5);

    // Verify currency symbol ₹ is present on prices
    const prices = page.locator('text=/₹\\d+/');
    const priceCount = await prices.count();
    expect(priceCount).toBeGreaterThan(10);

    // Capture screenshot at 390px
    await page.screenshot({
      path: testInfo.outputPath('chai-point-390px.png'),
      fullPage: true,
    });
  });

  test('Public Menu at /r/demo - 1280px Desktop Viewport', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto('/r/demo');
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    // Verify desktop header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Capture screenshot at 1280px
    await page.screenshot({
      path: testInfo.outputPath('saas-menu-1280px.png'),
      fullPage: true,
    });
  });

  test('Quick Links Menu Interactions (Call, WhatsApp, Owner Portal)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.goto('/r/demo');
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    // Click Hamburger menu button in header
    const hamburgerBtn = page.locator('header button[aria-label="Open menu"]');
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();

    // Verify Quick Links drawer opens
    const quickLinksHeader = page.locator('h2:has-text("Quick Links")');
    await expect(quickLinksHeader).toBeVisible();

    // Verify Call Us link has tel: protocol
    const callLink = page.locator('nav a[href^="tel:"]');
    await expect(callLink).toBeVisible();

    // Verify WhatsApp link exists
    const waLink = page.locator('nav a:has-text("WhatsApp")');
    await expect(waLink).toBeVisible();

    // Verify Owner Portal link exists
    const ownerLink = page.locator('nav a:has-text("Owner Portal")');
    await expect(ownerLink).toBeVisible();
  });
});
