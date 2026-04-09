import { expect, test } from '../../../fixtures/pom/test-options';
import { generateSauceDemoCredentials } from '../../../test-data/factories/sauce-demo/auth.factory';
import { AppText, ProductNames, ProductPrices, Routes } from '../../../enums/sauce-demo/sauce-demo';
import { sauceDemoConfig } from '../../../config/sauce-demo';

test.describe('Sauce Demo — Product Browse', () => {
  test(
    'should view product price after login',
    { tag: '@e2e' },
    async ({ sdLoginPage, sdInventoryPage, sdProductDetailPage }) => {
      const { username, password } = generateSauceDemoCredentials();

      await test.step('GIVEN user is on the login page', async () => {
        await sdLoginPage.goto();
        await expect(sdLoginPage.loginButton).toBeVisible();
      });

      await test.step('WHEN user signs in with valid credentials', async () => {
        await sdLoginPage.login(username, password);
      });

      await test.step('THEN user is on the inventory page', async () => {
        await expect(sdInventoryPage.page).toHaveURL(
          `${sauceDemoConfig.appUrl}${Routes.INVENTORY}`,
        );
      });

      await test.step('AND Swag Labs header is visible', async () => {
        await expect(sdInventoryPage.headerTitle).toHaveText(AppText.HEADER_TITLE);
      });

      await test.step('WHEN user clicks on Sauce Labs Backpack', async () => {
        await sdInventoryPage.clickProduct(ProductNames.SAUCE_LABS_BACKPACK);
      });

      await test.step('THEN product price is $29.99', async () => {
        await expect(sdProductDetailPage.productPrice).toHaveText(
          ProductPrices.SAUCE_LABS_BACKPACK,
        );
      });
    },
  );
});
