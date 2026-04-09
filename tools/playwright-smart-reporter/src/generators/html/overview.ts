import type { TestResultData, TestHistory, RunComparison, FailureCluster } from '../../types';
import { formatDuration, escapeHtml, sanitizeId } from '../../utils';
import { generateTrendChart } from '../chart-generator';
import { generateComparison } from '../comparison-generator';

/**
 * Generate the Overview content with executive summary
 */
export function generateOverviewContent(
  results: TestResultData[],
  comparison: RunComparison | undefined,
  failureClusters: FailureCluster[] | undefined,
  passed: number,
  failed: number,
  skipped: number,
  flaky: number,
  slow: number,
  newTests: number,
  total: number,
  passRate: number,
  totalDuration: number,
  history: TestHistory,
  durationBudgetMs?: number,
): string {
  // Calculate deltas from comparison
  const prevPassed = comparison?.baselineRun.passed ?? passed;
  const prevFailed = comparison?.baselineRun.failed ?? failed;
  const prevPassRate = comparison?.baselineRun.total
    ? Math.round((comparison.baselineRun.passed / comparison.baselineRun.total) * 100)
    : passRate;
  const prevDuration = comparison?.baselineRun.duration ?? totalDuration;

  const passRateDelta = passRate - prevPassRate;
  const durationDelta = totalDuration - prevDuration;
  const durationDeltaPercent =
    prevDuration > 0 ? Math.round((durationDelta / prevDuration) * 100) : 0;

  // New failures and fixed tests from comparison
  const newFailures = comparison?.changes.newFailures ?? [];
  const fixedTests = comparison?.changes.fixedTests ?? [];
  const regressions = comparison?.changes.regressions ?? [];

  // Calculate suite health score (0-100)
  const passRateScore = passRate;
  const flakinessScore = total > 0 ? Math.max(0, 100 - (flaky / total) * 200) : 100;
  const performanceScore = total > 0 ? Math.max(0, 100 - (slow / total) * 200) : 100;
  const suiteHealthScore = Math.round(
    passRateScore * 0.5 + flakinessScore * 0.3 + performanceScore * 0.2,
  );
  const healthGrade =
    suiteHealthScore >= 90
      ? 'A'
      : suiteHealthScore >= 80
        ? 'B'
        : suiteHealthScore >= 70
          ? 'C'
          : suiteHealthScore >= 60
            ? 'D'
            : 'F';
  const healthClass =
    suiteHealthScore >= 90
      ? 'excellent'
      : suiteHealthScore >= 70
        ? 'good'
        : suiteHealthScore >= 50
          ? 'fair'
          : 'poor';

  // Find top 5 slowest tests by p90 (fall back to average/current duration when p90 unavailable)
  const slowestTests = [...results]
    .sort((a, b) => {
      const aScore = a.p90Duration ?? a.averageDuration ?? a.duration;
      const bScore = b.p90Duration ?? b.averageDuration ?? b.duration;
      return bScore - aScore;
    })
    .slice(0, 5);
  const slowestTest = slowestTests[0];
  const mostFlakyTest = [...results]
    .filter((r) => r.flakinessScore !== undefined)
    .sort((a, b) => (b.flakinessScore ?? 0) - (a.flakinessScore ?? 0))[0];

  // Compute defect leakage from results (Phase 1)
  const failedTests = results.filter((r) => r.status === 'failed' || r.status === 'timedOut');
  const untrackedFailures = failedTests.filter(
    (r) => !(r.linkedIssues && r.linkedIssues.length > 0),
  ).length;
  const leakagePct =
    failedTests.length > 0 ? Math.round((untrackedFailures / failedTests.length) * 100) : null;

  // Pass rate sparkline from history
  const passRateHistory = (history.summaries ?? []).slice(-10).map((s) => {
    const rate = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
    return { rate, passed: s.passed, failed: s.failed };
  });

  // Generate failure clusters section
  const clustersHtml =
    failureClusters && failureClusters.length > 0
      ? `
    <div class="overview-section">
      <div class="section-header">
        <span class="section-icon">🔍</span>
        <span class="section-title">Failure Clusters</span>
      </div>
      <div class="failure-clusters-grid">
        ${failureClusters
          .slice(0, 5)
          .map((cluster) => {
            const firstError = cluster.tests[0]?.error || '';
            const errorPreview =
              firstError.split('\n')[0].slice(0, 100) + (firstError.length > 100 ? '...' : '');
            const affectedFiles = [...new Set(cluster.tests.map((t) => t.file))];
            return `
          <div class="cluster-card" onclick="filterTests('failed'); switchView('tests');">
            <div class="cluster-header">
              <div class="cluster-icon">⚠️</div>
              <div class="cluster-type">${escapeHtml(cluster.errorType)}</div>
              <div class="cluster-count">${cluster.count} test${cluster.count > 1 ? 's' : ''}</div>
            </div>
            ${errorPreview ? `<div class="cluster-error">${escapeHtml(errorPreview)}</div>` : ''}
            <div class="cluster-tests">
              ${cluster.tests
                .slice(0, 3)
                .map((t) => `<span class="cluster-test-name">${escapeHtml(t.title)}</span>`)
                .join('')}
              ${cluster.tests.length > 3 ? `<span class="cluster-more">+${cluster.tests.length - 3} more</span>` : ''}
            </div>
            <div class="cluster-files">
              ${affectedFiles
                .slice(0, 2)
                .map((f) => `<span class="cluster-file">${escapeHtml(f)}</span>`)
                .join('')}
              ${affectedFiles.length > 2 ? `<span class="cluster-more">+${affectedFiles.length - 2} files</span>` : ''}
            </div>
          </div>
        `;
          })
          .join('')}
      </div>
    </div>
  `
      : '';

  // Generate attention required section
  const hasAttentionItems =
    newFailures.length > 0 || fixedTests.length > 0 || regressions.length > 0 || flaky > 0;
  const attentionHtml = hasAttentionItems
    ? `
    <div class="overview-section attention-section">
      <div class="section-header">
        <span class="section-icon">⚡</span>
        <span class="section-title">Attention Required</span>
      </div>
      <div class="attention-grid">
        ${
          newFailures.length > 0
            ? `
          <div class="attention-card critical" onclick="filterTests('new-failure'); switchView('tests');">
            <div class="attention-value">${newFailures.length}</div>
            <div class="attention-label">New Failures</div>
            <div class="attention-desc">Tests that were passing, now failing</div>
          </div>
        `
            : ''
        }
        ${
          regressions.length > 0
            ? `
          <div class="attention-card warning" onclick="filterTests('regression'); switchView('tests');">
            <div class="attention-value">${regressions.length}</div>
            <div class="attention-label">Performance Regressions</div>
            <div class="attention-desc">Tests that got slower</div>
          </div>
        `
            : ''
        }
        ${
          flaky > 0
            ? `
          <div class="attention-card warning" onclick="filterTests('flaky'); switchView('tests');">
            <div class="attention-value">${flaky}</div>
            <div class="attention-label">Flaky Tests</div>
            <div class="attention-desc">Tests with unstable results</div>
          </div>
        `
            : ''
        }
        ${
          fixedTests.length > 0
            ? `
          <div class="attention-card success" onclick="filterTests('fixed'); switchView('tests');">
            <div class="attention-value">${fixedTests.length}</div>
            <div class="attention-label">Fixed Tests</div>
            <div class="attention-desc">Tests that were failing, now passing</div>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `
    : '';

  return `
    <!-- Hero Stats Row -->
    <div class="hero-stats">
      <div class="hero-stat-card health ${healthClass}">
        <div class="health-gauge">
          <svg class="health-ring" viewBox="0 0 100 100">
            <circle class="health-ring-bg" cx="50" cy="50" r="42" />
            <circle class="health-ring-fill" cx="50" cy="50" r="42" 
                    stroke-dasharray="${suiteHealthScore * 2.64} 264"
                    stroke-dashoffset="0" />
          </svg>
          <div class="health-score">
            <span class="health-grade">${healthGrade}</span>
            <span class="health-value">${suiteHealthScore}</span>
          </div>
        </div>
        <div class="hero-stat-info">
          <div class="hero-stat-label">Suite Health</div>
          <div class="health-breakdown">
            <span>Pass: ${passRate}%</span>
            <span>Stability: ${Math.round(flakinessScore)}%</span>
            <span>Perf: ${Math.round(performanceScore)}%</span>
          </div>
        </div>
      </div>

      <div class="hero-stat-card">
        <div class="hero-stat-main">
          <div class="hero-stat-value">${passRate}%</div>
          ${passRateDelta !== 0 ? `<div class="hero-stat-delta ${passRateDelta > 0 ? 'positive' : 'negative'}">${passRateDelta > 0 ? '↑' : '↓'}${Math.abs(passRateDelta)}%</div>` : ''}
        </div>
        <div class="hero-stat-label">Pass Rate</div>
        <div class="hero-stat-detail">${passed}/${total} tests</div>
      </div>

      <div class="hero-stat-card">
        <div class="hero-stat-main">
          <div class="hero-stat-value">${formatDuration(totalDuration)}</div>
          ${durationDeltaPercent !== 0 ? `<div class="hero-stat-delta ${durationDeltaPercent < 0 ? 'positive' : 'negative'}">${durationDeltaPercent < 0 ? '↓' : '↑'}${Math.abs(durationDeltaPercent)}%</div>` : ''}
        </div>
        <div class="hero-stat-label">Duration</div>
        <div class="hero-stat-detail">Total run time</div>
      </div>

      <div class="hero-stat-card mini-comparison">
        <div class="mini-bars">
          <div class="mini-bar-row clickable" onclick="filterByStatus('passed')" title="View passed tests" role="button" tabindex="0">
            <span class="mini-bar-label">Passed</span>
            <div class="mini-bar-track">
              <div class="mini-bar passed" style="width: ${((passed / Math.max(total, 1)) * 100).toFixed(1)}%"></div>
            </div>
            <span class="mini-bar-value">${passed}</span>
          </div>
          <div class="mini-bar-row clickable" onclick="filterByStatus('failed')" title="View failed tests" role="button" tabindex="0">
            <span class="mini-bar-label">Failed</span>
            <div class="mini-bar-track">
              <div class="mini-bar failed" style="width: ${((failed / Math.max(total, 1)) * 100).toFixed(1)}%"></div>
            </div>
            <span class="mini-bar-value">${failed}</span>
          </div>
          <div class="mini-bar-row clickable" onclick="filterByStatus('skipped')" title="View skipped tests" role="button" tabindex="0">
            <span class="mini-bar-label">Skipped</span>
            <div class="mini-bar-track">
              <div class="mini-bar skipped" style="width: ${((skipped / Math.max(total, 1)) * 100).toFixed(1)}%"></div>
            </div>
            <span class="mini-bar-value">${skipped}</span>
          </div>
          ${
            failed > 0
              ? `<div class="mini-bar-row leakage-rate-row" title="Defect leakage: failures with no linked issue">
            <span class="mini-bar-label">🐛 Defects</span>
            <div class="mini-bar-track">
              ${leakagePct !== null ? `<div class="mini-bar defects" style="width: ${leakagePct}%"></div>` : ''}
            </div>
            <span class="mini-bar-value leakage-value">${
              untrackedFailures === 0
                ? '✓ All tracked'
                : `${untrackedFailures}/${failedTests.length} untracked (${leakagePct}%)`
            }</span>
          </div>`
              : ''
          }
        </div>
      </div>
    </div>

    ${attentionHtml}

    ${clustersHtml}

    <!-- Quick Insights -->
    <div class="overview-section">
      <div class="section-header">
        <span class="section-icon">💡</span>
        <span class="section-title">Quick Insights</span>
      </div>
      <div class="insights-grid">
        ${
          slowestTest
            ? `
          <div class="insight-card insight-card-wide">
            <div class="insight-icon">🐢</div>
            <div class="insight-content">
              <div class="insight-label">Slowest Tests (p90)</div>
              <ol class="slowest-tests-list">
                ${slowestTests
                  .map((t) => {
                    const p90 = t.p90Duration ?? null;
                    const overBudget =
                      durationBudgetMs !== undefined && p90 !== null && p90 > durationBudgetMs;
                    return `<li class="slowest-tests-item" onclick="selectTest('${sanitizeId(t.testId)}'); switchView('tests');" title="${escapeHtml(t.title)}">
                      <span class="slowest-tests-title">${escapeHtml(t.title)}</span>
                      <span class="slowest-tests-meta">
                        ${p90 !== null ? `<span class="slowest-p90">p90: ${formatDuration(p90)}</span>` : ''}
                        <span class="slowest-last">last: ${formatDuration(t.duration)}</span>
                        ${overBudget ? '<span class="budget-exceeded-badge">Over budget</span>' : ''}
                      </span>
                    </li>`;
                  })
                  .join('')}
              </ol>
            </div>
          </div>
        `
            : ''
        }
        ${
          mostFlakyTest && mostFlakyTest.flakinessScore && mostFlakyTest.flakinessScore > 0
            ? `
          <div class="insight-card" onclick="selectTest('${sanitizeId(mostFlakyTest.testId)}'); switchView('tests');">
            <div class="insight-icon">⚡</div>
            <div class="insight-content">
              <div class="insight-label">Most Flaky Test</div>
              <div class="insight-title">${escapeHtml(mostFlakyTest.title)}</div>
              <div class="insight-value">${Math.round(mostFlakyTest.flakinessScore * 100)}% failure rate</div>
            </div>
          </div>
        `
            : ''
        }
        <div class="insight-card clickable" onclick="switchView('tests')" title="View all tests">
          <div class="insight-icon">📊</div>
          <div class="insight-content">
            <div class="insight-label">Test Distribution</div>
            <div class="insight-mini-stats">
              <span class="mini-stat"><span class="dot passed"></span>${passed} passed</span>
              <span class="mini-stat"><span class="dot failed"></span>${failed} failed</span>
              <span class="mini-stat"><span class="dot skipped"></span>${skipped} skipped</span>
            </div>
          </div>
        </div>
        <div class="insight-card clickable" onclick="switchView('trends')" title="View trends">
          <div class="insight-icon">📈</div>
          <div class="insight-content">
            <div class="insight-label">Pass Rate Trend</div>
            <div class="mini-sparkline">
              ${
                passRateHistory.length > 0
                  ? passRateHistory
                      .map(
                        (h, i) => `
                <div class="spark-col" title="Run ${i + 1}: ${h.rate}%">
                  <div class="spark-bar" style="height: ${h.rate}%"></div>
                </div>
              `,
                      )
                      .join('')
                  : '<span class="no-data">No history available</span>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
