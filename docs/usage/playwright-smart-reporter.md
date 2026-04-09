# Smart Reporter Usage Guide

**Audience:** Jr QA Engineers — how to read, navigate, and get the most out of the Smart Reporter.

After every test run, the Smart Reporter generates an HTML report at `playwright-report/smart-report.html`. It shows pass/fail results, step timelines, failure analysis, AI-powered fix suggestions, an embedded trace viewer, and test history trends — all in one place. This guide walks through every part of it.

---

## Table of Contents

1. [What is the Smart Reporter?](#1-what-is-the-smart-reporter)
2. [Build it once after cloning](#2-build-it-once-after-cloning)
3. [Opening the report after a test run](#3-opening-the-report-after-a-test-run)
4. [The report layout](#4-the-report-layout)
5. [Reading a passing test](#5-reading-a-passing-test)
6. [Reading a failing test](#6-reading-a-failing-test)
7. [Using the trace viewer](#7-using-the-trace-viewer)
8. [AI fix suggestions](#8-ai-fix-suggestions)
9. [Test history and trends](#9-test-history-and-trends)
10. [Accessibility view](#10-accessibility-view)
11. [Defect leakage tracking](#11-defect-leakage-tracking)
12. [Percentile duration metrics](#12-percentile-duration-metrics)
13. [Artifact downloads — ZIP, HAR, and console logs](#13-artifact-downloads--zip-har-and-console-logs)
14. [Build context filters](#14-build-context-filters)
15. [Adjusting settings](#15-adjusting-settings)
16. [LM Studio — local AI suggestions](#16-lm-studio--local-ai-suggestions)
17. [Troubleshooting](#17-troubleshooting)
18. [Common mistakes](#18-common-mistakes)

---

## 1. What is the Smart Reporter?

The Smart Reporter is an enhanced HTML test report that goes beyond a simple pass/fail list. It is built on top of [playwright-smart-reporter](https://github.com/qa-gary-parker/playwright-smart-reporter) and is included in this framework as a vendored copy with added LM Studio support for local AI suggestions.

Key features:

| Feature                       | What it does                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| **Step timeline**             | Shows every `test.step()` with duration — tells you exactly which step failed        |
| **Screenshots & video**       | Captured automatically on failure — visible directly in the report                   |
| **Trace viewer**              | Embedded Playwright trace — click any action to see the before/after screenshot      |
| **AI fix suggestions**        | When a test fails, an AI model explains the error and suggests how to fix it         |
| **Test history**              | Tracks pass/fail trends across runs — shows if a test is flaky or consistently slow  |
| **Failure clustering**        | Groups similar failures so you can spot patterns across multiple tests               |
| **Stability score**           | A 0–100 score per test based on its history — low scores flag flaky tests            |
| **Percentile duration**       | p50/p90/p95 per test from history; `durationBudgetMs` flags tests over your budget   |
| **Defect leakage tracking**   | `type: 'issue'` annotations surface as badges; Overview shows untracked failure rate |
| **Build context filters**     | Filter tests by browser, branch, environment, and release version                    |
| **Artifact ZIP & HAR export** | One-click ZIP download per test or for all failures; HAR export for network logs     |
| **Console log capture**       | `captureLogs` fixture captures browser console to a collapsible panel in the report  |

The report is generated and opened **automatically** after every `npm test` run. The browser opens as soon as the run completes — you do not need to run a separate command. In CI, the auto-open is skipped; the report is still generated and uploaded as an artifact.

---

## 2. Build it once after cloning

The reporter is compiled from TypeScript source. You only need to build it once after cloning the repo (or after pulling changes that update the reporter source).

```bash
npm run build:smart-reporter
```

If you see an error like `Cannot find module './tools/playwright-smart-reporter/dist/smart-reporter.js'` when running tests, the reporter has not been built yet. Run the above command and try again.

---

## 3. Opening the report after a test run

```bash
npm test
```

The browser opens automatically when the run finishes — no extra command needed.

To re-open the last report manually, or if you ran tests with a different command (e.g. `npx playwright test`):

```bash
npm run report:smart
```

### Trace viewer: use the serve command instead

`npm run report:smart` opens the HTML file directly from disk. This works for most viewing, but the trace viewer will not load — trace files are fetched over HTTP and browsers block them when the page is a local file.

When you need to use the trace viewer, serve the report instead:

```bash
npm run report:smart:serve
```

| Command                      | When to use                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `npm run report:smart`       | Re-opening the report, browsing results — no trace viewer needed |
| `npm run report:smart:serve` | When you need to click "View trace" for a failing test           |

> **Tip:** If you click "View trace" and nothing happens (or see a CORS error), switch to `npm run report:smart:serve`.

---

## 4. The report layout

The Smart Reporter has three main areas:

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: run summary (total / passed / failed / skipped)   ⚙   │
├──────────────────┬──────────────────────────────────────────────┤
│  LEFT SIDEBAR    │  MAIN CONTENT                                │
│                  │                                              │
│  Navigation:     │  View panel for the selected nav item        │
│  • Overview      │  (test list, trends, accessibility, etc.)    │
│  • Tests         │                                              │
│  • Trends        │  Detail card (bottom, when a test is         │
│  • Comparison    │  selected from the Tests view)               │
│  • Gallery       │                                              │
│  • ♿ Accessibility│                                             │
│    (when a11y    │                                              │
│    tests exist)  │                                              │
└──────────────────┴──────────────────────────────────────────────┘

> **Tip:** The Overview panel now includes a `🐛 Defects` row (when there are failures) and a Slowest Tests top-5 list sorted by p90.
```

### Header

The header shows:

- Total tests run and how many passed, failed, or were skipped
- Run duration
- A gear icon (⚙) that opens the Settings page

### Left sidebar navigation

The sidebar has nav items that switch between different views:

| Nav item             | What it shows                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Overview**         | High-level run summary — totals, pass rate, tags breakdown                                  |
| **Tests**            | Full test list with file tree, pass/fail dots, and detail cards                             |
| **Trends**           | Pass/fail trends across runs                                                                |
| **Comparison**       | Side-by-side run comparison                                                                 |
| **Gallery**          | Screenshot gallery for failing tests                                                        |
| **♿ Accessibility** | axe violation summary, rule breakdown, and trend (only shown when `a11yScan()` tests exist) |

In the **Tests** view, each test has a coloured dot:

- Green dot — passed
- Red dot — failed
- Yellow dot — flaky (passed on retry)
- Grey dot — skipped

### Test list

The main area shows all tests in the selected file (or all files if none is selected). Each row shows the test name, its tag, duration, and status.

---

## 5. Reading a passing test

Click any test in the list to open its detail card.

For a passing test you will see:

**Step timeline** — a list of every `test.step()` call with its label and duration:

```
✓ GIVEN user is on the login page        (0.3s)
✓ WHEN user enters valid credentials     (0.2s)
✓ THEN user is redirected to menu page   (0.4s)
```

Steps are colour-coded: green = passed, grey = skipped.

**Test metadata** — tags, project (browser), worker ID, start time.

**No screenshots or trace** — these are only captured on failure.

---

## 6. Reading a failing test

When a test fails, the detail card shows considerably more information.

### Step timeline with failure marker

The step that failed is marked in red. Steps after it are grey (they were skipped because the test stopped):

```
✓ GIVEN user is on the login page        (0.3s)
✓ WHEN user enters valid credentials     (0.2s)
✗ THEN user is redirected to menu page   (5.0s)  ← failed here
```

The duration on the failing step tells you how long Playwright waited before giving up. A `5.0s` on a step with a 5-second expect timeout means it timed out waiting for an element.

### Error message

Below the timeline, the full error message is shown — the same text you see in the terminal, but formatted and easier to read. This always includes:

- The error type (e.g. `waiting for locator ... to be visible`)
- The file and line number where the failure occurred
- The call stack (test → page object → locator call)

### Screenshot

The screenshot taken at the moment of failure appears below the error. This shows exactly what was on screen when the test gave up — usually the most important clue for diagnosing what went wrong.

### Video (if enabled)

If video capture is configured (retained on failure), a video player appears showing the full test run.

---

## 7. Using the trace viewer

For failing tests, a **View trace** link appears in the detail card. Click it to open the embedded trace viewer.

> Run `npm run report:smart:serve` (not `npm run report:smart`) before clicking "View trace" — traces load over HTTP and will not open when the report is a local file.

The trace viewer shows a full recording of the test:

### Actions tab

The timeline on the left lists every Playwright action — `goto`, `click`, `fill`, `expect`, etc. Click any action to see:

- A **before** screenshot (page state just before the action)
- An **after** screenshot (page state just after)
- The locator used and whether it resolved

Work through the actions from the last one backwards to find where things went wrong.

### Console tab

Shows JavaScript errors from the app (logged in red). These often explain why a button did not respond or a page did not load.

### Network tab

Shows every HTTP request made during the test. Failed requests are shown in red:

- `401` — authentication failed
- `404` — resource not found
- `500` — server error

If a test times out waiting for an element, the Network tab often shows a failed API call that was supposed to populate that element.

### Source tab

The test source code with the failing line highlighted — useful when the error message mentions a line number.

---

## 8. AI fix suggestions

When a test fails, the Smart Reporter can call an AI model to analyse the error and suggest a fix. The suggestion appears in the detail card below the error message.

A typical AI suggestion looks like this:

```
AI Analysis
───────────
The test timed out waiting for the locator `getByRole('button', { name: /confirm/ })`
to be visible (5000ms).

The error occurs at menu.spec.ts:42. Based on the step "THEN order confirmation is shown",
the test expects a confirmation button to appear after checkout.

Suggested fix: Check the Network tab in the trace — if the POST /api/order request
returned a 500 error, the confirmation button will never appear. Verify the API is
responding correctly before investigating the selector.
```

### Getting AI suggestions

AI suggestions are generated automatically when a test fails, **if** an AI provider is configured. There are two options:

1. **LM Studio** (free, runs locally) — see [Section 16](#16-lm-studio--local-ai-suggestions)
2. **Cloud providers** — set an API key in your environment:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`

If no provider is configured, the AI suggestion section is empty. The rest of the report still works normally.

**Provider priority:** LM Studio → Anthropic → OpenAI → Gemini. The first one that responds is used.

---

## 9. Test history and trends

Each test's detail card includes a **History** section showing how that test has performed across the last several runs.

### Stability score

A score from 0 to 100:

- **90–100** — very stable, passes consistently
- **70–89** — mostly stable, occasional issues
- **Below 70** — flagged as unstable — investigate or tag as `@flaky`

### Trend chart

A small bar chart shows pass/fail/flaky status per run. This is the fastest way to see whether a failure is new or has been happening for several runs.

### What "flaky" means in history

A test is marked **flaky** in a run if it failed on the first attempt but passed on a retry. The history chart distinguishes flaky runs (yellow) from clean passes (green) and hard failures (red).

### Keeping history accurate

History is stored in `playwright-report/test-history.json`. **Do not delete the `playwright-report/` folder between runs** — doing so resets all history and trends to zero. The file is gitignored so it only persists locally.

---

## 10. Accessibility view

The **♿ Accessibility** nav item appears in the sidebar after any run where at least one test used `a11yScan()`. Click it to open the Accessibility view.

### Summary bar

At the top of the view, four metrics are shown at a glance:

| Metric                    | What it means                                                  |
| ------------------------- | -------------------------------------------------------------- |
| **Total violations**      | Sum of all axe violations across all scanned tests in this run |
| **Tests scanned**         | How many tests called `a11yScan()`                             |
| **Tests with violations** | How many scanned tests found at least one violation            |
| **Clean tests**           | Scanned tests with zero violations                             |

If all scanned tests are clean, a green "All accessibility tests are clean" message replaces the table.

### Rule breakdown table

A table listing every axe rule that fired during the run:

| Column             | What it shows                                                                          |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Rule**           | The axe rule ID (e.g., `color-contrast`)                                               |
| **Impact**         | The worst impact level seen for this rule (`critical`, `serious`, `moderate`, `minor`) |
| **Affected tests** | How many tests triggered this rule                                                     |

### Affected test list

Below the table, each test that had violations is listed with the number of violations and a **View test →** button that jumps straight to its detail card in the Tests view.

### Cross-run trend chart

When you have ≥ 2 runs in your history that include axe data, a line chart shows how the total violation count has changed across runs. A flat line at zero is what you want to see.

### Axe badges on test cards

In the Tests view, each test card shows a small badge:

- **♿ ✓** (green) — scanned, zero violations
- **♿ N** (red) — scanned, N violations found

Tests that were not scanned with `a11yScan()` show no badge.

---

---

## 11. Defect leakage tracking

The Smart Reporter can distinguish between **tracked failures** (failures linked to a known bug ticket) and **untracked failures** (regressions with no ticket). This distinction is the most operationally useful signal in a QA report.

### How to link a test to an issue

Add a `type: 'issue'` annotation in your test:

```typescript
test('checkout fails for guest users @regression', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'PROJ-123', // short ID — shown as badge, not linked
  });
  // ...
});

// Or use a full URL to make the badge clickable:
test.info().annotations.push({
  type: 'issue',
  description: 'https://github.com/org/repo/issues/42',
});
```

Multiple `type: 'issue'` annotations on the same test are all shown.

### Issue badge on test cards

Each test with a linked issue shows a `[#PROJ-123]` badge in the badges row of the test card:

- **Full URL** (`https://...`) — the badge is a clickable link that opens the issue in a new tab.
- **Short ID** (`PROJ-123`) — clicking the badge copies the ref to the clipboard.

### Defects row in Overview

When a run has at least one failure, a `🐛 Defects` row appears in the Overview mini-comparison card:

| Scenario                        | Display               |
| ------------------------------- | --------------------- |
| All failures have linked issues | `✓ All tracked`       |
| Some failures are untracked     | `2/5 untracked (40%)` |

A high leakage rate means failures are going uninvestigated. A low rate means every failure is owned.

---

## 12. Percentile duration metrics

Beyond average duration, the Smart Reporter tracks **p50, p90, and p95** durations for each test across its history (requires ≥ 3 historical runs). These percentile values are more reliable than averages because a single slow outlier will not inflate the p50.

### Duration Stats row in test detail

Expand any test card to see its Duration Stats row:

```
p50: 1.2s    p90: 3.1s    p95: 4.5s
```

If the **current run's duration is above p90**, a `p90 exceeded` amber badge appears next to the stats.

### Duration budget

Set `durationBudgetMs` in the reporter options to flag tests that are consistently slow:

```typescript
// playwright.config.ts
reporter: [
  [
    './tools/playwright-smart-reporter/dist/smart-reporter.js',
    {
      durationBudgetMs: 5000, // flag tests whose p90 > 5 seconds
    },
  ],
];
```

When p90 exceeds the budget, a red `Over budget` badge appears on the test card and in the Slowest Tests list.

### Slowest Tests (top 5) in Overview

The Overview panel shows the 5 slowest tests by p90 duration. Each row shows the test title, p90, last run duration, and an `Over budget` badge if applicable. Click any row to jump to the test's detail card.

### Duration trend chart

The Trends view includes a **p90 Duration** chart (cyan) showing the p90 across your last N runs. If `durationBudgetMs` is set, a dashed horizontal reference line marks the threshold.

---

## 13. Artifact downloads — ZIP, HAR, and console logs

### ZIP download per test

Every test card that has screenshots, traces, or custom attachments shows a `⬇ Download Artifacts (ZIP)` button. Clicking it builds a ZIP in the browser and downloads it immediately — no server required.

### Failures ZIP (export menu)

The export menu (top right of the report) includes `📦 Failures ZIP` — downloads a single ZIP containing artifacts from every failing test in the run.

### HAR export

When a test has network logs (extracted from the trace), a `⬇ HAR` button appears in the Network Logs section header. Clicking it downloads a HAR 1.2 JSON file for that test. Open it in browser DevTools, [HAR Analyzer](https://har.tech/), or your preferred network analysis tool.

### Console log capture

Browser console output is not captured by default. Opt in by extending `test` from the console-log fixture:

```typescript
// In your spec file
import { test, expect } from '../../helpers/util/console-log-fixture';

test('cart emits no errors @regression', async ({ page }) => {
  await page.goto('/');
  // console is captured automatically via the auto-fixture
});
```

After the test runs, the report shows a collapsible `💬 Console Logs` panel with each entry colour-coded by level (`log`, `info`, `warn`, `error`).

> The fixture only captures logs from the test's own `page` object. Logs from a second page or popup require manual attachment.

---

## 14. Build context filters

Filter the Tests view by browser, branch, environment, or release version using the **BUILD** filter group.

### Available filter dimensions

| Chip type       | What it filters                                                  |
| --------------- | ---------------------------------------------------------------- |
| **Branch**      | Git branch the tests ran on (`GITHUB_REF_NAME`, etc.)            |
| **Environment** | `TEST_ENV` value (`dev`, `staging`, `production`)                |
| **Browser**     | Playwright project browser (`chromium`, `firefox`, `webkit`)     |
| **Release**     | `releaseVersion` from `playwright-report-settings.json` metadata |

Chips only appear when ≥ 2 distinct values exist in the current run's data.

### How filters work

- Within the same chip type: clicking multiple chips is OR (show tests matching any of the selected values).
- Across chip types: AND (show tests that match all active filter dimensions).
- Filter state is saved to localStorage and restored on next open.

### Filter persistence in Trends view

The active BUILD filter also applies to the Trends view — chart bars that do not match the active branch or environment are dimmed and a blue banner shows which filter is active.

---

## 15. Adjusting settings

Click the gear icon (⚙) in the report header to open the Settings page. It has three tabs:

### AI / LM Studio tab

| Setting                   | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| LM Studio base URL        | URL of the LM Studio local server (default: `http://127.0.0.1:1234`) |
| LM Studio model           | Model name in LM Studio (default: `local`)                           |
| Max tokens                | Length limit for AI suggestions (default: 512, range: 100–4000)      |
| Enable AI recommendations | Turn AI suggestions on or off                                        |

### Report Options tab

| Setting                     | What it does                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| Filter Playwright API steps | Hide low-level internal Playwright steps — makes the timeline cleaner |
| Enable trace viewer         | Show "View trace" links in the detail card                            |
| Enable network logs         | Include network request log in the report                             |
| Max history runs            | Number of past runs to show in the trend chart (default: 10)          |

### Advanced tab

Contains stability threshold and retry failure threshold settings.

### Saving settings

After changing a value, a "Setting saved" toast confirms it was stored. Settings persist across page refreshes (stored in `localStorage`).

To export settings as a config file: click **Download playwright-report-settings.json**. Save the file in the project root. The reporter reads it automatically on the next test run, so everyone on the team uses the same settings.

To reset everything: click **Reset to Defaults**.

---

## 16. LM Studio — local AI suggestions

LM Studio lets you run a local AI model on your machine and get AI fix suggestions without any cloud API keys or internet connection.

### Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Open LM Studio and download a model (any small instruct model works — 3B–7B parameters is enough)
3. Go to the **Local Server** tab in LM Studio and click **Start Server**
4. The server starts on `http://127.0.0.1:1234` by default

### Run tests with LM Studio active

No extra configuration is needed if LM Studio is running on the default port:

```bash
npm test
npm run report:smart:serve
```

Open the report, click a failing test, and the AI suggestion should appear.

### Using a different port or model

If LM Studio is on a different port, set the environment variable before running tests:

**Bash / terminal:**

```bash
LM_STUDIO_BASE_URL=http://127.0.0.1:5678 npm test
```

**PowerShell:**

```powershell
$env:LM_STUDIO_BASE_URL="http://127.0.0.1:5678"; npm test
```

To set a specific model name (if LM Studio shows a different name than `local`):

```bash
LM_STUDIO_MODEL=your-model-name npm test
```

### Persistent configuration

To avoid setting environment variables every time, add them to your `env/.env.dev` file:

```
LM_STUDIO_BASE_URL=http://127.0.0.1:1234
LM_STUDIO_MODEL=local
```

Or use the Settings page in the report (see [Section 15](#15-adjusting-settings)) and download `playwright-report-settings.json` to the project root.

---

## 17. Troubleshooting

**Report not generated after tests run**

The reporter has not been built. Run:

```bash
npm run build:smart-reporter
```

**"View trace" does nothing or shows a CORS error**

You opened the HTML file directly. Use the serve command instead:

```bash
npm run report:smart:serve
```

**AI suggestion section is empty**

No AI provider is configured, or the provider is not reachable:

- LM Studio: confirm the app is open, a model is loaded, and the server is started
- Cloud: set `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` in your environment
- Check that `enableAIRecommendations` is `true` in the Settings page

**History / trends are empty or reset**

The `playwright-report/test-history.json` file was deleted or the `playwright-report/` folder was cleared. History only builds up over multiple runs — it will start populating again from the next run.

**Report shows old results**

The browser has cached the previous report. Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac), or run `npm run report:smart:serve` and open the served URL.

**Tests run but the report is blank**

The reporter compiled with an error. Check the terminal output during the test run for any reporter-related error messages. Rebuild with `npm run build:smart-reporter`.

---

## 18. Common mistakes

| Mistake                                                | What to do instead                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Clicking "View trace" from a file:// URL               | Run `npm run report:smart:serve` first, then open the served URL |
| Deleting `playwright-report/` between runs             | Keep the folder — it stores `test-history.json` for trends       |
| Looking for the report at `test-results/`              | The Smart Reporter is at `playwright-report/smart-report.html`   |
| Expecting AI suggestions without any provider          | Configure LM Studio (free) or set a cloud API key                |
| Forgetting to build after cloning                      | Run `npm run build:smart-reporter` once after cloning            |
| Using `report:smart` on a new machine without building | Build first: `npm run build:smart-reporter`                      |

---

## See also

- [Debugging Failing Tests](debugging-failing-tests.md) — systematic workflow for diagnosing failures
- [Framework Onboarding](../framework-onboarding.md) — Section 6 for a guided Smart Reporter walkthrough
- [Developer Guide](../developer.md) — reporter configuration and CI artifact setup
