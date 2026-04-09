import * as fs from 'fs';
import * as path from 'path';
import type {
  TestHistory,
  TestHistoryEntry,
  TestResultData,
  RunSummary,
  RunMetadata,
  ReportMetadata,
  SmartReporterOptions,
  RunSnapshotFile,
  TestResultSnapshot,
} from '../types';
import { renderMarkdownLite, computePercentile } from '../utils';
import { sanitizeFilename } from '../utils/sanitizers';

/**
 * Manages test history persistence and retrieval
 */
export class HistoryCollector {
  private history: TestHistory = { runs: [], tests: {}, summaries: [] };
  private options: Required<
    Omit<
      SmartReporterOptions,
      | 'slackWebhook'
      | 'teamsWebhook'
      | 'baselineRunId'
      | 'networkLogFilter'
      | 'apiKey'
      | 'projectId'
      | 'cloudEndpoint'
      | 'projectName'
      | 'thresholds'
      | 'maxEmbeddedSize'
      | 'runId'
      | 'lmStudioBaseUrl'
      | 'lmStudioModel'
      | 'smartReporterMaxTokens'
      | 'metadata'
      | 'durationBudgetMs'
      | 'artifactRetentionRuns'
    >
  > &
    Pick<
      SmartReporterOptions,
      | 'slackWebhook'
      | 'teamsWebhook'
      | 'baselineRunId'
      | 'networkLogFilter'
      | 'apiKey'
      | 'projectId'
      | 'cloudEndpoint'
      | 'projectName'
      | 'thresholds'
      | 'maxEmbeddedSize'
      | 'runId'
      | 'lmStudioBaseUrl'
      | 'lmStudioModel'
      | 'smartReporterMaxTokens'
      | 'metadata'
      | 'durationBudgetMs'
      | 'artifactRetentionRuns'
    >;
  private outputDir: string;
  private currentRun: RunMetadata;
  private startTime: number;
  private aliases: Record<string, string> = {};

  constructor(options: SmartReporterOptions, outputDir: string) {
    // Issue #21: Support {project} placeholder in historyFile path
    let historyFile = options.historyFile ?? 'test-history.json';
    if (options.projectName) {
      // Replace {project} placeholder with actual project name
      historyFile = historyFile.replace('{project}', options.projectName);
      // If no placeholder was used but projectName is set, prepend project name
      if (!options.historyFile?.includes('{project}')) {
        const ext = path.extname(historyFile);
        const base = path.basename(historyFile, ext);
        const dir = path.dirname(historyFile);
        historyFile = path.join(dir, `${base}-${options.projectName}${ext}`);
      }
    }

    this.options = {
      outputFile: options.outputFile ?? 'smart-report.html',
      historyFile,
      maxHistoryRuns: options.maxHistoryRuns ?? 10,
      performanceThreshold: options.performanceThreshold ?? 0.2,
      enableRetryAnalysis: options.enableRetryAnalysis ?? true,
      enableFailureClustering: options.enableFailureClustering ?? true,
      enableStabilityScore: options.enableStabilityScore ?? true,
      enableGalleryView: options.enableGalleryView ?? true,
      enableComparison: options.enableComparison ?? true,
      enableAIRecommendations: options.enableAIRecommendations ?? true,
      enableTrendsView: options.enableTrendsView ?? true,
      enableTraceViewer: options.enableTraceViewer ?? true,
      enableHistoryDrilldown: options.enableHistoryDrilldown ?? false,
      stabilityThreshold: options.stabilityThreshold ?? 70,
      retryFailureThreshold: options.retryFailureThreshold ?? 3,
      cspSafe: options.cspSafe ?? false,
      enableNetworkLogs: options.enableNetworkLogs ?? true,
      networkLogFilter: options.networkLogFilter ?? undefined,
      networkLogExcludeAssets: options.networkLogExcludeAssets ?? true,
      networkLogMaxEntries: options.networkLogMaxEntries ?? 50,
      slackWebhook: options.slackWebhook,
      teamsWebhook: options.teamsWebhook,
      baselineRunId: options.baselineRunId,
      // Cloud options
      apiKey: options.apiKey,
      projectId: options.projectId,
      uploadToCloud: options.uploadToCloud ?? false,
      cloudEndpoint: options.cloudEndpoint,
      uploadArtifacts: options.uploadArtifacts ?? true,
      // Issue #21: Store project name for reference
      projectName: options.projectName,
      // Issue #22: Step filtering
      filterPwApiSteps: options.filterPwApiSteps ?? false,
      // Issue #20: Path resolution
      relativeToCwd: options.relativeToCwd ?? false,
      // Issue #26: External run ID (sanitized for safe use in filenames and HTML)
      runId: options.runId ? sanitizeFilename(options.runId.trim(), 100) : undefined,
      // Metadata (project/build context)
      metadata: options.metadata,
      // Performance budget
      durationBudgetMs: options.durationBudgetMs,
      // Artifact retention
      artifactRetentionRuns: options.artifactRetentionRuns,
    };
    this.outputDir = outputDir;
    this.currentRun = {
      runId: `run-${this.options.runId ?? Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.startTime = Date.now();
  }

  /** Returns the path to the alias file co-located with the history file. */
  private getAliasFilePath(): string {
    const historyPath = path.resolve(this.outputDir, this.options.historyFile);
    const dir = path.dirname(historyPath);
    const base = path.basename(historyPath, '.json');
    return path.join(dir, `${base}-aliases.json`);
  }

  /**
   * Loads test-history-aliases.json into this.aliases.
   * Silently ignored if the file is absent or malformed — it is optional.
   */
  private loadAliases(): void {
    const aliasPath = this.getAliasFilePath();
    if (!fs.existsSync(aliasPath)) return;
    try {
      const raw: unknown = JSON.parse(fs.readFileSync(aliasPath, 'utf-8'));
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        console.warn('[smart-reporter] test-history-aliases.json must be a JSON object — skipping');
        return;
      }
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value !== 'string') {
          console.warn(`[smart-reporter] Skipping malformed alias entry: ${key}`);
          continue;
        }
        this.aliases[key] = value;
      }
    } catch {
      // Malformed file — silently ignored; file is optional
    }
  }

  /**
   * Rewrites old test ID keys in history.tests to their new IDs using the loaded alias map.
   * When both old and new IDs have existing entries, they are merged and pruned to maxHistoryRuns.
   */
  private applyAliases(): void {
    let appliedCount = 0;
    for (const [oldId, newId] of Object.entries(this.aliases)) {
      if (!this.history.tests[oldId]) continue;
      if (this.history.tests[newId]) {
        // Both exist — merge chronologically and prune
        const merged = [...this.history.tests[oldId], ...this.history.tests[newId]].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        this.history.tests[newId] = merged.slice(-this.options.maxHistoryRuns);
      } else {
        this.history.tests[newId] = this.history.tests[oldId];
      }
      delete this.history.tests[oldId];
      appliedCount++;
    }
    if (appliedCount > 0) {
      console.log(
        `[smart-reporter] Applied ${appliedCount} test ID alias(es) from test-history-aliases.json`,
      );
    }
  }

  /**
   * Attempts to recover history for a test whose file path changed but title is unchanged.
   * Returns the old test ID if exactly one unambiguous match is found in history; null otherwise.
   *
   * Matching rule: same project prefix + same title, different file path segment.
   * If multiple tests in history share the same title the match is ambiguous and null is returned.
   */
  private tryFuzzyHistoryMatch(testId: string): string | null {
    const SEP = '::';
    const lastSepIdx = testId.lastIndexOf(SEP);
    if (lastSepIdx === -1) return null;

    const title = testId.substring(lastSepIdx + SEP.length);
    const fileWithPrefix = testId.substring(0, lastSepIdx);
    const prefixMatch = fileWithPrefix.match(/^(\[[^\]]+\] )/);
    const prefix = prefixMatch ? prefixMatch[1] : '';
    const filePath = prefix ? fileWithPrefix.substring(prefix.length) : fileWithPrefix;

    const matches: string[] = [];
    for (const existingId of Object.keys(this.history.tests)) {
      const existingLastSep = existingId.lastIndexOf(SEP);
      if (existingLastSep === -1) continue;
      const existingTitle = existingId.substring(existingLastSep + SEP.length);
      const existingFileWithPrefix = existingId.substring(0, existingLastSep);
      const existingPrefixMatch = existingFileWithPrefix.match(/^(\[[^\]]+\] )/);
      const existingPrefix = existingPrefixMatch ? existingPrefixMatch[1] : '';
      const existingFilePath = existingPrefix
        ? existingFileWithPrefix.substring(existingPrefix.length)
        : existingFileWithPrefix;

      if (existingTitle === title && existingPrefix === prefix && existingFilePath !== filePath) {
        matches.push(existingId);
      }
    }

    return matches.length === 1 ? matches[0] : null;
  }

  /**
   * Load test history from disk
   */
  loadHistory(): void {
    const historyPath = path.resolve(this.outputDir, this.options.historyFile);
    if (fs.existsSync(historyPath)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        // Support both old and new format
        if (loaded.tests) {
          // New format
          this.history = loaded;
        } else {
          // Old format: convert to new format
          this.history = { runs: [], tests: loaded, summaries: [] };
        }

        // Ensure summaries array exists
        if (!this.history.summaries) {
          this.history.summaries = [];
        }
        if (!this.history.runs) {
          this.history.runs = [];
        }
        if (!this.history.runFiles) {
          this.history.runFiles = {};
        }
      } catch (err) {
        console.warn('Failed to load history:', err);
        this.history = { runs: [], tests: {}, summaries: [] };
      }
    }
    // Load alias map and rewrite any stale test IDs before the current run touches history
    this.loadAliases();
    this.applyAliases();
  }

  /**
   * Update history with test results
   */
  updateHistory(results: TestResultData[], reportMetadata?: ReportMetadata): void {
    const timestamp = new Date().toISOString();
    const runId = this.currentRun.runId;

    for (const result of results) {
      // Fuzzy title-only match: recover history when a test file has been moved
      // but the test title is unchanged. Only fires when the exact ID is absent from history.
      if (!this.history.tests[result.testId]) {
        const matchedId = this.tryFuzzyHistoryMatch(result.testId);
        if (matchedId !== null) {
          this.history.tests[result.testId] = this.history.tests[matchedId];
          delete this.history.tests[matchedId];
          const sep = matchedId.lastIndexOf('::');
          const oldFile = sep !== -1 ? matchedId.substring(0, sep) : matchedId;
          console.log(
            `[smart-reporter] History recovered for test "${result.testId}"\n` +
              `  via title-only match (file path changed from "${oldFile}").\n` +
              `  To suppress this warning, add to ${path.basename(this.getAliasFilePath())}:\n` +
              `    "${matchedId}": "${result.testId}"`,
          );
        }
      }

      if (!this.history.tests[result.testId]) {
        this.history.tests[result.testId] = [];
      }

      const axeAnnotation = result.annotations?.find((a) => a.type === 'axe-violations');
      const axeViolations = axeAnnotation
        ? parseInt(axeAnnotation.description ?? '0', 10)
        : undefined;

      this.history.tests[result.testId].push({
        passed: result.status === 'passed',
        duration: result.duration,
        timestamp,
        ...(this.options.enableHistoryDrilldown ? { runId } : {}),
        skipped: result.status === 'skipped',
        retry: result.retry, // NEW: Track retry count
        ...(axeViolations !== undefined ? { axeViolations } : {}),
      });

      // Keep only last N runs
      if (this.history.tests[result.testId].length > this.options.maxHistoryRuns) {
        this.history.tests[result.testId] = this.history.tests[result.testId].slice(
          -this.options.maxHistoryRuns,
        );
      }
    }

    // Add run summary
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed' || r.status === 'timedOut').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const flaky = results.filter((r) => r.flakinessScore && r.flakinessScore >= 0.3).length;
    const slow = results.filter((r) => r.performanceTrend?.startsWith('↑')).length;
    const total = results.length;
    const duration = Date.now() - this.startTime;

    // Axe violation aggregates for the Accessibility trend view
    const a11yResults = results.filter((r) =>
      r.annotations?.some((a) => a.type === 'axe-violations'),
    );
    const totalAxeViolations = a11yResults.reduce((sum, r) => {
      const ann = r.annotations?.find((a) => a.type === 'axe-violations');
      return sum + parseInt(ann?.description ?? '0', 10);
    }, 0);
    const a11yViolatingCount = a11yResults.filter((r) => {
      const ann = r.annotations?.find((a) => a.type === 'axe-violations');
      return parseInt(ann?.description ?? '0', 10) > 0;
    }).length;

    // Compute run-level percentile durations from non-skipped test durations
    const MIN_SAMPLE = 3;
    const nonSkippedDurations = results
      .filter((r) => r.status !== 'skipped')
      .map((r) => r.duration)
      .sort((a, b) => a - b);
    const hasPercentiles = nonSkippedDurations.length >= MIN_SAMPLE;
    const runP50 = hasPercentiles
      ? Math.round(computePercentile(nonSkippedDurations, 50))
      : undefined;
    const runP90 = hasPercentiles
      ? Math.round(computePercentile(nonSkippedDurations, 90))
      : undefined;
    const runP95 = hasPercentiles
      ? Math.round(computePercentile(nonSkippedDurations, 95))
      : undefined;

    const summary: RunSummary = {
      runId: this.currentRun.runId,
      timestamp: this.currentRun.timestamp,
      total,
      passed,
      failed,
      skipped,
      flaky,
      slow,
      duration,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      ...(reportMetadata ? { metadata: reportMetadata } : {}),
      ...(hasPercentiles ? { p50Duration: runP50, p90Duration: runP90, p95Duration: runP95 } : {}),
      ...(a11yResults.length > 0
        ? { totalAxeViolations, a11yTestedCount: a11yResults.length, a11yViolatingCount }
        : {}),
    };

    this.history.summaries!.push(summary);

    // Keep only last N summaries
    if (this.history.summaries!.length > this.options.maxHistoryRuns) {
      this.history.summaries = this.history.summaries!.slice(-this.options.maxHistoryRuns);
    }

    if (this.options.enableHistoryDrilldown) {
      this.history.runs.push({ ...this.currentRun });
      if (this.history.runs.length > this.options.maxHistoryRuns) {
        this.history.runs = this.history.runs.slice(-this.options.maxHistoryRuns);
      }

      const historyPath = path.resolve(this.outputDir, this.options.historyFile);
      const historyDir = path.dirname(historyPath);
      const runsDir = path.join(historyDir, 'history-runs');
      if (!fs.existsSync(runsDir)) {
        fs.mkdirSync(runsDir, { recursive: true });
      }

      const snapshots: Record<string, TestResultSnapshot> = {};
      for (const result of results) {
        const screenshots =
          result.attachments?.screenshots?.filter((s) => !s.startsWith('data:')) ?? [];
        const videos = result.attachments?.videos ?? [];
        const traces = result.attachments?.traces ?? [];
        const custom = result.attachments?.custom ?? [];
        const hasAttachments =
          screenshots.length > 0 || videos.length > 0 || traces.length > 0 || custom.length > 0;

        const attachments = hasAttachments ? { screenshots, videos, traces, custom } : undefined;

        snapshots[result.testId] = {
          testId: result.testId,
          title: result.title,
          file: result.file,
          status: result.status,
          duration: result.duration,
          retry: result.retry,
          error: result.error,
          steps: result.steps ?? [],
          aiSuggestion: result.aiSuggestion,
          aiSuggestionHtml: result.aiSuggestion
            ? renderMarkdownLite(result.aiSuggestion)
            : undefined,
          attachments,
        };
      }

      const runFile: RunSnapshotFile = {
        runId,
        timestamp: this.currentRun.timestamp,
        tests: snapshots,
      };

      const runFileName = `${runId}.json`;
      const runFilePath = path.join(runsDir, runFileName);
      fs.writeFileSync(runFilePath, JSON.stringify(runFile, null, 2));

      if (!this.history.runFiles) this.history.runFiles = {};
      this.history.runFiles[runId] = `./history-runs/${runFileName}`;

      // Prune old run files
      const keepRunIds = new Set(this.history.runs.map((r) => r.runId));
      for (const existingRunId of Object.keys(this.history.runFiles)) {
        if (keepRunIds.has(existingRunId)) continue;
        const rel = this.history.runFiles[existingRunId];
        if (rel) {
          try {
            fs.unlinkSync(path.resolve(historyDir, rel));
          } catch {
            // ignore
          }
        }
        delete this.history.runFiles[existingRunId];
      }
    }

    // Save to disk
    const historyPath = path.resolve(this.outputDir, this.options.historyFile);
    fs.writeFileSync(historyPath, JSON.stringify(this.history, null, 2));
  }

  /**
   * Get history for a specific test
   */
  getTestHistory(testId: string): TestHistoryEntry[] {
    return this.history.tests[testId] || [];
  }

  /**
   * Get full history
   */
  getHistory(): TestHistory {
    return this.history;
  }

  /**
   * Get current run metadata
   */
  getCurrentRun(): RunMetadata {
    return this.currentRun;
  }

  /**
   * Get options
   */
  getOptions(): SmartReporterOptions {
    return this.options;
  }

  /**
   * Get baseline run for comparison (if enabled)
   */
  getBaselineRun(): RunSummary | null {
    if (!this.options.enableComparison || !this.history.summaries) {
      return null;
    }

    // If specific baseline specified, find it
    if (this.options.baselineRunId) {
      return this.history.summaries.find((s) => s.runId === this.options.baselineRunId) || null;
    }

    // Otherwise, use previous run
    return this.history.summaries.length > 0
      ? this.history.summaries[this.history.summaries.length - 1]
      : null;
  }
}
