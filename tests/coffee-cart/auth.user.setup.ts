/* eslint-disable playwright/expect-expect -- setup tests save storage state, no assertions needed */
import { test as setup } from '@playwright/test';
import { Credentials, Routes, StorageStatePaths } from '../../enums/coffee-cart/coffee-cart';

/**
 * Auth setup: regular user.
 * Logs in via UI and saves storage state for reuse across test projects.
 */
setup('authenticate as user', async ({ page }) => {
  await page.goto(Routes.LOGIN);
  await page.getByRole('textbox', { name: 'Email' }).fill(Credentials.USER_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(Credentials.USER_PASSWORD);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/(?:menu|home|$)/);
  await page.context().storageState({ path: StorageStatePaths.USER });
});
