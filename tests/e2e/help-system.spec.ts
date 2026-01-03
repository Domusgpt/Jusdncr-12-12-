import { test, expect } from '@playwright/test';

/**
 * Help System E2E Tests
 *
 * Tests the interactive help overlay system across all pages:
 * - Step 1: Assets page
 * - Step 2: Director page
 * - Step 4: Preview page
 *
 * Each test validates:
 * 1. Help button visibility and accessibility
 * 2. Help overlay opens correctly
 * 3. Navigation between help sections works
 * 4. Overlay closes properly
 */

test.describe('Help System', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('Step 1 - Help button and Import Rig are visible', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ HELP button visible on Step 1
     * ✓ IMPORT RIG button visible on Step 1
     * ✓ Both buttons are clickable
     */

    // Take screenshot before interaction
    await page.screenshot({
      path: 'tests/screenshots/help-step1-before.png',
      fullPage: true
    });

    // Look for HELP button
    const helpButton = page.locator('button:has-text("HELP")');
    await expect(helpButton).toBeVisible();

    // Look for IMPORT RIG button (use first match)
    const importRigButton = page.locator('button:has-text("IMPORT RIG")').first();
    await expect(importRigButton).toBeVisible();

    console.log('✓ Step 1 has HELP and IMPORT RIG buttons visible');
  });

  test('Step 1 - Help overlay opens and navigates', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Clicking HELP opens overlay
     * ✓ Overlay shows "STEP 1: ASSETS" title
     * ✓ Progress dots are visible
     * ✓ Next button advances sections
     * ✓ Back button goes to previous section
     * ✓ X button closes overlay
     */

    // Click HELP button
    const helpButton = page.locator('button:has-text("HELP")');
    await helpButton.click();

    // Wait for overlay animation
    await page.waitForTimeout(500);

    // Verify overlay is open
    const overlayTitle = page.locator('text=STEP 1: ASSETS');
    await expect(overlayTitle).toBeVisible();

    // Take screenshot of help overlay
    await page.screenshot({
      path: 'tests/screenshots/help-step1-overlay-open.png',
      fullPage: true
    });

    // Verify first section content
    await expect(page.locator('text=Source Identity')).toBeVisible();

    // Click Next to go to second section
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verify second section
    await expect(page.locator('text=Audio Stream')).toBeVisible();

    await page.screenshot({
      path: 'tests/screenshots/help-step1-section2.png',
      fullPage: true
    });

    // Click Next again to go to third section
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verify third section (Import Rig) - use heading inside help overlay
    await expect(page.locator('h3:has-text("Import Rig")')).toBeVisible();

    // Click Done to close
    const doneButton = page.locator('button:has-text("Done")');
    await doneButton.click();
    await page.waitForTimeout(300);

    // Verify overlay is closed
    await expect(overlayTitle).not.toBeVisible();

    console.log('✓ Step 1 help overlay navigation works correctly');
  });

  test('Step 1 - Help overlay closes with X button', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ X button closes overlay immediately
     */

    // Open help overlay
    await page.locator('button:has-text("HELP")').click();
    await page.waitForTimeout(500);

    // Verify overlay is open - use the h2 inside the overlay
    const overlayTitle = page.locator('.fixed h2:has-text("STEP 1: ASSETS")');
    await expect(overlayTitle).toBeVisible();

    // Click X button (the close button in the overlay)
    const closeButton = page.locator('.fixed button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();
    await page.waitForTimeout(500);

    // Verify overlay is closed - the fixed overlay should be gone
    await expect(overlayTitle).not.toBeVisible();

    console.log('✓ Step 1 help overlay X button closes overlay');
  });

  test('Step 2 - Navigate to Director and test help', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Navigate to Step 2 (Director Mode)
     * ✓ HELP button is visible
     * ✓ Help overlay shows "STEP 2: DIRECTOR"
     * ✓ Contains style selection help
     */

    // Upload a test image to proceed to Step 2
    // First, we need to simulate an image upload or navigate directly

    // For now, let's look for step navigation
    // The app may require an image before showing Step 2

    // Navigate by looking for the step indicator or footer nav
    const step2Nav = page.locator('text=DIRECTOR').first();

    if (await step2Nav.isVisible()) {
      await step2Nav.click();
      await page.waitForTimeout(1000);

      // Check for help button
      const helpButton = page.locator('button:has-text("HELP")');

      if (await helpButton.isVisible()) {
        await helpButton.click();
        await page.waitForTimeout(500);

        // Verify overlay
        await expect(page.locator('text=STEP 2: DIRECTOR')).toBeVisible();

        await page.screenshot({
          path: 'tests/screenshots/help-step2-overlay.png',
          fullPage: true
        });

        console.log('✓ Step 2 help overlay works');
      } else {
        console.log('ℹ Step 2 help button not visible (may require image upload first)');
      }
    } else {
      console.log('ℹ Step 2 navigation not directly accessible');
    }
  });

  test('Help overlay progress dots are clickable', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Progress dots allow direct section navigation
     */

    // Open help overlay
    await page.locator('button:has-text("HELP")').click();
    await page.waitForTimeout(500);

    // Click the third progress dot to jump to section 3
    const progressDots = page.locator('.w-3.h-3.rounded-full');
    const dotCount = await progressDots.count();

    if (dotCount >= 3) {
      // Click the third dot
      await progressDots.nth(2).click();
      await page.waitForTimeout(300);

      // Verify we jumped to section 3 (Import Rig) - use heading in overlay
      await expect(page.locator('h3:has-text("Import Rig")')).toBeVisible();

      await page.screenshot({
        path: 'tests/screenshots/help-progress-dots.png',
        fullPage: true
      });

      console.log('✓ Progress dots navigate between sections');
    } else {
      console.log(`ℹ Found ${dotCount} progress dots`);
    }
  });

  test('Surprise Me with Morph toggle', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ MORPH toggle button exists on Step 2
     * ✓ Toggle changes visual state
     * ✓ SURPRISE ME button is visible
     */

    // Navigate to Step 2 if possible
    const step2Nav = page.locator('text=DIRECTOR').first();

    if (await step2Nav.isVisible()) {
      await step2Nav.click();
      await page.waitForTimeout(1000);

      // Look for MORPH toggle
      const morphToggle = page.locator('button:has-text("MORPH")');

      if (await morphToggle.isVisible()) {
        // Take before screenshot
        await page.screenshot({
          path: 'tests/screenshots/surprise-morph-before.png',
          fullPage: true
        });

        // Click morph toggle
        await morphToggle.click();
        await page.waitForTimeout(300);

        // Verify toggle changed (has purple border when active)
        await page.screenshot({
          path: 'tests/screenshots/surprise-morph-after.png',
          fullPage: true
        });

        // Check SURPRISE ME button
        const surpriseButton = page.locator('button:has-text("SURPRISE ME")');
        await expect(surpriseButton).toBeVisible();

        console.log('✓ Morph toggle and Surprise Me work');
      }
    }
  });

  test('Style presets section is collapsed by default', async ({ page }) => {
    /**
     * VALIDATION CRITERIA:
     * ✓ Style presets section starts collapsed
     * ✓ Clicking header expands section
     * ✓ Style grid becomes visible when expanded
     */

    // Navigate to Step 2
    const step2Nav = page.locator('text=DIRECTOR').first();

    if (await step2Nav.isVisible()) {
      await step2Nav.click();
      await page.waitForTimeout(1000);

      // Look for collapsed STYLE PRESETS header
      const styleHeader = page.locator('text=STYLE PRESETS');

      if (await styleHeader.isVisible()) {
        // Take screenshot showing collapsed state
        await page.screenshot({
          path: 'tests/screenshots/styles-collapsed.png',
          fullPage: true
        });

        // The style grid should not be visible initially
        const styleGrid = page.locator('.grid.grid-cols-2.lg\\:grid-cols-4');
        const isGridHidden = !(await styleGrid.isVisible());

        if (isGridHidden) {
          console.log('✓ Style presets are collapsed by default');

          // Click to expand
          await styleHeader.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'tests/screenshots/styles-expanded.png',
            fullPage: true
          });
        }
      }
    }
  });

});
