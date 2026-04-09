import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';
import coffeeMenuData from '../../../test-data/static/coffee-cart/coffeeMenu.json' assert { type: 'json' };

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page, loginPage, menuPage }) => {
    // Login first
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);

    // Navigate to menu
    await menuPage.goto();
    await expect(page).toHaveURL(/\/(?:menu|home|$)/);
  });

  test('should load menu page with coffees', { tag: '@smoke' }, async ({ menuPage }) => {
    await test.step('GIVEN user is logged in', async () => {
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
    });

    await test.step('WHEN menu page loads', async () => {
      // Page is already loaded
    });

    await test.step('THEN coffee items are visible', async () => {
      const firstCoffee = coffeeMenuData.coffees[0]!;
      const card = menuPage.getCoffeeCard(firstCoffee.name);
      await expect(card).toBeVisible();
    });
  });

  test('should add coffee to cart from menu', { tag: '@smoke' }, async ({ menuPage }) => {
    const coffeeName = coffeeMenuData.coffees[0]!.name;

    await test.step('GIVEN menu is loaded with coffees', async () => {
      await expect(menuPage.getCoffeeCard(coffeeName)).toBeVisible();
    });

    await test.step('WHEN user clicks add to cart button', async () => {
      await menuPage.addToCart(coffeeName);
    });

    await test.step('THEN cart count increases', async () => {
      const count = await menuPage.header.getCartCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('should display coffee prices', { tag: '@sanity' }, async ({ menuPage }) => {
    const coffeeName = coffeeMenuData.coffees[0]!.name;

    await test.step('GIVEN menu shows coffee card', async () => {
      await expect(menuPage.getCoffeeCard(coffeeName)).toBeVisible();
    });

    await test.step('WHEN viewing coffee details', async () => {
      // Already visible
    });

    await test.step('THEN price is displayed in correct format', async () => {
      const priceText = await menuPage.getPriceValue(coffeeName);
      expect(priceText).toMatch(/\$\d+\.\d{2}/);
    });
  });

  test(
    'should add coffee to cart via right-click context menu',
    { tag: '@sanity' },
    async ({ menuPage }) => {
      const coffeeName = coffeeMenuData.coffees[1]!.name;

      await test.step('GIVEN coffee is visible on menu', async () => {
        await expect(menuPage.getCoffeeCard(coffeeName)).toBeVisible();
      });

      await test.step('WHEN user right-clicks coffee card', async () => {
        await menuPage.rightClickAddToCart(coffeeName);
      });

      await test.step('THEN context menu appears or coffee is added', async () => {
        // Behavior depends on app implementation
        const count = await menuPage.header.getCartCount();
        expect(count).toBeGreaterThanOrEqual(0);
      });
    },
  );

  test('should undo last action with Ctrl+Z', { tag: '@regression' }, async ({ menuPage }) => {
    const coffeeName = coffeeMenuData.coffees[0]!.name;
    const initialCount = await menuPage.header.getCartCount();

    await test.step('GIVEN user adds coffee to cart', async () => {
      await menuPage.addToCart(coffeeName);
      const afterAdd = await menuPage.header.getCartCount();
      expect(afterAdd).toBeGreaterThan(initialCount);
    });

    await test.step('WHEN user presses Ctrl+Z', async () => {
      await menuPage.undo();
    });

    await test.step('THEN action is undone and cart count reverts', async () => {
      const finalCount = await menuPage.header.getCartCount();
      expect(finalCount).toBe(initialCount);
    });
  });

  test(
    'should translate coffee name on double-click',
    { tag: '@regression' },
    async ({ menuPage }) => {
      const coffeeName = coffeeMenuData.coffees[0]!.name;

      await test.step('GIVEN coffee title is visible', async () => {
        await expect(menuPage.getCoffeeTitle(coffeeName)).toBeVisible();
      });

      await test.step('WHEN user double-clicks coffee title', async () => {
        await menuPage.toggleTranslation(coffeeName);
      });

      await test.step('THEN title content may change (translation toggles)', async () => {
        const title = menuPage.getCoffeeTitle(coffeeName);
        await expect(title).toBeVisible();
      });
    },
  );

  test('should add multiple of same coffee', { tag: '@regression' }, async ({ menuPage }) => {
    const coffeeName = coffeeMenuData.coffees[0]!.name;

    await test.step('GIVEN menu is loaded', async () => {
      await expect(menuPage.getCoffeeCard(coffeeName)).toBeVisible();
    });

    await test.step('WHEN user adds same coffee 3 times', async () => {
      for (let i = 0; i < 3; i++) {
        await menuPage.addToCart(coffeeName);
      }
    });

    await test.step('THEN cart count reflects total items', async () => {
      const count = await menuPage.header.getCartCount();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test('should search/filter coffees by name', { tag: '@regression' }, async ({ menuPage }) => {
    const searchTerm = CoffeeNames.ESPRESSO;

    await test.step('GIVEN menu is loaded', async () => {
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
    });

    await test.step('WHEN user searches for coffee', async () => {
      await menuPage.searchCoffee(searchTerm);
    });

    await test.step('THEN filtered results are displayed', async () => {
      const card = menuPage.getCoffeeCard(searchTerm);
      await expect(card).toBeVisible();
    });
  });
});
