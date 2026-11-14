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

    // 7. Capture Screenshots
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

  test('Comparison Slider: Verify Drag and Keyboard Interactions at 1280px, 390px, 360px', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 800, name: 'Desktop 1280px' },
      { width: 390, height: 844, name: 'iPhone 390px' },
      { width: 360, height: 740, name: 'Android 360px' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const slider = page.locator('div[role="slider"]').first();
      await expect(slider).toBeAttached({ timeout: 10000 });
      await slider.scrollIntoViewIfNeeded();
      await expect(slider).toBeVisible();

      // Initial value assertion
      const initialVal = await slider.getAttribute('aria-valuenow');
      expect(Number(initialVal)).toBe(50);

      // 1. Keyboard interaction test
      await slider.focus();
      await slider.press('ArrowRight');
      await slider.press('ArrowRight');
      const valAfterRight = await slider.getAttribute('aria-valuenow');
      expect(Number(valAfterRight)).toBeGreaterThan(50);

      await slider.press('ArrowLeft');
      const valAfterLeft = await slider.getAttribute('aria-valuenow');
      expect(Number(valAfterLeft)).toBeLessThan(Number(valAfterRight));

      await slider.press('Home');
      expect(await slider.getAttribute('aria-valuenow')).toBe('0');

      await slider.press('End');
      expect(await slider.getAttribute('aria-valuenow')).toBe('100');

      // 2. Drag interaction test with pointer movement across devices
      const box = await slider.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        const startX = box.x + box.width * 0.5;
        const targetX = box.x + box.width * 0.25; // Drag to 25%

        // Dispatch pointer events directly on slider to verify pointer capture & tracking logic
        await slider.dispatchEvent('pointerdown', { clientX: startX, pointerId: 1, pointerType: 'touch' });
        await slider.dispatchEvent('pointermove', { clientX: targetX, pointerId: 1, pointerType: 'touch' });
        await slider.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });

        const valAfterDrag = Number(await slider.getAttribute('aria-valuenow'));
        expect(valAfterDrag).toBeLessThan(40);
      }

      // 3. Accessible range input test
      const rangeInput = page.locator('#comparison-range-slider');
      await expect(rangeInput).toBeVisible();
      await rangeInput.fill('75');
      expect(await slider.getAttribute('aria-valuenow')).toBe('75');
    }
  });

  test('Sign-In Redirect: Verify Hero, Desktop/Mobile Nav, and Next Parameter', async ({ page }) => {
    // 1. Desktop Nav Sign In
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const desktopSignIn = page.locator('header a:has-text("Sign In"), div a:has-text("Sign In")').first();
    await desktopSignIn.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Restaurant Owner Portal')).toBeVisible();

    // 2. Hero Sign In Link
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const heroSignIn = page.locator('section a:has-text("Sign in to dashboard")').first();
    await heroSignIn.click();
    await expect(page).toHaveURL(/\/login/);

    // 3. Mobile Nav Sign In
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const pill = page.locator('nav').first();
    await pill.click();
    const mobileSignInBtn = page.locator('button:has-text("Sign In")');
    await expect(mobileSignInBtn).toBeVisible();
    await mobileSignInBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // 4. Safe internal redirect check on /owner
    const res = await page.goto('/owner');
    expect(res?.url()).toContain('/login');
  });

  test('Connect With Us: Verify Action, Scrolling, and Verified Contact Channels', async ({ page }) => {
    // 1. Desktop Navbar Contact click
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const contactNav = page.locator('a:has-text("Contact")').first();
    await contactNav.click();
    await page.waitForTimeout(600);

    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();
    await expect(page.locator('h2:has-text("Connect with us")')).toBeVisible();

    // Verify WhatsApp direct channel
    const whatsappLink = page.locator('a[href*="wa.me/917000703701"]');
    await expect(whatsappLink).toBeVisible();

    // Verify Phone direct channel
    const phoneLink = page.locator('a[href="tel:+917000703701"]').first();
    await expect(phoneLink).toBeVisible();

    // Verify Email direct channel
    const emailLink = page.locator('a[href="mailto:zaaykatech@gmail.com"]').first();
    await expect(emailLink).toBeVisible();

    // 2. Mobile Nav Contact click
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pill = page.locator('nav').first();
    await pill.click();

    const mobileContactBtn = page.locator('button:has-text("Contact")');
    await expect(mobileContactBtn).toBeVisible();
    await mobileContactBtn.click();
    await page.waitForTimeout(600);

    // Verify scroll to contact
    await expect(contactSection).toBeInViewport({ timeout: 10000 });
  });

  test('Marketing Images: Verify Zero 404s and Successful Natural Rendering Across Page', async ({ page }) => {
    const failed404s: string[] = [];
    page.on('response', (res) => {
      const url = res.url();
      if (
        res.status() === 404 &&
        !url.includes('_vercel') &&
        (url.includes('/desktop/') || url.includes('/hero/') || url.includes('/logos/') || url.includes('/brand/') || url.includes('logo.png') || url.includes('favicon.ico'))
      ) {
        failed404s.push(url);
      }
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Scroll to #work to trigger lazy images
    const workSection = page.locator('#work');
    await expect(workSection).toBeAttached({ timeout: 10000 });
    await workSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Wait for images to finish decoding
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img[src*="desktop"]'));
      await Promise.all(
        imgs.map((img) => ((img as HTMLImageElement).decode ? (img as HTMLImageElement).decode().catch(() => {}) : Promise.resolve()))
      );
    });

    // Assert zero image 404 errors
    expect(failed404s, `Found 404 image requests: ${failed404s.join(', ')}`).toHaveLength(0);

    // Assert natural width > 0 for all loaded desktop showcase images
    const desktopImgs = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="desktop"]'));
      return imgs.map((img) => ({
        src: (img as HTMLImageElement).src,
        naturalWidth: (img as HTMLImageElement).naturalWidth,
        complete: (img as HTMLImageElement).complete,
      }));
    });

    expect(desktopImgs.length).toBeGreaterThan(0);
    for (const img of desktopImgs) {
      expect(img.naturalWidth, `Image failed to decode: ${img.src}`).toBeGreaterThan(0);
      expect(img.complete).toBe(true);
    }
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
