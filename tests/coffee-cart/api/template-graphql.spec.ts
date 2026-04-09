/* eslint-disable playwright/no-skipped-test -- template; excluded via testIgnore */
/**
 * TEMPLATE — not executed (see `testIgnore` for `template-*.spec.ts` in playwright.config.ts).
 *
 * Copy to e.g. `my-app-graphql.spec.ts` and replace placeholders.
 * See: docs/usage/graphql-api-testing.md
 */

import { expect, test } from '../../../fixtures/pom/test-options';

// import { config } from '../../../config/coffee-cart';
// import { ApiEndpoints } from '../../../enums/coffee-cart/coffee-cart';
// import { YOUR_QUERY } from '../../../fixtures/api/graphql/your-operations';
// import { YourGraphQLResponseSchema } from '../../../fixtures/api/schemas/your-app/graphqlEnvelopeSchema';

test.describe('TEMPLATE GraphQL API', () => {
  test.skip(true, 'Template file — duplicate and implement, then remove skip');

  test('YOUR_TEST_NAME', { tag: '@api' }, () => {
    // const url = `${config.apiUrl}${ApiEndpoints.GRAPHQL}`;
    // const response = await api.post(url, {
    //   data: { query: YOUR_QUERY, variables: {} },
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // expect(response.ok()).toBeTruthy();
    // const body = await response.json();
    // YourGraphQLResponseSchema.parse(body);
    expect(true).toBe(true);
  });
});
