import { AttentionSets } from '../card-generator';
import type { TestResultData } from '../../types';
import { sanitizeId, escapeHtml, formatDuration } from '../../utils';

/**
 * Generate file tree structure for sidebar
 */
export function generateFileTree(results: TestResultData[]): string {
  const fileGroups = new Map<string, { passed: number; failed: number; total: number }>();

  for (const test of results) {
    const file = test.file;
    if (!fileGroups.has(file)) {
      fileGroups.set(file, { passed: 0, failed: 0, total: 0 });
    }
    const group = fileGroups.get(file)!;
    group.total++;
    if (test.status === 'passed') group.passed++;
    else if (test.status === 'failed' || test.status === 'timedOut') group.failed++;
  }

  return Array.from(fileGroups.entries())
    .map(([file, stats]) => {
      const statusClass = stats.failed > 0 ? 'has-failures' : 'all-passed';
      const fileName = file.split(/[\\/]/).pop() || file;
      return `
      <div class="file-tree-item ${statusClass}" data-file="${escapeHtml(file)}" onclick="filterByFile('${escapeHtml(file)}')">
        <span class="file-tree-icon">📄</span>
        <span class="file-tree-name" title="${escapeHtml(file)}">${escapeHtml(fileName)}</span>
        <span class="file-tree-stats">
          ${stats.passed > 0 ? `<span class="file-stat passed">${stats.passed}</span>` : ''}
          ${stats.failed > 0 ? `<span class="file-stat failed">${stats.failed}</span>` : ''}
        </span>
      </div>
    `;
    })
    .join('');
}

/**
 * Generate test list items for the main panel
 */
export function generateTestListItems(
  results: TestResultData[],
  showTraceSection: boolean,
  attention: AttentionSets = { newFailures: new Set(), regressions: new Set(), fixed: new Set() },
  projectDataAttrs: string = '',
): string {
  return results
    .map((test) => {
      const cardId = sanitizeId(test.testId);
      const statusClass =
        test.status === 'passed' ? 'passed' : test.status === 'skipped' ? 'skipped' : 'failed';
      const isFlaky = test.flakinessScore !== undefined && test.flakinessScore >= 0.3;
      const isSlow = test.performanceTrend?.startsWith('↑') || false;
      const isNew = test.flakinessIndicator?.includes('New') || false;

      // Attention states from comparison
      const isNewFailure = attention.newFailures.has(test.testId);
      const isRegression = attention.regressions.has(test.testId);
      const isFixed = attention.fixed.has(test.testId);

      // Determine stability badge
      let stabilityBadge = '';
      if (test.stabilityScore) {
        const grade = test.stabilityScore.grade;
        const score = test.stabilityScore.overall;
        const gradeClass =
          score >= 90
            ? 'grade-a'
            : score >= 80
              ? 'grade-b'
              : score >= 70
                ? 'grade-c'
                : score >= 60
                  ? 'grade-d'
                  : 'grade-f';
        stabilityBadge = `<span class="stability-badge ${gradeClass}">${grade}</span>`;
      }

      const statusLabel =
        test.status === 'passed' ? 'Passed' : test.status === 'skipped' ? 'Skipped' : 'Failed';
      return `
      <div class="test-list-item ${statusClass}"
           id="list-item-${cardId}"
           role="listitem"
           aria-label="${escapeHtml(test.title)} - ${statusLabel}"
           data-testid="${escapeHtml(test.testId)}"
           data-status="${test.status}"
           data-flaky="${isFlaky}"
           data-slow="${isSlow}"
           data-new="${isNew}"
           data-new-failure="${isNewFailure}"
           data-regression="${isRegression}"
           data-fixed="${isFixed}"
           data-file="${escapeHtml(test.file)}"
           data-grade="${test.stabilityScore?.grade || ''}"
           data-tags="${test.tags?.join(',') || ''}"
           data-suite="${test.suite || ''}"
           data-suites="${test.suites?.join(',') || ''}"
           data-project="${test.project || ''}"
           data-browser="${escapeHtml(test.browser || '')}"
           ${projectDataAttrs}
           ${
             test.customMetadata
               ? Object.entries(test.customMetadata)
                   .map(
                     ([k, v]) =>
                       `data-custom-${escapeHtml(k.toLowerCase().replace(/[^a-z0-9]/g, '-'))}="${escapeHtml(v)}"`,
                   )
                   .join(' ')
               : ''
           }
           onclick="selectTest('${cardId}')"
           tabindex="0"
           onkeydown="if(event.key==='Enter')selectTest('${cardId}')">
        <div class="test-item-status" aria-hidden="true">
          <div class="status-dot ${statusClass}"></div>
        </div>
        <div class="test-item-info">
          <div class="test-item-title">${escapeHtml(test.title)}</div>
          <div class="test-item-file">${escapeHtml(test.file)}</div>
        </div>
        <div class="test-item-meta">
          ${isNewFailure ? '<span class="test-item-badge new-failure">New Failure</span>' : ''}
          ${isRegression ? '<span class="test-item-badge regression">Regression</span>' : ''}
          ${isFixed ? '<span class="test-item-badge fixed">Fixed</span>' : ''}
          ${stabilityBadge}
          <span class="test-item-duration">${formatDuration(test.duration)}</span>
          ${isFlaky ? '<span class="test-item-badge flaky">Flaky</span>' : ''}
          ${isSlow ? '<span class="test-item-badge slow">Slow</span>' : ''}
          ${isNew ? '<span class="test-item-badge new">New</span>' : ''}
        </div>
      </div>
    `;
    })
    .join('');
}
