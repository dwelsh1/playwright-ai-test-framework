# Changelog

## [1.8.3] - 2026-04-11

### Changed

- **`playwright-cli-select`** **1.0.10**.
- **`@typescript-eslint/eslint-plugin`** and **`@typescript-eslint/parser`** **^8.58.1**.

### Fixed

- **`playwright.config.ts`** — Sauce Demo **`baseURL`** uses **`optionalEnvString()`** so blank **`SAUCE_DEMO_URL`** still falls back to the default host without triggering **`@typescript-eslint/prefer-nullish-coalescing`** on **`||`**.

---

## [1.8.2] - 2026-04-11

### Changed

- **`@playwright/test`** **^1.59.1** and **`@playwright/cli`** **^0.1.6** (latest on npm at upgrade time; **1.59.0** is superseded by **1.59.1**).
- **`mcr.microsoft.com/playwright`** Docker image tags aligned to **`v1.59.1-noble`** (`.devcontainer/`, CircleCI, docs).
- **`tools/playwright-smart-reporter`** — devDependency **`@playwright/test`** aligned to **^1.59.1** with refreshed lockfile.
- **`package.json`** repository, homepage, and bugs URLs → **`github.com/dwelsh1`**.

### Fixed

- **`npm audit`** — transitive fixes applied at the **repo root** (**0** vulnerabilities). The **`tools/playwright-smart-reporter`** subpackage still reports **moderate** issues in **`vitest` / `vite`** (fix would require **`npm audit fix --force`** / major **`vitest`** bump — unchanged).

---

## [1.8.1] - 2026-04-10

### Changed

- GitHub Actions: pull-request smoke runs the **`sauce-demo`** project against the public site; Coffee Cart regression, merge-reports, and quarantine stay on **`main`** push and nightly schedule. Regression jobs clone Coffee Cart, install `build-essential` for `better-sqlite3`, and start API + Vite (Linux-safe; `npm start` remains Windows-only upstream).
- `playwright.config.ts` — Sauce Demo `baseURL` treats blank `SAUCE_DEMO_URL` as unset so the default host still applies.
- `.gitignore` — ignore `.claude/settings.local.json`; file removed from version control (remains on disk locally).

### Fixed

- GitHub Actions: `merge-reports` no longer runs on pull requests when regression shards are skipped (avoids missing blob directory failures).

### Documentation

- `docs/developer.md`, `docs/usage/docker-usage.md`, `docs/framework-cheatsheet.md`, and `docs/framework-assessment.md` updated to match the CI behavior above.
- `ci-cd` skill and GitHub Copilot agent mirror — repo-specific Actions summary plus sync.
- **Lean POM** terminology aligned across README, `CLAUDE.md`, `.cursor/rules`, `page-objects` / related skills, `docs/`, and regenerated `.github/agents` (rule renamed **No Feedback-Less Lean POM**).

---

## [1.8.0] - 2026-04-09

### Added

- `LICENSE` — MIT license added for public repository readiness.
- `CONTRIBUTING.md` — contributor guidance covering setup, framework expectations, validation steps, docs/skills sync, and PR hygiene.
- `.cursor/skills/trust-but-verify/` and `.claude/skills/trust-but-verify/` — repo-specific manual verification skill plus a shared report template for post-implementation UI verification.
- `.github/agents/trust-but-verify.md` — GitHub Copilot mirror of the new verification skill, generated from the canonical Cursor skill.
- `docs/verification/README.md` — conventions for verification reports, screenshot storage, and commit guidance.
- `docs/testing/skills-testing.md` — manual testing guide for all framework skills, including negative tests and a dedicated `skill-creator` evaluation flow.
- `.vscode/extensions.json` — recommended workspace extensions for Playwright, ESLint, and Prettier.

### Changed

- Project identity updated from `my-pw-ai-framework` / "Playwright AI Assisted Framework" to `playwright-ai-test-framework` / "Playwright AI Test Framework" across package metadata, public docs, and repository URLs.
- `package.json` — release metadata expanded for GitHub publication: repository/homepage/bugs URLs, MIT license, author, and framework keywords. Script naming was also streamlined around clearer environment and smart-reporter helpers.
- `README.md`, `docs/developer.md`, `docs/framework-assessment.md`, `docs/framework-onboarding.md`, `docs/framework-cheatsheet.md`, `docs/learning-framework.md`, and related usage docs were refreshed to match the current framework shape, terminology, task list, and skill set.
- `docs/usage/skills-guide.md` was upgraded from a simple catalog into a full skills usage playbook with trigger guidance, companion-skill recommendations, and example prompts for all 35 skills.
- `docs/usage/skill-creator-usage.md` and `docs/usage/skill-prompt-examples.md` were expanded so skill creation, evaluation, and prompting are documented as first-class workflows.
- `.vscode/tasks.json` — standardized around the current 15-task set for common runs, reports, linting, type-checking, `playwright-cli` launchers, and process cleanup.
- `scripts/open-smart-report.cjs` — now resolves named smart-report outputs correctly so local `npm test` completes cleanly even when the generated report file is not the default `smart-report.html`.
- `scripts/kill-test-processes.ps1` — updated to work during the repository rename transition by recognizing both the old and new repo names.

### Fixed

- Remaining docs were aligned with the `api` fixture terminology instead of older `apiRequest` references in end-user examples.
- GitHub agent mirrors were re-synced after skill and documentation updates so Cursor, Claude, and GitHub Copilot stay aligned.

---

## [1.7.0] - 2026-03-26

### Added

- `.vscode/tasks.json` — 24 named VS Code tasks covering all test runs, reports, lint, format, scaffold, env check, auth reset, clean, and kill; runnable via Ctrl+Shift+P → Tasks: Run Task.
- `.vscode/playwright.code-snippets` — 26 framework-compliant TypeScript snippets with tab stops and choice pickers; prefixes: `pwtest`, `pwt`, `pwd`, `pwimport`, `pom`, `ge`, `pwaction`, `req`, `rou`, `pwa11y`, `pwvisual`, `pwe2e`, `pwschema`, `pwfactory`, `pwgiven`, `pwwhen`, `pwthen`, `pwand`, `pwts`, `pwbeforeeach`, `pwaftereach`, `pwresponse`, `cl`, `exv`, `exe`.
- `docs/framework-cheatsheet.md` — two-page dense quick-reference covering all npm commands, test tags, selector priority, templates, fixture list, data strategy, Zod rules, Must/Must Not table, and VS Code snippet prefixes.
- `docs/usage/dev-container.md` — step-by-step VS Code Dev Container setup guide for Jr QA Engineers with no Docker experience; covers named volumes, port forwarding, stopping/rebuilding, and CRLF troubleshooting.
- `docs/usage/docker-usage.md` — what Docker is, how the CI pipeline uses it, the Playwright Docker image, the Dockerfile explained line-by-line, and how to read CI log messages.
- Cypress framework design documentation describing how to mirror this framework's quality model in Cypress, including feature mapping, limitations, workarounds, and AI-skill adaptation.
- CI visibility gap documentation covering PR comments, GitHub check annotations, CI run links in Smart Reporter, and Slack notifications on nightly failure.

### Changed

- `docs/framework-assessment.md` — updated to v1.7.0; §9 Reporting expanded with percentile metrics, defect leakage, build context filters, artifact downloads, console log capture, accessibility nav view, artifact cleanup, CI metadata bar, and CI Visibility audit reference; §11 guide count updated to 23; `dev-container.md` and `docker-usage.md` added to guide list; §12 No Substitute UI Exploration enforcement noted; VS Code tasks and snippets added to metrics table and §11; conclusion updated.
- `docs/framework-assessment.md` — framework version header updated to 1.7.0.
- `docs/framework-onboarding.md` — VS Code tasks and snippets callout added to Next Steps; Further reading table updated.
- `docs/learning-framework.md` — framework cheatsheet added as Stage 1 entry 2d; VS Code row added to Quick Reference table.
- `docs/developer.md` — VS Code Tasks and Snippets subsection added under Dev Container.
- `README.md` — Framework Cheatsheet added to All documents table; version updated to 1.7.0.
- Accessibility violation tracking notes and Smart Reporter split notes were reorganized during the documentation cleanup.
- `package.json` — version bumped to `1.7.0`.

---

## [1.6.5] - 2026-03-26

### Added

- `tools/playwright-smart-reporter` — **Defect Leakage tracking (Phase 1, offline)**: tests annotated with `{ type: 'issue', description: 'PROJ-123' }` (or a full URL) now surface issue badges directly on test cards. A `🐛 Defects` row appears in the Overview mini-comparison card when there are failures, showing `untracked / total failures (X% leakage)` or `✓ All tracked` when every failure has a linked issue. Purely offline — no external API calls.
- `tools/playwright-smart-reporter/src/types.ts` — `LinkedIssue` interface (`ref`, `resolvedUrl?`); `linkedIssues?: LinkedIssue[]` on `TestResultData`; `untrackedFailures?` and `leakageRate?` on `RunSummary` (reserved for Phase 2 history persistence).
- `tools/playwright-smart-reporter/src/generators/html/styles.ts` — `.issue-badge` (indigo pill, monospace) and `.leakage-rate-row` / `.defects` bar CSS.

### Changed

- `tools/playwright-smart-reporter/src/smart-reporter.ts` — `onTestEnd` now parses all `type: 'issue'` annotations into a `LinkedIssue[]`; `resolvedUrl` set when description starts with `http`.
- `tools/playwright-smart-reporter/src/generators/card-generator.ts` — `issue` type excluded from generic annotation badges; new `issueBadgesHtml` renders `[#ref]` badges: click opens URL (when a full URL was given) or copies the ref to clipboard.
- `tools/playwright-smart-reporter/src/generators/html/overview.ts` — computes defect leakage from `results`; adds `🐛 Defects` row to the mini-comparison card (hidden when no failures).
- Defect leakage tracking notes updated to **Phase 1 Complete**.
- `docs/todo.md` — Priority 5 Phase 1 marked ✅ Complete.
- `package.json` — version bumped to `1.6.5`.

---

## [1.6.4] - 2026-03-26

### Added

- `tools/playwright-smart-reporter` — **Artifact file retention/cleanup**: `cleanOrphanedArtifacts()` in `smart-reporter.ts` runs on each `onEnd()` and deletes orphaned `screenshot-*.{png,jpg}` and `traces/*.zip` files from the output directory that are not referenced by the current run. New `artifactRetentionRuns` reporter option (default `1`; set to `0` to disable cleanup entirely).
- `tools/playwright-smart-reporter` — **Bulk ZIP download**: every test card with screenshots, traces, or inline custom attachments shows a `⬇ Download Artifacts (ZIP)` button. The export menu now includes a `📦 Failures ZIP` item that downloads a single ZIP of all failing-test artifacts. Powered by JSZip (always loaded, no longer gated on `enableTraceViewer`).
- `tools/playwright-smart-reporter` — **Console logs via fixture annotation**: `helpers/util/console-log-fixture.ts` captures `page.on('console')` events into `testInfo.annotations` with `type: 'console-log'`. The reporter renders a collapsible `💬 Console Logs` panel on test cards with per-level badges (`log`, `info`, `warn`, `error`, `debug`).
- `helpers/util/console-log-fixture.ts` (new) — opt-in `captureLogs` auto-fixture; extend `test` from this file to enable in any spec.
- `tools/playwright-smart-reporter` — **HAR export**: a `⬇ HAR` button in the Network Logs section header downloads a HAR 1.2–compliant JSON file built from `networkLogsData` for the selected test.
- `tools/playwright-smart-reporter` — **Browser version + OS in environment info**: CI info bar now shows Node.js version, platform, and Playwright version on all runs (local and CI). `CIInfo` extended with `nodeVersion?`, `platform?`, `playwrightVersion?`; populated in `onBegin` from `process.version`, `process.platform`, and `@playwright/test/package.json`.

### Changed

- `tools/playwright-smart-reporter/src/types.ts` — `CIInfo` extended with `nodeVersion`, `platform`, `playwrightVersion`; `ConsoleLogEntry` interface added; `artifactRetentionRuns?: number` added to `SmartReporterOptions`.
- `tools/playwright-smart-reporter/src/generators/html-generator.ts` — `screenshotsData` and `networkLogsData` injected as global `const` declarations before `generateScripts()` so the client-side download helpers have access to base64 screenshots and network entries stripped from `lightenedResults`; CI info bar extended with environment metadata; JSZip unconditionally loaded.
- `tools/playwright-smart-reporter/src/generators/card-generator.ts` — `generateNetworkLogsSection` receives `testId` param for HAR button; ZIP download button appended after custom attachments; console logs panel added before network logs.
- `tools/playwright-smart-reporter/src/generators/html/scripts.ts` — `triggerDownload`, `sanitizeForFilename`, `downloadTestArtifacts`, `downloadAllFailuresZip`, `downloadHar`, `toggleConsolePanel` functions added.
- `tools/playwright-smart-reporter/src/generators/html/styles.ts` — console log panel CSS (`.collapsible-label`, `.console-log-panel`, `.console-entry`, `.console-level` variants), download button CSS (`.download-zip-btn`, `.download-har-btn`).
- `docs/todo.md` — Priority 4 marked ✅ Done.

---

## [1.6.3] - 2026-03-26

### Added

- `tools/playwright-smart-reporter/src/utils/math.ts` (new) — `computePercentile(sortedValues, p)` using nearest-rank method.
- `tools/playwright-smart-reporter` — **Percentile duration metrics per test**: p50, p90, p95 computed from `TestHistoryEntry[]` for each test (requires ≥ 3 history entries). Shown in a Duration Stats row (p50 / p90 / p95) in the test detail card. A `p90 exceeded` badge appears when the current run's duration is above p90. `durationBudgetMs` reporter option: shows a red `Over budget` badge when a test's p90 exceeds the threshold.
- `tools/playwright-smart-reporter` — **Slowest Tests top-5 in Overview**: replaces the single slowest test with a ranked list of the 5 slowest tests sorted by p90 (falling back to average then current duration). Each row shows p90, last run duration, and an `Over budget` badge when applicable.
- `tools/playwright-smart-reporter` — **p90 per-test Duration trend chart**: a fifth trend chart (cyan `#06b6d4`) shows the p90 Duration trend per run with an optional dashed horizontal reference line when `durationBudgetMs` is set.
- `tools/playwright-smart-reporter` — **Run-level percentiles**: `RunSummary` now stores `p50Duration`, `p90Duration`, `p95Duration` (p-values across all individual test durations in the run). Computed in `history-collector.ts` during `updateHistory()`.

### Changed

- `tools/playwright-smart-reporter/src/types.ts` — `p50Duration`, `p90Duration`, `p95Duration` added to `TestResultData` and `RunSummary`; `durationBudgetMs?: number` added to `SmartReporterOptions`; `PerformanceAnalysis` extended with percentile fields.
- `tools/playwright-smart-reporter/src/analyzers/performance-analyzer.ts` — regression baseline changed from mean to p50; p50/p90/p95 computed and stored on `TestResultData`.
- `tools/playwright-smart-reporter/src/generators/html/overview.ts` — `durationBudgetMs` param added; Slowest Tests section updated to top-5 list with p90 and budget badge.
- `tools/playwright-smart-reporter/src/generators/chart-generator.ts` — `referenceLine?` param on `generateBarChart`; p90 Duration trend chart (chart 5) added.
- `tools/playwright-smart-reporter/src/collectors/history-collector.ts` — run-level p50/p90/p95 computed from all test durations; `durationBudgetMs` and `artifactRetentionRuns` added to options allowlist.
- `tools/playwright-smart-reporter/src/generators/html-generator.ts` — `generateOverviewContent` and `generateTrendChart` call sites updated to pass `durationBudgetMs`.
- `tools/playwright-smart-reporter/src/generators/html/styles.ts` — `.duration-stats-row`, `.p90-exceeded-badge`, `.budget-exceeded-badge` CSS added.
- Percentile metrics work updated to **Complete**.
- `docs/todo.md` — Priority 3 marked ✅ Done.

---

## [1.6.2] - 2026-03-26

### Added

- `tools/playwright-smart-reporter` — **Browser filter chip in Tests tab**: BUILD filter group now includes a Browser chip row. Clicking a browser chip (e.g. `chromium`, `firefox`, `webkit`) filters the test list to that browser. All test card elements carry a `data-browser` attribute. Teal accent colour distinguishes browser chips from branch/env chips.
- `tools/playwright-smart-reporter` — **Release version chip in Tests tab**: `data-release` attribute added to test elements; release chips appear in the BUILD filter group when multiple release versions exist across the run.
- `tools/playwright-smart-reporter` — **Branch and environment chips extend to all views**: the branch and environment filter state now persists when switching between Overview, Tests, Trends, and Comparison views. `data-branch` and `data-env` attributes present on all test elements.
- `tools/playwright-smart-reporter` — **Saved view persistence for new filter dimensions**: browser, release, and extended build-context filters are included in saved view serialisation and localStorage persistence.

### Changed

- `tools/playwright-smart-reporter/src/generators/html-generator.ts` — `projectDataAttrs` extended with `data-browser`, `data-branch`, `data-env`, `data-release`; BUILD filter section renders browser and release chip rows.
- `tools/playwright-smart-reporter/src/generators/html/scripts.ts` — `applyFilters()` handles browser and release filter sets.
- `tools/playwright-smart-reporter/src/generators/html/styles.ts` — teal accent for browser chips (`.filter-chip.browser-chip`).
- Build-context filter work updated to **Complete**.
- `docs/todo.md` — Priority 2 marked ✅ Done.

---

## [1.6.1] - 2026-03-26

### Added

- `tools/playwright-smart-reporter` — **History filter UI**: BUILD filter chips (branch, environment) now also apply to the Trends view. Each bar in the 4 trend charts carries `data-branch` and `data-env` attributes; the client-side `filterTrendBars()` function dims non-matching bars and shows a blue banner indicating the active filter context. History-derived chips (populated from `history.summaries[].metadata.build`) appear in the BUILD group when ≥2 distinct values exist across historical runs.
- `tools/playwright-smart-reporter` — **Stable test identity — alias map**: `HistoryCollector` now reads `test-history-aliases.json` (co-located with `test-history.json`) on startup and rewrites old test ID keys to their new IDs. When both old and new IDs exist (partial migration), entries are merged, sorted by timestamp, and pruned to `maxHistoryRuns`. Missing or malformed alias files are silently ignored.
- `tools/playwright-smart-reporter` — **Stable test identity — fuzzy title-only fallback**: when a test's exact history key is missing but exactly one history entry shares the same title and project prefix under a different file path, the history is automatically recovered and a warning is printed suggesting an alias entry. Ambiguous matches (multiple titles) are skipped to prevent false positives.
- `scripts/history-alias.cjs` — CLI utility to add/update a test ID alias in `playwright-report/test-history-aliases.json` after renaming or moving a test. Validates `--from` against `test-history.json` and is idempotent.
- `package.json` — added `history:alias` script: `node scripts/history-alias.cjs`.

### Changed

- `tools/playwright-smart-reporter/src/generators/chart-generator.ts` — bar `<g>` elements in `generateBarChart` now carry `data-branch` and `data-env` attributes from `RunSummary.metadata.build` for client-side filter targeting.
- `tools/playwright-smart-reporter/src/generators/html-generator.ts` — BUILD filter section now includes history-derived branch and environment chips. Guard updated to also skip the section when both chip sets are empty.
- `tools/playwright-smart-reporter/src/generators/html/scripts.ts` — `applyFilters()` and `switchView()` now call `filterTrendBars()`; added `filterTrendBars()` and `updateTrendFilterBanner()` functions.
- `tools/playwright-smart-reporter/src/generators/html/styles.ts` — added `.filter-sub-hint`, `.filter-chip.branch-chip`, `.filter-chip.env-chip`, and `.trend-filter-banner` CSS rules.
- History filter and alias work updated to **Complete**.

## [1.6.0] - 2026-03-26

### Added

- `fixtures/accessibility/a11y-fixture.ts` — extended with `axe-violation-rules` annotation that captures a JSON array of `{ id, impact }` tuples for every axe rule that fired. Used by the Smart Reporter Accessibility view. Also added teardown that writes a per-test artifact (`test-results/axe-results/{testId}.json`) for each scanned test, enabling CI parsing without race conditions from parallel workers.
- `scripts/merge-axe-results.cjs` — merges all per-test `test-results/axe-results/*.json` files into a single `test-results/axe-results.json` artifact sorted alphabetically by test title. Designed for CI tooling (DataDog, Grafana, PR comment bots). No-op if no axe results exist.
- `tools/playwright-smart-reporter` — **♿ Accessibility nav item** in the Smart Reporter sidebar. Only appears when at least one test has been scanned with `a11yScan()`. Shows:
  - Summary bar: total violations, tests scanned, tests with violations, clean tests
  - Rule breakdown table: each axe rule that fired, its worst impact level, and how many tests it affected
  - Affected test list with "View test →" shortcut link
  - Cross-run trend chart (Chart.js) showing total axe violations per run (appears when ≥ 2 history entries have axe data)
- `tools/playwright-smart-reporter` — **♿ badge on test cards**: green `✓` when a test was scanned and found clean; red violation count badge when violations were detected. Replaces the generic `📌 axe-violations` annotation badge.
- `tools/playwright-smart-reporter/src/analyzers/axe-annotation-analyzer.ts` — `AxeAnnotationAnalyzer` class that reads `axe-violations` and `axe-violation-rules` annotations from `TestResultData`, aggregates rule breakdown, violating test list, and cross-run trend from `RunSummary` history.
- `package.json` — added `report:axe` script: `node scripts/merge-axe-results.cjs`.

### Changed

- `tools/playwright-smart-reporter/src/types.ts` — added `axeViolations?: number` to `TestHistoryEntry`; added `totalAxeViolations?`, `a11yTestedCount?`, `a11yViolatingCount?` to `RunSummary`; added `A11yRuleEntry`, `A11yTestSummary`, `A11yAnalysis` interfaces.
- `tools/playwright-smart-reporter/src/collectors/history-collector.ts` — persists `axeViolations` on each `TestHistoryEntry` and computes `totalAxeViolations`, `a11yTestedCount`, `a11yViolatingCount` aggregates on `RunSummary`.
- `tests/coffee-cart/functional/accessibility.spec.ts` — `[DEMO] a11ybreak param produces detectable WCAG violations` now manually pushes `axe-violations` and `axe-violation-rules` annotations after calling `analyze()` directly, so the demo test feeds the Smart Reporter Accessibility view and per-test JSON artifacts.
- `package.json` — version bumped to `1.6.0`.

## [1.5.9] - 2026-03-24

### Added

- `helpers/coffee-cart/price.helper.ts` — `formatPrice(amount)` formats a numeric dollar value to the `"$X.XX"` string the Coffee Cart UI displays. Combines with `CoffeePrices` enum values for exact cart total assertions.
- `helpers/util/clipboard.ts` — `readClipboard(page)` reads the browser clipboard text content. For asserting "Copy" button interactions. Requires `clipboard-read` permission granted on the browser context.
- `helpers/util/download.ts` — `readDownloadAsText(download)` reads a Playwright `Download` as a UTF-8 string. For asserting exported file content (CSV, JSON, TXT).
- `docs/usage/helpers-usage.md` — full reference guide for the `helpers/` folder: what each function does, when to use it, the helper vs fixture vs page object decision table, and historical context for removed dead code.

### Changed

- `tests/coffee-cart/functional/cart.spec.ts` — added `'Cart — Exact Price Calculation'` describe block: uses `api` fixture to set up a known cart state (2 × Espresso + 1 × Cappuccino), then asserts the exact total using `formatPrice(2 * CoffeePrices.ESPRESSO + CoffeePrices.CAPPUCCINO)` = `"$16.50"`.
- `README.md` — added Helpers Reference Guide to Documentation table.
- `docs/learning-framework.md` — added Helpers Reference Guide as item 18 in Stage 5; renumbered Stage 6 items (19–22); added Quick Reference entry.

### Removed

- `helpers/coffee-cart/auth.helper.ts` — `authenticateUser()` and `saveStorageState()` were never imported anywhere. Auth setup uses Playwright's native `page.context().storageState()` approach and does not need these functions.
- `helpers/util/util.ts` — `formatDate()` was never imported anywhere. Removed to keep the helpers folder clean.

## [1.5.8] - 2026-03-24

### Added

- `scripts/check-env.cjs` — pre-flight environment check: verifies `env/.env.dev` exists, Smart Reporter dist is built, `.auth/` is present, and Coffee Cart ports 5273/3002 are reachable. Run via `npm run check:env`.
- `scripts/reset-auth.cjs` — deletes all JSON files inside `.auth/` to force auth storage state regeneration on the next run. Run via `npm run reset:auth`.
- `scripts/clean.cjs` — removes `test-results/`, `playwright-report/`, and `.auth/` in one command. Run via `npm run clean`.
- `scripts/report-summary.cjs` — reads `test-results/results.json` and prints a compact passed/failed/skipped/flaky count summary to the terminal. Run via `npm run report:summary`.
- `docs/usage/scripts-usage.md` — full reference guide for every script in `scripts/`: purpose, when to run, npm command, and historical context for changes made.
- `package.json` — added `check:env`, `reset:auth`, `clean`, `detect:flaky`, and `report:summary` npm scripts.

### Changed

- `scripts/install-playwright-cli-browsers.sh` — replaced full installer with a thin wrapper that delegates to `install-playwright-cli-browsers.js`, eliminating duplicate logic.
- `scripts/setup.sh` — removed Python 3.11+ installation step (step 4 of 6); setup is now 5 steps. Python is not required by modern Playwright.
- `README.md` — added five new utility commands to the Utilities table; added Scripts Reference Guide to the Documentation table.
- `docs/learning-framework.md` — added Scripts Reference Guide (item 21) to Stage 6 and Quick Reference table.
- `package.json` — version bumped to `1.5.8`.

## [1.5.7] - 2026-03-24

### Added

- `docs/usage/coffee-cart-app.md` — Jr QA guide covering: what Coffee Cart is, how to start it (ports 5273/5273), all UI pages and REST API endpoints in reference tables, how tests connect via `config.apiUrl`, all test types and page objects covered, running commands by type and tag, auth setup and default credentials, the `?a11ybreak=1` and `?visualbreak=1` demo break parameters, and common mistakes.
- `docs/usage/sauce-demo-app.md` — Jr QA guide covering: what Sauce Demo is, no local setup required, all six built-in test users and their behaviours, app pages table, all three page objects with fixture names, `sauceDemoConfig` and `Routes`/`ProductNames`/`ProductPrices` enums, running commands, the credentials factory with override examples, and common mistakes.

### Changed

- Smart Reporter header text: "StageWright Local / Get your test stage right." → "Smart Reporter / Get your test results right." (rebuilt dist).
- Removed Allure reporting: `allure-playwright` devDependency, `test:allure` and `report:allure` npm scripts, Allure entry from `playwright.config.ts` CI reporters, `allure-results/` and `allure-report/` from `.gitignore` and `.prettierignore`.
- `README.md` — removed `test:allure`/`report:allure` table rows; updated CI reporters description and Configuration table; added Coffee Cart and Sauce Demo app guide entries.
- `docs/developer.md` — removed Allure from reporters table and single-reporter script examples; updated description from "all six" to "five" CI reporters.
- `docs/roadmap.md` — updated Reporting checkboxes to reflect Allure removal.
- `docs/framework-assessment.md` — updated report format count from 6 to 5; updated Section 11 guide count to 21.
- `docs/learning-framework.md` — added Stage 2b for the two new app guides; added Coffee Cart and Sauce Demo to Quick Reference table.
- `package.json` — version bumped to `1.5.7`.

## [1.5.6] - 2026-03-24

### Added

- `docs/usage/network-mocking.md` — Jr QA guide covering: when to mock vs use the real backend, all six `networkMock` fixture methods (`simulateServerError`, `simulateTimeout`, `goOffline`, `goOnline`, `blockRequests`, `mockJsonResponse`), URL pattern syntax, restoring the network within a test, a complete worked example with two tests, and common mistakes.
- `docs/usage/writing-e2e-tests.md` — Jr QA guide covering: E2E vs functional test comparison table, when to write E2E tests, test anatomy with `afterEach` cleanup, the `@destructive` tag and what cleanup is required, multi-role journeys with user→admin switching, combining multiple page objects, factories for E2E data, keeping E2E tests stable, and common mistakes.
- `docs/usage/multi-environment-testing.md` — Jr QA guide covering: the three environments (dev, staging, production), how `.env` files configure each environment, npm scripts for staging/production runs, the `config` object and URL construction, skipping tests per environment, environment-specific credentials, which tags run in each environment, CI pipeline environment strategy, and adding a new environment variable.
- `docs/learning-framework.md` — Six-stage learning path for Jr QA Engineers covering all documentation from first-time setup through advanced topics; includes a quick-reference table by topic for experienced engineers who need a specific guide without following the full path.

### Changed

- `README.md` Documentation table — added six new entries: Authentication & Storage State, Multi-Environment Testing, Accessibility Testing, Flaky Test Management, Network Mocking, Writing E2E Journey Tests, and the new Learning Path guide.
- `package.json` — version bumped to `1.5.6`.

## [1.5.5] - 2026-03-24

### Added

- `docs/usage/test-data-factories.md` — Jr QA guide covering: why not to hardcode, factory functions vs static JSON, calling factories inside tests (not at module level), overrides pattern, all checkout factory functions with examples, static JSON file format and `for...of` loop pattern, and decision table for choosing factory vs static.
- `docs/usage/understanding-fixtures.md` — Jr QA guide covering: what a fixture is, the one import rule, every page object and component fixture with type table, the `api` fixture (all methods, `data` option, reading responses), helper fixtures (`createdOrder`, `seededCart`) with lifecycle explanation, `a11y` fixture, `networkMock` fixture, combining fixtures, the merge chain in `test-options.ts`, and common mistakes.
- `docs/usage/writing-api-tests.md` — Jr QA guide covering: what API tests verify, generating the stub, anatomy of an API spec, URL construction from `config` + enums, all `api` fixture methods with examples, Zod schema validation pattern, status code coverage strategy, `for...of` loop for invalid inputs from static JSON, serial mode + `beforeEach`/`afterEach` for stateful endpoints, a complete worked example, and common mistakes.

### Changed

- `README.md` Documentation table — added three new Jr QA usage guide entries.
- `package.json` — version bumped to `1.5.5`.

## [1.5.4] - 2026-03-24

### Added

- `docs/usage/playwright-smart-reporter.md` — expanded from a brief reference into a full Jr QA usage guide: 13 sections covering report layout, reading passing and failing tests, step timeline, trace viewer (with serve vs open distinction), AI fix suggestions, test history and trends, settings UI (three tabs), LM Studio local AI setup, persistent configuration, troubleshooting table, and common mistakes table.

### Changed

- Smart Reporter integration, settings, and vendored implementation notes were reorganized during earlier documentation cleanup.
- Moved `docs/smart-reporter/playwright-smart-reporter.md` to `docs/usage/` alongside the other Jr QA usage guides.
- Deleted empty `docs/smart-reporter/` folder.
- `README.md` Documentation table — added Smart Reporter Usage Guide entry.
- `package.json` — version bumped to `1.5.4`.

## [1.5.3] - 2026-03-24

### Added

- `docs/usage/debugging-failing-tests.md` — 9-section guide for Jr QA Engineers covering: reading error messages, headed mode, trace viewer (tabs in order), Playwright Inspector / PWDEBUG, UI mode, common error messages decoded table, CI artifact workflow, anti-patterns (waitForTimeout, inflated timeouts, commenting out assertions), and a before-you-ask checklist.
- `docs/usage/playwright-cli-exploration.md` — guide covering: why to explore before writing selectors, opening pages, reading snapshots, translating snapshot roles/names to Playwright locators, interacting with the page, following a full user flow, exploring auth-required pages, saving state between sessions, and common mistakes.
- `docs/usage/creating-a-page-object.md` — step-by-step guide covering: page object anatomy, pre-exploration with playwright-cli, file creation, class skeleton, locator patterns with selector priority table, action methods with JSDoc rules, fixture registration (both files), using the fixture in a test, component composition, and common mistakes.
- `docs/usage/visual-regression-baselines.md` — guide covering: how toHaveScreenshot works, running visual tests, creating first-time baselines, reading failure output (expected/actual/diff), updating baselines after intentional changes, masking dynamic content, baseline file storage and naming conventions, CI/Linux baseline strategy, and common mistakes.

### Changed

- `README.md` Documentation table — added four new Jr QA usage guide entries.
- `package.json` — version bumped to `1.5.3`.

## [1.5.2] - 2026-03-24

### Added

- `scripts/templates/` — three framework-compliant test templates:
  - `functional.spec.ts.tpl` — UI feature test with `beforeEach`, `test.describe`, and GWT steps
  - `api.spec.ts.tpl` — API test with schema import and single `test.step` call
  - `e2e.spec.ts.tpl` — end-to-end journey test with GWT steps
- `scripts/generate-test.sh` — populates a template from `--type`, `--area`, and `--name` flags; title-cases area/name tokens; validates type; guards against overwriting existing files; prints next steps.
- `scripts/onboard.sh` — 6-step interactive walkthrough: pre-flight app check, smoke tests, a11y tests, visual regression tests, Smart Reporter orientation, `playwright-cli` exploration, and test generator demo.
- `npm run generate:test` and `npm run onboard` scripts in `package.json`.

### Changed

- `docs/developer.md` — added "Generating a test stub" and "Interactive onboarding" sub-sections under Running Tests; added both to the Table of Contents.
- `docs/framework-onboarding.md` — Step 7 (Next Steps) now references `npm run generate:test` with a copy-paste example; added onboard tip at the bottom.
- `README.md` Utilities table — added `generate:test` and `onboard` entries.
- `docs/roadmap.md` — checked off test generation templates and interactive onboarding script.
- Roadmap completion work items 2 and 3 marked ✅ Done.

## [1.5.1] - 2026-03-24

### Added

- `scripts/detect-flaky.js` — post-run script that parses `test-results/results.json` and writes `test-results/flaky-tests.json` listing tests that failed on attempt 1 but passed on a later retry. Runs with `continue-on-error: true`; always produces output (empty array when no flaky tests detected).
- `quarantine` job in `.github/workflows/playwright.yml` — runs `@flaky`-tagged tests on push/nightly with 3 retries and `continue-on-error: true`. Uploads `quarantine-report` artifact (7-day retention).
- `quarantine-tests` job in `.circleci/config.yml` — same pattern for CircleCI nightly workflow.
- Flaky detection step in `merge-reports` job (GitHub Actions) and `regression-tests` job (CircleCI): generates `flaky-tests.json` and uploads as `flaky-report` artifact.

### Changed

- `.github/workflows/playwright.yml` `merge-reports` — now runs two merge passes: HTML and JSON (stdout redirected to `test-results/results.json`) so `detect-flaky.js` has data to parse.
- `.circleci/config.yml` regression job — reporter changed from `list,junit` to `list,junit,json` to produce `results.json` for flaky detection.
- `CLAUDE.md` and `.cursor/rules/rules.mdc` No Multiple Tags rule — `@flaky` added to the allowed secondary-tag list alongside `@destructive`.
- `docs/developer.md` CI/CD section — updated pipeline tables, added Flaky test workflow section and `flaky-report`/`quarantine-report` to the Artifacts list.

## [1.5.0] - 2026-03-24

### Added

- `tests/coffee-cart/functional/accessibility.spec.ts` — `login form is keyboard operable` test (LT-4): tabs through Email → Password → Sign in, asserts focus order, then submits with Enter and validates redirect. Total `@a11y` tests: 5 → 6.
- `Makefile` with composable targets: `install`, `setup`, `lint`, `test`, `smoke`, `regression`, `a11y`, `visual`, `report`, `clean` (LT-3).
- A roadmap completion outline was added for flaky detection/quarantine, test generation templates, interactive onboarding, and VS Code task definitions.

### Changed

- `tsconfig.json` `moduleResolution`: `"node"` → `"bundler"` to correctly support ESNext module resolution and `package.json` exports fields (LT-1).
- `tsconfig.json` `lib`: removed `"DOM"` — browser globals are no longer available project-wide. Files that legitimately use browser types inside `page.evaluate()` callbacks (`checkout.spec.ts`, `performance.spec.ts`) use `/// <reference lib="dom" />` instead (LT-2).
- `fixtures/accessibility/a11y-fixture.ts` — attaches axe violation count as a test annotation (`axe-violations: N violations`) after each scan, surfacing the count in Smart Reporter test detail cards (LT-5 Option A).
- `docs/todo.md` — added LT-5 Options B (JSON artifact) and C (Smart Reporter plugin) implementation sketches.

### Fixed

- `coffee-cart/src/components/parts/Snackbar.vue` — `role="button"` changed to `role="status"`; added `aria-label="Notification"` to disambiguate from the loading spinner which also carries `role="status"`.
- `pages/components/snackbar.component.ts` — selector updated from `getByTestId('snackbar')` to `getByRole('status', { name: /notification/i })` to match the corrected ARIA role and label.
- `tests/coffee-cart/functional/cart.spec.ts` — replaced hardcoded `'John Doe'`/`'john@example.com'` with `generateCheckoutData()` factory call (QW-1).
- `tests/coffee-cart/functional/checkout.spec.ts` — replaced hardcoded `'John Doe'` in two validation tests with `generateCheckoutData().name` (QW-1); replaced two inline `page.locator('dialog, [role="dialog"]')` occurrences with `expect(paymentDetails.submitButton).toBeVisible()` (MT-1).
- `tests/coffee-cart/functional/orders-list.spec.ts` — replaced the always-true `expect(typeof isEmpty).toBe('boolean')` assertion with a meaningful `expect(isEmpty).toBe(false)` and renamed the test to `should show orders when they exist` (QW-2).
- `pages/coffee-cart/menu.page.ts` — `coffeeList` visibility changed from `private` → `readonly` to allow accessibility tests to assert page-loaded state via `expect(menuPage.coffeeList).toBeVisible()`.

## [1.4.0] - 2026-03-23

### Added

- `@axe-core/playwright` dependency for WCAG 2.1 AA accessibility scanning.
- `fixtures/accessibility/a11y-fixture.ts` — reusable `a11yScan` fixture with `include`, `exclude`, and `disableRules` options; scans with WCAG 2.1 AA tags and formats violations for readable test output.
- `tests/coffee-cart/functional/accessibility.spec.ts` — 5 `@a11y` tests covering login page, menu page, payment details modal, login error state (known `color-contrast` bug documented with `// FIXME`), and a `[DEMO]` scenario that proves the a11y scanner detects real violations.
- `[DEMO] visualbreak param produces a detectable visual difference` test in `visual-regression.spec.ts` with a dedicated `login-page-visual-break.png` baseline for side-by-side comparison during onboarding.
- `?a11ybreak=1` URL param on Coffee Cart app — sets `--primary` CSS variable to `#d4d4d4` via body class, creating intentional color-contrast violations (~1.1:1 on button, ~1.05:1 on heading) for accessibility testing demos.
- `?visualbreak=1` URL param on Coffee Cart app — hides the Coffee Cart logo via `v-if` in `LoginPage.vue` for visual regression demos.
- `TestParams.A11Y_BREAK` and `TestParams.VISUAL_BREAK` enum members in `enums/coffee-cart/coffee-cart.ts`.
- `@a11y` and `@visual` as first-class test tags alongside `@smoke`, `@sanity`, `@regression`, `@e2e`, and `@api`.
- `tests/sauce-demo/e2e/cart-management.spec.ts` — Sauce Demo E2E test demonstrating framework patterns (explore-first, fixture injection, factory data, GWT steps).
- `docs/framework-onboarding.md` — step-by-step onboarding guide for Jr QA Engineers covering project structure, running tests, Smart Reporter, page objects, fixtures, test data, API testing, accessibility testing (with `?a11ybreak=1` demo walkthrough), and visual regression testing (with `?visualbreak=1` demo walkthrough).

### Changed

- `tests/coffee-cart/functional/accessibility.spec.ts` tests retagged `@regression` → `@a11y`.
- `tests/coffee-cart/functional/visual-regression.spec.ts` tests retagged `@regression` → `@visual`.
- `CLAUDE.md` and `.cursor/rules/rules.mdc` No Multiple Tags rule updated to include `@a11y` and `@visual` as allowed tags.
- `fixtures/pom/test-options.ts` — `a11yFixture` merged into the test options chain so `a11yScan` is available in all tests.
- `docs/framework-assessment.md` tag distribution updated: `@regression` 50→45, added `@a11y` (5) and `@visual` (6), `@destructive` reclassified as secondary-only.

## [1.3.0] - 2026-03-22

### Changed

- Version bump to 1.3.0 — no functional changes. Consolidates all v1.2.0 work (pw-api-plugin integration, API test rewrites, LOG_API_UI toggle, framework assessment v03) into a clean release.

## [1.2.0] - 2026-03-22

### Added

- `pw-api-plugin` integration — new `api` fixture in `fixtures/api/pw-api-fixture.ts` wrapping `pwApi` with conditional `page` passing.
- `LOG_API_UI` environment variable (default `false`) to toggle API request/response logging in Playwright UI, Trace Viewer, and HTML reports without browser overhead when off.
- Developer guide sections: `api` fixture usage, `LOG_API_UI` toggle, POST/DELETE examples, legacy `apiRequest` note, schema table.

### Changed

- Rewrote all 4 API test files (`cart-api`, `menu-api`, `orders-api`, `login-api`) to match the actual Coffee Cart API — previously used non-existent endpoints (`/login`, `/logout`, `/refresh`, `/confirm`), wrong request payloads (`coffeeId` instead of `name`), wrong HTTP methods (PUT for cart), and wrong ID formats (numeric instead of `ORD-*`).
- Migrated all API tests from `apiRequest` fixture to the new `api` fixture (`pw-api-plugin`).
- `cart-api.spec.ts`: Uses `POST /api/cart` with `{name}` body, `DELETE /api/cart/:name` for decrement, `DELETE /api/cart` to empty. Added `afterEach` cleanup, error-case tests (400/404), and Zod `CartResponseSchema` validation. 10 tests.
- `menu-api.spec.ts`: Removed non-existent `GET /api/coffees/:id` tests. All tests use `GET /api/coffees` with `CoffeeListResponseSchema` validation including recipe `{name, quantity}` structure. 5 tests.
- `orders-api.spec.ts`: Creates orders via `POST /api/checkout` (not `POST /api/orders`), uses `ORD-*` string IDs, validates with `CheckoutResponseSchema` and `OrderListResponseSchema`. Added error-case tests (400/404). 8 tests.
- `login-api.spec.ts`: Replaced 6 auth tests (login, logout, refresh, confirm, token validation) with 2 error-handling tests confirming auth endpoints return 404 (no server-side auth exists).
- Removed non-existent `ApiEndpoints` enum members: `LOGIN`, `LOGOUT`, `REFRESH`, `CONFIRM`.
- Fixed `coffeeMenu.json` static data: recipe format changed from string arrays to `{name, quantity}` objects to match actual API response.

## [1.1.0] - 2026-03-22

### Changed

- `SnackbarComponent` selector changed from CSS classes (`.snackbar`, `.toast`) to `getByTestId('snackbar')` for reliability.
- `HeaderComponent` nav container selector changed from CSS `nav, [role="navigation"]` to `getByRole('navigation')` for consistency.
- Checkout validation tests now assert actual HTML5 validation messages instead of just checking submit button visibility.
- API test authentication (cart-api, orders-api) extracted to `test.beforeEach()` to reduce duplication.
- Enabled 3 additional TypeScript strict flags: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`. All type errors resolved across the codebase.

### Added

- `.devcontainer/` setup with Dockerfile, devcontainer.json, and post-create script for one-click containerized development.
- `@destructive` tag and `afterEach` cleanup hook on first E2E test (`full-purchase.spec.ts`) to ensure cart state is reverted.
- Developer guide sections: bracket notation for index signatures, `undefined` handling for array access, Dev Container usage.
- `playwright-cli-select` for interactive test selection — 8 npm scripts: `select`, `select:specs`, `select:titles`, `select:tags`, `select:failed`, `select:changed`, `select:ui`, `select:headed`.

### Fixed

- Documented that `CartPage.totalDisplay` and `checkoutButton` intentionally reference the same element (the app's checkout button displays "Total: $X.XX" text and has aria-label "Proceed to checkout"). `totalDisplay` is used for reading the total via `getTotal()`, while `checkoutButton` is used for the click action via `checkout()`.

## [1.0.2] - 2026-03-22

### Changed

- Migrated `playwright.config.ts` to modern `defineConfig()` API (replaces deprecated `PlaywrightTestConfig` export).
- Set `actionTimeout` to 15 seconds (was `0` / infinite — a stuck locator would hang forever).
- Added explicit `outputDir: 'test-results'` for clarity.
- Split `auth.setup.ts` into `auth.user.setup.ts` and `auth.admin.setup.ts` so each setup project only runs its own auth.
- Narrowed admin project `testMatch` from broad glob (`**/*admin*.spec.ts`) to explicit file list.
- Reporters now differ by environment: local dev runs List + HTML + Smart Reporter; CI runs all six (adds JUnit, JSON, Allure).
- Added `testMatch: '**/*.spec.ts'` and `testIgnore` patterns (`wip-*`, `explore-*`, `scratch-*`) to prevent accidental test runs.
- Added `metadata: { env: testEnv }` for environment identification in reports.

### Added

- `npm run test:smart` script — run tests with Smart Reporter only.
- Smart Reporter Settings UI — gear icon in report header opens a Settings page with three tabs (AI / LM Studio, Report Options, Advanced). Settings persist to `localStorage` and can be exported as `playwright-report-settings.json`.
- Model Selection dropdown in Settings UI fetches available models from LM Studio (`/v1/models`).

### Fixed

- Auth setup `getByLabel(/email/i)` matched two elements (login + payment form). Fixed to `getByRole('textbox', { name: 'Email' })`.

## [1.0.1] - 2026-03-21

### Added

- Added `npm run test:smoke` script to run `@smoke` tagged tests with all reporters.
- Added `npm run kill` script and `scripts/kill-test-processes.ps1` to clean up orphaned Playwright/ESLint processes.

### Changed

- Default `npm test` now runs Chromium only with 4 workers (`--project=chromium --workers=4`).
- All `test:*` scripts (`test:junit`, `test:json`, `test:allure`, `test:all-reporters`) now use Chromium with 4 workers.

### Fixed

- Added `dotenv` loading in `playwright.config.ts` to read `env/.env.dev` — environment variables (`APP_URL`, `API_URL`) were previously undefined.
- Changed `baseURL` from `process.env.BASE_URL` to `process.env.APP_URL` to match the env file.
- Fixed login page form locator in `login.page.ts` — strict mode violation caused by two `<form>` elements on the page (login form + payment modal).

## [1.0.0] - 2026-03-20

### Added

- Initialized project with Playwright + TypeScript scaffold.
- Added dependencies: @faker-js/faker, @playwright/cli, @playwright/test, @types/node, @typescript-eslint packages, allure-playwright, eslint and plugins, husky, is-ci, jiti, lint-staged, dotenv, zod.
- Installed Playwright browsers (`npx playwright install`).
- Added scripts: `lint`, `lint:fix`, `format`, `test`, `test:junit`, `test:json`, `test:allure`, `test:all-reporters`.
- Created `tsconfig.json`, `playwright.config.ts`, `.eslintrc.cjs`, `eslint.config.js`, `.prettierrc`, and initial tests (`tests/example.spec.ts`, `tests/failure.spec.ts`).
- Added README, CHANGELOG, and the initial documentation structure (onboarding, roadmap, todo, and reporting docs).
- Added .gitignore with coverage, reports, and build directories.
- Implemented multi-format test reporting: List, HTML, JUnit, JSON, and Allure v3.

### Fixed

- Configured ESLint v9 flat config with @eslint/eslintrc compatibility.
- Removed conflicting legacy .eslintrc.cjs config file to prevent ESLint hanging.

### Examples

- `tests/example.spec.ts` - Passing test example (verifies page title).
- `tests/failure.spec.ts` - Failing test examples (demonstrates failure reporting).

### Verified

- `npm run lint` passes after formatting.
- `npx playwright test --project=chromium` passes.
- All report formats generate correctly: HTML, JUnit, JSON, Allure.
- Failing tests captured properly with screenshots, videos, and stack traces.
