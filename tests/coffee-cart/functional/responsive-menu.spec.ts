import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import coffeeMenuData from '../../../test-data/static/coffee-cart/coffeeMenu.json' assert { type: 'json' };

/**
 * Runs on **`mobile-chrome`** only (`grep: /@responsive/`).
 * Desktop projects use `grepInvert: /@responsive/` so viewport stays desktop there.
 */
test.describe('Menu · responsive', { tag: ['@responsive', '@ui'] }, () => {
  test.beforeEach(async ({ page, loginPage, menuPage }) => {
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();
    await expect(page).toHaveURL(/\/(?:menu|home|$)/);
  });

  test(
    'first coffee card is visible on mobile viewport',
    { tag: '@regression' },
    async ({ menuPage }) => {
      const firstCoffee = coffeeMenuData.coffees[0]!;
      await expect(menuPage.getCoffeeCard(firstCoffee.name)).toBeVisible();
    },
  );
});
