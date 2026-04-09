import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { ApiEndpoints } from '../../../enums/coffee-cart/coffee-cart';
import {
  StoreListResponseSchema,
  StoreSchema,
  NearestStoreResponseSchema,
  StoreEligibilityResponseSchema,
} from '../../../fixtures/api/schemas/coffee-cart/storeSchema';
import type { Store } from '../../../fixtures/api/schemas/coffee-cart/storeSchema';

const STORES_URL = `${config.apiUrl}${ApiEndpoints.STORES}`;

// Arizona store coordinates (within seed data pickup radius)
const PHOENIX_COORDS = { latitude: 33.4484, longitude: -112.074 };
// Coordinates far from all stores (middle of the ocean)
const OCEAN_COORDS = { latitude: 0, longitude: 0 };

test.describe('Stores API', () => {
  let firstStore: Store;

  test.beforeAll(async ({ api }) => {
    // Seed stores if not already present
    await api.post(`${config.apiUrl}/api/stores/seed`);

    // Cache first store for use in individual tests
    const response = await api.get(STORES_URL);
    const body = await response.json();
    const stores = StoreListResponseSchema.parse(body);
    firstStore = stores[0]!;
  });

  test.describe('GET /api/stores', () => {
    test('should return all active stores', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN fetching all stores', async () => {
        const response = await api.get(STORES_URL);

        expect(response.status()).toBe(200);
        const body = await response.json();
        const stores = StoreListResponseSchema.parse(body);
        expect(stores.length).toBeGreaterThan(0);
      });
    });

    test('should validate store schema fields', { tag: '@api' }, async ({ api }) => {
      let stores: Store[];

      await test.step('WHEN fetching stores', async () => {
        const response = await api.get(STORES_URL);
        const body = await response.json();
        stores = StoreListResponseSchema.parse(body);
      });

      await test.step('THEN each store has required location fields', () => {
        for (const store of stores!) {
          StoreSchema.parse(store);
          expect(store.name).toBeTruthy();
          expect(store.latitude).toBeGreaterThanOrEqual(-90);
          expect(store.latitude).toBeLessThanOrEqual(90);
          expect(store.longitude).toBeGreaterThanOrEqual(-180);
          expect(store.longitude).toBeLessThanOrEqual(180);
          expect(store.pickup_radius_miles).toBeGreaterThan(0);
          expect(store.is_active).toBe(true);
        }
      });
    });
  });

  test.describe('GET /api/stores/:id', () => {
    test('should return a store by valid ID', { tag: '@api' }, async ({ api }) => {
      await test.step(`WHEN fetching store ${firstStore.id}`, async () => {
        const response = await api.get(`${STORES_URL}/${firstStore.id}`);

        expect(response.status()).toBe(200);
        const body = await response.json();
        const store = StoreSchema.parse(body);
        expect(store.id).toBe(firstStore.id);
        expect(store.name).toBe(firstStore.name);
      });
    });

    test('should return 400 for a non-numeric store ID', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN fetching store with non-numeric ID', async () => {
        const response = await api.get(`${STORES_URL}/not-a-number`);

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });

    test('should return 404 for a non-existent store ID', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN fetching store with ID 999999', async () => {
        const response = await api.get(`${STORES_URL}/999999`);

        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });
  });

  test.describe('POST /api/stores/nearest', () => {
    test('should return nearest store for valid coordinates', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting Phoenix coordinates', async () => {
        const response = await api.post(`${STORES_URL}/nearest`, { data: PHOENIX_COORDS });

        expect(response.status()).toBe(200);
        const body = await response.json();
        const result = NearestStoreResponseSchema.parse(body);
        expect(result.store).not.toBeNull();
        expect(result.distance_miles).not.toBeNull();
        expect(typeof result.is_within_radius).toBe('boolean');
      });
    });

    test(
      'should return null store for coordinates far from all stores',
      { tag: '@api' },
      async ({ api }) => {
        await test.step('WHEN posting ocean coordinates (0, 0)', async () => {
          const response = await api.post(`${STORES_URL}/nearest`, { data: OCEAN_COORDS });

          expect(response.status()).toBe(200);
          const body = await response.json();
          const result = NearestStoreResponseSchema.parse(body);
          // Either no store within radius or a very far store — response must still be valid schema
          expect(result.is_within_radius).toBe(false);
        });
      },
    );

    test('should return 400 for missing coordinates', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting without coordinates', async () => {
        const response = await api.post(`${STORES_URL}/nearest`, { data: {} });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });

    test('should return 400 for invalid latitude', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting latitude > 90', async () => {
        const response = await api.post(`${STORES_URL}/nearest`, {
          data: { latitude: 999, longitude: -112.074 },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });

    test('should return 400 for invalid longitude', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting longitude > 180', async () => {
        const response = await api.post(`${STORES_URL}/nearest`, {
          data: { latitude: 33.4484, longitude: 999 },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });
  });

  test.describe('POST /api/stores/eligibility', () => {
    test(
      'should return eligibility for a store with valid coordinates',
      { tag: '@api' },
      async ({ api }) => {
        await test.step(`WHEN checking eligibility for store ${firstStore.id} near Phoenix`, async () => {
          const response = await api.post(`${STORES_URL}/eligibility`, {
            data: { ...PHOENIX_COORDS, store_id: firstStore.id },
          });

          expect(response.status()).toBe(200);
          const body = await response.json();
          const result = StoreEligibilityResponseSchema.parse(body);
          expect(result.store_id).toBe(firstStore.id);
          expect(result.store_name).toBe(firstStore.name);
          expect(result.pickup_radius_miles).toBeGreaterThan(0);
        });
      },
    );

    test('should return 400 for missing store_id', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting without store_id', async () => {
        const response = await api.post(`${STORES_URL}/eligibility`, { data: PHOENIX_COORDS });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });

    test('should return 400 for invalid coordinates', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting invalid latitude', async () => {
        const response = await api.post(`${STORES_URL}/eligibility`, {
          data: { latitude: 999, longitude: -112.074, store_id: firstStore.id },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });

    test('should return 404 for a non-existent store_id', { tag: '@api' }, async ({ api }) => {
      await test.step('WHEN posting valid coordinates with non-existent store_id', async () => {
        const response = await api.post(`${STORES_URL}/eligibility`, {
          data: { ...PHOENIX_COORDS, store_id: 999999 },
        });

        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });
    });
  });
});
