import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('{{AREA_TITLE}} — {{PAGE_TITLE}}', () => {
  test.beforeEach(async ({ {{PAGE_FIXTURE}} }) => {
    await {{PAGE_FIXTURE}}.goto();
    await expect({{PAGE_FIXTURE}}.{{READY_LOCATOR}}).toBeVisible();
  });

  test(
    '{{TEST_NAME}}',
    { tag: '@smoke' },
    async ({ {{PAGE_FIXTURE}} }) => {
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
