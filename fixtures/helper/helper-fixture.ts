import { test as base } from '@playwright/test';
import { apiRequest } from '../api/plain-function';
import { config } from '../../config/coffee-cart';
import { ApiEndpoints, CoffeeNames, CoffeePrices } from '../../enums/coffee-cart/coffee-cart';
import { generateCheckoutData } from '../../test-data/factories/coffee-cart/checkout.factory';
import { generateOrderPayload } from '../../test-data/factories/coffee-cart/order.factory';
import type { CheckoutOrder } from '../api/schemas/coffee-cart/checkoutSchema';
import type { CartItem } from '../api/schemas/coffee-cart/cartSchema';

/**
 * Helper fixtures for recurring API-driven setup and teardown.
 *
 * WHEN TO USE THESE:
 * - Tests that need a pre-existing order (e.g., orders list, admin dashboard)
 * - Tests that need a pre-populated cart (e.g., checkout flow)
 *
 * WHEN TO USE `api` FIXTURE DIRECTLY INSTEAD:
 * - One-off API calls in a single test
 * - API assertions (status codes, response validation)
 * - Simple setup in `beforeEach`
 */

// ==================== Types ====================

export type HelperFixtures = {
  /** Creates an order via API before the test and is available for assertions. */
  createdOrder: CheckoutOrder;
  /** Populates the cart with items via API before the test. Clears cart after. */
  seededCart: CartItem[];
};

// ==================== Fixtures ====================

export const test = base.extend<HelperFixtures>({
  /**
   * Creates an order via the checkout API before the test.
   * The order data is available in the test for assertions.
   * Cart is cleared after checkout automatically by the app.
   */
  createdOrder: async ({ request }, use) => {
    const checkoutData = generateCheckoutData();
    const orderPayload = generateOrderPayload({
      name: checkoutData.name,
      email: checkoutData.email,
      subscribe: checkoutData.subscribe,
      items: [
        {
          name: CoffeeNames.ESPRESSO,
          quantity: 1,
          unitPrice: CoffeePrices.ESPRESSO,
        },
      ],
    });

    // ── SETUP: Add item to cart, then checkout ──────────────
    await apiRequest({
      request,
      method: 'POST',
      url: ApiEndpoints.CART,
      baseUrl: config.apiUrl,
      body: { name: CoffeeNames.ESPRESSO, quantity: 1 },
    });

    const { body: checkoutBody } = await apiRequest({
      request,
      method: 'POST',
      url: ApiEndpoints.CHECKOUT,
      baseUrl: config.apiUrl,
      body: orderPayload,
    });

    const order = (checkoutBody as { order: CheckoutOrder }).order;

    // ── YIELD: Pass order data to the test ──────────────────
    await use(order);

    // ── TEARDOWN: Delete the order via admin API ────────────
    if (order.orderId) {
      await apiRequest({
        request,
        method: 'DELETE',
        url: `${ApiEndpoints.ORDERS}/${order.orderId}`,
        baseUrl: config.apiUrl,
      });
    }
  },

  /**
   * Populates the cart with 2 items via API before the test.
   * Clears the cart after the test completes.
   */
  seededCart: async ({ request }, use) => {
    // ── SETUP: Add items to cart ────────────────────────────
    const items: CartItem[] = [
      { name: CoffeeNames.ESPRESSO, quantity: 2 },
      { name: CoffeeNames.CAPPUCCINO, quantity: 1 },
    ];

    for (const item of items) {
      await apiRequest({
        request,
        method: 'POST',
        url: ApiEndpoints.CART,
        baseUrl: config.apiUrl,
        body: item,
      });
    }

    // ── YIELD: Pass cart items to the test ───────────────────
    await use(items);

    // ── TEARDOWN: Clear the cart ────────────────────────────
    for (const item of items) {
      await apiRequest({
        request,
        method: 'DELETE',
        url: `${ApiEndpoints.CART}/${encodeURIComponent(item.name)}`,
        baseUrl: config.apiUrl,
      });
    }
  },
});
