import { test as base } from '../../fixtures/pom/test-options';

/**
 * Auto-fixture that captures all browser console messages during a test and
 * records them as `console-log` annotations on `testInfo`.
 *
 * The Smart Reporter reads these annotations and renders them in a collapsible
 * "Console Logs" panel on the test detail card.
 *
 * Each annotation has:
 *   - `type: 'console-log'`
 *   - `description: JSON.stringify({ level, text, timestamp })`
 *
 * Usage — import `test` from this file instead of `test-options` in any spec
 * where you want console capture:
 *
 * ```typescript
 * import { test, expect } from '../../helpers/util/console-log-fixture';
 * ```
 *
 * Or enable globally for all tests by adding it to `page-object-fixture.ts`:
 * ```typescript
 * export const test = base.extend<{ captureLogs: void }>({
 *   captureLogs: [async ({ page }, use, testInfo) => { ... }, { auto: true }],
 * });
 * ```
 */
export const test = base.extend<{ captureLogs: void }>({
  captureLogs: [
    async ({ page }, use, testInfo) => {
      page.on('console', (msg) => {
        testInfo.annotations.push({
          type: 'console-log',
          description: JSON.stringify({
            level: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString(),
          }),
        });
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '../../fixtures/pom/test-options';
