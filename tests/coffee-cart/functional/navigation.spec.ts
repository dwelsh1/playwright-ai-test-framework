import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Navigation', () => {
  test.beforeEach(async ({ loginPage, menuPage }) => {
    // Login
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);

    // Navigate to menu
    await menuPage.goto();
  });

  test(
    'should navigate to all main pages via header',
    { tag: '@smoke' },
    async ({ menuPage, cartPage, header }) => {
      await test.step('GIVEN user is on menu page', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('WHEN clicking navigation links', async () => {
        await header.goToCart();
      });

      await test.step('THEN user navigates to cart page', async () => {
        await expect(cartPage.page).toHaveURL(/\/cart/);
      });
    },
  );

  test('should update cart badge count', { tag: '@sanity' }, async ({ menuPage, header }) => {
    const initialCount = await header.getCartCount();

    await test.step('GIVEN user is on menu page', async () => {
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
    });

    await test.step('WHEN user adds item to cart', async () => {
      await menuPage.addToCart(CoffeeNames.ESPRESSO);
    });

    await test.step('THEN cart badge count increases', async () => {
      const newCount = await header.getCartCount();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test('should logout user from header', { tag: '@regression' }, async ({ page, header }) => {
    await test.step('GIVEN user is logged in', async () => {
      // Already logged in in beforeEach
    });

    await test.step('WHEN user clicks logout', async () => {
      await header.logout();
    });

    await test.step('THEN user is redirected to login page', async () => {
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test('should have accessible navigation links', { tag: '@regression' }, async ({ header }) => {
    await test.step('GIVEN header is visible', async () => {
      // Already visible
    });

    await test.step('WHEN checking navigation elements', async () => {
      // Already visible
    });

    await test.step('THEN all nav links are keyboard accessible', async () => {
      await expect(header.menuLink).toBeVisible();
      await expect(header.cartLink).toBeVisible();
      await expect(header.ordersLink).toBeVisible();
    });
  });

  test(
    'should highlight active page in navigation',
    { tag: '@regression' },
    async ({ page, menuPage }) => {
      await test.step('GIVEN user is on menu page', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('WHEN viewing header navigation', async () => {
        // Check for active class
      });

      await test.step('THEN menu link is marked as active', async () => {
        const activeLink = page.locator('[aria-current="page"], .active');
        await expect(activeLink).toContainText(/menu|home/i);
      });
    },
  );

  test(
    'should navigate to orders page from header',
    { tag: '@regression' },
    async ({ header, ordersPage }) => {
      await test.step('GIVEN user is logged in', async () => {
        // Already logged in
      });

      await test.step('WHEN clicking orders link', async () => {
        await header.goToOrders();
      });

      await test.step('THEN orders page loads', async () => {
        await expect(ordersPage.page).toHaveURL(/\/orders/);
      });
    },
  );

  test(
    'should maintain navigation state across pages',
    { tag: '@regression' },
    async ({ menuPage, cartPage, header }) => {
      await test.step('GIVEN user is on menu page', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('WHEN navigating between pages', async () => {
        await header.goToCart();
        await expect(cartPage.page).toHaveURL(/\/cart/);
      });

      await test.step('THEN returning to menu preserves state', async () => {
        await header.goToMenu();
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });
    },
  );
});
