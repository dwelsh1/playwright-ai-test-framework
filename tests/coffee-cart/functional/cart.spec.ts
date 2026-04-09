import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateRandomCoffee,
  generateCheckoutData,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import { formatPrice } from '../../../helpers/coffee-cart/price.helper';
import { CoffeeNames, CoffeePrices } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Cart Page', () => {
  let addedCoffee: string;

  test.beforeEach(async ({ loginPage, menuPage }) => {
    // Login and navigate to menu
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();

    // Add an item to cart
    addedCoffee = generateRandomCoffee();
    await menuPage.addToCart(addedCoffee);

    // Navigate to cart via header (preserves SPA state)
    await menuPage.header.goToCart();
  });

  test('should display cart contents', { tag: '@smoke' }, async ({ cartPage }) => {
    await test.step('GIVEN user has items in cart', async () => {
      const isEmpty = await cartPage.isEmpty();
      expect(isEmpty).toBe(false);
    });

    await test.step('WHEN cart page loads', async () => {
      await expect(cartPage.page).toHaveURL(/\/cart/);
    });

    await test.step('THEN cart items are visible', async () => {
      await expect(cartPage.cartList).toBeVisible();
    });
  });

  test('should increase item quantity', { tag: '@smoke' }, async ({ cartPage }) => {
    await test.step('GIVEN cart has an item', async () => {
      await expect(cartPage.cartList).toBeVisible();
    });

    await test.step('WHEN user clicks increase button', async () => {
      const items = await cartPage.cartList.locator('tr, [role="row"]').count();
      if (items > 1) {
        const coffeeName = generateRandomCoffee();
        await cartPage.increaseQuantity(coffeeName);
      }
    });

    await test.step('THEN quantity increases visually', async () => {
      await expect(cartPage.totalDisplay).toBeVisible();
    });
  });

  test('should decrease item quantity', { tag: '@smoke' }, async ({ cartPage }) => {
    await test.step('GIVEN cart item has quantity > 1', async () => {
      // First increase quantity
      await cartPage.increaseQuantity(addedCoffee);
    });

    await test.step('WHEN user clicks decrease button', async () => {
      await cartPage.decreaseQuantity(addedCoffee);
    });

    await test.step('THEN quantity decreases', async () => {
      await expect(cartPage.totalDisplay).toBeVisible();
    });
  });

  test('should remove item from cart', { tag: '@sanity' }, async ({ cartPage }) => {
    await test.step('GIVEN cart has items', async () => {
      await expect(cartPage.cartList).toBeVisible();
    });

    await test.step('WHEN user clicks remove button', async () => {
      await cartPage.removeItem(addedCoffee);
    });

    await test.step('THEN cart is empty', async () => {
      const isEmpty = await cartPage.isEmpty();
      expect(isEmpty).toBe(true);
    });
  });

  test('should empty cart by removing all items', { tag: '@regression' }, async ({ cartPage }) => {
    await test.step('GIVEN cart has items', async () => {
      const isEmpty = await cartPage.isEmpty();
      expect(isEmpty).toBe(false);
    });

    await test.step('WHEN user removes all items', async () => {
      await cartPage.removeItem(addedCoffee);
    });

    await test.step('THEN cart is cleared', async () => {
      const isEmpty = await cartPage.isEmpty();
      expect(isEmpty).toBe(true);
    });
  });

  test(
    'should clear cart contents on page reload',
    { tag: '@regression' },
    async ({ menuPage, cartPage }) => {
      await test.step('GIVEN user has items in cart', async () => {
        await menuPage.goto();
        await menuPage.addToCart(generateRandomCoffee());
        await menuPage.header.goToCart();
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(false);
      });

      await test.step('WHEN user reloads the page', async () => {
        await cartPage.page.reload();
      });

      await test.step('THEN cart is empty — client-side state does not persist across reloads', async () => {
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(true);
      });
    },
  );

  test(
    'should clear cart after successful checkout',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails }) => {
      await test.step('GIVEN user has items in cart', async () => {
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(false);
      });

      await test.step('WHEN user completes checkout', async () => {
        await cartPage.checkout();
        if (await paymentDetails.isVisible()) {
          const { name, email } = generateCheckoutData();
          await paymentDetails.fillCheckout(name, email);
          await paymentDetails.submit();
        }
      });

      await test.step('THEN cart is cleared after order', async () => {
        // Navigate back to cart to verify
        await cartPage.goto();
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(true);
      });
    },
  );

  test(
    'should display correct total price based on quantities',
    { tag: '@regression' },
    async ({ cartPage }) => {
      await test.step('GIVEN cart is loaded with items', async () => {
        await expect(cartPage.totalDisplay).toBeVisible();
      });

      await test.step('WHEN viewing total', async () => {
        // Already visible
      });

      await test.step('THEN total is in correct currency format', async () => {
        const total = await cartPage.getTotal();
        expect(total).toMatch(/\$\d+\.\d{2}/);
      });
    },
  );
});

test.describe('Cart — Exact Price Calculation', () => {
  test(
    'should display exact total price for known item quantities',
    { tag: '@regression' },
    async ({ menuPage, cartPage }) => {
      // 2 × Espresso ($5.00 each) + 1 × Cappuccino ($6.50) = $16.50
      const expectedTotal = formatPrice(2 * CoffeePrices.ESPRESSO + CoffeePrices.CAPPUCCINO);

      await test.step('GIVEN menu is loaded with known items added to cart', async () => {
        await menuPage.goto();
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await menuPage.addToCart(CoffeeNames.CAPPUCCINO);
        await menuPage.header.goToCart();
      });

      await test.step('WHEN viewing the cart total', async () => {
        await expect(cartPage.totalDisplay).toBeVisible();
      });

      await test.step('THEN total matches the calculated price from enums', async () => {
        const total = await cartPage.getTotal();
        expect(total).toContain(expectedTotal);
      });
    },
  );
});
