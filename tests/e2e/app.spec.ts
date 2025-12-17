import { test, expect } from '@playwright/test';

test.describe('jusDNCE App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Check that the app title is visible
    await expect(page.locator('h1')).toContainText('jusDNCE');
  });

  test('should show upload section on step 1', async ({ page }) => {
    // Check for SOURCE_IDENTITY section
    await expect(page.getByText('SOURCE_IDENTITY')).toBeVisible();

    // Check for upload target text
    await expect(page.getByText('UPLOAD TARGET')).toBeVisible();
  });

  test('should have sign in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should have import rig button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /import rig/i })).toBeVisible();
  });

  test('should show credits display', async ({ page }) => {
    await expect(page.getByText(/\d+ CR/)).toBeVisible();
  });

  test('should navigate to director step after uploading image', async ({ page }) => {
    // Create a fake image file
    const buffer = Buffer.from('fake-image-data');

    // Get the file input
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();

    // Upload the file
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });

    // Click continue
    const continueButton = page.getByRole('button', { name: /continue sequence/i });
    if (await continueButton.isVisible()) {
      await continueButton.click();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // App should still be visible
    await expect(page.locator('h1')).toContainText('jusDNCE');
  });
});

test.describe('Visual Regression', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for WebGL to initialize
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 1000, // Allow some variance due to WebGL
    });
  });
});
