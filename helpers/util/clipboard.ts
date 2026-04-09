import type { Page } from '@playwright/test';

/**
 * Reads the current clipboard text content from the browser context.
 * Use this to assert the result of "Copy" button interactions.
 *
 * Requires the `clipboard-read` permission to be granted on the browser context
 * before calling:
 * ```typescript
 * await page.context().grantPermissions(['clipboard-read']);
 * ```
 *
 * @param {Page} page - Playwright Page
 * @returns {Promise<string>} Current clipboard text
 *
 * @example
 * await page.context().grantPermissions(['clipboard-read']);
 * await copyButton.click();
 * const copied = await readClipboard(page);
 * expect(copied).toBe(expectedOrderId);
 */
export async function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
