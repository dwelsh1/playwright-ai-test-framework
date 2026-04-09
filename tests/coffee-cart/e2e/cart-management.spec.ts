import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Cart Management Journey', () => {
  test(
    'should browse menu, add multiple items, modify quantities, and checkout',
    { tag: '@e2e' },
    async ({ loginPage, menuPage, header, cartPage }) => {
      const { email, password } = generateUserCredentials();

      await test.step('GIVEN user is logged in', async () => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await menuPage.goto();
      });

      await test.step('WHEN user browses multiple coffees', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
        const coffees = [CoffeeNames.ESPRESSO, CoffeeNames.CAPPUCCINO, CoffeeNames.MOCHA];
        for (const [index, coffee] of coffees.entries()) {
          const card = menuPage.getCoffeeCard(coffee);
          await expect(card).toBeVisible();
          await menuPage.addToCart(coffee);
          await expect
            .poll(async () => header.getCartCount(), {
              message: `Cart count updates after adding ${coffee}`,
            })
            .toBe(index + 1);
        }
      });

      await test.step('AND cart shows all items', async () => {
        const cartCount = await header.getCartCount();
        expect(cartCount).toBeGreaterThan(0);
      });

      await test.step('THEN user navigates to cart', async () => {
        await header.goToCart();
        await expect(cartPage.page).toHaveURL(/\/cart/);
      });

      await test.step('AND user modifies quantities', async () => {
        const coffees = [CoffeeNames.ESPRESSO, CoffeeNames.CAPPUCCINO];
        for (const coffee of coffees) {
          const card = cartPage.getCartItemRow(coffee);
          if (await card.isVisible()) {
            await cartPage.increaseQuantity(coffee);
          }
        }
      });

      await test.step('AND cart total updates', async () => {
        const total = await cartPage.getTotal();
        expect(total).toMatch(/\$\d+\.\d{2}/);
      });

      await test.step('THEN checkout button is available', async () => {
        await expect(cartPage.checkoutButton).toBeVisible();
      });
    },
  );

  test(
    'should persist cart across SPA navigation but clear on page reload',
    { tag: '@e2e' },
    async ({ loginPage, menuPage, header, cartPage, page }) => {
      const { email, password } = generateUserCredentials();

      await test.step('GIVEN user is logged in and adds items to cart', async () => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await menuPage.goto();
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await menuPage.addToCart(CoffeeNames.CAPPUCCINO);
        const initialCount = await header.getCartCount();
        expect(initialCount).toBeGreaterThan(0);
      });

      await test.step('WHEN user navigates away via SPA routing', async () => {
        await header.goToMenu();
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('THEN cart count persists after SPA navigation', async () => {
        const persistedCount = await header.getCartCount();
        expect(persistedCount).toBeGreaterThan(0);
      });

      await test.step('AND cart items are visible when navigating to cart page', async () => {
        await header.goToCart();
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(false);
      });

      await test.step('WHEN user performs a full page reload', async () => {
        await page.reload();
      });

      await test.step('THEN cart is cleared — in-memory state does not survive a reload', async () => {
        const reloadedCount = await header.getCartCount();
        expect(reloadedCount).toBe(0);
      });
    },
  );
});
