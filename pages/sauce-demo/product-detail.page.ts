import { Page, Locator } from '@playwright/test';

/**
 * Product detail page object for Sauce Demo.
 */
export class SdProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.getByTestId('inventory-item-name');
    this.productPrice = page.getByTestId('inventory-item-price');
    this.backButton = page.getByRole('button', { name: /back to products/i });
  }
}
