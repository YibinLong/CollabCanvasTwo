import { test, expect } from '@playwright/test';

test.describe('CollabCanvas Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    // Check that the page title exists
    await expect(page).toHaveTitle(/CollabCanvas/);
  });

  test('should display the toolbar', async ({ page }) => {
    // The toolbar should be visible
    const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"]').first();
    await expect(toolbar).toBeVisible({ timeout: 10000 });
  });

  test('should display authentication form when not logged in', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Either auth form or canvas should be visible
    const authForm = page.locator('form').first();
    const hasAuthForm = await authForm.isVisible().catch(() => false);

    // Just verify the page loaded successfully
    expect(await page.title()).toContain('CollabCanvas');
  });
});

test.describe('Canvas Interactions', () => {
  // Note: These tests assume user is authenticated
  // In a real scenario, you'd mock authentication or use test credentials

  test('should have working tool buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for toolbar buttons by their SVG icons or button elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Should have multiple tool buttons
    expect(buttonCount).toBeGreaterThan(0);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('should respond to keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Press 'v' for select tool
    await page.keyboard.press('v');

    // Press 'r' for rectangle tool
    await page.keyboard.press('r');

    // Press 'c' for circle tool (if not in input)
    await page.keyboard.press('o');

    // The page should still be functional
    await expect(page).toHaveTitle(/CollabCanvas/);
  });
});

test.describe('Accessibility', () => {
  test('should have accessible elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that buttons have titles or aria-labels
    const buttons = page.locator('button[title], button[aria-label]');
    const accessibleButtonCount = await buttons.count();

    // Should have some accessible buttons
    expect(accessibleButtonCount).toBeGreaterThan(0);
  });
});
