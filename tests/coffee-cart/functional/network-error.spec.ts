import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Network Error Handling', () => {
  test.beforeEach(async ({ loginPage, menuPage }) => {
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();
    await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
  });

  test(
    'should handle API server error gracefully on menu',
    { tag: '@regression' },
    async ({ networkMock, page }) => {
      await test.step('GIVEN the coffees API returns a 500 error', async () => {
        await networkMock.simulateServerError('**/api/coffees');
      });

      await test.step('WHEN user reloads the menu page', async () => {
        await page.reload();
      });

      await test.step('THEN the page does not crash', async () => {
        await expect(page).toHaveURL(/\/(?:menu|home|$)/);
      });
    },
  );

  test(
    'should handle API timeout gracefully on cart',
    { tag: '@regression' },
    async ({ networkMock, menuPage, cartPage, header }) => {
      await test.step('GIVEN user has items in cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        const count = await header.getCartCount();
        expect(count).toBeGreaterThan(0);
      });

      await test.step('AND the cart API times out', async () => {
        await networkMock.simulateTimeout('**/api/cart');
      });

      await test.step('WHEN user navigates to cart via direct URL', async () => {
        await cartPage.goto();
      });

      await test.step('THEN the page loads without crashing', async () => {
        await expect(cartPage.page).toHaveURL(/\/cart/);
      });
    },
  );

  test(
    'should handle offline mode gracefully',
    { tag: '@regression' },
    async ({ networkMock, page }) => {
      await test.step('GIVEN the page is loaded normally', async () => {
        await expect(page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('WHEN the network goes offline', async () => {
        await networkMock.goOffline();
      });

      await test.step('THEN the already-loaded page remains visible', async () => {
        // Page content loaded before offline should still be rendered
        await expect(page.locator('body')).toBeVisible();
      });

      await test.step('AND network can be restored', async () => {
        await networkMock.goOnline();
        await page.reload();
        await expect(page).toHaveURL(/\/(?:menu|home|$)/);
      });
    },
  );

  test(
    'should block third-party image requests',
    { tag: '@regression' },
    async ({ networkMock, page }) => {
      const blockedRequests: string[] = [];
      page.on('requestfailed', (request) => {
        blockedRequests.push(request.url());
      });

      await test.step('GIVEN image requests are blocked', async () => {
        await networkMock.blockRequests('**/*.{png,jpg,jpeg,gif,svg}');
      });

      await test.step('WHEN user reloads the page', async () => {
        await page.reload();
        await page.waitForLoadState('load');
      });

      await test.step('THEN the page still functions without images', async () => {
        await expect(page).toHaveURL(/\/(?:menu|home|$)/);
      });
    },
  );

  test(
    'should display mock data from intercepted API',
    { tag: '@regression' },
    async ({ networkMock, page }) => {
      const mockCoffees = [
        { name: 'Test Coffee', price: 99.99, recipe: [{ name: 'Magic Beans', quantity: 1 }] },
      ];

      await test.step('GIVEN the coffees API returns mock data', async () => {
        await networkMock.mockJsonResponse('**/api/coffees', mockCoffees);
      });

      await test.step('WHEN user navigates to menu', async () => {
        await page.goto('/');
        await page.waitForLoadState('load');
      });

      await test.step('THEN the mock coffee data is displayed', async () => {
        await expect(page.getByText('Test Coffee')).toBeVisible();
      });
    },
  );
});
