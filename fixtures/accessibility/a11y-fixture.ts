import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

export type A11yFixtures = {
  /** Run a WCAG 2.1 AA axe-core scan on the current page state. */
  a11yScan: (options?: {
    include?: string;
    exclude?: string[];
    disableRules?: string[];
  }) => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  a11yScan: async ({ page }, use) => {
    let capturedCount = 0;
    let capturedRules: Array<{ id: string; impact: string }> = [];
    let wasScanned = false;

    await use(async (options = {}) => {
      let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

      if (options.include) builder = builder.include(options.include);
      if (options.exclude) {
        for (const selector of options.exclude) {
          builder = builder.exclude(selector);
        }
      }
      if (options.disableRules) builder = builder.disableRules(options.disableRules);

      const results = await builder.analyze();

      capturedCount = results.violations.length;
      capturedRules = results.violations.map((v) => ({ id: v.id, impact: v.impact ?? 'unknown' }));
      wasScanned = true;

      base.info().annotations.push({
        type: 'axe-violations',
        description: `${results.violations.length} violations`,
      });

      if (results.violations.length > 0) {
        base.info().annotations.push({
          type: 'axe-violation-rules',
          description: JSON.stringify(capturedRules),
        });
      }

      const violations = results.violations.map((v) => ({
        rule: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        help: v.helpUrl,
      }));

      expect(results.violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });

    // TEARDOWN — Option B: write per-test JSON file for axe-results artifact.
    // Each worker writes its own file to avoid concurrent write race conditions.
    // Run `npm run report:axe` after tests complete to merge into test-results/axe-results.json.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (wasScanned) {
      try {
        const info = base.info();
        const entry = {
          test: info.title,
          file: path.relative(process.cwd(), info.file),
          violations: capturedCount,
          rules: capturedRules,
          date: new Date().toISOString(),
          status: info.status,
        };
        const dir = path.resolve('test-results/axe-results');
        fs.mkdirSync(dir, { recursive: true });
        const safe = info.testId.replace(/[^a-z0-9]/gi, '-').slice(0, 100);
        fs.writeFileSync(path.join(dir, `${safe}.json`), JSON.stringify(entry, null, 2));
      } catch {
        // Non-fatal: JSON artifact write failure should not affect test results
      }
    }
  },
});
