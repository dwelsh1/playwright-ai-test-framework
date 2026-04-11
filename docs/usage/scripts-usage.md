# Scripts Reference Guide

**Audience:** Developers and QA Engineers — what each script in the `scripts/` folder does, when to run it, and how it fits into the framework.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test lifecycle scripts](#2-test-lifecycle-scripts)
   - [check-smart-reporter.cjs](#check-smart-reportercjs)
   - [open-smart-report.cjs](#open-smart-reportcjs)
   - [verify-smart-reporter.cjs](#verify-smart-reportercjs)
   - [detect-flaky.js](#detect-flakyjs)
3. [Developer setup scripts](#3-developer-setup-scripts)
   - [setup.sh](#setupsh)
   - [install-playwright-cli-browsers.sh](#install-playwright-cli-browserssh)
   - [install-playwright-cli-browsers.js](#install-playwright-cli-browsersjs)
   - [link-cli.sh](#link-clish)
4. [Playwright CLI wrappers](#4-playwright-cli-wrappers)
   - [playwright-cli.sh](#playwright-clish)
   - [playwright-cli.cmd](#playwright-clicmd)
5. [Process management](#5-process-management)
   - [kill-test-processes.ps1](#kill-test-processesps1)
6. [Maintenance utilities](#6-maintenance-utilities)
   - [check-env.cjs](#check-envcjs)
   - [reset-auth.cjs](#reset-authcjs)
   - [clean.cjs](#cleancjs)
   - [report-summary.cjs](#report-summarycjs)
   - [merge-axe-results.cjs](#merge-axe-resultscjs)
   - [history-alias.cjs](#history-aliascjs)
   - [sync-github-agents.cjs](#sync-github-agentscjs)
7. [Code generation](#7-code-generation)
   - [generate-test.sh](#generate-testsh)
   - [Test stub templates](#test-stub-templates)
8. [Onboarding](#8-onboarding)
   - [onboard.sh](#onboardsh)

---

## 1. Overview

The `scripts/` folder contains shell scripts, Node.js scripts, and PowerShell scripts that support the framework's test lifecycle, developer setup, and tooling. Most scripts are wired into `package.json` — you rarely need to call them directly.

```
scripts/
├── check-smart-reporter.cjs          # pretest: verify dist exists
├── open-smart-report.cjs             # posttest: open report in browser
├── verify-smart-reporter.cjs         # build health check + smoke run
├── detect-flaky.js                   # parse results.json → flaky-tests.json
├── check-env.cjs                     # pre-flight environment check
├── reset-auth.cjs                    # delete stale auth storage state
├── clean.cjs                         # remove test-results/, playwright-report/, .auth/
├── report-summary.cjs                # print passed/failed/skipped count to terminal
├── merge-axe-results.cjs             # merge per-test axe result files → axe-results.json
├── history-alias.cjs                 # add/update a test ID alias in test-history-aliases.json
├── sync-github-agents.cjs            # generate .github/agents from .cursor/skills (Copilot)
├── setup.sh                          # full local dev environment setup (5 steps)
├── install-playwright-cli-browsers.sh # thin wrapper → install-playwright-cli-browsers.js
├── install-playwright-cli-browsers.js # install CLI Chromium (Node.js / cross-platform)
├── link-cli.sh                       # symlink playwright-cli onto PATH
├── playwright-cli.sh                 # browser-isolated playwright-cli wrapper (Unix)
├── playwright-cli.cmd                # browser-isolated playwright-cli wrapper (Windows)
├── kill-test-processes.ps1           # kill orphaned Playwright/ESLint processes (Windows)
├── generate-test.sh                  # scaffold a test stub from a template
├── onboard.sh                        # interactive new-contributor walkthrough
└── templates/
    ├── functional.spec.ts.tpl        # template for functional tests
    ├── api.spec.ts.tpl               # template for API tests
    └── e2e.spec.ts.tpl               # template for E2E tests
```

---

## 2. Test lifecycle scripts

These scripts run automatically as part of `npm test` via npm lifecycle hooks. You do not need to call them directly under normal circumstances.

### check-smart-reporter.cjs

**Runs as:** `pretest` (automatically before every `npm test`)

**What it does:** Checks that `tools/playwright-smart-reporter/dist/smart-reporter.js` exists. If the file is missing — because the smart reporter has never been built — it exits with code 1 and prints a clear error message telling you to run `npm run build:smart-reporter`.

**Why it exists:** The smart reporter is a vendored tool that must be compiled from TypeScript source before it can generate reports. Without this guard, tests would silently produce no smart report and the report:smart command would fail with a confusing error.

**When you might run it manually:**

```bash
node scripts/check-smart-reporter.cjs
```

If this fails, fix it with:

```bash
npm run build:smart-reporter
```

---

### open-smart-report.cjs

**Runs as:** `posttest` (automatically after every `npm test`)

**What it does:** Opens `playwright-report/smart-report.html` in your default browser after the test run completes. It detects the operating system and uses the appropriate command:

- **macOS:** `open`
- **Linux:** `xdg-open`
- **Windows:** `start`

**CI guard:** If `process.env.CI` is set (GitHub Actions, CircleCI), the script exits immediately without opening anything. CI environments have no desktop to open a browser.

**When you might want to skip it locally:** If you are running many successive test runs and do not want a new browser tab opening after each one, you can use the raw Playwright command instead of `npm test`:

```bash
npx playwright test --project=chromium
```

Or open the report manually afterward:

```bash
npm run report:smart
```

---

### verify-smart-reporter.cjs

**Runs as:** `npm run verify:smart-reporter` (manual, not part of the test lifecycle)

**What it does:** A full health check for the smart reporter build. It:

1. Checks that `tools/playwright-smart-reporter/dist/smart-reporter.js` exists
2. Runs the `@smoke` tests (excluding `@visual`) to generate a fresh `smart-report.html`
3. Reads the generated file and verifies it contains the strings `"Overview"` and `"Tests"`

**When to use it:** After rebuilding the smart reporter (`npm run build:smart-reporter`) to confirm the build produced a working reporter, not just that the file exists.

```bash
npm run build:smart-reporter
node scripts/verify-smart-reporter.cjs
```

---

### detect-flaky.js

**Runs as:** `npm run detect:flaky` (manual or post-CI)

**What it does:** Reads `test-results/results.json` (the JSON reporter output) and walks the test suite tree looking for tests that have **both** a failed result **and** a passed result within the same run. When a test fails on first attempt but passes on retry, it is a strong signal of flakiness.

Detected flaky tests are written to `test-results/flaky-tests.json` in this format:

```json
[
  {
    "title": "should add item to cart",
    "file": "tests/coffee-cart/functional/cart.spec.ts"
  }
]
```

**When to use it:** After a CI run with retries enabled (`--retries=2`). If any tests passed on retry, run `detect-flaky.js` to identify them, then investigate whether they need the `@flaky` tag.

```bash
# Run tests with retries (as CI does)
npx playwright test --project=chromium --retries=2

# Detect which tests flaked
node scripts/detect-flaky.js

# Review the output
cat test-results/flaky-tests.json
```

See [Flaky Test Management](flaky-test-management.md) for the full investigation workflow.

---

## 3. Developer setup scripts

These scripts are used to set up a development environment from scratch. You typically run them once when first cloning the repository.

### setup.sh

**Runs as:** Manual — `bash scripts/setup.sh` (Unix/WSL only)

**What it does:** A full one-shot developer environment setup. It:

1. Installs Node.js **22.22.2** (matches **`.nvmrc`**) via `nvm` (or verifies it is already installed)
2. Runs `npm ci` to install all project dependencies
3. Installs Playwright browsers (`npx playwright install --with-deps`)
4. Runs `link-cli.sh` to put `playwright-cli` on `PATH`
5. Creates `env/.env.dev` from the example file if it does not already exist

**Platform restriction:** This script is bash-only and will not run on Windows Command Prompt or PowerShell. Windows users must use **WSL** or the **Dev Container** instead.

**When to use it:** When setting up a new local machine without using the Dev Container.

```bash
bash scripts/setup.sh
```

> **Tip:** If you are using the Dev Container, you do not need `setup.sh`. The container runs all setup automatically via `.devcontainer/post-create.sh`.

---

### install-playwright-cli-browsers.sh

**Runs as:** Called by `setup.sh` and the Dev Container post-create script

**What it does:** A thin bash wrapper that delegates to `install-playwright-cli-browsers.js`. Kept so existing callers (`setup.sh`, `.devcontainer/post-create.sh`) do not need to change.

```bash
# Called automatically by setup.sh or post-create.sh
bash scripts/install-playwright-cli-browsers.sh
```

---

### install-playwright-cli-browsers.js

**Runs as:** The actual installer — called by the `.sh` wrapper and directly on Windows

**What it does:** Installs Chromium specifically for `@playwright/cli` into an **isolated browser cache**, separate from the browsers used by `@playwright/test`. It writes a version marker file so the installation is skipped if the correct Chromium version is already present.

**Why separate browsers?** `@playwright/cli` bundles a different version of Playwright internals than `@playwright/test`. If both tools shared the same browser cache they would conflict. The isolation prevents this.

**Browser cache locations:**

| Environment     | Cache path                                     |
| --------------- | ---------------------------------------------- |
| Dev Container   | `/ms-playwright-cli` (named volume)            |
| Local (Unix)    | `~/.cache/playwright-cli-browsers`             |
| Local (Windows) | `%USERPROFILE%\.cache\playwright-cli-browsers` |

**When to use it directly:** On Windows outside a Dev Container, or to force a re-install:

```bash
node scripts/install-playwright-cli-browsers.js
```

---

### link-cli.sh

**Runs as:** Called by `setup.sh`; also run manually after `npm ci` to fix PATH issues

**What it does:** Creates symlinks in `~/.local/bin/`:

- `playwright-cli` → `scripts/playwright-cli.sh` (the browser-isolated wrapper)
- `playwright` → `scripts/playwright-cli.sh` (alias)

This puts `playwright-cli` on your `PATH` without requiring a global npm install.

**When to run manually:**

```bash
bash scripts/link-cli.sh "$(pwd -P)"
```

Run this if `playwright-cli: command not found` appears after `npm ci`.

---

## 4. Playwright CLI wrappers

These scripts ensure `playwright-cli` uses its own isolated browser cache, not the one used by `@playwright/test`.

### playwright-cli.sh

**Used on:** Unix (Linux, macOS, WSL, Dev Container)

**What it does:** Sets `PLAYWRIGHT_BROWSERS_PATH` to the isolated CLI browser cache, then executes `playwright-cli` with all arguments passed through. This ensures that when you run `playwright-cli open`, it uses the correct Chromium — not the one installed for `@playwright/test`.

**How it is invoked:** Via the symlink created by `link-cli.sh`. When you type `playwright-cli open`, it runs this script transparently.

You do not call this script directly. Use `playwright-cli` commands normally:

```bash
playwright-cli open http://localhost:5273
playwright-cli snapshot
playwright-cli close
```

---

### playwright-cli.cmd

**Used on:** Windows (Command Prompt / PowerShell, not WSL)

**What it does:** The Windows equivalent of `playwright-cli.sh`. Sets `PLAYWRIGHT_BROWSERS_PATH` from `PLAYWRIGHT_CLI_BROWSERS_PATH` (if set, e.g., in the Dev Container) or falls back to `%USERPROFILE%\.cache\playwright-cli-browsers`, then runs `playwright-cli`.

**When it applies:** Only on Windows outside of WSL. Inside WSL or the Dev Container, the `.sh` wrapper is used instead.

---

## 5. Process management

### kill-test-processes.ps1

**Runs as:** `npm run kill` (Windows only)

**What it does:** Finds and kills all `node.exe` processes whose command line contains both the repository name **and** one of `playwright`, `eslint`, or `npx`. This targets orphaned test runner or linter processes that were left running in the background — for example, if a test run was force-stopped with Ctrl+C.

**When to use it:**

- Playwright is reporting that a port is already in use
- VS Code's ESLint extension becomes unresponsive
- A previous test run did not clean up properly and `npm test` hangs immediately

```powershell
npm run kill
```

> **Note:** This script is PowerShell-only and is designed for Windows. On Unix systems, use `pkill -f playwright` or `kill $(lsof -t -i:5273)` as needed.

---

## 6. Maintenance utilities

These scripts are available via npm commands for day-to-day maintenance tasks. None of them run automatically as part of `npm test`.

### check-env.cjs

**Runs as:** `npm run check:env`

**What it does:** A pre-flight environment check that verifies:

1. `env/.env.dev` exists (most common setup failure)
2. The Smart Reporter dist has been built
3. The `.auth/` directory exists
4. Coffee Cart's frontend port (5273) and API port (3002) are reachable

Ports are checked as informational warnings — the script does not fail if Coffee Cart is not running, since it may not be needed for every run. Only a missing `env/.env.dev` causes a non-zero exit.

```bash
npm run check:env
```

Run this before starting a new session if you want a quick sanity check without running tests.

---

### reset-auth.cjs

**Runs as:** `npm run reset:auth`

**What it does:** Deletes all `.json` files inside the `.auth/` directory, recursively. This forces Playwright's auth setup projects to re-run on the next `npm test`, generating fresh storage state files.

**When to use it:**

- Tests are failing with authentication errors
- You have changed user credentials in `env/.env.dev`
- The `.auth/` files are stale after a schema change to the auth flow

```bash
npm run reset:auth
```

The next `npm test` run will re-run the auth setup and regenerate the storage state automatically.

---

### clean.cjs

**Runs as:** `npm run clean`

**What it does:** Removes three directories in one command:

| Directory            | What it contains                      |
| -------------------- | ------------------------------------- |
| `test-results/`      | Test results, traces, and JSON output |
| `playwright-report/` | HTML report and Smart Reporter files  |
| `.auth/`             | Auth storage state                    |

**When to use it:** Before a completely fresh test run — for example, when you want to verify results from a clean state with no cached auth or stale traces.

```bash
npm run clean
npm test
```

---

### report-summary.cjs

**Runs as:** `npm run report:summary`

**What it does:** Reads `test-results/results.json` (generated by the JSON reporter in every `npm test` run) and prints a compact count summary to the terminal:

```
Test Summary
──────────────────────────────
Total:    42
Passed:   40 (2 flaky)
Failed:   1
Skipped:  1
──────────────────────────────
```

Flaky tests (failed on first attempt, passed on retry) are counted in both `Passed` and the `(N flaky)` indicator.

**When to use it:** After a test run when you want a quick count without opening the HTML or Smart Reporter, or in CI where you want a summary line in the build log.

```bash
npm run report:summary
```

---

### merge-axe-results.cjs

**Runs as:** `npm run report:axe`

**What it does:** Merges all per-test axe result files from `test-results/axe-results/` into a single `test-results/axe-results.json` artifact.

Each test that uses `a11yScan()` writes its own separate JSON file during the test run (`test-results/axe-results/{safe-test-name}.json`). Using per-test files (rather than a single shared file) avoids concurrent write race conditions when tests run in parallel across multiple workers. This script merges them after the run completes.

The merged output is sorted alphabetically by test title for stable diffs:

```json
[
  {
    "test": "cart page meets WCAG 2.1 AA",
    "file": "tests/coffee-cart/functional/accessibility.spec.ts",
    "violations": 0,
    "rules": [],
    "date": "2026-03-26T10:00:00.000Z",
    "status": "passed"
  },
  {
    "test": "login page meets WCAG 2.1 AA",
    "file": "tests/coffee-cart/functional/accessibility.spec.ts",
    "violations": 2,
    "rules": [{ "id": "color-contrast", "impact": "serious" }],
    "date": "2026-03-26T10:00:02.000Z",
    "status": "failed"
  }
]
```

**When to use it:** After any test run that includes `@a11y` tests, if you want to export axe results for CI tooling (PR comment bots, DataDog, Grafana dashboards). It is a no-op if no `a11yScan()` tests ran.

```bash
npm run report:axe
```

**Output:** `test-results/axe-results.json`

---

### history-alias.cjs

**Runs as:** `npm run history:alias`

**What it does:** Adds or updates a test ID alias entry in `playwright-report/test-history-aliases.json`. Use this after renaming a test or moving a test file so the Smart Reporter carries forward the test's historical run data under the new ID instead of starting fresh.

**Usage:**

```bash
npm run history:alias -- \
  --from "[chromium] tests/old/path.spec.ts::test title here" \
  --to   "[chromium] tests/new/path.spec.ts::test title here"
```

Both `--from` and `--to` must be the full test ID in the format `[ProjectName] path/to/file.spec.ts::Test Title`. To find the correct IDs, open `playwright-report/test-history.json` and look for the relevant key.

**What happens on the next test run:**

When the Smart Reporter runs tests, it reads `test-history-aliases.json` before processing any results. It rewrites old keys in the history object to their new IDs. If both the old and new IDs already have history entries (partial migration), the entries are merged and sorted by timestamp, then pruned to `maxHistoryRuns`.

**Flags:**

| Flag     | Required | Description                    |
| -------- | -------- | ------------------------------ |
| `--from` | Yes      | Old test ID (the orphaned key) |
| `--to`   | Yes      | New test ID (the current key)  |

**Exit behaviour:**

| Condition                                    | Exit code        | Message                                                                  |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| Entry written successfully                   | 0                | Prints the added `from → to` entry                                       |
| `--from` ID not found in `test-history.json` | 0 (warning only) | `[warn] Old ID not found in test-history.json — check the ID is correct` |
| Missing `--from` or `--to` argument          | 1                | Prints usage and exits                                                   |

Running the command twice with the same `--from` key overwrites the existing entry (idempotent).

**Note:** The Smart Reporter also has an automatic fallback: if a test's exact ID is not in history but the title matches exactly one history entry under a different file path, history is recovered automatically and a warning is printed suggesting you add an alias. The `history:alias` command lets you formalise that alias to suppress the warning on future runs.

**Output:** `playwright-report/test-history-aliases.json`

---

### sync-github-agents.cjs

**Runs as:** `npm run sync:github-agents`

**What it does:** Reads every `.cursor/skills/<id>/SKILL.md` (Agent Skills format) and writes **GitHub Copilot custom agent** files to `.github/agents/<id>.md` with Copilot-compatible frontmatter plus the skill body. Run this after **any** `SKILL.md` edit so Copilot stays in sync with Cursor/Claude.

**Usage:**

```bash
npm run sync:github-agents
```

**Output:** `.github/agents/*.md` (and leaves `.github/agents/README.md` unchanged — edit that file by hand if needed).

**See also:** `docs/usage/skills-guide.md`, `.github/agents/README.md`.

---

## 7. Code generation

### generate-test.sh

**Runs as:** `npm run generate:test`

**What it does:** Scaffolds a correctly structured test file from a template. It accepts three flags:

| Flag     | Description                              | Example              |
| -------- | ---------------------------------------- | -------------------- |
| `--type` | Test type: `functional`, `api`, or `e2e` | `--type=api`         |
| `--area` | App area subdirectory                    | `--area=coffee-cart` |
| `--name` | Output file name (without `.spec.ts`)    | `--name=checkout`    |

**What it generates:** A test stub pre-filled with the correct:

- Import path for `test` and `expect` from `fixtures/pom/test-options`
- `test.describe()` block with the area name
- `test.beforeEach()` for navigation
- A placeholder test with `test.step()` Given/When/Then structure
- The appropriate tag (`@smoke`, `@api`, or `@e2e`)

**Output location:**

```
tests/{area}/{type}/{name}.spec.ts
```

**How to use it:**

```bash
# Scaffold a functional test for the Coffee Cart menu page
npm run generate:test -- --type=functional --area=coffee-cart --name=menu

# Scaffold an API test for the cart endpoint
npm run generate:test -- --type=api --area=coffee-cart --name=cart

# Scaffold an E2E test for the checkout flow
npm run generate:test -- --type=e2e --area=coffee-cart --name=checkout-journey
```

The script guards against accidentally overwriting an existing file — if the target path already exists, it exits with an error.

See [Test Generator Usage](test-generator-usage.md) for a step-by-step walkthrough.

---

### Test stub templates

**Location:** `scripts/templates/`

These are the source templates used by `generate-test.sh`. They contain placeholder tokens that the generator substitutes at runtime:

| Token               | Replaced with                         |
| ------------------- | ------------------------------------- |
| `{{AREA}}`          | The `--area` value (`coffee-cart`)    |
| `{{AREA_TITLE}}`    | Title-cased area (`Coffee Cart`)      |
| `{{PAGE_FIXTURE}}`  | A placeholder fixture name to fill in |
| `{{READY_LOCATOR}}` | A placeholder locator to fill in      |

**Templates available:**

| File                     | Generates                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `functional.spec.ts.tpl` | A `@smoke`-tagged functional test                            |
| `api.spec.ts.tpl`        | An `@api`-tagged API test with schema validation placeholder |
| `e2e.spec.ts.tpl`        | An `@e2e`-tagged E2E journey test                            |

You do not edit these templates often. When you do, test the output by generating a new stub with `npm run generate:test` and verifying the result compiles and runs.

---

## 8. Onboarding

### onboard.sh

**Runs as:** `npm run onboard` (Unix/WSL only)

**What it does:** An interactive six-step walkthrough for new contributors. It is designed to be run on day one and walks the new team member through:

| Step | What it does                                                                          |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | Pre-flight check — curls `http://localhost:5273` to confirm Coffee Cart is up         |
| 2    | Runs the `@smoke` tests and shows the result                                          |
| 3    | Runs the `@a11y` tests to demonstrate accessibility scanning                          |
| 4    | Runs the `@visual` tests to demonstrate screenshot comparison                         |
| 5    | Opens the Smart Reporter in the browser                                               |
| 6    | Demonstrates `playwright-cli open` for page exploration, then runs the test generator |

Each step pauses and asks the user to press Enter before continuing, so they can read the output and ask questions.

**Prerequisites before running:**

- Coffee Cart app must be running (`npm start` from the `coffee-cart/` directory)
- Visual regression baselines must exist (run `npx playwright test --update-snapshots` first if they do not)

```bash
npm run onboard
```

> **Platform note:** This script is bash-only. Windows users should run it inside WSL or the Dev Container.

---

## 9. Changes made

The following simplifications were applied when this guide was written. They are documented here for historical context and to explain why the current scripts look different from older versions.

### Simplified

**`install-playwright-cli-browsers.sh`** was rewritten as a thin wrapper that calls `install-playwright-cli-browsers.js`. Previously both files contained the full installation logic and had to be kept in sync. Now the `.js` file is the single source of truth — cross-platform, no bash required — and the `.sh` file is a one-liner for backwards compatibility with `setup.sh` and `post-create.sh`.

**`setup.sh`** had its Python 3.11+ installation step removed (was step 4 of 6, now 5 steps total). Playwright's Node.js package has not required Python since v1.20 — the step was a legacy artefact. Removing it shortens setup time and eliminates a source of errors on systems where `apt-get` or `brew` installs an incompatible Python version.

---

## See also

- [Test Generator Usage](test-generator-usage.md) — step-by-step guide for `npm run generate:test`
- [Debugging Failing Tests](debugging-failing-tests.md) — when to use `npm run kill` and trace-based debugging
- [Flaky Test Management](flaky-test-management.md) — using `detect-flaky.js` to find flaky tests
- [Smart Reporter Usage Guide](playwright-smart-reporter.md) — understanding the report opened by `open-smart-report.cjs`
- [playwright-cli Exploration Guide](playwright-cli-exploration.md) — using the `playwright-cli` wrapper scripts
- [Framework Onboarding](../framework-onboarding.md) — the full onboarding walkthrough that `onboard.sh` automates
