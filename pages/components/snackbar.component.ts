import { Page, Locator } from '@playwright/test';

/**
 * Snackbar / Toast notification component
 */
export class SnackbarComponent {
  readonly page: Page;
  private readonly snackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.snackbar = page.getByRole('status', { name: /notification/i });
  }

  /**
   * Get the toast message text
   */
  async getMessage(): Promise<string> {
    return (await this.snackbar.textContent()) ?? '';
  }

  /**
   * Wait for snackbar to appear
   */
  async waitForAppear(timeout = 5000): Promise<void> {
    await this.snackbar.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for snackbar to disappear
   */
  async waitForDisappear(timeout = 10000): Promise<void> {
    await this.snackbar.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Check if snackbar is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.snackbar.isVisible();
  }
}
