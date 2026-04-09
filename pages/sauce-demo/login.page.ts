import { Page, Locator } from '@playwright/test';
import { Routes } from '../../enums/sauce-demo/sauce-demo';

/**
 * Login page object for Sauce Demo.
 */
export class SdLoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
  }

  /**
   * Navigate to the Sauce Demo login page.
   */
  async goto(): Promise<void> {
    await this.page.goto(Routes.LOGIN);
  }

  /**
   * Log in with the given credentials.
   * @param username - Sauce Demo username
   * @param password - Sauce Demo password
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
