/**
 * HTML Generator - Main orchestrator for HTML report generation
 * Coordinates all other generators and generates the complete HTML document
 *
 * REDESIGNED: Modern app-shell layout with sidebar, top bar, and master-detail view
 */

import type {
  TestResultData,
  TestHistory,
  RunComparison,
  RunSnapshotFile,
  SmartReporterOptions,
  FailureCluster,
  CIInfo,
  ReportMetadata,
  CustomMetadataField,
  SavedView,
} from '../types';
import { formatDuration, escapeHtml, sanitizeId } from '../utils';
import { AxeAnnotationAnalyzer } from '../analyzers/axe-annotation-analyzer';
import { generateTrendChart } from './chart-generator';
import { generateGroupedTests, generateTestCard, AttentionSets } from './card-generator';
import { generateGallery } from './gallery-generator';
import { generateComparison } from './comparison-generator';
// Issue #13: Inline trace viewer integration
import {
  generateJSZipScript,
  generateTraceViewerHtml,
  generateTraceViewerScript,
} from './trace-viewer-generator';
import { generateStyles } from './html/styles';
import { generateScripts } from './html/scripts';
import { generateFileTree, generateTestListItems } from './html/sidebar';
import { generateOverviewContent } from './html/overview';

export interface HtmlGeneratorData {
  results: TestResultData[];
  history: TestHistory;
  startTime: number;
  options: SmartReporterOptions;
  comparison?: RunComparison;
  historyRunSnapshots?: Record<string, RunSnapshotFile>;
  failureClusters?: FailureCluster[];
  ciInfo?: CIInfo;
  reportMetadata?: ReportMetadata;
  customFields?: CustomMetadataField[];
  savedViews?: SavedView[];
}

/** JSON safe inside any HTML `<script>...</script>` body (incl. `type="application/json"`). */
function escapeJsonForHtmlScript(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function generateHtml(data: HtmlGeneratorData): string {
  const {
    results,
    history,
    startTime,
    options,
    comparison,
    historyRunSnapshots,
    failureClusters,
    ciInfo,
    reportMetadata,
    customFields,
    savedViews,
  } = data;

  const totalDuration = Date.now() - startTime;

  // Issue #17 & #16: Use outcome-based counting for accurate stats
  // - Flaky tests (outcome='flaky') passed on retry - count as passed AND flaky
  // - Expected failures (outcome='expected', expectedStatus='failed') - count as passed
  // - Unexpected failures (outcome='unexpected') - count as failed
  const passed = results.filter(
    (r) =>
      r.status === 'passed' ||
      r.outcome === 'expected' || // Expected failures behaved as expected
      r.outcome === 'flaky', // Flaky tests passed on retry
  ).length;
  const failed = results.filter(
    (r) => r.outcome === 'unexpected' && (r.status === 'failed' || r.status === 'timedOut'),
  ).length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  // Flaky: tests that passed on retry (outcome='flaky')
  // This is more accurate than flakinessScore which is history-based
  const flaky = results.filter((r) => r.outcome === 'flaky').length;
  const slow = results.filter((r) => r.performanceTrend?.startsWith('↑')).length;
  const newTests = results.filter((r) => r.flakinessIndicator?.includes('New')).length;
  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Calculate stability grade counts
  const gradeA = results.filter((r) => r.stabilityScore && r.stabilityScore.grade === 'A').length;
  const gradeB = results.filter((r) => r.stabilityScore && r.stabilityScore.grade === 'B').length;
  const gradeC = results.filter((r) => r.stabilityScore && r.stabilityScore.grade === 'C').length;
  const gradeD = results.filter((r) => r.stabilityScore && r.stabilityScore.grade === 'D').length;
  const gradeF = results.filter((r) => r.stabilityScore && r.stabilityScore.grade === 'F').length;

  // Build attention sets from comparison data
  const attentionSets: AttentionSets = {
    newFailures: new Set(comparison?.changes.newFailures.map((t) => t.testId) ?? []),
    regressions: new Set(comparison?.changes.regressions.map((t) => t.testId) ?? []),
    fixed: new Set(comparison?.changes.fixedTests.map((t) => t.testId) ?? []),
  };
  const newFailuresCount = attentionSets.newFailures.size;
  const regressionsCount = attentionSets.regressions.size;
  const fixedCount = attentionSets.fixed.size;
  const hasAttention = newFailuresCount > 0 || regressionsCount > 0 || fixedCount > 0;

  // Extract unique tags and suites from all tests
  const allTags = new Map<string, number>(); // tag -> count
  const allSuites = new Map<string, number>(); // suite -> count
  for (const r of results) {
    if (r.tags) {
      for (const tag of r.tags) {
        allTags.set(tag, (allTags.get(tag) || 0) + 1);
      }
    }
    if (r.suite) {
      allSuites.set(r.suite, (allSuites.get(r.suite) || 0) + 1);
    }
  }
  // Sort tags and suites by count (descending)
  const sortedTags = [...allTags.entries()].sort((a, b) => b[1] - a[1]);
  const sortedSuites = [...allSuites.entries()].sort((a, b) => b[1] - a[1]);

  // --- Phase 1: Embed report metadata as JSON (includes savedViews for Phase 4) ---
  const reportMetadataJson = JSON.stringify({
    ...(reportMetadata ?? {}),
    savedViews: savedViews ?? [],
  })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  // --- Phase 2: Compute unique Playwright project values for BUILD chips ---
  const playwrightProjectCounts = new Map<string, number>();
  for (const r of results) {
    if (r.project) {
      playwrightProjectCounts.set(r.project, (playwrightProjectCounts.get(r.project) || 0) + 1);
    }
  }
  const sortedPwProjects = [...playwrightProjectCounts.entries()].sort((a, b) => b[1] - a[1]);

  // --- Phase 7: Custom metadata filter chips (scope: 'test' fields only) ---
  const customFilterFields = (customFields || []).filter((f) => f.scope === 'test');
  const customFieldValueMaps = customFilterFields
    .map((field) => {
      const safeKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const observed = new Set<string>();
      for (const r of results) {
        const val = r.customMetadata?.[field.key];
        if (val !== undefined && val !== null && val !== '') observed.add(val);
      }
      return { field, safeKey, values: [...observed].sort() };
    })
    .filter((x) => x.values.length > 0);

  // --- Phase 2: Compute unique browser values for browser filter chips ---
  const browserCounts = new Map<string, number>();
  for (const r of results) {
    if (r.browser) {
      browserCounts.set(r.browser, (browserCounts.get(r.browser) || 0) + 1);
    }
  }
  const uniqueBrowsers = [...browserCounts.keys()].sort();

  // --- Phase 2: Project + build data attributes injected on every test element ---
  // Same value on all tests within a single run — enables branch/env/release filtering
  const projectDataAttrs = [
    reportMetadata?.project?.org ? `data-org="${escapeHtml(reportMetadata.project.org)}"` : '',
    reportMetadata?.project?.team ? `data-team="${escapeHtml(reportMetadata.project.team)}"` : '',
    reportMetadata?.project?.app ? `data-app="${escapeHtml(reportMetadata.project.app)}"` : '',
    reportMetadata?.build?.branch ? `data-branch="${escapeHtml(reportMetadata.build.branch)}"` : '',
    reportMetadata?.build?.environment
      ? `data-env="${escapeHtml(reportMetadata.build.environment)}"`
      : '',
    reportMetadata?.build?.releaseVersion
      ? `data-release="${escapeHtml(reportMetadata.build.releaseVersion)}"`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Sort results: attention items first (new failures, regressions, fixed), then rest
  const sortedResults = [...results].sort((a, b) => {
    const aIsAttention =
      attentionSets.newFailures.has(a.testId) ||
      attentionSets.regressions.has(a.testId) ||
      attentionSets.fixed.has(a.testId);
    const bIsAttention =
      attentionSets.newFailures.has(b.testId) ||
      attentionSets.regressions.has(b.testId) ||
      attentionSets.fixed.has(b.testId);

    if (aIsAttention && !bIsAttention) return -1;
    if (!aIsAttention && bIsAttention) return 1;

    // Within attention items, prioritize: new failures > regressions > fixed
    if (aIsAttention && bIsAttention) {
      const aPriority = attentionSets.newFailures.has(a.testId)
        ? 0
        : attentionSets.regressions.has(a.testId)
          ? 1
          : 2;
      const bPriority = attentionSets.newFailures.has(b.testId)
        ? 0
        : attentionSets.regressions.has(b.testId)
          ? 1
          : 2;
      return aPriority - bPriority;
    }

    return 0;
  });

  // Issue #19: Strip large binary data from embedded JSON to prevent RangeError with large test suites
  // The HTML already renders screenshots/traces in cards and gallery, so JavaScript doesn't need them
  const lightenedResults = results.map((test) => {
    // Destructure to exclude large fields
    const { screenshot, traceData, networkLogs, attachments, ...rest } = test;
    // Keep attachment metadata but remove base64 screenshot data
    const lightenedAttachments = attachments
      ? {
          screenshots:
            attachments.screenshots?.map((s) =>
              s.startsWith('data:') ? '[base64-screenshot]' : s,
            ) || [],
          videos: attachments.videos || [],
          traces: attachments.traces || [],
          custom:
            attachments.custom?.map((c) => ({
              ...c,
              body: c.body ? '[base64-content]' : undefined,
            })) || [],
        }
      : undefined;
    return {
      ...rest,
      // Keep file paths but not base64 data
      screenshot: screenshot?.startsWith('data:') ? '[base64-screenshot]' : screenshot,
      tracePath: test.tracePath, // Keep path for trace viewer links
      attachments: lightenedAttachments,
    };
  });

  const testsJson = escapeJsonForHtmlScript(JSON.stringify(lightenedResults));

  // Screenshots data for ZIP download — keep base64 data URIs (stripped from lightenedResults)
  // Only include non-passed tests to keep the payload small
  const screenshotsMap: Record<string, string[]> = {};
  for (const r of results) {
    const shots = (r.attachments?.screenshots ?? []).filter((s) => s.startsWith('data:'));
    if (shots.length > 0) screenshotsMap[r.testId] = shots;
  }
  const screenshotsDataJson = escapeJsonForHtmlScript(JSON.stringify(screenshotsMap));

  // Network logs data for HAR export — stripped from lightenedResults
  const networkLogsMap: Record<string, (typeof results)[0]['networkLogs']> = {};
  for (const r of results) {
    if (r.networkLogs && r.networkLogs.entries.length > 0) {
      networkLogsMap[r.testId] = r.networkLogs;
    }
  }
  const networkLogsDataJson = escapeJsonForHtmlScript(JSON.stringify(networkLogsMap));

  // Feature flags
  const showGallery = options.enableGalleryView !== false;
  const showComparison = options.enableComparison !== false && !!comparison;
  const cspSafe = options.cspSafe === true;
  const enableTraceViewer = options.enableTraceViewer !== false;
  const showTraceSection = enableTraceViewer;
  const enableHistoryDrilldown = options.enableHistoryDrilldown === true;
  // Issue #19: Also lighten history snapshots to prevent RangeError
  const lightenedHistorySnapshots =
    enableHistoryDrilldown && historyRunSnapshots
      ? Object.fromEntries(
          Object.entries(historyRunSnapshots).map(([runId, snapshot]) => [
            runId,
            {
              ...snapshot,
              tests: Object.fromEntries(
                Object.entries(snapshot.tests || {}).map(([testId, testSnap]) => [
                  testId,
                  {
                    ...testSnap,
                    attachments: testSnap.attachments
                      ? {
                          screenshots:
                            testSnap.attachments.screenshots?.map((s) =>
                              s.startsWith('data:') ? '[base64-screenshot]' : s,
                            ) || [],
                          videos: testSnap.attachments.videos || [],
                          traces: testSnap.attachments.traces || [],
                          custom:
                            testSnap.attachments.custom?.map((c) => ({
                              ...c,
                              body: c.body ? '[base64-content]' : undefined,
                            })) || [],
                        }
                      : undefined,
                  },
                ]),
              ),
            },
          ]),
        )
      : {};
  const historyRunSnapshotsJson = escapeJsonForHtmlScript(
    enableHistoryDrilldown ? JSON.stringify(lightenedHistorySnapshots) : '{}',
  );

  // Google Fonts links (only included when not in CSP-safe mode)
  const fontLinks = cspSafe
    ? ''
    : `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">`;

  const statsData = escapeJsonForHtmlScript(
    JSON.stringify({
      passed,
      failed,
      skipped,
      flaky,
      slow,
      newTests,
      total,
      passRate,
      gradeA,
      gradeB,
      gradeC,
      gradeD,
      gradeF,
      totalDuration,
      summaries: history.summaries ?? [],
    }),
  );

  // Accessibility analysis (axe-core annotations)
  const a11yAnalysis = new AxeAnnotationAnalyzer().analyze(results, history.summaries ?? []);

  // Reporter options for Settings UI (embedded so the Settings page shows current values)
  const reporterOptionsJson = escapeJsonForHtmlScript(
    JSON.stringify({
      enableAIRecommendations: options.enableAIRecommendations ?? true,
      lmStudioBaseUrl: options.lmStudioBaseUrl ?? '',
      lmStudioModel: options.lmStudioModel ?? '',
      smartReporterMaxTokens: options.smartReporterMaxTokens ?? 512,
      maxHistoryRuns: options.maxHistoryRuns ?? 10,
      filterPwApiSteps: options.filterPwApiSteps ?? false,
      enableHistoryDrilldown: options.enableHistoryDrilldown ?? false,
      enableTraceViewer: options.enableTraceViewer ?? true,
      enableNetworkLogs: options.enableNetworkLogs ?? true,
      stabilityThreshold: options.stabilityThreshold ?? 70,
      retryFailureThreshold: options.retryFailureThreshold ?? 3,
    }),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Test Report</title>${fontLinks}
  <style>
${generateStyles(passRate, cspSafe)}
  </style>
  <!-- Phase 1: Report metadata for client-side project/build filtering -->
  <script id="report-metadata" type="application/json">${reportMetadataJson}</script>
</head>
<body>
  <!-- Skip to main content for accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- App Shell -->
  <div class="app-shell" role="application">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <button class="sidebar-toggle" onclick="toggleSidebar()" title="Toggle Sidebar (⌘B)" aria-label="Toggle sidebar navigation" aria-expanded="true" aria-controls="sidebar">
          <span class="hamburger-icon" aria-hidden="true">☰</span>
        </button>
        <div class="logo">
          <div class="logo-text">
            <span class="logo-title">Smart Reporter</span>
            <span class="logo-subtitle">Get your test results right.</span>
          </div>
        </div>
        ${(() => {
          // Phase 3: Project hierarchy breadcrumb — only rendered when metadata is set
          const parts: string[] = [];
          if (reportMetadata?.project?.org) parts.push(escapeHtml(reportMetadata.project.org));
          if (reportMetadata?.project?.team) parts.push(escapeHtml(reportMetadata.project.team));
          if (reportMetadata?.project?.app) parts.push(escapeHtml(reportMetadata.project.app));
          if (parts.length === 0) return '';
          const envLabel = reportMetadata?.build?.environment
            ? `<span class="project-breadcrumb-env">${escapeHtml(reportMetadata.build.environment)}</span>`
            : '';
          return `
        <nav class="project-breadcrumb" aria-label="Project context">
          ${parts
            .map(
              (p, i) =>
                `<span class="project-breadcrumb-item">${p}</span>${i < parts.length - 1 ? '<span class="project-breadcrumb-sep">/</span>' : ''}`,
            )
            .join('')}
          ${envLabel}
        </nav>`;
        })()}
        <nav class="breadcrumbs">
          <span class="breadcrumb active" data-view="tests" onclick="switchView('tests')" style="cursor:pointer">Tests</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb" id="breadcrumb-detail"></span>
        </nav>
      </div>
      <div class="top-bar-right">
        <button class="search-trigger" onclick="openSearch()" title="Search (⌘K)" aria-label="Search tests">
          <span class="search-icon-btn">🔍</span>
          <span class="search-label">Search...</span>
          <kbd class="search-kbd">⌘K</kbd>
        </button>
        <div class="timestamp">${new Date().toLocaleString()}</div>
        <div class="settings-dropdown" id="settingsDropdown">
          <button class="top-bar-icon-btn" onclick="toggleSettingsMenu()" title="Settings" aria-label="Settings" aria-haspopup="true" aria-expanded="false">
            &#9881;
          </button>
          <div class="settings-menu" role="menu">
            <button class="settings-menu-item" onclick="switchView('settings'); closeSettingsMenu()" role="menuitem"><span>⚙️</span> Settings</button>
            <div class="settings-menu-divider"></div>
            <div class="settings-menu-section">Theme</div>
            <button class="settings-menu-item theme-item" onclick="setTheme('system')" role="menuitem" data-theme="system"><span>💻</span> System</button>
            <button class="settings-menu-item theme-item" onclick="setTheme('light')" role="menuitem" data-theme="light"><span>☀️</span> Light</button>
            <button class="settings-menu-item theme-item" onclick="setTheme('dark')" role="menuitem" data-theme="dark"><span>🌙</span> Dark</button>
            <div class="settings-menu-divider"></div>
            <div class="settings-menu-section">Export</div>
            <button class="settings-menu-item" onclick="exportJSON(); closeSettingsMenu()" role="menuitem"><span>📄</span> JSON</button>
            <button class="settings-menu-item" onclick="exportCSV(); closeSettingsMenu()" role="menuitem"><span>📊</span> CSV</button>
            <button class="settings-menu-item" onclick="showSummaryExport(); closeSettingsMenu()" role="menuitem"><span>📋</span> Summary Card</button>
            <button class="settings-menu-item" onclick="downloadAllFailuresZip(); closeSettingsMenu()" role="menuitem"><span>📦</span> Failures ZIP</button>
          </div>
        </div>
      </div>
    </header>

    ${(() => {
      // Show footer when ciInfo is present (always, since we now populate node/OS/PW) OR when reportMetadata.build has values
      const build = reportMetadata?.build;
      const hasBuildMeta = build && Object.keys(build).length > 0;
      if (!ciInfo && !hasBuildMeta) return '';

      // Prefer reportMetadata.build values (config file takes priority over raw CI env vars)
      const branch = build?.branch || ciInfo?.branch;
      const commit = build?.commitSha || ciInfo?.commit;
      const buildId = build?.pipelineId || ciInfo?.buildId;
      const provider = build?.ciProvider || ciInfo?.provider || 'local';

      return `
    <!-- CI Environment Info Bar -->
    <div class="ci-info-bar">
      ${provider !== 'local' ? `<span class="ci-provider">${escapeHtml(provider.toUpperCase())}</span>` : ''}
      ${branch ? `<span class="ci-item"><span class="ci-label">Branch:</span> ${escapeHtml(branch)}</span>` : ''}
      ${commit ? `<span class="ci-item"><span class="ci-label">Commit:</span> ${escapeHtml(commit)}</span>` : ''}
      ${buildId ? `<span class="ci-item"><span class="ci-label">Build:</span> #${escapeHtml(buildId)}</span>` : ''}
      ${ciInfo?.nodeVersion ? `<span class="ci-item"><span class="ci-label">Node:</span> ${escapeHtml(ciInfo.nodeVersion)}</span>` : ''}
      ${ciInfo?.platform ? `<span class="ci-item"><span class="ci-label">OS:</span> ${escapeHtml(ciInfo.platform)}</span>` : ''}
      ${ciInfo?.playwrightVersion ? `<span class="ci-item"><span class="ci-label">PW:</span> ${escapeHtml(ciInfo.playwrightVersion)}</span>` : ''}
    </div>
    `;
    })()}

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

    <!-- Toast notifications container -->
    <div class="toast-container" id="toastContainer" aria-live="polite"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <!-- Progress Ring -->
      <div class="sidebar-progress">
        <div class="progress-ring-container clickable" onclick="switchView('tests')" title="View all tests" role="button" tabindex="0">
          <svg class="progress-ring" width="80" height="80">
            <circle class="progress-ring-bg" cx="40" cy="40" r="34"/>
            <circle class="progress-ring-fill" cx="40" cy="40" r="34"
                    stroke-dasharray="213.6"
                    stroke-dashoffset="${(213.6 - (213.6 * passRate) / 100).toFixed(1)}"/>
          </svg>
          <div class="progress-ring-value">${passRate}%</div>
        </div>
        <div class="progress-label">Pass Rate</div>
      </div>

      <!-- Quick Stats -->
      <div class="sidebar-stats" role="group" aria-label="Test statistics">
        <button class="mini-stat passed" onclick="filterTests('passed')" title="Passed tests" aria-label="${passed} passed tests - click to filter">
          <span class="mini-stat-value" id="stat-passed">${passed}</span>
          <span class="mini-stat-label">Passed</span>
        </button>
        <button class="mini-stat failed" onclick="filterTests('failed')" title="Failed tests" aria-label="${failed} failed tests - click to filter">
          <span class="mini-stat-value" id="stat-failed">${failed}</span>
          <span class="mini-stat-label">Failed</span>
        </button>
        <button class="mini-stat flaky" onclick="filterTests('flaky')" title="Flaky tests" aria-label="${flaky} flaky tests - click to filter">
          <span class="mini-stat-value" id="stat-flaky">${flaky}</span>
          <span class="mini-stat-label">Flaky</span>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" aria-label="Main navigation">
        <div class="nav-section-title" id="nav-section-label">Navigation</div>
        <div role="tablist" aria-labelledby="nav-section-label">
          <button class="nav-item active" data-view="overview" onclick="switchView('overview')" role="tab" aria-selected="true" aria-controls="view-overview">
            <span class="nav-icon" aria-hidden="true">📊</span>
            <span class="nav-label">Overview</span>
          </button>
          <button class="nav-item" data-view="tests" onclick="switchView('tests')" role="tab" aria-selected="false" aria-controls="view-tests">
            <span class="nav-icon" aria-hidden="true">🧪</span>
            <span class="nav-label">Tests</span>
            <span class="nav-badge" aria-label="${total} total tests">${total}</span>
          </button>
          <button class="nav-item" data-view="trends" onclick="switchView('trends')" role="tab" aria-selected="false" aria-controls="view-trends">
            <span class="nav-icon" aria-hidden="true">📈</span>
            <span class="nav-label">Trends</span>
          </button>
          ${
            showComparison
              ? `
          <button class="nav-item" data-view="comparison" onclick="switchView('comparison')" role="tab" aria-selected="false" aria-controls="view-comparison">
            <span class="nav-icon" aria-hidden="true">⚖️</span>
            <span class="nav-label">Comparison</span>
          </button>
          `
              : ''
          }
          ${
            showGallery
              ? `
          <button class="nav-item" data-view="gallery" onclick="switchView('gallery')" role="tab" aria-selected="false" aria-controls="view-gallery">
            <span class="nav-icon" aria-hidden="true">🖼️</span>
            <span class="nav-label">Gallery</span>
          </button>
          `
              : ''
          }
          ${
            a11yAnalysis.testedCount > 0
              ? `
          <button class="nav-item" data-view="accessibility" onclick="switchView('accessibility')" role="tab" aria-selected="false" aria-controls="view-accessibility">
            <span class="nav-icon" aria-hidden="true">♿</span>
            <span class="nav-label">Accessibility</span>
            ${a11yAnalysis.violatingCount > 0 ? `<span class="nav-badge nav-badge-error" aria-label="${a11yAnalysis.totalViolations} violation${a11yAnalysis.totalViolations !== 1 ? 's' : ''}">${a11yAnalysis.totalViolations}</span>` : ''}
          </button>
          `
              : ''
          }
        </div>
      </nav>

      <!-- Filters -->
      <div class="sidebar-filters" role="region" aria-label="Test filters">
        <div class="nav-section-title">Filters <button class="clear-filters-btn" onclick="clearAllFilters()" title="Clear all filters" aria-label="Clear all filters">✕</button></div>

        ${(() => {
          // Phase 2: PROJECT collapsible group
          const proj = reportMetadata?.project;
          if (!proj?.org && !proj?.team && !proj?.app) return '';

          const chips = [
            proj.org ? { dim: 'org', val: proj.org } : null,
            proj.team ? { dim: 'team', val: proj.team } : null,
            proj.app ? { dim: 'app', val: proj.app } : null,
          ]
            .filter(Boolean)
            .map(
              (c) =>
                `<button class="filter-chip project-chip" data-filter="${c!.dim}-${escapeHtml(c!.val)}" data-group="context-project" onclick="toggleFilter(this)" aria-pressed="false" title="${c!.dim}: ${escapeHtml(c!.val)}">${escapeHtml(c!.val)}</button>`,
            )
            .join('');

          return `
        <div class="filter-group filter-group-collapsible" data-group="context-project" role="group" aria-label="Project filters">
          <div class="filter-group-header" onclick="toggleFilterGroup('context-project')" aria-expanded="true" aria-controls="filter-body-context-project">
            <span class="filter-group-title">Project</span>
            <span class="filter-group-chevron" aria-hidden="true">▾</span>
            <span class="filter-group-badge" id="context-project-badge" style="display:none" aria-label="active filters">0</span>
          </div>
          <div class="filter-group-body" id="filter-body-context-project">
            <div class="filter-chips project-chips" role="group" aria-label="Project filter chips">
              ${chips}
            </div>
          </div>
        </div>`;
        })()}

        ${(() => {
          // Phase 2: BUILD collapsible group
          const build = reportMetadata?.build;
          const hasBuildInfo = build && Object.keys(build).length > 0;
          const hasPwProjects = sortedPwProjects.length > 1; // only show chip group when multiple projects exist

          // History-based branch/env/release chips — only render when ≥2 distinct values appear across runs
          const historyBranches = [
            ...new Set(
              (history.summaries ?? [])
                .map((s) => s.metadata?.build?.branch)
                .filter((b): b is string => Boolean(b)),
            ),
          ];
          const historyEnvs = [
            ...new Set(
              (history.summaries ?? [])
                .map((s) => s.metadata?.build?.environment)
                .filter((e): e is string => Boolean(e)),
            ),
          ];
          const historyReleases = [
            ...new Set(
              (history.summaries ?? [])
                .map((s) => s.metadata?.build?.releaseVersion)
                .filter((r): r is string => Boolean(r)),
            ),
          ];
          const hasHistoryBranches = historyBranches.length >= 2;
          const hasHistoryEnvs = historyEnvs.length >= 2;
          const hasHistoryReleases = historyReleases.length >= 2;
          const hasBrowserChips = uniqueBrowsers.length >= 2;

          if (
            !hasBuildInfo &&
            !hasPwProjects &&
            !hasHistoryBranches &&
            !hasHistoryEnvs &&
            !hasHistoryReleases &&
            !hasBrowserChips
          )
            return '';

          // Info rows for single-value build dimensions
          const infoRows = [
            build?.environment
              ? `<div class="filter-meta-row"><span class="filter-meta-label">Env</span><span class="filter-meta-value">${escapeHtml(build.environment)}</span></div>`
              : '',
            build?.branch
              ? `<div class="filter-meta-row"><span class="filter-meta-label">Branch</span><span class="filter-meta-value">${escapeHtml(build.branch)}</span></div>`
              : '',
            build?.prNumber
              ? `<div class="filter-meta-row"><span class="filter-meta-label">PR</span><span class="filter-meta-value">#${escapeHtml(build.prNumber)}</span></div>`
              : '',
            build?.commitSha
              ? `<div class="filter-meta-row"><span class="filter-meta-label">Commit</span><span class="filter-meta-value filter-meta-mono">${escapeHtml(build.commitSha)}</span></div>`
              : '',
            build?.pipelineId
              ? `<div class="filter-meta-row"><span class="filter-meta-label">Pipeline</span><span class="filter-meta-value filter-meta-mono">#${escapeHtml(build.pipelineId)}</span></div>`
              : '',
            build?.releaseVersion
              ? `<div class="filter-meta-row"><span class="filter-meta-label">Release</span><span class="filter-meta-value">${escapeHtml(build.releaseVersion)}</span></div>`
              : '',
          ]
            .filter(Boolean)
            .join('');

          // Browser chips — only when ≥2 distinct browsers
          const browserChips = hasBrowserChips
            ? `<div class="filter-group-sub-title">Browser</div>
            <div class="filter-chips" role="group" aria-label="Browser filter chips">
              ${uniqueBrowsers
                .map(
                  (b) =>
                    `<button class="filter-chip browser-chip" data-filter="browser-${escapeHtml(b)}" data-group="context-build" onclick="toggleFilter(this)" aria-pressed="false">${escapeHtml(b)}</button>`,
                )
                .join('')}
            </div>`
            : '';

          // Playwright project chips — only when multiple projects
          const pwProjectChips = hasPwProjects
            ? `<div class="filter-group-sub-title">Playwright Project</div>
            <div class="filter-chips" role="group" aria-label="Playwright project filter chips">
              ${sortedPwProjects
                .map(
                  ([proj, count]) =>
                    `<button class="filter-chip pwproject-chip" data-filter="pwproject-${escapeHtml(proj)}" data-group="context-build" data-pwproject="${escapeHtml(proj)}" onclick="toggleFilter(this)" aria-pressed="false" title="${escapeHtml(proj)} (${count} tests)">${escapeHtml(proj)} (${count})</button>`,
                )
                .join('')}
            </div>`
            : '';

          // History branch chips — filter Tests tab and Trends chart bars
          const branchChips = hasHistoryBranches
            ? `<div class="filter-group-sub-title">Branch</div>
            <div class="filter-chips" role="group" aria-label="Branch filter chips">
              ${historyBranches
                .map(
                  (b) =>
                    `<button class="filter-chip branch-chip" data-filter="branch-${escapeHtml(b)}" data-group="context-build" onclick="toggleFilter(this)" aria-pressed="false">${escapeHtml(b)}</button>`,
                )
                .join('')}
            </div>`
            : '';

          // History environment chips — filter Tests tab and Trends chart bars
          const envChips = hasHistoryEnvs
            ? `<div class="filter-group-sub-title">Environment</div>
            <div class="filter-chips" role="group" aria-label="Environment filter chips">
              ${historyEnvs
                .map(
                  (e) =>
                    `<button class="filter-chip env-chip" data-filter="env-${escapeHtml(e)}" data-group="context-build" onclick="toggleFilter(this)" aria-pressed="false">${escapeHtml(e)}</button>`,
                )
                .join('')}
            </div>`
            : '';

          // History release version chips — only when ≥2 distinct release versions
          const releaseChips = hasHistoryReleases
            ? `<div class="filter-group-sub-title">Release</div>
            <div class="filter-chips" role="group" aria-label="Release filter chips">
              ${historyReleases
                .map(
                  (r) =>
                    `<button class="filter-chip release-chip" data-filter="release-${escapeHtml(r)}" data-group="context-build" onclick="toggleFilter(this)" aria-pressed="false">${escapeHtml(r)}</button>`,
                )
                .join('')}
            </div>`
            : '';

          if (
            !infoRows &&
            !browserChips &&
            !pwProjectChips &&
            !branchChips &&
            !envChips &&
            !releaseChips
          )
            return '';

          return `
        <div class="filter-group filter-group-collapsible" data-group="context-build" role="group" aria-label="Build filters">
          <div class="filter-group-header" onclick="toggleFilterGroup('context-build')" aria-expanded="true" aria-controls="filter-body-context-build">
            <span class="filter-group-title">Build</span>
            <span class="filter-group-chevron" aria-hidden="true">▾</span>
            <span class="filter-group-badge" id="context-build-badge" style="display:none" aria-label="active filters">0</span>
          </div>
          <div class="filter-group-body" id="filter-body-context-build">
            ${infoRows}
            ${browserChips}
            ${pwProjectChips}
            ${branchChips}
            ${envChips}
            ${releaseChips}
          </div>
        </div>`;
        })()}

        ${
          customFieldValueMaps.length > 0
            ? `
        <div class="filter-group filter-group-collapsible" data-group="context-custom" role="group" aria-label="Custom filters">
          <div class="filter-group-header" onclick="toggleFilterGroup('context-custom')" aria-expanded="true" aria-controls="filter-body-context-custom">
            <span class="filter-group-title">Custom</span>
            <span class="filter-group-chevron" aria-hidden="true">▾</span>
            <span class="filter-group-badge" id="context-custom-badge" style="display:none" aria-label="active filters">0</span>
          </div>
          <div class="filter-group-body" id="filter-body-context-custom">
            ${customFieldValueMaps
              .map(
                ({ field, safeKey, values }) => `
            <div class="filter-group-sub-title">${escapeHtml(field.label)}</div>
            <div class="filter-chips" role="group" aria-label="${escapeHtml(field.label)} filter chips">
              ${values
                .map(
                  (v) =>
                    `<button class="filter-chip custom-chip" data-filter="${safeKey}-${escapeHtml(v)}" data-group="context-custom" onclick="toggleFilter(this)" aria-pressed="false">${escapeHtml(v)}</button>`,
                )
                .join('')}
            </div>`,
              )
              .join('')}
          </div>
        </div>`
            : ''
        }

        ${
          reportMetadata?.project?.org ||
          reportMetadata?.project?.team ||
          reportMetadata?.project?.app ||
          (reportMetadata?.build && Object.keys(reportMetadata.build).length > 0) ||
          sortedPwProjects.length > 1 ||
          customFieldValueMaps.length > 0
            ? '<div class="filter-separator" role="separator"></div>'
            : ''
        }

        ${
          hasAttention
            ? `
        <div class="filter-group" data-group="attention" role="group" aria-label="Attention filters">
          <div class="filter-group-title" id="attention-filter-label">Attention</div>
          <div class="filter-chips attention-chips" role="group" aria-labelledby="attention-filter-label">
            ${newFailuresCount > 0 ? `<button class="filter-chip attention-new-failure" data-filter="new-failure" data-group="attention" onclick="toggleFilter(this)" aria-pressed="false">New Failure (${newFailuresCount})</button>` : ''}
            ${regressionsCount > 0 ? `<button class="filter-chip attention-regression" data-filter="regression" data-group="attention" onclick="toggleFilter(this)" aria-pressed="false">Regression (${regressionsCount})</button>` : ''}
            ${fixedCount > 0 ? `<button class="filter-chip attention-fixed" data-filter="fixed" data-group="attention" onclick="toggleFilter(this)" aria-pressed="false">Fixed (${fixedCount})</button>` : ''}
          </div>
        </div>
        `
            : ''
        }
        <div class="filter-group" data-group="status" role="group" aria-label="Status filters">
          <div class="filter-group-title" id="status-filter-label">Status</div>
          <div class="filter-chips" role="group" aria-labelledby="status-filter-label">
            <button class="filter-chip" data-filter="passed" data-group="status" onclick="toggleFilter(this)" aria-pressed="false">Passed</button>
            <button class="filter-chip" data-filter="failed" data-group="status" onclick="toggleFilter(this)" aria-pressed="false">Failed</button>
            <button class="filter-chip" data-filter="skipped" data-group="status" onclick="toggleFilter(this)" aria-pressed="false">Skipped</button>
          </div>
        </div>
        <div class="filter-group" data-group="health" role="group" aria-label="Health filters">
          <div class="filter-group-title" id="health-filter-label">Health</div>
          <div class="filter-chips" role="group" aria-labelledby="health-filter-label">
            <button class="filter-chip" data-filter="flaky" data-group="health" onclick="toggleFilter(this)" aria-pressed="false">Flaky (${flaky})</button>
            <button class="filter-chip" data-filter="slow" data-group="health" onclick="toggleFilter(this)" aria-pressed="false">Slow (${slow})</button>
            <button class="filter-chip" data-filter="new" data-group="health" onclick="toggleFilter(this)" aria-pressed="false">New (${newTests})</button>
          </div>
        </div>
        <div class="filter-group" data-group="grade" role="group" aria-label="Grade filters">
          <div class="filter-group-title" id="grade-filter-label">Grade</div>
          <div class="filter-chips grade-chips" role="group" aria-labelledby="grade-filter-label">
            <button class="filter-chip grade-a" data-filter="grade-a" data-group="grade" onclick="toggleFilter(this)" aria-pressed="false" aria-label="Grade A">A</button>
            <button class="filter-chip grade-b" data-filter="grade-b" data-group="grade" onclick="toggleFilter(this)" aria-pressed="false" aria-label="Grade B">B</button>
            <button class="filter-chip grade-c" data-filter="grade-c" data-group="grade" onclick="toggleFilter(this)" aria-pressed="false" aria-label="Grade C">C</button>
            <button class="filter-chip grade-d" data-filter="grade-d" data-group="grade" onclick="toggleFilter(this)" aria-pressed="false" aria-label="Grade D">D</button>
            <button class="filter-chip grade-f" data-filter="grade-f" data-group="grade" onclick="toggleFilter(this)" aria-pressed="false" aria-label="Grade F">F</button>
          </div>
        </div>
        ${
          sortedSuites.length > 0
            ? `
        <div class="filter-group" data-group="suite" role="group" aria-label="Suite filters">
          <div class="filter-group-title" id="suite-filter-label">Suite</div>
          <div class="filter-chips suite-chips" role="group" aria-labelledby="suite-filter-label">
            ${sortedSuites
              .slice(0, 8)
              .map(
                ([suite, count]) =>
                  `<button class="filter-chip suite-chip" data-filter="suite-${escapeHtml(suite)}" data-group="suite" data-suite-name="${escapeHtml(suite)}" onclick="toggleFilter(this)" aria-pressed="false" title="${escapeHtml(suite)} (${count} tests)">${escapeHtml(suite.length > 15 ? suite.slice(0, 12) + '...' : suite)} (${count})</button>`,
              )
              .join('')}
          </div>
        </div>
        `
            : ''
        }
        ${
          sortedTags.length > 0
            ? `
        <div class="filter-group" data-group="tag" role="group" aria-label="Tag filters">
          <div class="filter-group-title" id="tag-filter-label">Tags</div>
          <div class="filter-chips tag-chips" role="group" aria-labelledby="tag-filter-label">
            ${sortedTags
              .slice(0, 8)
              .map(
                ([tag, count]) =>
                  `<button class="filter-chip tag-chip" data-filter="tag-${escapeHtml(tag)}" data-group="tag" data-tag-name="${escapeHtml(tag)}" onclick="toggleFilter(this)" aria-pressed="false" title="${escapeHtml(tag)} (${count} tests)">${escapeHtml(tag)} (${count})</button>`,
              )
              .join('')}
          </div>
        </div>
        `
            : ''
        }
      </div>

      <!-- Saved Views -->
      <div class="sidebar-saved-views">
        <div class="saved-views-header">
          <span class="nav-section-title" style="margin:0">Saved Views</span>
          <div class="saved-views-header-actions">
            <button class="sv-icon-btn" onclick="exportSavedViews()" title="Export views" aria-label="Export saved views">↓</button>
            <label class="sv-icon-btn" title="Import views" aria-label="Import saved views">↑
              <input type="file" accept=".json" style="display:none" onchange="importSavedViews(this)">
            </label>
          </div>
        </div>
        <div class="saved-views-list" id="saved-views-list"></div>
        <div class="save-view-area">
          <button class="sv-save-btn" onclick="showSaveViewForm()" id="sv-save-toggle">+ Save current view</button>
          <div class="sv-save-form" id="sv-save-form" style="display:none">
            <input type="text" id="sv-name-input" class="sv-name-input" placeholder="View name..." maxlength="40" onkeydown="if(event.key==='Enter')saveCurrentView();if(event.key==='Escape')hideSaveViewForm();">
            <div class="sv-save-form-actions">
              <button class="sv-btn sv-btn-primary" onclick="saveCurrentView()">Save</button>
              <button class="sv-btn" onclick="hideSaveViewForm()">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- File Tree -->
      <div class="sidebar-files">
        <div class="nav-section-title">Specs</div>
        <div class="file-tree">
          ${generateFileTree(results)}
        </div>
      </div>

      <!-- Duration -->
      <div class="sidebar-footer">
        <div class="run-duration">
          <span class="duration-icon">⏱️</span>
          <span class="duration-value">${formatDuration(totalDuration)}</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content" id="main-content" tabindex="-1" aria-label="Test report content">
      <!-- Overview View -->
      <section class="view-panel" id="view-overview" role="tabpanel" aria-label="Overview">
        <div class="view-header">
          <h2 class="view-title">Overview</h2>
        </div>
        <div class="overview-content">
          ${generateOverviewContent(results, comparison, failureClusters, passed, failed, skipped, flaky, slow, newTests, total, passRate, totalDuration, history, options.durationBudgetMs)}
        </div>
      </section>

      <!-- Tests View (Master-Detail) -->
      <section class="view-panel" id="view-tests" role="tabpanel" aria-label="Tests" style="display: none;">
        <div class="master-detail-layout">
          <!-- Test List (Master) -->
          <div class="test-list-panel">
            <div class="test-list-header">
              <div class="test-list-tabs" role="tablist" aria-label="Test grouping options">
                <button class="tab-btn active" data-tab="all" onclick="switchTestTab('all')" role="tab" aria-selected="true" aria-controls="tab-all">All Tests</button>
                <button class="tab-btn" data-tab="by-file" onclick="switchTestTab('by-file')" role="tab" aria-selected="false" aria-controls="tab-by-file">By Spec</button>
                <button class="tab-btn" data-tab="by-status" onclick="switchTestTab('by-status')" role="tab" aria-selected="false" aria-controls="tab-by-status">By Status</button>
                <button class="tab-btn" data-tab="by-stability" onclick="switchTestTab('by-stability')" role="tab" aria-selected="false" aria-controls="tab-by-stability">By Stability</button>
              </div>
              <div class="test-list-search">
                <input type="text" class="inline-search" placeholder="Filter tests..." oninput="searchTests(this.value)" aria-label="Filter tests by name">
              </div>
            </div>
            <div class="test-list-content">
              <!-- Empty state for no results -->
              <div class="empty-state" id="emptyState" style="display: none;">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No tests found</div>
                <div class="empty-state-message">No tests match your current filters. Try adjusting your search or filter criteria.</div>
                <button class="empty-state-action" onclick="clearAllFilters()">Clear filters</button>
              </div>
              <!-- All Tests Tab -->
              <div class="test-tab-content active" id="tab-all" role="tabpanel" aria-labelledby="tab-all-label">
                <div role="list" aria-label="All tests">
                  ${generateTestListItems(sortedResults, showTraceSection, attentionSets, projectDataAttrs)}
                </div>
              </div>
              <!-- By Spec Tab -->
              <div class="test-tab-content" id="tab-by-file" role="tabpanel" aria-labelledby="tab-by-file-label">
                ${generateGroupedTests(sortedResults, showTraceSection, attentionSets, projectDataAttrs, options.durationBudgetMs)}
              </div>
              <!-- By Status Tab -->
              <div class="test-tab-content" id="tab-by-status" role="tabpanel" aria-labelledby="tab-by-status-label">
                <div class="status-group failed-group">
                  <div class="status-group-header">
                    <span class="status-group-dot failed"></span>
                    <span class="status-group-title">Failed (${failed})</span>
                  </div>
                  ${generateTestListItems(
                    sortedResults.filter((r) => r.status === 'failed' || r.status === 'timedOut'),
                    showTraceSection,
                    attentionSets,
                    projectDataAttrs,
                  )}
                </div>
                <div class="status-group passed-group">
                  <div class="status-group-header">
                    <span class="status-group-dot passed"></span>
                    <span class="status-group-title">Passed (${passed})</span>
                  </div>
                  ${generateTestListItems(
                    sortedResults.filter((r) => r.status === 'passed'),
                    showTraceSection,
                    attentionSets,
                    projectDataAttrs,
                  )}
                </div>
                <div class="status-group skipped-group">
                  <div class="status-group-header">
                    <span class="status-group-dot skipped"></span>
                    <span class="status-group-title">Skipped (${skipped})</span>
                  </div>
                  ${generateTestListItems(
                    sortedResults.filter((r) => r.status === 'skipped'),
                    showTraceSection,
                    attentionSets,
                    projectDataAttrs,
                  )}
                </div>
              </div>
              <!-- By Stability Tab -->
              <div class="test-tab-content" id="tab-by-stability">
                ${['A', 'B', 'C', 'D', 'F']
                  .map((grade) => {
                    const gradeTests = sortedResults.filter(
                      (r) => r.stabilityScore?.grade === grade,
                    );
                    if (gradeTests.length === 0) return '';
                    return `
                    <div class="stability-group grade-${grade.toLowerCase()}-group">
                      <div class="stability-group-header">
                        <span class="stability-badge ${grade.toLowerCase()}">${grade}</span>
                        <span class="stability-group-title">Grade ${grade} (${gradeTests.length})</span>
                      </div>
                      ${generateTestListItems(gradeTests, showTraceSection, attentionSets, projectDataAttrs)}
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Test Detail (Detail) -->
          <div class="test-detail-panel" id="test-detail-panel">
            <div class="detail-placeholder">
              <div class="placeholder-icon">🧪</div>
              <div class="placeholder-text">Select a test to view details</div>
              <div class="placeholder-hint">Click on any test in the list</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trends View -->
      <section class="view-panel" id="view-trends" role="tabpanel" aria-label="Trends" style="display: none;">
        <div class="view-header">
          <h2 class="view-title">Trends</h2>
        </div>
        <div class="trends-content">
          ${generateTrendChart({ results, history, startTime, durationBudgetMs: options.durationBudgetMs })}
        </div>
      </section>

      <!-- Comparison View -->
      ${
        showComparison
          ? `
      <section class="view-panel" id="view-comparison" role="tabpanel" aria-label="Comparison" style="display: none;">
        <div class="view-header">
          <h2 class="view-title">Run Comparison</h2>
        </div>
        <!-- Phase 5: quick-compare by branch / env (populated by JS) -->
        <div id="comparison-quick-selectors" style="padding: 0 1.5rem 0.5rem;"></div>
        <div class="comparison-content">
          ${generateComparison(comparison!)}
        </div>
      </section>
      `
          : ''
      }

      <!-- Gallery View -->
      ${
        showGallery
          ? `
      <section class="view-panel" id="view-gallery" role="tabpanel" aria-label="Gallery" style="display: none;">
        <div class="view-header">
          <h2 class="view-title">Attachments Gallery</h2>
        </div>
        <div class="gallery-content">
          ${generateGallery(results)}
        </div>
      </section>
      `
          : ''
      }

      <!-- Accessibility View -->
      ${
        a11yAnalysis.testedCount > 0
          ? `
      <section class="view-panel" id="view-accessibility" role="tabpanel" aria-label="Accessibility" style="display: none;">
        <div class="view-header">
          <h2 class="view-title">Accessibility</h2>
        </div>
        <div class="a11y-content">

          <!-- Summary bar -->
          <div class="a11y-summary-bar">
            <div class="a11y-stat">
              <span class="a11y-stat-value${a11yAnalysis.totalViolations > 0 ? ' a11y-stat-violations' : ' a11y-stat-clean'}">${a11yAnalysis.totalViolations}</span>
              <span class="a11y-stat-label">Total Violations</span>
            </div>
            <div class="a11y-stat">
              <span class="a11y-stat-value${a11yAnalysis.violatingCount > 0 ? ' a11y-stat-violations' : ''}">${a11yAnalysis.violatingCount}</span>
              <span class="a11y-stat-label">Affected Tests</span>
            </div>
            <div class="a11y-stat">
              <span class="a11y-stat-value a11y-stat-clean">${a11yAnalysis.cleanCount}</span>
              <span class="a11y-stat-label">Clean Tests</span>
            </div>
            <div class="a11y-stat">
              <span class="a11y-stat-value">${a11yAnalysis.testedCount}</span>
              <span class="a11y-stat-label">Tests Scanned</span>
            </div>
          </div>

          ${
            a11yAnalysis.violatingCount === 0
              ? `<div class="a11y-all-clear">
              <span class="a11y-all-clear-icon">✅</span>
              <div class="a11y-all-clear-title">All scanned tests pass WCAG 2.1 AA</div>
              <div class="a11y-all-clear-sub">${a11yAnalysis.testedCount} test${a11yAnalysis.testedCount !== 1 ? 's' : ''} scanned, no violations found</div>
            </div>`
              : `
          <!-- Rule breakdown table -->
          <div class="a11y-section">
            <h3 class="a11y-section-title">Rule Breakdown</h3>
            <table class="a11y-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Impact</th>
                  <th>Occurrences</th>
                  <th>Affected Tests</th>
                </tr>
              </thead>
              <tbody>
                ${a11yAnalysis.ruleBreakdown
                  .map(
                    (rule) => `
                <tr>
                  <td><code class="a11y-rule-id">${escapeHtml(rule.id)}</code></td>
                  <td><span class="a11y-impact a11y-impact-${escapeHtml(rule.impact)}">${escapeHtml(rule.impact)}</span></td>
                  <td class="a11y-count">${rule.occurrences}</td>
                  <td class="a11y-test-titles">${rule.testTitles.map((t) => `<span class="a11y-test-title-chip">${escapeHtml(t)}</span>`).join('')}</td>
                </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Violating tests list -->
          <div class="a11y-section">
            <h3 class="a11y-section-title">Affected Tests</h3>
            <div class="a11y-test-list">
              ${a11yAnalysis.violatingTests
                .map(
                  (t) => `
              <div class="a11y-test-item">
                <div class="a11y-test-item-left">
                  <span class="a11y-test-violation-count">${t.violations}</span>
                  <div>
                    <div class="a11y-test-item-title">${escapeHtml(t.title)}</div>
                    <div class="a11y-test-item-file">${escapeHtml(t.file)}</div>
                    <div class="a11y-test-item-rules">${t.rules.map((r) => `<span class="a11y-impact a11y-impact-${escapeHtml(r.impact)}">${escapeHtml(r.id)}</span>`).join('')}</div>
                  </div>
                </div>
                <button class="a11y-view-test-btn" onclick="switchView('tests'); setTimeout(function(){ var el = document.getElementById('card-${sanitizeId(t.testId)}'); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.querySelector('.test-card-header')?.click(); } }, 200);" title="View test in Tests panel">View test →</button>
              </div>`,
                )
                .join('')}
            </div>
          </div>`
          }

          ${
            a11yAnalysis.runTrend.length >= 2
              ? `
          <!-- Cross-run violation trend chart -->
          <div class="a11y-section">
            <h3 class="a11y-section-title">Violation Trend</h3>
            <div class="a11y-chart-container">
              <canvas id="a11y-trend-chart" aria-label="Accessibility violations per run" role="img"></canvas>
            </div>
          </div>
          <script>
          (function() {
            var trendData = ${JSON.stringify(a11yAnalysis.runTrend)};
            function initA11yChart() {
              if (typeof Chart === 'undefined') { setTimeout(initA11yChart, 200); return; }
              var ctx = document.getElementById('a11y-trend-chart');
              if (!ctx) return;
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: trendData.map(function(r) { return new Date(r.timestamp).toLocaleDateString(); }),
                  datasets: [{
                    label: 'Violations',
                    data: trendData.map(function(r) { return r.totalViolations; }),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                  }]
                },
                options: {
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                  }
                }
              });
            }
            initA11yChart();
          })();
          </script>`
              : ''
          }

        </div>
      </section>
      `
          : ''
      }

      <!-- Settings View -->
      <section class="view-panel" id="view-settings" role="tabpanel" aria-label="Settings" style="display: none;">
        <div class="settings-container">
          <div class="settings-header">
            <h2 class="view-title">Settings</h2>
          </div>
          <div class="settings-tabs">
            <button class="settings-tab active" data-tab="ai" onclick="switchSettingsTab('ai')">AI / LM Studio</button>
            <button class="settings-tab" data-tab="report" onclick="switchSettingsTab('report')">Report options</button>
            <button class="settings-tab" data-tab="advanced" onclick="switchSettingsTab('advanced')">Advanced</button>
          </div>

          <!-- Tab: AI / LM Studio -->
          <div class="settings-tab-panel active" id="settings-tab-ai">
            <div class="setting-group setting-toggle-row">
              <div>
                <div class="setting-label">Enable AI recommendations</div>
                <div class="setting-description">Analyze failures with AI and show suggestions in the Playwright Smart Report.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enableAI" onchange="saveSetting('enableAIRecommendations', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="setting-lmStudioBaseUrl">LM Studio base URL (Smart Reporter)</label>
              <input type="text" id="setting-lmStudioBaseUrl" class="setting-input"
                     onchange="saveSetting('lmStudioBaseUrl', this.value); fetchLmStudioModels(this.value, '')"
                     placeholder="http://127.0.0.1:1234">
              <div class="setting-description">Base URL for LM Studio when generating Smart Reporter AI suggestions. Leave default to use the same as main AI endpoint.</div>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="setting-lmStudioModel">Model Selection (Smart Reporter)</label>
              <div class="setting-select-wrapper">
                <select id="setting-lmStudioModel" class="setting-input setting-select"
                        onchange="saveSetting('lmStudioModel', this.value)">
                  <option value="">Auto-select</option>
                </select>
              </div>
              <div class="setting-description">Choose which model to use for Smart Reporter AI suggestions. Leave as &ldquo;Auto-select&rdquo; to use the first available model.</div>
              <div class="setting-description setting-model-count" id="setting-modelCount"></div>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="setting-maxTokens">Max Tokens &ndash; Smart Reporter</label>
              <input type="number" id="setting-maxTokens" class="setting-input"
                     min="100" max="4000"
                     onchange="saveSetting('smartReporterMaxTokens', parseInt(this.value, 10))">
              <div class="setting-description">Maximum length of Playwright Smart Reporter AI suggestions (100&ndash;4000). Used when generating failure analysis in the report. Default 512.</div>
            </div>

            <div class="settings-callout">
              <p>To use these values when running tests: add <code>SMART_REPORTER_MAX_TOKENS</code> (and optionally <code>LM_STUDIO_BASE_URL</code>, <code>LM_STUDIO_MODEL</code>) to your <code>.env</code> file, or download the settings file and place it in your project root.</p>
              <button class="settings-download-btn" onclick="downloadSettings()">Download playwright-report-settings.json</button>
            </div>
          </div>

          <!-- Tab: Report Options -->
          <div class="settings-tab-panel" id="settings-tab-report">
            <div class="setting-group">
              <label class="setting-label" for="setting-maxHistoryRuns">Max history runs</label>
              <input type="number" id="setting-maxHistoryRuns" class="setting-input"
                     min="1" max="100"
                     onchange="saveSetting('maxHistoryRuns', parseInt(this.value, 10))">
              <div class="setting-description">Number of past runs to keep in the Smart Report history (affects report size and load time).</div>
            </div>

            <div class="setting-group setting-toggle-row">
              <div>
                <div class="setting-label">Filter Playwright API steps</div>
                <div class="setting-description">Hide low-level Playwright API steps in the report to reduce clutter.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-filterPwApiSteps" onchange="saveSetting('filterPwApiSteps', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-group setting-toggle-row">
              <div>
                <div class="setting-label">Enable history drilldown</div>
                <div class="setting-description">Store per-run data so you can click history dots to see past run details. Disable to reduce report size.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enableHistoryDrilldown" onchange="saveSetting('enableHistoryDrilldown', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-group setting-toggle-row">
              <div>
                <div class="setting-label">Enable trace viewer links</div>
                <div class="setting-description">Show "View trace" links in the Smart Report when trace files are available.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enableTraceViewer" onchange="saveSetting('enableTraceViewer', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-group setting-toggle-row">
              <div>
                <div class="setting-label">Enable network logs in report</div>
                <div class="setting-description">Include network request log in the report when trace files are present.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enableNetworkLogs" onchange="saveSetting('enableNetworkLogs', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Tab: Advanced -->
          <div class="settings-tab-panel" id="settings-tab-advanced">
            <div class="setting-group">
              <label class="setting-label" for="setting-stabilityThreshold">Stability score warning threshold</label>
              <input type="number" id="setting-stabilityThreshold" class="setting-input"
                     min="0" max="100"
                     onchange="saveSetting('stabilityThreshold', parseInt(this.value, 10))">
              <div class="setting-description">Warn when a test's stability score is below this value (0&ndash;100).</div>
            </div>

            <div class="setting-group">
              <label class="setting-label" for="setting-retryFailureThreshold">Retry failure threshold</label>
              <input type="number" id="setting-retryFailureThreshold" class="setting-input"
                     min="1" max="20"
                     onchange="saveSetting('retryFailureThreshold', parseInt(this.value, 10))">
              <div class="setting-description">Warn when a test needed more than this many retries to pass.</div>
            </div>
          </div>

          <div class="settings-footer">
            <button class="settings-reset-btn" onclick="openResetConfirm()">Reset to Defaults</button>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- Reset Confirm Modal -->
  <div class="confirm-modal" id="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-hidden="true">
    <div class="confirm-modal-backdrop" onclick="closeResetConfirm()"></div>
    <div class="confirm-modal-content">
      <div class="confirm-modal-icon">⚠️</div>
      <h3 class="confirm-modal-title" id="confirm-modal-title">Reset to Defaults</h3>
      <p class="confirm-modal-body">This will clear all saved settings and restore defaults. This cannot be undone.</p>
      <div class="confirm-modal-actions">
        <button class="confirm-modal-btn confirm-modal-cancel" onclick="closeResetConfirm()">Cancel</button>
        <button class="confirm-modal-btn confirm-modal-ok" onclick="resetSettings(); closeResetConfirm()">Reset</button>
      </div>
    </div>
  </div>

  <!-- Search Modal -->
  <div class="search-modal" id="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-modal-title" aria-hidden="true">
    <div class="search-modal-backdrop" onclick="closeSearch()"></div>
    <div class="search-modal-content">
      <div class="search-modal-header">
        <span class="search-modal-icon" aria-hidden="true">🔍</span>
        <label for="search-modal-input" class="visually-hidden" id="search-modal-title">Search tests</label>
        <input type="text" class="search-modal-input" id="search-modal-input" placeholder="Search tests..." oninput="handleSearchInput(this.value)" aria-describedby="search-modal-hint">
        <span id="search-modal-hint" class="visually-hidden">Press Escape to close</span>
        <button class="search-modal-esc" onclick="closeSearch()" aria-label="Close search">ESC</button>
      </div>
      <div class="search-modal-results" id="search-modal-results" role="listbox" aria-label="Search results"></div>
    </div>
  </div>

  <!-- Issue #13: Inline Trace Viewer Modal -->
  ${enableTraceViewer ? generateTraceViewerHtml() : ''}

  <!-- Hidden data containers for detail rendering -->
  <div id="test-cards-data" style="display: none;">
    ${results.map((test) => generateTestCard(test, showTraceSection, options.durationBudgetMs)).join('\n')}
  </div>

  <!-- JSZip library for trace extraction and artifact downloads -->
  <script>${generateJSZipScript()}</script>

  <!-- Large payloads as JSON: avoids JS parse errors from U+2028/U+2029, import attributes in prompts, etc. -->
  <script id="sr-embed-tests" type="application/json">${testsJson}</script>
  <script id="sr-embed-screenshots" type="application/json">${screenshotsDataJson}</script>
  <script id="sr-embed-network" type="application/json">${networkLogsDataJson}</script>
  <script id="sr-embed-stats" type="application/json">${statsData}</script>
  <script id="sr-embed-reporter-options" type="application/json">${reporterOptionsJson}</script>
  <script id="sr-embed-history-snapshots" type="application/json">${historyRunSnapshotsJson}</script>

  <script>
${generateScripts(showGallery, showComparison, enableTraceViewer, enableHistoryDrilldown)}

${enableTraceViewer ? generateTraceViewerScript() : ''}
  </script>
</body>
</html>`;
}
