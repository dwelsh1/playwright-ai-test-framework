import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('{{AREA_TITLE}} — {{JOURNEY_TITLE}}', () => {
  test(
    '{{TEST_NAME}}',
    { tag: '@e2e' },
    async ({ {{FIXTURES}} }) => {
      await test.step('GIVEN {{GIVEN}}', async () => {
        // TODO
      });

      await test.step('WHEN {{WHEN}}', async () => {
        // TODO
      });

      await test.step('THEN {{THEN}}', async () => {
        // TODO
      });
    },
  );
});
