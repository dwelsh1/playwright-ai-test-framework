import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';

/**
 * Admin dashboard page object
 */
export class AdminPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly dashboard: Locator;
  readonly ordersTable: Locator;
  readonly confirmPrompt: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.dashboard = page.getByRole('heading', { name: 'Admin Dashboard' });
    // Scope to the orders grid — the first `table` on the page can be another widget.
    this.ordersTable = page.getByRole('table', { name: /^orders$/i });
    // Inline confirmation uses "Sure? Yes / No" pattern (not a dialog)
    this.confirmPrompt = page.getByText(/sure\?/i);
    this.confirmDeleteButton = page.getByRole('button', { name: /^yes$/i });
    this.cancelButton = page.getByRole('button', { name: /^no$/i });
  }

  /**
   * Get stat term by name (Total Revenue, Orders Placed, Items Sold, Last Order)
   */
  getStatCard(statName: string): Locator {
    return this.page.getByRole('term').filter({ hasText: new RegExp(statName, 'i') });
  }

  /**
   * Get stat value (the dd paired with a dt term within the same stat-card)
   */
  getStatValue(statName: string): Locator {
    return this.page
      .getByRole('term')
      .filter({ hasText: new RegExp(statName, 'i') })
      .locator('..')
      .getByRole('definition');
  }

  /**
   * Get order row in the orders table (substring match on the row; order ids are unique).
   */
  getAdminOrderRow(orderId: string): Locator {
    return this.ordersTable.getByRole('row').filter({ hasText: orderId });
  }

  /**
   * Get delete button for an order (matches a11y name like "Delete order ORD-…").
   */
  getDeleteButton(orderId: string): Locator {
    const escaped = orderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.ordersTable.getByRole('button', {
      name: new RegExp(`delete\\s+order\\s+${escaped}`, 'i'),
    });
  }

  /**
   * Get stat numeric value
   */
  async getStatNumericValue(statName: string): Promise<number> {
    const text = await this.getStatValue(statName).textContent();
    const numeric = text?.replace(/[^0-9]/g, '') ?? '0';
    return parseInt(numeric, 10);
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: string): Promise<void> {
    await this.getDeleteButton(orderId).click();
  }

  /**
   * Confirm order deletion
   */
  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
  }

  /**
   * Cancel order deletion
   */
  async cancelDelete(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Navigate to admin page
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }
}
