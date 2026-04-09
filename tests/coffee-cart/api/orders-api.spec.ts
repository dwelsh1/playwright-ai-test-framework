import { expect, test } from '../../../fixtures/pom/test-options';
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { config } from '../../../config/coffee-cart';
import {
  COFFEE_CART_API_ENDPOINTS,
  CoffeeNames,
  CoffeePrices,
} from '../../../enums/coffee-cart/coffee-cart';
import { CheckoutResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/checkoutSchema';
import { OrderListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/orderSchema';

const CHECKOUT_URL = `${config.apiUrl}${COFFEE_CART_API_ENDPOINTS.CHECKOUT}`;
const ORDERS_URL = `${config.apiUrl}${COFFEE_CART_API_ENDPOINTS.ORDERS}`;

test.describe('Orders API', () => {
  test('should create order via POST /api/checkout', { tag: '@api' }, async ({ api }) => {
    const checkoutData = generateCheckoutData();

    await test.step('WHEN submitting a checkout', async () => {
      const response = await api.post(CHECKOUT_URL, {
        data: {
          ...checkoutData,
          items: [{ name: CoffeeNames.ESPRESSO, quantity: 1, unitPrice: CoffeePrices.ESPRESSO }],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      const parsed = CheckoutResponseSchema.parse(body);
      expect(parsed.order.orderId).toMatch(/^ORD-/);
      expect(parsed.order.name).toBe(checkoutData.name);
      expect(parsed.order.email).toBe(checkoutData.email);
      expect(parsed.order.items).toHaveLength(1);
      expect(parsed.order.total).toBe(CoffeePrices.ESPRESSO);
    });
  });

  test('should fetch all orders via GET /api/orders', { tag: '@api' }, async ({ api }) => {
    await test.step('GIVEN an order exists', async () => {
      const checkoutData = generateCheckoutData();
      await api.post(CHECKOUT_URL, {
        data: {
          ...checkoutData,
          items: [{ name: CoffeeNames.AMERICANO, quantity: 1, unitPrice: CoffeePrices.AMERICANO }],
        },
      });
    });

    await test.step('WHEN fetching orders', async () => {
      const response = await api.get(ORDERS_URL);

      expect(response.status()).toBe(200);
      const body = await response.json();
      const orders = OrderListResponseSchema.parse(body);
      expect(orders.length).toBeGreaterThan(0);
    });
  });

  test(
    'should fetch single order by orderId via GET /api/orders/:orderId',
    { tag: '@api' },
    async ({ api }) => {
      let orderId: string;

      await test.step('GIVEN an order is created', async () => {
        const checkoutData = generateCheckoutData();
        const response = await api.post(CHECKOUT_URL, {
          data: {
            ...checkoutData,
            items: [
              { name: CoffeeNames.CAPPUCCINO, quantity: 2, unitPrice: CoffeePrices.CAPPUCCINO },
            ],
          },
        });

        const body = await response.json();
        const parsed = CheckoutResponseSchema.parse(body);
        orderId = parsed.order.orderId;
      });

      await test.step('WHEN fetching order by orderId', async () => {
        const response = await api.get(`${ORDERS_URL}/${orderId!}`);

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('order_id', orderId!);
        expect(body).toHaveProperty('items');
        expect(body).toHaveProperty('total');
      });
    },
  );

  test('should delete order via DELETE /api/orders/:orderId', { tag: '@api' }, async ({ api }) => {
    let orderId: string;

    await test.step('GIVEN an order exists', async () => {
      const checkoutData = generateCheckoutData();
      const response = await api.post(CHECKOUT_URL, {
        data: {
          ...checkoutData,
          items: [{ name: CoffeeNames.MOCHA, quantity: 1, unitPrice: CoffeePrices.MOCHA }],
        },
      });

      const body = await response.json();
      const parsed = CheckoutResponseSchema.parse(body);
      orderId = parsed.order.orderId;
    });

    await test.step('WHEN deleting the order', async () => {
      const response = await api.delete(`${ORDERS_URL}/${orderId!}`);
      expect(response.status()).toBe(204);
    });

    await test.step('THEN order is no longer found', async () => {
      const response = await api.get(`${ORDERS_URL}/${orderId!}`);
      expect(response.status()).toBe(404);
    });
  });

  test(
    'should return 400 when checkout is missing name or email',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('WHEN submitting checkout without name', async () => {
        const response = await api.post(CHECKOUT_URL, {
          data: {
            email: 'test@example.com',
            items: [{ name: CoffeeNames.ESPRESSO, quantity: 1, unitPrice: CoffeePrices.ESPRESSO }],
          },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    },
  );

  test('should return 400 when checkout has no items', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN submitting checkout with empty items', async () => {
      const checkoutData = generateCheckoutData();
      const response = await api.post(CHECKOUT_URL, {
        data: { ...checkoutData, items: [] },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test('should return 404 for non-existent order', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN fetching a non-existent order', async () => {
      const response = await api.get(`${ORDERS_URL}/ORD-nonexistent`);

      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Order not found');
    });
  });

  test('should validate order list response schema', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN fetching all orders', async () => {
      const response = await api.get(ORDERS_URL);
      const body = await response.json();

      const orders = OrderListResponseSchema.parse(body);
      expect(Array.isArray(orders)).toBe(true);
    });
  });
});
