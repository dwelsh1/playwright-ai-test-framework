import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { COFFEE_CART_API_ENDPOINTS, CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';
import {
  CoffeeListResponseSchema,
  CoffeeSchema,
} from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';
import type { Coffee } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';

const COFFEES_URL = `${config.apiUrl}${COFFEE_CART_API_ENDPOINTS.COFFEES}`;

test.describe('Menu API', () => {
  test('should fetch all coffees via GET /api/coffees', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN fetching the coffee menu', async () => {
      const response = await api.get(COFFEES_URL);

      expect(response.status()).toBe(200);
      const body = await response.json();
      const coffees = CoffeeListResponseSchema.parse(body);
      expect(coffees.length).toBeGreaterThan(0);
    });
  });

  test(
    'should validate coffee schema with all required fields',
    { tag: '@api' },
    async ({ api }) => {
      let coffees: Coffee[];

      await test.step('WHEN fetching coffee list', async () => {
        const response = await api.get(COFFEES_URL);
        expect(response.status()).toBe(200);
        const body = await response.json();
        coffees = CoffeeListResponseSchema.parse(body);
      });

      await test.step('THEN each coffee has name, price, and recipe', () => {
        for (const coffee of coffees!) {
          CoffeeSchema.parse(coffee);
          expect(coffee.name).toBeTruthy();
          expect(coffee.price).toBeGreaterThan(0);
          expect(coffee.recipe.length).toBeGreaterThan(0);
        }
      });
    },
  );

  test('should return valid prices for all coffees', { tag: '@api' }, async ({ api }) => {
    let coffees: Coffee[];

    await test.step('WHEN fetching coffees', async () => {
      const response = await api.get(COFFEES_URL);
      const body = await response.json();
      coffees = CoffeeListResponseSchema.parse(body);
    });

    await test.step('THEN all prices are positive numbers', () => {
      for (const coffee of coffees!) {
        expect(typeof coffee.price).toBe('number');
        expect(coffee.price).toBeGreaterThan(0);
      }
    });
  });

  test('should include recipe ingredients in coffee details', { tag: '@api' }, async ({ api }) => {
    let coffees: Coffee[];

    await test.step('WHEN fetching coffees', async () => {
      const response = await api.get(COFFEES_URL);
      const body = await response.json();
      coffees = CoffeeListResponseSchema.parse(body);
    });

    await test.step('THEN each recipe has name and quantity', () => {
      for (const coffee of coffees!) {
        expect(Array.isArray(coffee.recipe)).toBe(true);
        expect(coffee.recipe.length).toBeGreaterThan(0);
        for (const ingredient of coffee.recipe) {
          expect(ingredient).toHaveProperty('name');
          expect(ingredient).toHaveProperty('quantity');
          expect(ingredient.quantity).toBeGreaterThan(0);
        }
      }
    });
  });

  test('should include expected coffees in the menu', { tag: '@api' }, async ({ api }) => {
    let names: string[];

    await test.step('WHEN fetching coffees', async () => {
      const response = await api.get(COFFEES_URL);
      const body = await response.json();
      const coffees = CoffeeListResponseSchema.parse(body);
      names = coffees.map((c) => c.name);
    });

    await test.step('THEN menu contains Espresso and Cappuccino', () => {
      expect(names!).toContain(CoffeeNames.ESPRESSO);
      expect(names!).toContain(CoffeeNames.CAPPUCCINO);
    });
  });
});
