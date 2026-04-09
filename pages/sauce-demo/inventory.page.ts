import { Page, Locator } from '@playwright/test';
import { ProductNames } from '../../enums/sauce-demo/sauce-demo';

/**
 * Inventory (product listing) page object for Sauce Demo.
 */
export class SdInventoryPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly productList: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('Swag Labs', { exact: true });
    this.productList = page.getByTestId('inventory-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  /**
   * Click a product card to navigate to its detail page.
   * @param name - Product name from the ProductNames enum
   */
  async clickProduct(name: ProductNames): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).first().click();
  }

  /**
   * Add a product to the cart from the inventory list.
   * @param name - Product name from the ProductNames enum
   */
  async addToCart(name: ProductNames): Promise<void> {
    const slug = name
      .toLowerCase()
      .replace(/[().']+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }
}
