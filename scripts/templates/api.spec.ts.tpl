import { expect, test } from '../../../fixtures/pom/test-options';
import { {{SCHEMA_NAME}} } from '../../../fixtures/api/schemas/{{AREA}}/{{SCHEMA_FILE}}';

test.describe('{{AREA_TITLE}} API — {{ENDPOINT_TITLE}}', () => {
  test(
    'GET {{ENDPOINT}} returns valid schema',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('WHEN GET {{ENDPOINT}} is called', async () => {
        const response = await api.get('{{ENDPOINT}}');
        expect(response.status()).toBe(200);
        const body = await response.json();
        {{SCHEMA_NAME}}.parse(body);
      });
    },
  );
});
