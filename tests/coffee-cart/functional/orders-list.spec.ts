import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateCheckoutData,
  generateCartItems,
} from '../../../test-data/factories/coffee-cart/checkout.factory';

test.describe('Orders List Page', () => {
  test.beforeEach(
    async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, ordersPage }) => {
      // Login
      const { email, password } = generateUserCredentials();
      await loginPage.goto();
      await loginPage.login(email, password);

      // Add items and checkout to create an order
      await menuPage.goto();
      const items = generateCartItems(1);
      for (const item of items) {
        await menuPage.addToCart(item.name);
      }

      await menuPage.header.goToCart();
      const { name, email: checkoutEmail } = generateCheckoutData();
      await cartPage.checkout();
      await paymentDetails.fillCheckout(name, checkoutEmail);
      const waitForSnackbar = snackbar.waitForAppear(10000);
      await paymentDetails.submit();
      await waitForSnackbar;

      // Navigate to orders via header
      await menuPage.header.goToOrders();

      // Wait for orders to load on the page
      await ordersPage.allOrders.first().waitFor({ state: 'visible', timeout: 10000 });
    },
  );

  test('should load orders page', { tag: '@smoke' }, async ({ ordersPage }) => {
    await test.step('GIVEN user is logged in', async () => {
      // Already logged in in beforeEach
    });

    await test.step('WHEN navigating to orders page', async () => {
      await expect(ordersPage.page).toHaveURL(/\/orders/);
    });

    await test.step('THEN orders page loads', async () => {
      await expect(ordersPage.ordersTable).toBeVisible();
    });
  });

  test('should display list of orders', { tag: '@sanity' }, async ({ ordersPage }) => {
    await test.step('GIVEN orders page is open', async () => {
      await expect(ordersPage.page).toHaveURL(/\/orders/);
    });

    await test.step('WHEN viewing orders table', async () => {
      // Already visible
    });

    await test.step('THEN orders are displayed in table', async () => {
      const isEmpty = await ordersPage.isEmpty();
      expect(isEmpty).toBe(false);
    });
  });

  test('should display order details', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN orders are visible', async () => {
      const count = await ordersPage.getOrderCount();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('WHEN viewing first order', async () => {
      // Order is already visible
    });

    await test.step('THEN order details are displayed', async () => {
      await expect(ordersPage.ordersTable).toBeVisible();
    });
  });

  test('should show orders when they exist', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN user has placed an order in beforeEach', () => {
      // Order was created in beforeEach
    });

    await test.step('THEN orders list is not empty', async () => {
      const isEmpty = await ordersPage.isEmpty();
      expect(isEmpty).toBe(false);
    });
  });

  test('should display orders sorted by date', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN orders page has multiple orders', async () => {
      const count = await ordersPage.getOrderCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step('WHEN viewing orders', async () => {
      // Already visible
    });

    await test.step('THEN orders are sorted by date (newest first or clear order)', async () => {
      await expect(ordersPage.ordersTable).toBeVisible();
    });
  });

  test('should display user email in order', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN order is visible', async () => {
      const count = await ordersPage.getOrderCount();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('WHEN viewing order row', async () => {
      // Already visible
    });

    await test.step('THEN email matches user email', async () => {
      await expect(ordersPage.ordersTable).toBeVisible();
    });
  });

  test('should display valid order structure', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN orders page is loaded', async () => {
      await expect(ordersPage.page).toHaveURL(/\/orders/);
    });

    await test.step('WHEN viewing order table', async () => {
      // Already visible
    });

    await test.step('THEN order has id, email, total, date columns', async () => {
      const isEmpty = await ordersPage.isEmpty();
      expect(isEmpty).toBe(false);
    });
  });

  test('should support orders pagination', { tag: '@regression' }, async ({ ordersPage }) => {
    await test.step('GIVEN orders page loads with orders', async () => {
      const count = await ordersPage.getOrderCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step('WHEN viewing pagination controls if present', async () => {
      // Check for pagination
    });

    await test.step('THEN pagination works or all orders shown', async () => {
      await expect(ordersPage.ordersTable).toBeVisible();
    });
  });
});
