import type { Download } from '@playwright/test';

/**
 * Reads the content of a Playwright Download as a UTF-8 string.
 * Use this to assert the content of exported files (CSV, JSON, TXT).
 *
 * Pair with `page.waitForEvent('download')` to capture the download first:
 * ```typescript
 * const [download] = await Promise.all([
 *   page.waitForEvent('download'),
 *   exportButton.click(),
 * ]);
 * const content = await readDownloadAsText(download);
 * expect(content).toContain('Order ID');
 * ```
 *
 * @param {Download} download - Playwright Download object
 * @returns {Promise<string>} File content as a UTF-8 string
 * @throws {Error} If the download path is null (download failed or was cancelled)
 */
export async function readDownloadAsText(download: Download): Promise<string> {
  const filePath = await download.path();
  if (!filePath) {
    throw new Error('Download path is null — the download may have failed or been cancelled.');
  }
  const { readFile } = await import('fs/promises');
  return readFile(filePath, 'utf-8');
}
