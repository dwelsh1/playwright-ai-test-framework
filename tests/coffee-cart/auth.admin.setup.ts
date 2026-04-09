/* eslint-disable playwright/expect-expect -- setup tests save storage state, no assertions needed */
import { test as setup } from '@playwright/test';
import { Credentials, Routes, StorageStatePaths } from '../../enums/coffee-cart/coffee-cart';

/**
 * Auth setup: admin user.
 * Logs in via UI and saves storage state for reuse across admin test projects.
 */
setup('authenticate as admin', async ({ page }) => {
  await page.goto(Routes.LOGIN);
  await page.getByRole('textbox', { name: 'Email' }).fill(Credentials.ADMIN_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(Credentials.ADMIN_PASSWORD);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/admin/);
  await page.context().storageState({ path: StorageStatePaths.ADMIN });
});
