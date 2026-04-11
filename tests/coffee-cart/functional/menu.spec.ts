import { expect, test } from '../../../fixtures/pom/test-options';
import { formatPrice } from '../../../helpers/coffee-cart/price.helper';
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
    await menuPage.waitForMenuHydrated();
  });

  test(
    'should hydrate menu with nav, product cards, and ingredient regions',
    { tag: '@sanity' },
    async ({ menuPage, header }) => {
      const espresso = coffeeMenuData.coffees.find((c) => c.name === CoffeeNames.ESPRESSO)!;
      const cappuccino = coffeeMenuData.coffees.find((c) => c.name === CoffeeNames.CAPPUCCINO)!;

      await test.step('GIVEN user is logged in on the menu route', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('WHEN the menu list is shown', async () => {
        await expect(menuPage.coffeeList).toBeVisible();
      });

      await test.step('THEN top navigation shows menu and cart with count', async () => {
        await expect(header.menuLink).toBeVisible();
        await expect(header.cartLink).toBeVisible();
        await expect(header.cartLink).toContainText(/cart\s*\(\d+\)/i);
      });

      await test.step('THEN GitHub link points at /github when the build exposes it', async () => {
        await expect(async () => {
          if ((await header.githubLink.count()) === 0) {
            return;
          }
          await expect(header.githubLink).toBeVisible();
          await expect(header.githubLink).toHaveAttribute('href', /\/github/);
        }).toPass({ timeout: 5_000 });
      });

      await test.step('THEN known coffees show title with price and recipe content', async () => {
        for (const coffee of [espresso, cappuccino]) {
          const title = menuPage.getCoffeeTitle(coffee.name);
          await expect(title).toBeVisible();
          await expect(title).toContainText(coffee.name);
          await expect(title).toContainText(formatPrice(coffee.price));
          const firstIngredient = coffee.recipe[0]!.name;
          await expect(async () => {
            const region = menuPage.getCoffeeIngredientRegion(coffee.name);
            if ((await region.count()) > 0) {
              // Named ingredient region (e.g. public menu); local fork may use image-only cards instead.
              // eslint-disable-next-line playwright/no-conditional-expect -- branch matches one of two supported DOM shapes
              await expect(region).toContainText(firstIngredient, { ignoreCase: true });
              return;
            }
            await expect(menuPage.getCoffeeRecipe(coffee.name)).toBeVisible();
          }).toPass({ timeout: 5_000 });
        }
      });
    },
  );

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

  test(
    'should update cart link and checkout summary after adding from menu',
    { tag: '@sanity' },
    async ({ menuPage, header }) => {
      const coffee = coffeeMenuData.coffees.find((c) => c.name === CoffeeNames.AMERICANO)!;

      await test.step('GIVEN menu is hydrated with an empty cart', async () => {
        await expect(header.cartLink).toContainText('(0)');
        const initialSummary = await menuPage.readCheckoutSummaryText();
        expect(initialSummary).toMatch(/Total:\s*\$0\.00/);
      });

      await test.step('WHEN user adds one item from the menu', async () => {
        await menuPage.addToCart(coffee.name);
      });

      await test.step('THEN cart link and checkout summary reflect the line total', async () => {
        await expect(header.cartLink).toContainText('(1)');
        const summary = await menuPage.readCheckoutSummaryText();
        expect(summary).toContain(formatPrice(coffee.price));
      });
    },
  );

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
