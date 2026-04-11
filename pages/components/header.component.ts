import { Page, Locator } from '@playwright/test';

/**
 * Header component - navigation and cart badge
 */
export class HeaderComponent {
  readonly page: Page;
  readonly menuLink: Locator;
  readonly cartLink: Locator;
  readonly githubLink: Locator;
  readonly ordersLink: Locator;
  readonly adminLink: Locator;
  private readonly navContainer: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navContainer = page.getByRole('navigation');
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    this.menuLink = this.navContainer.getByRole('link', { name: /menu|home|coffees/i });
    this.cartLink = this.navContainer.getByRole('link', { name: /cart/i });
    this.githubLink = page.getByRole('banner').getByRole('link', { name: /github/i });
    this.ordersLink = this.navContainer.getByRole('link', { name: /orders|history/i });
    this.adminLink = this.navContainer.getByRole('link', { name: /admin|dashboard/i });
  }

  /**
   * Navigate to menu page
   */
  async goToMenu(): Promise<void> {
    await this.menuLink.click();
  }

  /**
   * Navigate to cart page
   */
  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Navigate to orders page
   */
  async goToOrders(): Promise<void> {
    await this.ordersLink.click();
  }

  /**
   * Navigate to admin dashboard
   */
  async goToAdmin(): Promise<void> {
    await this.adminLink.click();
  }

  /**
   * Get current cart item count
   */
  async getCartCount(): Promise<number> {
    const text = await this.cartLink.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match ? parseInt(match[1] ?? '0', 10) : 0;
  }

  /**
   * Sign out of the application
   */
  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
