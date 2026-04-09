import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { COFFEE_CART_API_ENDPOINTS, CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';
import { CartResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/cartSchema';
import { generateUnknownCoffeeName } from '../../../test-data/factories/coffee-cart/checkout.factory';

const CART_URL = `${config.apiUrl}${COFFEE_CART_API_ENDPOINTS.CART}`;

test.describe('Cart API', () => {
  // Cart is global server state — run serially to avoid cross-test interference
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ api }) => {
    await api.delete(CART_URL);
  });

  test.afterEach(async ({ api }) => {
    await api.delete(CART_URL);
  });

  test('should retrieve empty cart via GET /api/cart', { tag: '@api' }, async ({ api }) => {
    await test.step('GIVEN cart is empty', async () => {
      await api.delete(CART_URL);
    });

    await test.step('WHEN fetching cart', async () => {
      const response = await api.get(CART_URL);

      expect(response.status()).toBe(200);
      const body = await response.json();
      const cart = CartResponseSchema.parse(body);
      expect(cart).toHaveLength(0);
    });
  });

  test('should add item to cart via POST /api/cart', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN adding Espresso to cart', async () => {
      const response = await api.post(CART_URL, {
        data: { name: CoffeeNames.ESPRESSO },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      const cart = CartResponseSchema.parse(body);
      expect(cart).toContainEqual({ name: CoffeeNames.ESPRESSO, quantity: 1 });
    });
  });

  test(
    'should increment quantity when adding same item twice',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('GIVEN Espresso is in cart', async () => {
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
      });

      await test.step('WHEN adding Espresso again', async () => {
        const response = await api.post(CART_URL, {
          data: { name: CoffeeNames.ESPRESSO },
        });

        expect(response.status()).toBe(201);
        const body = await response.json();
        const cart = CartResponseSchema.parse(body);
        expect(cart).toContainEqual({ name: CoffeeNames.ESPRESSO, quantity: 2 });
      });
    },
  );

  test(
    'should decrement item quantity via DELETE /api/cart/:name',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('GIVEN cart has 2 Espressos', async () => {
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
      });

      await test.step('WHEN deleting one Espresso', async () => {
        const response = await api.delete(
          `${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO)}`,
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        const cart = CartResponseSchema.parse(body);
        expect(cart).toContainEqual({ name: CoffeeNames.ESPRESSO, quantity: 1 });
      });
    },
  );

  test(
    'should remove item entirely when quantity reaches zero',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('GIVEN cart has 1 Espresso', async () => {
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
      });

      await test.step('WHEN deleting the last Espresso', async () => {
        const response = await api.delete(
          `${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO)}`,
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        const cart = CartResponseSchema.parse(body);
        expect(cart).toHaveLength(0);
      });
    },
  );

  test('should empty entire cart via DELETE /api/cart', { tag: '@api' }, async ({ api }) => {
    await test.step('GIVEN cart has items', async () => {
      await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
      await api.post(CART_URL, { data: { name: CoffeeNames.CAPPUCCINO } });
    });

    await test.step('WHEN emptying cart', async () => {
      const response = await api.delete(CART_URL);

      expect(response.status()).toBe(200);
      const body = await response.json();
      const cart = CartResponseSchema.parse(body);
      expect(cart).toHaveLength(0);
    });
  });

  test('should return 400 when adding item without name', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN posting without name field', async () => {
      const response = await api.post(CART_URL, { data: {} });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test('should return 404 when adding non-existent coffee', { tag: '@api' }, async ({ api }) => {
    const unknownCoffee = generateUnknownCoffeeName();

    await test.step('WHEN posting a coffee name that does not exist', async () => {
      const response = await api.post(CART_URL, {
        data: { name: unknownCoffee },
      });

      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test('should return 404 when removing item not in cart', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN deleting an item not in cart', async () => {
      const response = await api.delete(`${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO)}`);

      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test(
    'should remove all units of an item via DELETE /api/cart/:name/all',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('GIVEN cart has 3 Espressos and 1 Cappuccino', async () => {
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
        await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
        await api.post(CART_URL, { data: { name: CoffeeNames.CAPPUCCINO } });
      });

      await test.step('WHEN deleting all Espressos', async () => {
        const response = await api.delete(
          `${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO)}/all`,
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        const cart = CartResponseSchema.parse(body);
        expect(cart.find((item) => item.name === CoffeeNames.ESPRESSO)).toBeUndefined();
        expect(cart).toContainEqual({ name: CoffeeNames.CAPPUCCINO, quantity: 1 });
      });
    },
  );

  test(
    'should return 200 (no-op) when deleting all units of an item not in cart',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('WHEN deleting all units of an item not in cart', async () => {
        const response = await api.delete(
          `${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO)}/all`,
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        const cart = CartResponseSchema.parse(body);
        expect(cart).toHaveLength(0);
      });
    },
  );

  test('should validate cart response schema', { tag: '@api' }, async ({ api }) => {
    await test.step('GIVEN items in cart', async () => {
      await api.post(CART_URL, { data: { name: CoffeeNames.CAPPUCCINO } });
    });

    await test.step('THEN cart response matches CartResponseSchema', async () => {
      const response = await api.get(CART_URL);
      const body = await response.json();

      const cart = CartResponseSchema.parse(body);
      expect(cart.length).toBeGreaterThan(0);
      expect(cart[0]).toEqual(
        expect.objectContaining({ name: expect.any(String), quantity: expect.any(Number) }),
      );
    });
  });
});
