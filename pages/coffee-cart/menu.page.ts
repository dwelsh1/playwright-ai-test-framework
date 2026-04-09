import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';
import { PromotionComponent } from '../components/promotion.component';
import { gotoWithPageLoadError } from '../../helpers/navigation/goto-page';

/**
 * Menu page object - browse coffees
 */
export class MenuPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly promotion: PromotionComponent;
  readonly coffeeList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.promotion = new PromotionComponent(page);
    this.coffeeList = page.getByRole('list').filter({ has: page.getByRole('heading') });
  }

  /**
   * Get coffee card (listitem) by name
   */
  getCoffeeCard(coffeeName: string): Locator {
    return this.coffeeList.getByRole('listitem').filter({
      has: this.page.getByRole('button', { name: new RegExp(`Add ${coffeeName} to cart`, 'i') }),
    });
  }

  /**
   * Get coffee title within a card
   */
  getCoffeeTitle(coffeeName: string): Locator {
    return this.getCoffeeCard(coffeeName).getByRole('heading');
  }

  /**
   * Get coffee price within a card
   */
  getCoffeePrice(coffeeName: string): Locator {
    return this.getCoffeeCard(coffeeName).getByRole('heading').locator('text=/\\$\\d+\\.\\d+/');
  }

  /**
   * Get add to cart button for a coffee
   */
  getAddToCartButton(coffeeName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`Add ${coffeeName} to cart`, 'i') });
  }

  /**
   * Get coffee recipe/ingredients
   */
  getCoffeeRecipe(coffeeName: string): Locator {
    return this.getCoffeeCard(coffeeName).getByRole('img', { name: coffeeName });
  }

  /**
   * Add coffee to cart by clicking add button
   */
  async addToCart(coffeeName: string): Promise<void> {
    await this.getAddToCartButton(coffeeName).click();
  }

  /**
   * Right-click to add coffee to cart (context menu)
   */
  async rightClickAddToCart(coffeeName: string): Promise<void> {
    await this.getCoffeeCard(coffeeName).click({ button: 'right' });
    await this.page.keyboard.press('Escape');
  }

  /**
   * Double-click coffee title to toggle translation
   */
  async toggleTranslation(coffeeName: string): Promise<void> {
    await this.getCoffeeTitle(coffeeName).dblclick();
  }

  /**
   * Get current price for a coffee
   */
  async getPriceValue(coffeeName: string): Promise<string> {
    return (await this.getCoffeePrice(coffeeName).textContent()) ?? '';
  }

  /**
   * Undo last action with Ctrl+Z
   */
  async undo(): Promise<void> {
    await this.page.keyboard.press('Control+z');
  }

  /**
   * Search for coffee by name
   */
  async searchCoffee(searchTerm: string): Promise<void> {
    const searchInput = this.page.getByRole('searchbox', { name: /search coffees/i });
    await searchInput.fill(searchTerm);
  }

  /**
   * Navigate to menu page
   */
  async goto(): Promise<void> {
    await gotoWithPageLoadError(this.page, '/');
  }
}
