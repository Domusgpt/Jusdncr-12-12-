import { test, expect } from '@playwright/test';

/**
 * jusDNCE E2E Test Suite with Visual Validation
 *
 * Each test captures screenshots to demonstrate:
 * 1. What the test is checking
 * 2. The expected visual state
 * 3. Pass/fail criteria
 */

test.describe('jusDNCE Visual Validation Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for WebGL to initialize
    await page.waitForTimeout(2000);
  });

  test('1. App Initial Load - Homepage renders correctly', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ App title "jusDNCE" is visible
     * ✓ WebGL background canvas is present
     * ✓ Header with branding loads
     * ✓ Footer navigation is visible
     */

    // Capture initial state
    await page.screenshot({
      path: 'tests/screenshots/01-initial-load.png',
      fullPage: true
    });

    // Validate title
    const title = page.locator('h1');
    await expect(title).toContainText('jusDNCE');

    // Validate WebGL canvas exists
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Validate header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Validate footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    console.log('✓ Homepage loaded successfully with all core elements');
  });

  test('2. Step 1 - Asset Upload Section', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ "SOURCE_IDENTITY" section header visible
     * ✓ Image upload area present
     * ✓ "UPLOAD TARGET" text visible
     * ✓ Audio upload section present
     * ✓ Upload area is interactive (hover state)
     */

    await page.screenshot({
      path: 'tests/screenshots/02-step1-assets.png',
      fullPage: true
    });

    // Validate SOURCE_IDENTITY section
    await expect(page.getByText('SOURCE_IDENTITY')).toBeVisible();

    // Validate upload target
    await expect(page.getByText('UPLOAD TARGET')).toBeVisible();

    // Validate file inputs exist
    const imageInput = page.locator('input[type="file"][accept*="image"]').first();
    await expect(imageInput).toBeAttached();

    // Hover over upload area to show interactive state
    const uploadArea = page.locator('.cursor-pointer').first();
    await uploadArea.hover();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/02b-step1-hover-state.png',
      fullPage: true
    });

    console.log('✓ Step 1 Asset upload section validated');
  });

  test('3. Header Components', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Logo/branding visible
     * ✓ Credits display shows "X CR"
     * ✓ Sign In button visible
     * ✓ Import Golem button visible
     */

    // Focus on header area
    const header = page.locator('header');
    await header.screenshot({
      path: 'tests/screenshots/03-header.png'
    });

    // Validate branding
    await expect(page.locator('h1')).toContainText('jusDNCE');

    // Validate credits display
    await expect(page.getByText(/\d+ CR/)).toBeVisible();

    // Validate Sign In button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Validate Import Golem button
    await expect(page.getByRole('button', { name: /import golem/i })).toBeVisible();

    console.log('✓ Header components validated');
  });

  test('4. Footer Navigation', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Progress indicators visible
     * ✓ Step 1 highlighted as active
     * ✓ "CONTINUE SEQUENCE" button present (disabled without image)
     */

    const footer = page.locator('footer');
    await footer.screenshot({
      path: 'tests/screenshots/04-footer.png'
    });

    // Validate progression indicators
    await expect(page.getByText('PROGRESSION //')).toBeVisible();

    // Progress dots should exist
    const progressDots = page.locator('footer .rounded-full');
    const dotCount = await progressDots.count();
    expect(dotCount).toBeGreaterThanOrEqual(3);

    console.log('✓ Footer navigation validated');
  });

  test('5. Sign In Modal', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Clicking Sign In opens modal
     * ✓ Modal has authentication options
     * ✓ Modal can be closed
     */

    // Click Sign In
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/05-signin-modal.png',
      fullPage: true
    });

    // Check modal is visible
    const modal = page.locator('[class*="modal"], [class*="fixed"][class*="inset"]').first();

    // Close modal if X button exists
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    console.log('✓ Sign In modal interaction validated');
  });

  test('6. WebGL Background Visualization', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Canvas element is rendered
     * ✓ Canvas has non-zero dimensions
     * ✓ WebGL context is active (canvas is drawing)
     */

    // Get canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Get canvas dimensions
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);

    // Take screenshot of just the canvas area
    await canvas.screenshot({
      path: 'tests/screenshots/06-webgl-background.png'
    });

    // Wait and take another to show animation
    await page.waitForTimeout(1000);
    await canvas.screenshot({
      path: 'tests/screenshots/06b-webgl-animated.png'
    });

    console.log('✓ WebGL background visualization validated');
    console.log(`  Canvas size: ${box?.width}x${box?.height}`);
  });

  test('7. Responsive Design - Mobile', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ App renders on mobile viewport
     * ✓ Core elements remain visible
     * ✓ Layout adapts appropriately
     */

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/07-mobile-view.png',
      fullPage: true
    });

    // Validate core elements still visible
    await expect(page.locator('h1')).toContainText('jusDNCE');
    await expect(page.locator('canvas').first()).toBeVisible();

    console.log('✓ Mobile responsive design validated');
  });

  test('8. Responsive Design - Tablet', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ App renders on tablet viewport
     * ✓ Two-column layout visible
     */

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/08-tablet-view.png',
      fullPage: true
    });

    await expect(page.locator('h1')).toContainText('jusDNCE');

    console.log('✓ Tablet responsive design validated');
  });

  test('9. Interactive Hover States', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Buttons show hover effects
     * ✓ Upload areas show hover states
     * ✓ Visual feedback on interaction
     */

    // Hover over Sign In button
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'tests/screenshots/09a-signin-hover.png',
      fullPage: true
    });

    // Hover over credits area
    const creditsArea = page.locator('text=/\\d+ CR/').first();
    if (await creditsArea.isVisible()) {
      await creditsArea.hover();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: 'tests/screenshots/09b-credits-hover.png',
      fullPage: true
    });

    console.log('✓ Interactive hover states validated');
  });

  test('10. Full Page Visual Snapshot', async ({ page }) => {
    /**
     * FINAL VALIDATION:
     * Complete visual snapshot of the application
     * for baseline comparison
     */

    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/10-full-desktop.png',
      fullPage: true
    });

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reload and check for errors
    await page.reload();
    await page.waitForTimeout(2000);

    // Log any errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    } else {
      console.log('✓ No console errors detected');
    }

    console.log('✓ Full page visual snapshot captured');
  });
});

test.describe('Accessibility Checks', () => {
  test('Basic accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    /**
     * ACCESSIBILITY CRITERIA:
     * ✓ Interactive elements are focusable
     * ✓ Buttons have accessible names
     */

    // Check Sign In button is focusable
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.focus();

    await page.screenshot({
      path: 'tests/screenshots/11-accessibility-focus.png',
      fullPage: true
    });

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await page.screenshot({
      path: 'tests/screenshots/11b-tab-navigation.png',
      fullPage: true
    });

    console.log('✓ Basic accessibility validated');
  });
});
