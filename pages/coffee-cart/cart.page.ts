import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';
import { PaymentDetailsComponent } from '../components/payment-details.component';
import { SnackbarComponent } from '../components/snackbar.component';

/**
 * Cart page object
 */
export class CartPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly paymentDetails: PaymentDetailsComponent;
  readonly snackbar: SnackbarComponent;
  readonly cartList: Locator;
  readonly totalDisplay: Locator;
  readonly emptyCartButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.paymentDetails = new PaymentDetailsComponent(page);
    this.snackbar = new SnackbarComponent(page);
    this.cartList = page
      .getByRole('list')
      .filter({ has: page.getByRole('button', { name: /Add one|Remove one/i }) });
    this.totalDisplay = page.getByRole('button', { name: /proceed to checkout/i });
    this.emptyCartButton = page.getByRole('button', { name: /empty|clear/i });
    this.checkoutButton = page.getByRole('button', { name: /proceed to checkout/i });
  }

  /**
   * Get cart item row by coffee name
   */
  getCartItemRow(coffeeName: string): Locator {
    return this.cartList.getByRole('listitem').filter({ hasText: new RegExp(coffeeName, 'i') });
  }

  /**
   * Get increase quantity button
   */
  getIncreaseButton(coffeeName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`Add one ${coffeeName}`, 'i') });
  }

  /**
   * Get decrease quantity button
   */
  getDecreaseButton(coffeeName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`Remove one ${coffeeName}`, 'i') });
  }

  /**
   * Get remove item button
   */
  getRemoveButton(coffeeName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`Remove all ${coffeeName}`, 'i') });
  }

  /**
   * Increase quantity for a cart item
   */
  async increaseQuantity(coffeeName: string): Promise<void> {
    await this.getIncreaseButton(coffeeName).click();
  }

  /**
   * Decrease quantity for a cart item
   */
  async decreaseQuantity(coffeeName: string): Promise<void> {
    await this.getDecreaseButton(coffeeName).click();
  }

  /**
   * Remove item from cart
   */
  async removeItem(coffeeName: string): Promise<void> {
    await this.getRemoveButton(coffeeName).click();
  }

  /**
   * Empty the entire cart
   */
  async emptyCart(): Promise<void> {
    await this.emptyCartButton.click();
  }

  /**
   * Get current cart total
   */
  async getTotal(): Promise<string> {
    return (await this.totalDisplay.textContent()) ?? '';
  }

  /**
   * Reorder items via drag and drop
   */
  async reorderItems(fromCoffeeName: string, toCoffeeName: string): Promise<void> {
    const fromRow = this.getCartItemRow(fromCoffeeName);
    const toRow = this.getCartItemRow(toCoffeeName);
    await fromRow.dragTo(toRow);
  }

  /**
   * Proceed to checkout
   */
  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  /**
   * Navigate to cart page
   */
  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    const emptyMessage = this.page.getByText(/no coffee, go add some/i);
    return await emptyMessage.isVisible();
  }
}
