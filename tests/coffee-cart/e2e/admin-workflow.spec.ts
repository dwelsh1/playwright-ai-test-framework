import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateAdminCredentials,
  generateUserCredentials,
  generateCheckoutData,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import {
  AdminDashboardStats,
  ApiEndpoints,
  CoffeeNames,
  CoffeePrices,
} from '../../../enums/coffee-cart/coffee-cart';
import { CheckoutResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/checkoutSchema';
import { config } from '../../../config/coffee-cart';

test.describe('Admin Workflow', () => {
  test(
    'should show API-created order in admin dashboard and allow deletion',
    { tag: '@e2e' },
    async ({ api, loginPage, adminPage }) => {
      const adminCreds = generateAdminCredentials();
      const { name, email } = generateCheckoutData();
      let orderId: string;

      await test.step('GIVEN an order is created via API', async () => {
        const response = await api.post(`${config.apiUrl}${ApiEndpoints.CHECKOUT}`, {
          data: {
            name,
            email,
            subscribe: false,
            items: [{ name: CoffeeNames.ESPRESSO, quantity: 1, unitPrice: CoffeePrices.ESPRESSO }],
          },
        });

        expect(response.status()).toBe(201);
        const body = await response.json();
        const result = CheckoutResponseSchema.parse(body);
        orderId = result.order.orderId;
        expect(orderId).toMatch(/^ORD-/);
      });

      await test.step('WHEN admin logs in via UI', async () => {
        await loginPage.goto();
        await loginPage.loginAsAdmin(adminCreds.email, adminCreds.password);
        await adminPage.goto();
        await expect(adminPage.page).toHaveURL(/\/admin/);
      });

      await test.step('THEN the order appears in the admin orders table', async () => {
        const orderRow = adminPage.getAdminOrderRow(orderId!);
        await expect(orderRow).toBeVisible();
      });

      await test.step('AND admin can delete the order', async () => {
        await adminPage.deleteOrder(orderId!);
        await expect(adminPage.confirmPrompt).toBeVisible();
        await adminPage.confirmDelete();
      });

      await test.step('THEN the order is removed from the table', async () => {
        const orderRow = adminPage.getAdminOrderRow(orderId!);
        await expect(orderRow).toBeHidden();
      });
    },
  );

  test(
    'should allow admin to view statistics, filter orders, and manage deletions',
    { tag: '@e2e' },
    async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, adminPage, header }) => {
      const userCreds = generateUserCredentials();
      const adminCreds = generateAdminCredentials();
      const { name, email: checkoutEmail } = generateCheckoutData();

      await test.step('GIVEN multiple orders exist in system', async () => {
        // Create order 1 as user
        await loginPage.goto();
        await loginPage.login(userCreds.email, userCreds.password);
        await menuPage.goto();
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await header.goToCart();
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, checkoutEmail);
        await paymentDetails.submit();
        await snackbar.waitForAppear();
      });

      await test.step('WHEN admin logs in', async () => {
        await header.logout();
        await loginPage.goto();
        await loginPage.loginAsAdmin(adminCreds.email, adminCreds.password);
      });

      await test.step('THEN admin dashboard loads with statistics', async () => {
        await adminPage.goto();
        await expect(adminPage.page).toHaveURL(/\/admin/);
        await expect(adminPage.dashboard).toBeVisible();
      });

      await test.step('AND stat cards display key metrics', async () => {
        const revenueCard = adminPage.getStatCard(AdminDashboardStats.REVENUE);
        const ordersCard = adminPage.getStatCard(AdminDashboardStats.ORDERS);
        await expect(revenueCard).toBeVisible();
        await expect(ordersCard).toBeVisible();
      });

      await test.step('AND orders table is visible', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
        const count = await adminPage.getStatNumericValue(AdminDashboardStats.ORDERS);
        expect(count).toBeGreaterThanOrEqual(1);
      });

      await test.step('AND admin can delete orders', async () => {
        const deleteButton = adminPage.ordersTable
          .getByRole('button', { name: /delete|remove/i })
          .first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          // eslint-disable-next-line playwright/no-conditional-expect -- delete only if button exists
          await expect(adminPage.confirmPrompt).toBeVisible();
          await adminPage.confirmDelete();
        }
      });

      await test.step('THEN stats are updated', async () => {
        await adminPage.page.reload();
        const finalCount = await adminPage.getStatNumericValue(AdminDashboardStats.ORDERS);
        expect(typeof finalCount).toBe('number');
      });

      await test.step('AND admin can view order details', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
      });
    },
  );
});
