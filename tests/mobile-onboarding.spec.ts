import { test, expect, Page } from '@playwright/test';

/**
 * Asserts mobile viewport hygiene:
 * 1. No horizontal scroll (scrollWidth <= window.innerWidth)
 * 2. All text inputs, textareas, selects have computed font-size >= 16px to prevent iOS Safari auto-zoom
 * 3. Primary Next/Continue action button is within the visible viewport (sticky bottom bar)
 */
async function assertMobileScreenHygiene(page: Page) {
  // 1. Verify no horizontal overflow/scroll
  const noHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth + 1; // +1px tolerance for subpixel rounding
  });
  expect(noHorizontalScroll).toBe(true);

  // 2. Verify all visible inputs, selects, textareas have font-size >= 16px
  const inputs = await page.locator('input:visible, select:visible, textarea:visible').all();
  for (const input of inputs) {
    const fontSize = await input.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(16);
  }

  // 3. Verify the primary Continue button is visible inside viewport
  const continueButton = page.locator('button:has-text("Continue")');
  await expect(continueButton).toBeVisible();

  const isButtonInViewport = await continueButton.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 10
    );
  });
  expect(isButtonInViewport).toBe(true);
}

test.describe('Mobile Onboarding Responsive Layout & Flow', () => {
  test('Completes Step 1 (1a -> 1b -> 1c -> 1d) on mobile viewport and reaches Step 2', async ({
    page,
  }) => {
    // Navigate to mobile onboarding test page
    await page.goto('/test-mobile-onboarding');

    // -------------------------------------------------------------
    // Screen 1a: Restaurant Name
    // -------------------------------------------------------------
    await page.waitForSelector('#restaurant-name');
    await assertMobileScreenHygiene(page);

    const nameInput = page.locator('#restaurant-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Zaayka Spice Bistro');

    // Click Continue
    const continue1a = page.locator('button:has-text("Continue")');
    await continue1a.click();

    // -------------------------------------------------------------
    // Screen 1b: Food Type Tap Cards
    // -------------------------------------------------------------
    await page.waitForSelector('text=What do you serve?');
    await assertMobileScreenHygiene(page);

    // Select "Pure Veg" tap card
    const vegCard = page.locator('button:has-text("Pure Veg")');
    await expect(vegCard).toBeVisible();
    await vegCard.click();

    // Click Continue
    const continue1b = page.locator('button:has-text("Continue")');
    await continue1b.click();

    // -------------------------------------------------------------
    // Screen 1c: Phone Number
    // -------------------------------------------------------------
    await page.waitForSelector('#phone-number');
    await assertMobileScreenHygiene(page);

    const phoneInput = page.locator('#phone-number');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9876543210');

    // Click Continue
    const continue1c = page.locator('button:has-text("Continue")');
    await continue1c.click();

    // -------------------------------------------------------------
    // Screen 1d: City
    // -------------------------------------------------------------
    await page.waitForSelector('#restaurant-city');
    await assertMobileScreenHygiene(page);

    const cityInput = page.locator('#restaurant-city');
    await expect(cityInput).toBeVisible();
    await cityInput.fill('Mumbai');

    // Click Continue
    const continue1d = page.locator('button:has-text("Continue")');
    await continue1d.click();

    // -------------------------------------------------------------
    // Reaches Step 2: Look & Style (Screen 2a: Add your restaurant logo)
    // -------------------------------------------------------------
    await page.waitForSelector('text=Add your restaurant logo');
    const step2Header = page.locator('text=Add your restaurant logo');
    await expect(step2Header).toBeVisible();

    // Verify progress indicator reads Step 2 of 5
    const progressText = page.locator('text=Step 2 of 5');
    await expect(progressText).toBeVisible();

    // Verify no horizontal overflow on step 2
    const noHorizontalScrollStep2 = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalScrollStep2).toBe(true);
  });

  test('Capture Before Screenshots at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. /test-mobile-onboarding
    await page.goto('/test-mobile-onboarding');
    await page.waitForSelector('#restaurant-name');
    await page.screenshot({
      path: '/Users/alokkhamora/.gemini/antigravity/brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots/before-onboarding-390px.png',
      fullPage: true,
    });

    // 2. /owner (redirects to /owner/onboarding when unauthenticated)
    await page.goto('/owner');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/Users/alokkhamora/.gemini/antigravity/brain/c981519c-7047-4ad2-9bee-2b9374da6548/screenshots/before-owner-390px.png',
      fullPage: true,
    });
  });
});
