import { faker } from '@faker-js/faker';
import { CheckoutRequestSchema } from '../../../fixtures/api/schemas/coffee-cart/checkoutSchema';
import type { CheckoutRequest } from '../../../fixtures/api/schemas/coffee-cart/checkoutSchema';
import { CoffeeNames, CoffeePrices } from '../../../enums/coffee-cart/coffee-cart';

/** Coffee menu with prices for building valid order items */
const COFFEE_MENU: { name: string; unitPrice: number }[] = [
  { name: CoffeeNames.ESPRESSO, unitPrice: CoffeePrices.ESPRESSO },
  { name: CoffeeNames.ESPRESSO_MACCHIATO, unitPrice: CoffeePrices.ESPRESSO_MACCHIATO },
  { name: CoffeeNames.CAPPUCCINO, unitPrice: CoffeePrices.CAPPUCCINO },
  { name: CoffeeNames.MOCHA, unitPrice: CoffeePrices.MOCHA },
  { name: CoffeeNames.FLAT_WHITE, unitPrice: CoffeePrices.FLAT_WHITE },
  { name: CoffeeNames.AMERICANO, unitPrice: CoffeePrices.AMERICANO },
  { name: CoffeeNames.CAFE_LATTE, unitPrice: CoffeePrices.CAFE_LATTE },
  { name: CoffeeNames.ESPRESSO_CON_PANNA, unitPrice: CoffeePrices.ESPRESSO_CON_PANNA },
  { name: CoffeeNames.HOT_CHOCOLATE, unitPrice: CoffeePrices.HOT_CHOCOLATE },
];

/**
 * Generates a valid checkout request payload with Zod validation.
 * @param overrides - Optional field overrides
 * @returns Zod-validated checkout request
 */
export const generateOrderPayload = (overrides?: Partial<CheckoutRequest>): CheckoutRequest => {
  const itemCount = faker.number.int({ min: 1, max: 3 });
  const selectedCoffees = faker.helpers.arrayElements(COFFEE_MENU, itemCount);

  const payload = {
    name: overrides?.name ?? faker.person.fullName(),
    email: overrides?.email ?? faker.internet.email(),
    subscribe: overrides?.subscribe ?? faker.datatype.boolean(),
    items:
      overrides?.items ??
      selectedCoffees.map((coffee) => ({
        name: coffee.name,
        quantity: faker.number.int({ min: 1, max: 3 }),
        unitPrice: coffee.unitPrice,
      })),
  };

  return CheckoutRequestSchema.parse(payload);
};

/**
 * Generates multiple order payloads for bulk/data-driven tests.
 * @param count - Number of orders to generate
 * @returns Array of Zod-validated checkout requests
 */
export const generateOrderPayloads = (count: number): CheckoutRequest[] => {
  return Array.from({ length: count }, () => generateOrderPayload());
};
