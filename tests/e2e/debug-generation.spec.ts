import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = 'tests/output';

test('Debug Generation - Capture Console Errors', async ({ page }) => {
  test.setTimeout(120000);

  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  // Capture ALL console output
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  // Navigate
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  console.log('✓ App loaded');

  // Upload image
  const testImagePath = 'tests/fixtures/test-character.jpg';
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠ No test image - skipping');
    return;
  }

  const imageInput = page.locator('input[type="file"][accept*="image"]').first();
  await imageInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1500);
  console.log('✓ Image uploaded');

  // Screenshot before clicking
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug-01-before-click.png'), fullPage: true });

  // Click QUICK DANCE
  const quickDanceBtn = page.locator('button:has-text("QUICK DANCE")');
  if (await quickDanceBtn.isVisible()) {
    await quickDanceBtn.click();
    console.log('✓ Clicked QUICK DANCE');
  } else {
    const continueBtn = page.locator('button:has-text("CONTINUE")');
    await continueBtn.click();
    console.log('✓ Clicked CONTINUE');
  }

  // Wait and capture any errors
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug-02-after-click.png'), fullPage: true });

  // Handle any alert dialogs
  page.on('dialog', async dialog => {
    console.log(`⚠ ALERT: ${dialog.message()}`);
    consoleErrors.push(`[ALERT] ${dialog.message()}`);
    await dialog.dismiss();
  });

  // Wait more for API response
  await page.waitForTimeout(10000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug-03-final.png'), fullPage: true });

  // Write all console output to file
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'console-log.txt'),
    consoleMessages.join('\n')
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'console-errors.txt'),
    consoleErrors.join('\n')
  );

  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach(e => console.log(e));
  console.log('======================\n');

  console.log(`Total messages: ${consoleMessages.length}`);
  console.log(`Total errors: ${consoleErrors.length}`);
});
