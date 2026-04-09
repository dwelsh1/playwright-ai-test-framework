import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';
import { gotoWithPageLoadError } from '../../helpers/navigation/goto-page';

/**
 * Login page object
 */
export class LoginPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.form = page.locator('form:not([aria-label="Payment form"])');
    this.emailInput = this.form.getByLabel(/email/i);
    this.passwordInput = this.form.getByLabel(/password/i);
    this.submitButton = this.form.getByRole('button', { name: /login|sign in|submit/i });
    this.errorMessage = this.form.getByRole('alert');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await gotoWithPageLoadError(this.page, '/login');
  }

  /**
   * Log in with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Log in as admin user
   */
  async loginAsAdmin(adminEmail: string, adminPassword: string): Promise<void> {
    await this.login(adminEmail, adminPassword);
  }

  /**
   * Log in as regular user
   */
  async loginAsUser(userEmail: string, userPassword: string): Promise<void> {
    await this.login(userEmail, userPassword);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
