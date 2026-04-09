import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/coffee-cart/login.page';
import { MenuPage } from '../../pages/coffee-cart/menu.page';
import { CartPage } from '../../pages/coffee-cart/cart.page';
import { OrdersPage } from '../../pages/coffee-cart/orders.page';
import { AdminPage } from '../../pages/coffee-cart/admin.page';
import { HeaderComponent } from '../../pages/components/header.component';
import { PaymentDetailsComponent } from '../../pages/components/payment-details.component';
import { SnackbarComponent } from '../../pages/components/snackbar.component';
import { PromotionComponent } from '../../pages/components/promotion.component';
import { SdLoginPage } from '../../pages/sauce-demo/login.page';
import { SdInventoryPage } from '../../pages/sauce-demo/inventory.page';
import { SdProductDetailPage } from '../../pages/sauce-demo/product-detail.page';

/**
 * Framework fixtures for page objects and components.
 * Add new page object types here as you create them.
 */
export type FrameworkFixtures = {
  /** Login page object */
  loginPage: LoginPage;
  /** Menu page object */
  menuPage: MenuPage;
  /** Cart page object */
  cartPage: CartPage;
  /** Orders page object */
  ordersPage: OrdersPage;
  /** Admin page object */
  adminPage: AdminPage;
  /** Header component */
  header: HeaderComponent;
  /** Payment details component */
  paymentDetails: PaymentDetailsComponent;
  /** Snackbar component */
  snackbar: SnackbarComponent;
  /** Promotion component */
  promotion: PromotionComponent;
  resetStorageState: () => Promise<void>;
  // Sauce Demo page objects (new app registration — see docs/developer.md)
  /** Sauce Demo login page */
  sdLoginPage: SdLoginPage;
  /** Sauce Demo inventory page */
  sdInventoryPage: SdInventoryPage;
  /** Sauce Demo product detail page */
  sdProductDetailPage: SdProductDetailPage;
};

/**
 * Extended test with page object and component fixtures.
 * Import this in your test files to access page objects and components.
 *
 * @example
 * ```ts
 * import { test, expect } from '../../../fixtures/pom/test-options';
 * import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
 *
 * test('example test', async ({ loginPage, header }) => {
 *   const { email, password } = generateUserCredentials();
 *   await loginPage.goto();
 *   await loginPage.login(email, password);
 *   const cartCount = await header.getCartCount();
 * });
 * ```
 */
export const test = base.extend<FrameworkFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  menuPage: async ({ page }, use) => {
    await use(new MenuPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },

  paymentDetails: async ({ page }, use) => {
    await use(new PaymentDetailsComponent(page));
  },

  snackbar: async ({ page }, use) => {
    await use(new SnackbarComponent(page));
  },

  promotion: async ({ page }, use) => {
    await use(new PromotionComponent(page));
  },

  resetStorageState: async ({ context }, use) => {
    await use(async () => {
      await context.clearCookies();
      await context.clearPermissions();
    });
  },

  sdLoginPage: async ({ page }, use) => {
    await use(new SdLoginPage(page));
  },

  sdInventoryPage: async ({ page }, use) => {
    await use(new SdInventoryPage(page));
  },

  sdProductDetailPage: async ({ page }, use) => {
    await use(new SdProductDetailPage(page));
  },
});
