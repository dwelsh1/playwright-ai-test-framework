import { faker } from '@faker-js/faker';
import { CartItemSchema } from '../../../fixtures/api/schemas/coffee-cart/cartSchema';
import type { CartItem } from '../../../fixtures/api/schemas/coffee-cart/cartSchema';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

/** All available coffee names for cart operations */
const COFFEE_LIST = Object.values(CoffeeNames).filter((name) => !name.startsWith('(Discounted)'));

/**
 * Generates a Zod-validated cart item for admin/cart seeding operations.
 * @param overrides - Optional field overrides
 * @returns Zod-validated cart item
 */
export const generateCartItem = (overrides?: Partial<CartItem>): CartItem => {
  const item = {
    name: overrides?.name ?? faker.helpers.arrayElement(COFFEE_LIST),
    quantity: overrides?.quantity ?? faker.number.int({ min: 1, max: 5 }),
  };

  return CartItemSchema.parse(item);
};

/**
 * Generates multiple Zod-validated cart items for bulk cart seeding.
 * @param count - Number of items to generate (default: 1-3)
 * @returns Array of Zod-validated cart items
 */
export const generateCartItems = (count?: number): CartItem[] => {
  const itemCount = count ?? faker.number.int({ min: 1, max: 3 });
  const selectedCoffees = faker.helpers.arrayElements(COFFEE_LIST, itemCount);

  return selectedCoffees.map((name) =>
    CartItemSchema.parse({
      name,
      quantity: faker.number.int({ min: 1, max: 5 }),
    }),
  );
};

/**
 * Generates admin dashboard stat expectations for assertion helpers.
 * @param orderCount - Expected number of orders
 * @param totalRevenue - Expected total revenue
 * @returns Object with expected stat values
 */
export const generateExpectedStats = (orderCount: number, totalRevenue: number) => ({
  ordersPlaced: orderCount,
  totalRevenue,
  itemsSold: orderCount, // minimum, actual depends on quantities
});
