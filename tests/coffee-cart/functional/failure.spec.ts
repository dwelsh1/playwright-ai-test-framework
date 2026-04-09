/* eslint-disable playwright/expect-expect, playwright/prefer-locator */
import { test, expect } from '../../../fixtures/pom/test-options';

test('intentional failure - button click', async ({ page }) => {
  test.fixme(true, 'Demo-only failure; exclude from normal verification runs.');
  await page.goto('https://example.com');
  // This will fail because the button doesn't exist
  await page.click('button:has-text("Non-existent Button")');
});

test('intentional failure - assertion', async ({ page }) => {
  test.fixme(true, 'Demo-only failure; exclude from normal verification runs.');
  await page.goto('https://example.com');
  const title = await page.title();
  // This will fail because title is "Example Domain"
  expect(title).toBe('Wrong Title');
});
