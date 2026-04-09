import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';

test.describe('API Error Handling', () => {
  test('should return 404 for non-existent endpoints', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN requesting a non-existent endpoint', async () => {
      const response = await api.get(`${config.apiUrl}/api/nonexistent`);
      expect(response.status()).toBe(404);
    });
  });

  test('should return 404 for non-existent login endpoint', { tag: '@api' }, async ({ api }) => {
    const credentials = generateUserCredentials();

    await test.step('WHEN posting to /login (no server-side auth exists)', async () => {
      const response = await api.post(`${config.apiUrl}/login`, {
        data: credentials,
      });
      expect(response.status()).toBe(404);
    });
  });
});
