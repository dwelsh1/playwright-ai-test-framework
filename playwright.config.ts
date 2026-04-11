import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { StorageStatePaths } from './enums/coffee-cart/coffee-cart';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const testEnv = process.env['TEST_ENV'] || 'dev';
dotenv.config({ path: path.resolve('env', `.env.${testEnv}`) });

function optionalEnvString(key: string, fallback: string): string {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') return fallback;
  return String(v).trim();
}

// ──────────────────────────────────────────────────────────
// Smart Reporter settings (LM Studio + cloud AI)
// ──────────────────────────────────────────────────────────

const DEFAULT_SMART_REPORTER_MAX_TOKENS = 512;
const DEFAULT_MAX_HISTORY_RUNS = 10;

interface PlaywrightReportSettings {
  smartReporterMaxTokens?: number;
  enableAIRecommendations?: boolean;
  lmStudioBaseUrl?: string;
  lmStudioModel?: string;
  maxHistoryRuns?: number;
  filterPwApiSteps?: boolean;
  enableHistoryDrilldown?: boolean;
  enableTraceViewer?: boolean;
  enableNetworkLogs?: boolean;
  stabilityThreshold?: number;
  retryFailureThreshold?: number;
}

function loadPlaywrightReportSettings(): PlaywrightReportSettings {
  const out: PlaywrightReportSettings = {};
  // SMART_REPORTER_CONFIG env var (set by scripts/test-smart.cjs) takes priority so each
  // concurrent run reads its own config file directly.
  const envConfig = process.env['SMART_REPORTER_CONFIG'];
  const resolvedEnvConfig = envConfig
    ? path.isAbsolute(envConfig)
      ? envConfig
      : path.resolve(process.cwd(), envConfig)
    : null;
  const settingsPath =
    resolvedEnvConfig && fs.existsSync(resolvedEnvConfig)
      ? resolvedEnvConfig
      : path.resolve('playwright-report-settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
      if (
        typeof data['smartReporterMaxTokens'] === 'number' &&
        data['smartReporterMaxTokens'] >= 100 &&
        data['smartReporterMaxTokens'] <= 4000
      )
        out.smartReporterMaxTokens = data['smartReporterMaxTokens'];
      if (typeof data['enableAIRecommendations'] === 'boolean')
        out.enableAIRecommendations = data['enableAIRecommendations'];
      if (typeof data['lmStudioBaseUrl'] === 'string' && data['lmStudioBaseUrl'].trim() !== '')
        out.lmStudioBaseUrl = data['lmStudioBaseUrl'];
      if (typeof data['lmStudioModel'] === 'string' && data['lmStudioModel'].trim() !== '')
        out.lmStudioModel = data['lmStudioModel'];
      if (
        typeof data['maxHistoryRuns'] === 'number' &&
        data['maxHistoryRuns'] >= 1 &&
        data['maxHistoryRuns'] <= 100
      )
        out.maxHistoryRuns = data['maxHistoryRuns'];
      if (typeof data['filterPwApiSteps'] === 'boolean')
        out.filterPwApiSteps = data['filterPwApiSteps'];
      if (typeof data['enableHistoryDrilldown'] === 'boolean')
        out.enableHistoryDrilldown = data['enableHistoryDrilldown'];
      if (typeof data['enableTraceViewer'] === 'boolean')
        out.enableTraceViewer = data['enableTraceViewer'];
      if (typeof data['enableNetworkLogs'] === 'boolean')
        out.enableNetworkLogs = data['enableNetworkLogs'];
      if (typeof data['stabilityThreshold'] === 'number')
        out.stabilityThreshold = data['stabilityThreshold'];
      if (typeof data['retryFailureThreshold'] === 'number')
        out.retryFailureThreshold = data['retryFailureThreshold'];
    }
  } catch {
    // Settings file parse error — use defaults
  }

  // Env overrides (env wins over file)
  const envMaxTokens = process.env['SMART_REPORTER_MAX_TOKENS'];
  if (envMaxTokens !== undefined && envMaxTokens !== '') {
    const n = parseInt(envMaxTokens, 10);
    if (Number.isFinite(n) && n >= 100 && n <= 4000) out.smartReporterMaxTokens = n;
  }
  if (process.env['LM_STUDIO_BASE_URL'] !== undefined && process.env['LM_STUDIO_BASE_URL'] !== '')
    out.lmStudioBaseUrl = process.env['LM_STUDIO_BASE_URL'];
  if (process.env['LM_STUDIO_MODEL'] !== undefined && process.env['LM_STUDIO_MODEL'] !== '')
    out.lmStudioModel = process.env['LM_STUDIO_MODEL'];
  if (process.env['ENABLE_AI_RECOMMENDATIONS'] !== undefined)
    out.enableAIRecommendations = process.env['ENABLE_AI_RECOMMENDATIONS'] !== 'false';
  return out;
}

function getSmartReporterOptions(): Record<string, unknown> {
  const s = loadPlaywrightReportSettings();
  const options: Record<string, unknown> = {
    outputFile: 'playwright-report/smart-report.html',
    historyFile: '.smart-reporter/test-history.json',
    relativeToCwd: true,
    smartReporterMaxTokens: s.smartReporterMaxTokens ?? DEFAULT_SMART_REPORTER_MAX_TOKENS,
    enableAIRecommendations: s.enableAIRecommendations ?? true,
    lmStudioBaseUrl:
      s.lmStudioBaseUrl ?? process.env['LM_STUDIO_BASE_URL'] ?? 'http://127.0.0.1:1234',
    lmStudioModel: s.lmStudioModel ?? process.env['LM_STUDIO_MODEL'],
    maxHistoryRuns: s.maxHistoryRuns ?? DEFAULT_MAX_HISTORY_RUNS,
    filterPwApiSteps: s.filterPwApiSteps ?? false,
    enableHistoryDrilldown: s.enableHistoryDrilldown ?? true,
    enableTraceViewer: s.enableTraceViewer ?? true,
    enableNetworkLogs: s.enableNetworkLogs ?? false,
    enableComparison: true,
    enableRetryAnalysis: true,
    enableFailureClustering: true,
    enableStabilityScore: true,
    stabilityThreshold: s.stabilityThreshold ?? 70,
    retryFailureThreshold: s.retryFailureThreshold ?? 3,
  };

  // CI run ID for consistent shard identification
  if (process.env['GITHUB_RUN_ID']) {
    options['runId'] = process.env['GITHUB_RUN_ID'];
  } else if (process.env['CIRCLE_BUILD_NUM']) {
    options['runId'] = process.env['CIRCLE_BUILD_NUM'];
  }

  return options;
}

// ──────────────────────────────────────────────────────────
// Reporters: CI gets all formats, local dev gets lightweight set
// ──────────────────────────────────────────────────────────

const ciReporters: PlaywrightTestConfig['reporter'] = [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['./tools/playwright-smart-reporter/dist/smart-reporter.js', getSmartReporterOptions()],
];

const localReporters: PlaywrightTestConfig['reporter'] = [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['./tools/playwright-smart-reporter/dist/smart-reporter.js', getSmartReporterOptions()],
];

// Linux CI (GitHub Actions, Circle) expects *-chromium-linux.png; baselines in repo were captured on Windows
// (*-chromium-win32.png). Point screenshot paths at the committed Windows baselines so comparisons run instead of
// failing on missing files. Prefer adding dedicated Linux baselines later if pixel drift becomes noisy.
const chromiumSnapshotPathTemplateOnLinuxCi =
  process.env['CI'] && process.platform === 'linux'
    ? ('{testDir}/{testFilePath}-snapshots/{arg}-chromium-win32{ext}' as const)
    : undefined;

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/wip-*', '**/explore-*', '**/scratch-*', '**/template-*.spec.ts'],
  outputDir: 'test-results',
  timeout: 30_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : 1,
  reporter: process.env['CI'] ? ciReporters : localReporters,
  metadata: {
    env: testEnv,
  },
  use: {
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    baseURL: process.env['APP_URL'] || 'http://localhost:5273',
  },
  projects: [
    // ── Coffee Cart ────────────────────────────────────────

    // Auth setup (each file runs only its own auth)
    {
      name: 'user-setup',
      testDir: 'tests/coffee-cart',
      testMatch: 'auth.user.setup.ts',
    },
    {
      name: 'admin-setup',
      testDir: 'tests/coffee-cart',
      testMatch: 'auth.admin.setup.ts',
    },

    // Browser projects (depend on user auth setup)
    // testIgnore excludes API specs — those run in 'chromium-api' with workers=1
    // to avoid race conditions on the globally shared server-side cart.
    {
      name: 'chromium',
      testDir: 'tests/coffee-cart',
      testIgnore: ['**/api/**'],
      grepInvert: /@responsive/,
      ...(chromiumSnapshotPathTemplateOnLinuxCi
        ? { snapshotPathTemplate: chromiumSnapshotPathTemplateOnLinuxCi }
        : {}),
      use: {
        ...devices['Desktop Chrome'],
        storageState: StorageStatePaths.USER,
      },
      dependencies: ['user-setup'],
    },
    {
      name: 'chromium-api',
      testDir: 'tests/coffee-cart/api',
      use: {
        ...devices['Desktop Chrome'],
        storageState: StorageStatePaths.USER,
      },
      dependencies: ['user-setup'],
    },
    {
      name: 'firefox',
      testDir: 'tests/coffee-cart',
      testIgnore: ['**/api/**'],
      grepInvert: /@responsive/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: StorageStatePaths.USER,
      },
      dependencies: ['user-setup'],
    },
    {
      name: 'webkit',
      testDir: 'tests/coffee-cart',
      testIgnore: ['**/api/**'],
      grepInvert: /@responsive/,
      use: {
        ...devices['Desktop Safari'],
        storageState: StorageStatePaths.USER,
      },
      dependencies: ['user-setup'],
    },

    {
      name: 'mobile-chrome',
      testDir: 'tests/coffee-cart',
      testIgnore: ['**/api/**'],
      grep: /@responsive/,
      use: {
        ...devices['Pixel 7'],
        storageState: StorageStatePaths.USER,
      },
      dependencies: ['user-setup'],
    },

    // Admin project (uses admin storage state)
    {
      name: 'chromium-admin',
      testDir: 'tests/coffee-cart',
      grepInvert: /@responsive/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: StorageStatePaths.ADMIN,
      },
      dependencies: ['admin-setup'],
      testMatch: ['**/admin-dashboard.spec.ts', '**/admin-workflow.spec.ts'],
    },

    // ── Sauce Demo ─────────────────────────────────────────

    // No auth setup needed — tests authenticate through the login flow
    {
      name: 'sauce-demo',
      testDir: 'tests/sauce-demo',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: optionalEnvString('SAUCE_DEMO_URL', 'https://www.saucedemo.com'),
        // Sauce Demo uses data-test attributes (not the default data-testid)
        testIdAttribute: 'data-test',
      },
    },
  ],
});
