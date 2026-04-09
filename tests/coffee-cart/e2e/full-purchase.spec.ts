import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateAdminCredentials,
  generateCheckoutData,
  generateCartItems,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import { AdminDashboardStats, CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Full Purchase Journey', () => {
  test.afterEach(async ({ cartPage }) => {
    await cartPage.goto();
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      await cartPage.emptyCart();
    }
  });

  test(
    'should complete full user journey from login to order confirmation',
    { tag: ['@e2e', '@destructive'] },
    async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, ordersPage, header }) => {
      const { email, password } = generateUserCredentials();
      const { name, email: checkoutEmail } = generateCheckoutData();
      const cartItems = generateCartItems(2);

      await test.step('GIVEN user navigates to login', async () => {
        await loginPage.goto();
        await expect(loginPage.form).toBeVisible();
      });

      await test.step('WHEN user logs in with valid credentials', async () => {
        await loginPage.login(email, password);
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('AND user browses menu and adds items', async () => {
        for (const item of cartItems) {
          await menuPage.addToCart(item.name);
        }
        const cartCount = await header.getCartCount();
        expect(cartCount).toBeGreaterThan(0);
      });

      await test.step('AND user navigates to cart', async () => {
        await header.goToCart();
        await expect(cartPage.page).toHaveURL(/\/cart/);
      });

      await test.step('AND user reviews and modifies cart', async () => {
        await cartPage.increaseQuantity(cartItems[0]!.name);
        await expect(cartPage.cartList).toBeVisible();
      });

      await test.step('AND user proceeds to checkout', async () => {
        await cartPage.checkout();
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('AND user fills checkout form', async () => {
        await paymentDetails.fillCheckout(name, checkoutEmail);
      });

      await test.step('AND user submits order', async () => {
        await paymentDetails.submit();
        await snackbar.waitForAppear();
      });

      await test.step('THEN order confirmation is shown', async () => {
        const message = await snackbar.getMessage();
        expect(message).toBeTruthy();
      });

      await test.step('AND cart is cleared after checkout', async () => {
        await cartPage.goto();
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(true);
      });

      await test.step('AND new order appears in orders list', async () => {
        await ordersPage.goto();
        const isEmpty = await ordersPage.isEmpty();
        expect(isEmpty).toBe(false);
      });
    },
  );

  test(
    'should allow admin to view and delete user orders',
    { tag: '@e2e' },
    async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, adminPage, header }) => {
      const { email, password } = generateUserCredentials();
      const { email: checkoutEmail, name } = generateCheckoutData();

      await test.step('GIVEN user places an order', async () => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await menuPage.goto();
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await header.goToCart();
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, checkoutEmail);
        await paymentDetails.submit();
        await snackbar.waitForAppear();
      });

      await test.step('AND admin logs in', async () => {
        await header.logout();
        const { email: adminEmail, password: adminPassword } = generateAdminCredentials();
        await loginPage.goto();
        await loginPage.loginAsAdmin(adminEmail, adminPassword);
      });

      await test.step('WHEN admin navigates to dashboard', async () => {
        await adminPage.goto();
        await expect(adminPage.page).toHaveURL(/\/admin/);
      });

      await test.step('THEN orders are visible in admin panel', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
        const count = await adminPage.getStatNumericValue(AdminDashboardStats.ORDERS);
        expect(count).toBeGreaterThan(0);
      });

      await test.step('AND admin can delete an order', async () => {
        const deleteButton = adminPage.ordersTable
          .getByRole('button', { name: /delete|remove/i })
          .first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await adminPage.confirmDelete();
          await adminPage.page.reload();
        }
      });
    },
  );
});
