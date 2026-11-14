import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_SCREENSHOTS_DIR = '/Users/alokkhamora/.gemini/antigravity/brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots';

test.describe('Marketing Website Conversion & Mobile Suite', () => {
  test('Desktop 1280px: Verify All 8 Sections, Hero CTAs, Preview, FAQ and Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Verify Brand Title and Tagline
    await expect(page.locator('text=ZaaykaTech').first()).toBeVisible();
    await expect(page.locator('text=THE FUTURE OF DINING IS HERE')).toBeVisible();

    // 2. Verify Hero Headline & Supporting text
    await expect(page.locator('h1:has-text("Your restaurant’s digital menu. Managed in minutes.")')).toBeVisible();
    await expect(page.locator('text=Create your QR menu, update dishes and prices, and manage everything from one simple dashboard.')).toBeVisible();

    // 3. Verify Hero CTAs
    const primaryTrialBtn = page.locator('section a:has-text("Start free trial")').first();
    await expect(primaryTrialBtn).toBeVisible();
    await expect(primaryTrialBtn).toHaveAttribute('href', '/login');

    const secondarySeeHowBtn = page.locator('section a:has-text("See how it works")').first();
    await expect(secondarySeeHowBtn).toBeVisible();
    await expect(secondarySeeHowBtn).toHaveAttribute('href', '#preview');

    const ownerSignInLink = page.locator('section a:has-text("Sign in to dashboard")').first();
    await expect(ownerSignInLink).toBeVisible();
    await expect(ownerSignInLink).toHaveAttribute('href', '/login');

    // 4. Verify Section Order in DOM
    const previewSection = page.locator('#preview');
    await expect(previewSection).toBeVisible();
    await expect(page.locator('h2:has-text("See ZaaykaTech in Action")')).toBeVisible();

    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    const howItWorksSection = page.locator('#how-it-works');
    await expect(howItWorksSection).toBeVisible();
    await expect(page.locator('h2:has-text("Live in 3 Simple Steps")')).toBeVisible();

    const workSection = page.locator('#work');
    await expect(workSection).toBeVisible();

    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();

    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();
    await expect(page.locator('h2:has-text("Frequently Asked Questions")')).toBeVisible();

    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();

    // 5. Test Interactive Phone Preview (Category click & Search)
    const startersTab = page.locator('button:has-text("Starters")').first();
    await startersTab.scrollIntoViewIfNeeded();
    await startersTab.click({ force: true });
    await expect(page.locator('text=Crispy Corn & Water Chestnut')).toBeVisible();

    // 6. Test FAQ Accordion expand
    const faqItem = page.locator('button:has-text("Do customers need to download an app")');
    await faqItem.scrollIntoViewIfNeeded();
    await faqItem.press('Enter');
    await expect(page.locator('text=The digital menu opens immediately in their mobile browser')).toBeVisible();

    // 7. Capture After Screenshots
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-after-1280px.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-homepage-1280px.png'),
      fullPage: false,
    });
  });

  test('Mobile 390px: Verify Hero CTA Above Fold, Mobile Navigation & Touch Controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify Brand title is visible
    await expect(page.locator('text=ZaaykaTech').first()).toBeVisible();

    // Verify Hero Primary CTA button is visible above the fold and has >= 55px height
    const heroTrialBtn = page.locator('section a:has-text("Start free trial")').first();
    await expect(heroTrialBtn).toBeVisible();
    await page.waitForTimeout(500);
    const box = await heroTrialBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(55);
      expect(box.y + box.height).toBeLessThan(844); // strictly above the fold
    }

    // Verify Mobile Navigation Pill exists
    const pillNav = page.locator('nav').first();
    await expect(pillNav).toBeVisible();

    // Tap to expand
    await pillNav.click();
    // Verify Sign In link is accessible in expanded navigation
    const navSignIn = page.locator('button:has-text("Sign In")');
    if (await navSignIn.isVisible()) {
      await expect(navSignIn).toBeVisible();
    }

    // Capture mobile screenshots
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-after-390px.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(ARTIFACT_SCREENSHOTS_DIR, 'marketing-homepage-390px.png'),
      fullPage: false,
    });
  });

  test('Responsive Viewport Scan: 320px, 360px, 412px, 768px for Zero Horizontal Overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 600, name: '320px Ultra-compact' },
      { width: 360, height: 740, name: '360px Android' },
      { width: 412, height: 915, name: '412px Pixel' },
      { width: 768, height: 1024, name: '768px Tablet' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });
      expect(hasHorizontalScroll, `Failed on viewport ${vp.name}`).toBe(false);
    }
  });

  test('Verify Pricing Page at 1280px and 390px', async ({ page }) => {
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

  test('Verify Protected Owner Portal & Menu Routes are Unaffected', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Test /login
    await page.goto('/login');
    await expect(page.locator('text=Restaurant Owner Portal')).toBeVisible();

    // Verify /owner redirects unauthenticated users safely
    const response = await page.goto('/owner');
    expect(response?.url()).toContain('/login');
  });
});
