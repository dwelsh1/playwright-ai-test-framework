import { expect, test } from '../../../fixtures/pom/test-options';
import { generateSauceDemoCredentials } from '../../../test-data/factories/sauce-demo/auth.factory';
import { ProductNames, Routes } from '../../../enums/sauce-demo/sauce-demo';
import { sauceDemoConfig } from '../../../config/sauce-demo';

test.describe('Sauce Demo — Cart Management', () => {
  test(
    'should reflect cart count after adding item from inventory',
    { tag: '@e2e' },
    async ({ sdLoginPage, sdInventoryPage }) => {
      const { username, password } = generateSauceDemoCredentials();

      await test.step('GIVEN user is logged in and on the inventory page', async () => {
        await sdLoginPage.goto();
        await sdLoginPage.login(username, password);
        await expect(sdInventoryPage.page).toHaveURL(
          `${sauceDemoConfig.appUrl}${Routes.INVENTORY}`,
        );
      });

      await test.step('WHEN user adds an item to the cart', async () => {
        await sdInventoryPage.addToCart(ProductNames.SAUCE_LABS_ONESIE);
      });

      await test.step('THEN the cart badge shows a count of 1', async () => {
        await expect(sdInventoryPage.cartBadge).toHaveText('1');
      });
    },
  );
});
