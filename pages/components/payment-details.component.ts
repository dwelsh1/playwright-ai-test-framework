import { Page, Locator } from '@playwright/test';

/**
 * Payment details / Checkout modal component
 */
export class PaymentDetailsComponent {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subscribeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;
  readonly errorMessage: Locator;
  private readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog', { name: /payment details/i });
    this.nameInput = this.modal.getByLabel(/name|full name/i);
    this.emailInput = this.modal.getByLabel(/email/i);
    this.subscribeCheckbox = this.modal.getByRole('checkbox', { name: /promotion/i });
    this.submitButton = this.modal.getByRole('button', { name: /pay|submit|checkout|confirm/i });
    this.closeButton = this.modal.getByRole('button', { name: /close|cancel|×/i });
    this.errorMessage = this.modal.getByRole('alert');
  }

  /**
   * Fill checkout form with credentials
   */
  async fillCheckout(name: string, email: string, subscribe?: boolean): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (subscribe) {
      await this.subscribeCheckbox.check();
    }
  }

  /**
   * Submit the checkout form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Close the modal
   */
  async close(): Promise<void> {
    await this.closeButton.click();
  }

  /**
   * Check if modal is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }
}
