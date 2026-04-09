import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { ApiEndpoints } from '../../../enums/coffee-cart/coffee-cart';
import { ApiError } from '../../../helpers/errors/test-errors';
import {
  COFFEES_QUERY,
  INVALID_FIELD_QUERY,
} from '../../../fixtures/api/graphql/coffee-cart-operations';
import { CoffeesGraphQLResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/graphqlEnvelopeSchema';
import { CoffeeListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';

const graphqlUrl = () => {
  const base = config.apiUrl;
  if (!base) {
    throw new Error('API_URL is not set — load env/.env.<TEST_ENV> or set API_URL for API tests.');
  }
  return `${base}${ApiEndpoints.GRAPHQL}`;
};

test.describe('Coffee Cart GraphQL — menu', { tag: ['@api', '@graphql'] }, () => {
  test('returns coffees consistent with GET /api/coffees', async ({ api }) => {
    const url = graphqlUrl();
    const [restRes, gqlRes] = await Promise.all([
      api.get(`${config.apiUrl}${ApiEndpoints.COFFEES}`),
      api.post(url, {
        data: { query: COFFEES_QUERY },
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    await test.step('REST menu is available', async () => {
      if (!restRes.ok()) {
        throw new ApiError(
          restRes.status(),
          await restRes.text(),
          `${config.apiUrl}${ApiEndpoints.COFFEES}`,
        );
      }
      expect(restRes.status()).toBe(200);
    });

    await test.step('GraphQL HTTP succeeds', async () => {
      if (!gqlRes.ok()) {
        throw new ApiError(gqlRes.status(), await gqlRes.text(), url);
      }
      expect(gqlRes.status()).toBe(200);
    });

    await test.step('Envelope and coffee list validate with Zod', async () => {
      const body = await gqlRes.json();
      const parsed = CoffeesGraphQLResponseSchema.parse(body);
      expect(parsed.errors).toBeUndefined();
      const coffees = CoffeeListResponseSchema.parse(parsed.data?.coffees);
      const restBody = await restRes.json();
      const restCoffees = CoffeeListResponseSchema.parse(restBody);
      expect(coffees).toEqual(restCoffees);
    });
  });

  test('returns GraphQL errors for invalid selection', async ({ api }) => {
    const url = graphqlUrl();
    const gqlRes = await api.post(url, {
      data: { query: INVALID_FIELD_QUERY },
      headers: { 'Content-Type': 'application/json' },
    });

    await test.step('HTTP 200 with errors array (common GraphQL HTTP style)', async () => {
      if (!gqlRes.ok()) {
        throw new ApiError(gqlRes.status(), await gqlRes.text(), url);
      }
      const body = await gqlRes.json();
      expect(body.errors).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThan(0);
      expect(String(body.errors[0].message)).toMatch(/cannot query field|notARealField/i);
    });
  });
});
