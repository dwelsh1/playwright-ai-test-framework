import { faker } from '@faker-js/faker';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

/**
 * Generates a valid checkout payload with name, email, and subscribe preference.
 * @param {object} overrides - Optional field overrides
 * @returns {object} Valid checkout data
 */
export const generateCheckoutData = (overrides?: {
  name?: string;
  email?: string;
  subscribe?: boolean;
}) => {
  return {
    name: overrides?.name ?? faker.person.fullName(),
    email: overrides?.email ?? faker.internet.email(),
    subscribe: overrides?.subscribe ?? faker.datatype.boolean(),
  };
};

/**
 * Generates valid login credentials (user email/password).
 * Reads from TEST_USER_EMAIL / TEST_USER_PASSWORD env vars; falls back to demo defaults.
 * @param {object} overrides - Optional field overrides
 * @returns {object} User credentials
 */
export const generateUserCredentials = (overrides?: { email?: string; password?: string }) => {
  return {
    email: overrides?.email ?? process.env['TEST_USER_EMAIL'] ?? 'user@example.com',
    password: overrides?.password ?? process.env['TEST_USER_PASSWORD'] ?? 'password',
  };
};

/**
 * Generates valid admin credentials.
 * Reads from TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD env vars; falls back to demo defaults.
 * @param {object} overrides - Optional field overrides
 * @returns {object} Admin credentials
 */
export const generateAdminCredentials = (overrides?: { email?: string; password?: string }) => {
  return {
    email: overrides?.email ?? process.env['TEST_ADMIN_EMAIL'] ?? 'admin@example.com',
    password: overrides?.password ?? process.env['TEST_ADMIN_PASSWORD'] ?? 'admin',
  };
};

/** Regular coffees available for adding to cart (excludes promo-only items) */
const REGULAR_COFFEES: CoffeeNames[] = [
  CoffeeNames.AMERICANO,
  CoffeeNames.CAFE_LATTE,
  CoffeeNames.CAPPUCCINO,
  CoffeeNames.ESPRESSO,
  CoffeeNames.ESPRESSO_CON_PANNA,
  CoffeeNames.ESPRESSO_MACCHIATO,
  CoffeeNames.FLAT_WHITE,
  CoffeeNames.HOT_CHOCOLATE,
  CoffeeNames.MOCHA,
];

/**
 * Generates a random coffee name from available options
 * @returns {CoffeeNames} Coffee name
 */
export const generateRandomCoffee = (): CoffeeNames => {
  return REGULAR_COFFEES[Math.floor(Math.random() * REGULAR_COFFEES.length)]!;
};

/**
 * Generates a coffee name that should not exist in the menu.
 * Useful for negative API tests without hardcoding invalid values inline.
 * @returns {string} Non-existent coffee name
 */
export const generateUnknownCoffeeName = (): string => {
  return `Unknown ${faker.string.alphanumeric(8)}`;
};

/**
 * Generates random cart items (coffee names with quantities)
 * @param {number} itemCount - Number of items to generate (default: 1-3)
 * @returns {array} Array of {name, quantity} objects
 */
export const generateCartItems = (itemCount?: number) => {
  const count = itemCount ?? faker.number.int({ min: 1, max: 3 });
  const items = [];

  for (let i = 0; i < count; i++) {
    items.push({
      name: generateRandomCoffee(),
      quantity: faker.number.int({ min: 1, max: 5 }),
    });
  }

  return items;
};
