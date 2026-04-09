import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';

/**
 * Orders history page object
 */
export class OrdersPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly ordersTable: Locator;
  readonly allOrders: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.ordersTable = page.getByRole('heading', { name: /order history/i });
    this.allOrders = page.getByRole('article');
    this.emptyMessage = page.getByText(/no orders/i);
  }

  /**
   * Get order card by order ID
   */
  getOrderRow(orderId: string): Locator {
    return this.page.getByRole('article').filter({ hasText: new RegExp(orderId, 'i') });
  }

  /**
   * Get total number of orders
   */
  async getOrderCount(): Promise<number> {
    return await this.allOrders.count();
  }

  /**
   * Check if orders list is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyMessage.isVisible();
  }

  /**
   * Navigate to orders page
   */
  async goto(): Promise<void> {
    await this.page.goto('/orders');
  }
}
