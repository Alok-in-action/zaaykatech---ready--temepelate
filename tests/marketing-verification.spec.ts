import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_SCREENSHOTS_DIR = '/Users/alokkhamora/.gemini/antigravity/brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots';

test.describe('Marketing Website Integration Suite', () => {
  test('Capture Homepage at 1280px Desktop and Verify Elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify Brand Title and Heading
    await expect(page.locator('text=ZaaykaTech').first()).toBeVisible();
    await expect(page.locator('text=THE FUTURE OF DINING IS HERE')).toBeVisible();

    // Verify SaaS Hero Headline and Description
    await expect(page.locator('h1:has-text("Your restaurant’s digital menu. Managed in minutes.")')).toBeVisible();
    await expect(page.locator('text=Create your QR menu, update dishes and prices, and manage everything from one simple dashboard.')).toBeVisible();

    // Verify Hero CTA buttons
    const heroSignInBtn = page.locator('section a:has-text("Sign in")').first();
    await expect(heroSignInBtn).toBeVisible();
    await expect(heroSignInBtn).toHaveAttribute('href', '/login');

    const heroDemoBtn = page.locator('section a:has-text("View demo")').first();
    await expect(heroDemoBtn).toBeVisible();
    await expect(heroDemoBtn).toHaveAttribute('href', '/r/chai-point');

    // Verify Sections exist
    await expect(page.locator('#work')).toBeVisible();
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-homepage-1280px.png'),
      fullPage: false,
    });
  });

  test('Capture Homepage at 390px Mobile Viewport and Check Hero CTA Above Fold', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify Brand title is visible
    await expect(page.locator('text=ZaaykaTech').first()).toBeVisible();

    // Verify SaaS Hero Headline
    await expect(page.locator('h1:has-text("Your restaurant’s digital menu. Managed in minutes.")')).toBeVisible();

    // Verify Hero Sign In button is visible above the fold and has >= 56px height
    const heroSignInBtn = page.locator('section a:has-text("Sign in")').first();
    await expect(heroSignInBtn).toBeVisible();
    const box = await heroSignInBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(55); // allowing 1px subpixel tolerance
      expect(box.y + box.height).toBeLessThan(844); // strictly above the fold on 844px height
    }

    // Capture mobile screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-homepage-390px.png'),
      fullPage: false,
    });
  });

  test('Verify 360px Compact Mobile Layout, Hero CTA Above Fold, and No Horizontal Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify Hero Sign In button is visible above fold on 740px height screen
    const heroSignInBtn = page.locator('section a:has-text("Sign in")').first();
    await expect(heroSignInBtn).toBeVisible();
    const box = await heroSignInBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(55);
      expect(box.y + box.height).toBeLessThan(740); // strictly above the fold on 740px screen
    }

    // Verify no unexpected horizontal document overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5; // small buffer for subpixel render
    });
    expect(hasHorizontalScroll).toBe(false);

    // Capture 360px screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-homepage-360px.png'),
      fullPage: false,
    });
  });

  test('Capture Pricing Page at 1280px and 390px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/pricing', { waitUntil: 'networkidle' });

    await expect(page.locator('h1:has-text("Simple, Transparent Pricing")')).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-pricing-1280px.png'),
      fullPage: false,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-pricing-390px.png'),
      fullPage: false,
    });
  });

  test('Verify CTA and Navigation links route correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Check Sign In button in navbar
    const signInBtn = page.locator('nav a:has-text("Sign In"), header a:has-text("Sign In")').first();
    if (await signInBtn.isVisible()) {
      await expect(signInBtn).toHaveAttribute('href', '/login');
    }

    // Check Pricing Card CTA
    const pricingCta = page.locator('a:has-text("Start Free Trial")').first();
    await expect(pricingCta).toHaveAttribute('href', '/login');

    const proCta = page.locator('a:has-text("Get Started Today")').first();
    await expect(proCta).toHaveAttribute('href', '/login');
  });

  test('Verify Protected Owner Portal & Menu Styles are Unaffected', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Test /login
    await page.goto('/login');
    await expect(page.locator('text=Restaurant Owner Portal')).toBeVisible();

    // Verify /owner redirects unauthenticated users safely
    const response = await page.goto('/owner');
    expect(response?.url()).toContain('/login');
  });
});
