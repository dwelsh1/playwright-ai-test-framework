import type {
  TestResultData,
  A11yAnalysis,
  A11yRuleEntry,
  A11yTestSummary,
  RunSummary,
} from '../types';

/**
 * Extracts and aggregates axe-core violation data from test annotations.
 *
 * Reads two annotation types written by a11y-fixture.ts (and the [DEMO] test):
 *   - `axe-violations`:      description = "<N> violations"
 *   - `axe-violation-rules`: description = JSON array of { id, impact }
 *
 * Does not read axe-results.json — that file is for external CI tooling only.
 * Historical trend data comes from TestHistoryEntry.axeViolations (stored by HistoryCollector).
 */
export class AxeAnnotationAnalyzer {
  /**
   * Analyse all test results and produce an A11yAnalysis for the current run.
   * @param results   Final test results for the run
   * @param summaries Previous RunSummary entries (for cross-run trend)
   */
  analyze(results: TestResultData[], summaries: RunSummary[] = []): A11yAnalysis {
    const violatingTests: A11yTestSummary[] = [];
    const ruleMap = new Map<string, A11yRuleEntry>();
    let totalViolations = 0;
    let testedCount = 0;

    for (const test of results) {
      const countAnnotation = test.annotations?.find((a) => a.type === 'axe-violations');
      if (!countAnnotation) continue; // not an a11y test — skip entirely
      testedCount++;

      const count = parseInt(countAnnotation.description ?? '0', 10);
      totalViolations += count;

      const rulesAnnotation = test.annotations?.find((a) => a.type === 'axe-violation-rules');
      let rules: Array<{ id: string; impact: string }> = [];
      if (rulesAnnotation?.description) {
        try {
          rules = JSON.parse(rulesAnnotation.description) as Array<{ id: string; impact: string }>;
        } catch {
          // malformed annotation — treat as no rule details
        }
      }

      if (count > 0) {
        for (const rule of rules) {
          const existing = ruleMap.get(rule.id);
          if (existing) {
            existing.occurrences++;
            existing.testTitles.push(test.title);
          } else {
            ruleMap.set(rule.id, {
              id: rule.id,
              impact: rule.impact,
              occurrences: 1,
              testTitles: [test.title],
            });
          }
        }

        // Per-test trend from TestHistoryEntry.axeViolations
        const trend = test.history
          .filter((h) => h.axeViolations !== undefined)
          .map((h) => h.axeViolations as number);

        violatingTests.push({
          testId: test.testId,
          title: test.title,
          file: test.file,
          violations: count,
          rules,
          status: test.status,
          trend,
        });
      }
    }

    const ruleBreakdown = [...ruleMap.values()].sort((a, b) => b.occurrences - a.occurrences);

    // Cross-run trend from persisted RunSummary history
    const runTrend = summaries
      .filter((s) => s.a11yTestedCount !== undefined && s.a11yTestedCount > 0)
      .slice(-20)
      .map((s) => ({
        runId: s.runId,
        timestamp: s.timestamp,
        totalViolations: s.totalAxeViolations ?? 0,
      }));

    return {
      totalViolations,
      testedCount,
      violatingCount: violatingTests.length,
      cleanCount: testedCount - violatingTests.length,
      ruleBreakdown,
      violatingTests,
      runTrend,
    };
  }
}
