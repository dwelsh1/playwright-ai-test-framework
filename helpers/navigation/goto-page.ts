import type { Page } from '@playwright/test';
import { PageLoadError } from '../errors/test-errors';
import { createLogger } from '../logger';

const log = createLogger('goto-page');

type GotoOptions = NonNullable<Parameters<Page['goto']>[1]>;

/**
 * Navigate with `domcontentloaded` and wrap failures in {@link PageLoadError} while preserving `cause`.
 */
export async function gotoWithPageLoadError(
  page: Page,
  url: string,
  options?: GotoOptions,
): Promise<void> {
  log.debug('navigating', { url });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', ...options });
  } catch (e) {
    throw new PageLoadError(url, { cause: e });
  }
}
