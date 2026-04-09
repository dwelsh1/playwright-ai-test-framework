# Playwright AI Test Framework

An enterprise-ready Playwright test automation framework designed for AI-assisted development with TypeScript.

Built with **Page Object Model**, **fixture-based dependency injection**, **Zod schema validation**, and **35 AI skills** that guide Claude and Cursor to generate code following the framework's conventions.

> **Smart Reporter v1.7.0** — now includes percentile duration metrics (p50/p90/p95), defect leakage tracking, bulk artifact ZIP download, HAR export, console log capture, and browser/build context filters.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Build the smart reporter (once after clone)
npm run build:smart-reporter

# Run tests (Chromium, 4 workers)
npm test
```

**Dev Container:** Open in VS Code and click "Reopen in Container" for a pre-configured environment with browsers, Node.js 22, and extensions ready to go.

## Commands

### Application Under Test (Coffee Cart)

The tests run against the Coffee Cart app in a separate repo (`coffee-cart/`). Start it before running tests.

| Command            | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `npm start`        | Start both API server (port 3002) and Vite dev server (port 5273) |
| `npm run dev`      | Start Vite dev server only (port 5273)                            |
| `npm run server`   | Start API server only (port 3002)                                 |
| `npm run build`    | Build the app for production                                      |
| `npm run serve`    | Preview the production build                                      |
| `npm run test`     | Run unit tests (Vitest)                                           |
| `npm run test:run` | Run unit tests once (no watch mode)                               |

> Run these commands from the `coffee-cart/` directory, not from this framework directory.

### Application Under Test (Sauce Demo)

The framework also includes tests for Sauce Demo, a publicly hosted demo app maintained by Sauce Labs. Unlike Coffee Cart, it requires no local app startup.

| Command                                                        | Description                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `npx playwright test tests/sauce-demo/ --project=sauce-demo`   | Run the Sauce Demo suite against the live app                |
| `SAUCE_DEMO_URL=https://www.saucedemo.com npx playwright test` | Override the Sauce Demo base URL when targeting another host |

> Sauce Demo runs against `https://www.saucedemo.com` by default. See `docs/usage/sauce-demo-app.md` for users, page objects, routes, and test structure.

### Running Tests

| Command                             | Description                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm test`                          | Run Chromium tests with 4 workers; Smart Reporter opens automatically after                                   |
| `npm run test:report`               | Same as default Chromium run via Node (Windows-friendly); opens Smart Report after (skipped when `CI` is set) |
| `npm run test:smoke`                | Run `@smoke` tagged tests                                                                                     |
| `npm run test:env:staging`          | Run all tests against staging                                                                                 |
| `npm run test:env:staging:smoke`    | Run smoke tests against staging                                                                               |
| `npm run test:env:production`       | Run smoke tests against production                                                                            |
| `npm run test:junit`                | Run tests with JUnit reporter only                                                                            |
| `npm run test:json`                 | Run tests with JSON reporter only                                                                             |
| `npm run test:smart`                | Run tests with Smart Reporter only                                                                            |
| `npx playwright test`               | Run all tests across all browsers                                                                             |
| `npx playwright test --grep "@tag"` | Run tests matching a tag                                                                                      |

### Interactive Test Selection

Browse and pick tests from a searchable list instead of typing file paths or grep patterns. Powered by [playwright-cli-select](https://github.com/dennisbergevin/playwright-cli-select).

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run select`        | Interactive prompt (specs, titles, or tags) |
| `npm run select:failed` | Re-run previously failed tests              |
| `npm run select:ui`     | Pick tests, then open in Playwright UI      |
| `npm run select:headed` | Pick tests, then run in headed browser      |

Use arrow keys to navigate, Tab to toggle selection, type to filter, Enter to run.

### Reports

| Command                      | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `npm run report:html`        | Open the HTML report in your browser                                           |
| `npm run report:smart`       | Open the Smart Reporter (trends, AI fix suggestions)                           |
| `npm run report:smart:serve` | Serve the Smart Reporter (needed for trace viewer)                             |
| `npm run report:axe`         | Merge per-test axe results into `test-results/axe-results.json` for CI tooling |

Every test run generates all report formats automatically (List, HTML, JUnit, JSON, Smart Reporter). The single-reporter scripts override the config and produce only that format.

Smart Reporter powered by [playwright-smart-reporter](https://github.com/qa-gary-parker/playwright-smart-reporter) (MIT). LM Studio support added for local AI failure analysis.

### Code Quality

| Command            | Description                   |
| ------------------ | ----------------------------- |
| `npm run lint`     | Run ESLint checks             |
| `npm run lint:fix` | Fix lint issues automatically |
| `npm run format`   | Format code with Prettier     |

### Utilities

| Command                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `npm run kill`           | Kill orphaned Playwright/ESLint processes                     |
| `npm run check:env`      | Check env file and Coffee Cart port reachability              |
| `npm run reset:auth`     | Delete stale auth storage state (forces re-login on next run) |
| `npm run clean`          | Remove test results, reports, and auth state                  |
| `npm run detect:flaky`   | Detect flaky tests from the last run's results                |
| `npm run report:summary` | Print passed/failed/skipped count summary to terminal         |
| `npm run generate:test`  | Scaffold a framework-compliant test stub from template        |
| `npm run history:alias`  | Add/update a test ID alias after renaming or moving a test    |
| `npm run onboard`        | Interactive onboarding walkthrough (new contributors)         |

### VS Code Tasks

If you use VS Code, the repo includes ready-made tasks in `.vscode/tasks.json` and extension recommendations in `.vscode/extensions.json`.

- Open the Command Palette with `Ctrl+Shift+P`, then run `Tasks: Run Task`
- Useful starting tasks: `Test: Run All`, `Test: Smoke (Chromium)`, `Test: Current File (Chromium)`, `Lint`, and `Report: Open Smart Reporter`
- `Ctrl+Shift+B` runs the default build task, which is configured as `Lint`
- To add your own task, duplicate an entry in `.vscode/tasks.json`, change the `label` and `command`, then re-run it from the task picker

See `docs/developer.md` for the full VS Code workflow, including task customization guidance and snippet usage.

## Command Examples

Common `npx playwright test` patterns. All flags can be combined.

```bash
# Run smoke tests on Chromium with retries and 4 workers
npx playwright test --project=chromium --workers=4 --grep "@smoke" --retries=1

# Run a single spec file
npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium

# Run all API tests (no browser UI — fast)
npx playwright test tests/coffee-cart/api/ --project=chromium

# Run all E2E journey tests
npx playwright test tests/coffee-cart/e2e/ --project=chromium

# Run tests across all configured browsers (Chromium, Firefox, WebKit)
npx playwright test

# Run tests matching a tag (quote the @ to avoid shell issues)
npx playwright test --grep "@regression"

# Exclude a tag (run everything except smoke)
npx playwright test --project=chromium --grep-invert "@smoke"

# Run a single test by title
npx playwright test --project=chromium --grep "should login successfully"

# Run tests in headed mode (see the browser)
npx playwright test tests/coffee-cart/functional/menu.spec.ts --project=chromium --headed

# Run in debug mode (Playwright Inspector opens, step through actions)
npx playwright test tests/coffee-cart/functional/cart.spec.ts --project=chromium --debug

# Run with traces enabled (useful for debugging failures locally)
npx playwright test --project=chromium --grep "@smoke" --trace on

# Run against staging environment
TEST_ENV=staging npx playwright test --project=chromium --grep "@smoke"

# Update visual regression baselines after intentional UI changes
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium --update-snapshots

# Run with only the list reporter (no HTML/JSON/Allure output)
npx playwright test --project=chromium --reporter=list
```

### Power grep (`--grep` / `--grep-invert`)

Playwright treats `--grep` as a **RegExp** against the full test title (including tags in the title line). Quote patterns in shells so `@` and parentheses are not mangled.

| Goal                                                         | Example                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **OR** — run tests tagged `@smoke` **or** `@sanity`          | `npx playwright test --project=chromium --grep "@smoke\|@sanity"`      |
| **AND** — title must match two fragments (order-independent) | `npx playwright test --project=chromium --grep "(?=.*menu)(?=.*@api)"` |
| **Exclude** a tag from an otherwise broad run                | `npx playwright test --project=chromium --grep-invert "@flaky"`        |

Desktop browser projects use **`grepInvert: /@responsive/`** so layout-only mobile specs run only under **`--project=mobile-chrome`** (which **`grep: /@responsive/`**). Override on the CLI as needed.

## Project Structure

```
├── .devcontainer/                       # Dev Container (one-click setup)
├── .github/workflows/                   # GitHub Actions CI pipeline
├── .circleci/                           # CircleCI CI pipeline
├── config/                              # App configuration (env vars)
│   └── coffee-cart.ts
├── enums/                               # String constants by area
│   ├── coffee-cart/
│   └── util/
├── env/                                 # Environment config files
│   ├── .env.dev                         # Local development (default)
│   ├── .env.staging                     # Staging environment
│   └── .env.production                  # Production (smoke only)
├── fixtures/
│   ├── accessibility/                   # Accessibility fixture
│   │   └── a11y-fixture.ts             # a11yScan (WCAG 2.1 AA)
│   ├── api/                             # API request fixture + Zod schemas
│   │   ├── api-request-fixture.ts
│   │   ├── schemas/coffee-cart/          # Response schemas (Zod)
│   │   └── schemas/util/
│   ├── helper/                          # Setup/teardown fixtures
│   │   └── helper-fixture.ts
│   ├── network/                         # Network mocking fixture
│   │   └── network-mock-fixture.ts
│   └── pom/                             # Page object fixtures
│       ├── page-object-fixture.ts       # POM registration
│       └── test-options.ts              # Single import point (test, expect)
├── helpers/                             # Utility functions
│   ├── coffee-cart/
│   └── util/
├── pages/                               # Page objects
│   ├── coffee-cart/                      # App-specific page objects
│   └── components/                      # Reusable UI components
├── test-data/
│   ├── factories/coffee-cart/           # Dynamic data (Faker)
│   └── static/coffee-cart/              # Static boundary/invalid data
├── tests/
│   └── coffee-cart/
│       ├── auth.user.setup.ts          # User auth setup (storage state)
│       ├── auth.admin.setup.ts        # Admin auth setup (storage state)
│       ├── api/                         # API tests
│       ├── e2e/                         # End-to-end journey tests
│       └── functional/                  # Feature-focused tests (incl. visual & perf)
├── tools/
│   └── playwright-smart-reporter/       # Vendored smart reporter (with LM Studio)
├── .claude/skills/                      # AI skills for Claude
├── .cursor/skills/                      # AI skills for Cursor
└── playwright.config.ts
```

## Configuration

| Setting           | Value                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| Test timeout      | 30 seconds                                                                 |
| Action timeout    | 15 seconds                                                                 |
| Expect timeout    | 5 seconds                                                                  |
| Browsers          | Chromium, Firefox, WebKit, **mobile-chrome** (Pixel 7, `@responsive` only) |
| Parallel          | Fully parallel                                                             |
| Retries           | 0 local, 2 in CI                                                           |
| Traces            | On first retry                                                             |
| Screenshots       | On failure only                                                            |
| Video             | Retained on failure                                                        |
| Base URL          | `APP_URL` env var or `http://localhost:5273`                               |
| Auth              | Separate setup projects (user + admin)                                     |
| Reporters (local) | List, HTML, Smart Reporter                                                 |
| Reporters (CI)    | List, HTML, JUnit, JSON, Smart Reporter                                    |
| Output directory  | `test-results/`                                                            |

Environment variables are loaded from `env/.env.dev` via dotenv. Auth setup runs automatically before tests — see [Developer Guide](docs/developer.md#authentication--storage-state) for details.

### API debugging ([pw-api-plugin](https://github.com/sclavijosuero/pw-api-plugin))

API specs use the **`api` fixture** (`fixtures/api/pw-api-fixture.ts`), which wraps **[pw-api-plugin](https://github.com/sclavijosuero/pw-api-plugin)** so you can see rich request/response cards in the Playwright UI, **Trace Viewer**, and (optionally) the **HTML report**. By default **`LOG_API_UI`** is off so API-only projects do not launch a browser; turn it on when debugging. See [API logging with `LOG_API_UI`](docs/developer.md#api-logging-with-log_api_ui) and `.env.example` for **`LOG_API_REPORT`** and **`COLOR_SCHEME`**.

## AI Skills

The framework includes **35 prescriptive AI skills** in `.claude/skills/` and `.cursor/skills/` that guide AI assistants to generate code matching the framework's conventions. The same guidance is available to **GitHub Copilot** as [custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents) under `.github/agents/` (regenerate with `npm run sync:github-agents` after editing any skill). Skills cover selectors, page objects, fixtures, test standards, API testing, accessibility, visual regression, debugging, CI/CD, and more.

One of the newer workflow skills is `trust-but-verify`, which is designed for post-implementation manual verification of UI changes. It reviews the branch diff, PR description, and expected behavior, uses `playwright-cli` to verify the live app, and writes a verification report to `docs/verification/`. See `docs/verification/README.md` for naming, screenshot, and commit guidance.

See [docs/usage/skills-guide.md](docs/usage/skills-guide.md) for the full skills usage playbook with trigger guidance, example prompts, and reading order recommendations.

## Documentation

### Where to start

Both of these are "start here" docs for Jr QA Engineers, but they serve different purposes — one teaches, the other navigates.

|                       | [Framework Onboarding](docs/framework-onboarding.md) | [Learning Path](docs/learning-framework.md)         |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| **What it is**        | The actual content                                   | A map to all the content                            |
| **Has code examples** | Yes                                                  | No                                                  |
| **Audience action**   | Read and follow along                                | Use it to decide what to read next                  |
| **When to use it**    | First week — read it fully                           | Ongoing — when you want to know what to tackle next |

### All documents

| Document                                                                            | Audience        | Content                                                                                          |
| ----------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| [Developer Guide](docs/developer.md)                                                | New developers  | Architecture, patterns, how to add tests and page objects                                        |
| [Framework Onboarding](docs/framework-onboarding.md)                                | Jr QA Engineers | Step-by-step walkthrough including a11y and visual demos                                         |
| [Dev Container Guide](docs/usage/dev-container.md)                                  | Jr QA Engineers | Step-by-step VS Code Dev Container setup, daily use, and troubleshooting                         |
| [Docker Usage Guide](docs/usage/docker-usage.md)                                    | Jr QA Engineers | What Docker is, how CI uses it, the Playwright image, and the Dockerfile explained               |
| [Test Generator Usage](docs/usage/test-generator-usage.md)                          | Jr QA Engineers | Step-by-step guide to scaffolding tests with `generate:test`                                     |
| [Debugging Failing Tests](docs/usage/debugging-failing-tests.md)                    | Jr QA Engineers | Systematic guide to diagnosing and fixing test failures                                          |
| [playwright-cli Exploration Guide](docs/usage/playwright-cli-exploration.md)        | Jr QA Engineers | How to explore pages and discover selectors before writing                                       |
| [Creating a Page Object](docs/usage/creating-a-page-object.md)                      | Jr QA Engineers | Step-by-step guide to building and registering page objects                                      |
| [Visual Regression — Managing Baselines](docs/usage/visual-regression-baselines.md) | Jr QA Engineers | Creating, updating, and troubleshooting visual baselines                                         |
| [Smart Reporter Usage Guide](docs/usage/playwright-smart-reporter.md)               | Jr QA Engineers | Reading reports, trace viewer, AI suggestions, and history                                       |
| [Test Data Factories](docs/usage/test-data-factories.md)                            | Jr QA Engineers | Factories, Faker, static JSON, overrides, and when to use each                                   |
| [Understanding Fixtures](docs/usage/understanding-fixtures.md)                      | Jr QA Engineers | Every fixture explained — page objects, api, helpers, a11y                                       |
| [Writing Full API Tests](docs/usage/writing-api-tests.md)                           | Jr QA Engineers | From generated stub to complete API spec with schema validation                                  |
| [GraphQL API Testing](docs/usage/graphql-api-testing.md)                            | Jr QA Engineers | GraphQL over HTTP, operation constants, Zod on `data` / `errors`                                 |
| [Authentication & Storage State](docs/usage/authentication-storage-state.md)        | Jr QA Engineers | How auth state works, setup files, role switching, and new roles                                 |
| [Multi-Environment Testing](docs/usage/multi-environment-testing.md)                | Jr QA Engineers | Dev, staging, production — switching environments and CI setup                                   |
| [Accessibility Testing](docs/usage/accessibility-testing.md)                        | Jr QA Engineers | axe-core scanning, violation reports, keyboard navigation tests                                  |
| [Flaky Test Management](docs/usage/flaky-test-management.md)                        | Jr QA Engineers | Identifying, tagging, quarantining, and fixing flaky tests                                       |
| [Network Mocking](docs/usage/network-mocking.md)                                    | Jr QA Engineers | Simulating errors, timeouts, offline mode, and custom responses                                  |
| [Writing E2E Journey Tests](docs/usage/writing-e2e-tests.md)                        | Jr QA Engineers | Multi-page flows, destructive tests, cleanup, and role switching                                 |
| [Coffee Cart App Guide](docs/usage/coffee-cart-app.md)                              | Jr QA Engineers | App setup, pages, API endpoints, page objects, demo break params                                 |
| [Coffee Cart OpenAPI Spec](docs/api/coffee-cart-openapi.yaml)                       | All             | OpenAPI 3.0 spec for all Coffee Cart REST endpoints                                              |
| [Sauce Demo App Guide](docs/usage/sauce-demo-app.md)                                | Jr QA Engineers | App overview, test users, credentials, page objects, enums                                       |
| [Helpers Reference Guide](docs/usage/helpers-usage.md)                              | Developers      | All helper functions explained — purpose, usage, and when to use                                 |
| [Scripts Reference Guide](docs/usage/scripts-usage.md)                              | Developers      | All scripts explained — purpose, when to run, and npm commands                                   |
| [Framework Cheatsheet](docs/framework-cheatsheet.md)                                | All             | Dense quick-reference — commands, tags, selectors, templates, VS Code tasks and snippet prefixes |
| [Learning Path](docs/learning-framework.md)                                         | Jr QA Engineers | Recommended reading order for all docs — beginner to advanced                                    |
| [Skills Guide](docs/usage/skills-guide.md)                                          | AI users        | Skills usage playbook with all 35 skills, trigger guidance, and example prompts                  |

## Husky + lint-staged

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Configure `lint-staged` in `package.json`:

```json
"lint-staged": {
  "**/*.{js,ts}": ["eslint --fix", "prettier --write"]
}
```
