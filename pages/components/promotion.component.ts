import { Page, Locator } from '@playwright/test';

/**
 * Promotion popup component - discount offer modal
 */
export class PromotionComponent {
  readonly page: Page;
  readonly yesButton: Locator;
  readonly noButton: Locator;
  readonly closeButton: Locator;
  readonly discountText: Locator;
  private readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog', { name: /promotion/i });
    this.yesButton = this.modal.getByRole('button', { name: /yes|accept|ok|take|claim/i });
    this.noButton = this.modal.getByRole('button', { name: /no|dismiss|skip|cancel/i });
    this.closeButton = this.modal.getByRole('button', { name: /close|×/i });
    this.discountText = this.modal.locator('text=/discount|mocha|promo/i');
  }

  /**
   * Accept the promotion offer
   */
  async accept(): Promise<void> {
    await this.yesButton.click();
  }

  /**
   * Dismiss the promotion offer
   */
  async dismiss(): Promise<void> {
    await this.noButton.click();
  }

  /**
   * Check if promotion modal is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Wait for promotion to appear
   */
  async waitForAppear(timeout = 5000): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout });
  }
}
