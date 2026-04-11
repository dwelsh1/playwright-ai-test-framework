# Framework Assessment Report

**Playwright AI Test Framework**
**Assessment Date:** March 24, 2026
**Framework Version:** 1.7.0

> This report is a current-state assessment snapshot. Older assessment iterations have been removed from the active docs set. For day-to-day implementation guidance, use `README.md`, `docs/developer.md`, and the docs in `docs/usage/`.

---

## Executive Summary

This report assesses the Playwright AI Test Framework at version 1.7.0. The framework has expanded to 109 tagged tests across 21 spec files, completed all planned improvements from the assessment roadmap, and introduced keyboard navigation testing, axe violation tracking, `moduleResolution: "bundler"`, DOM lib isolation, and a cross-platform Makefile. All 14 categories remain Exemplary.

| Category                             | Rating | Status    |
| ------------------------------------ | ------ | --------- |
| Project Architecture & Organization  | ★★★★★  | Exemplary |
| Lean POM & component design          | ★★★★★  | Exemplary |
| Dependency Injection & Fixtures      | ★★★★★  | Exemplary |
| Test Coverage & Quality              | ★★★★★  | Exemplary |
| Type Safety & Schema Validation      | ★★★★★  | Exemplary |
| Data Strategy                        | ★★★★★  | Exemplary |
| CI/CD Pipeline                       | ★★★★★  | Exemplary |
| Code Quality Gates                   | ★★★★★  | Exemplary |
| Reporting & Observability            | ★★★★★  | Exemplary |
| Security & Credential Management     | ★★★★★  | Exemplary |
| Documentation & Onboarding           | ★★★★★  | Exemplary |
| AI-Assisted Development              | ★★★★★  | Exemplary |
| Cross-Platform & Environment Support | ★★★★★  | Exemplary |
| Accessibility Testing                | ★★★★★  | Exemplary |

**Overall Score: 5.0 / 5.0** — Production-ready, enterprise-grade framework. All 14 categories at Exemplary.

---

## Framework at a Glance

| Metric                        | Current                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| Total Test Files              | 21 spec files (+ 2 setup files)                                      |
| Total Test Cases              | 109 tagged tests                                                     |
| Lean POM (pages + components) | 5 pages + 4 reusable components                                      |
| API Schemas (Zod)             | 5 strict schemas + 1 shared error response schema                    |
| Data Factories                | 4 Faker-powered factories                                            |
| Fixture Files                 | 14 (Lean POM, API, helper, network, accessibility)                   |
| Enum Files                    | 3 (coffee-cart, sauce-demo, shared roles)                            |
| AI Skills                     | 35 prescriptive skills                                               |
| VS Code Tasks                 | 15 named tasks (`.vscode/tasks.json`)                                |
| VS Code Snippets              | 26 framework-compliant snippets (`.vscode/playwright.code-snippets`) |
| Jr QA Usage Guides            | 23 guides + 1 learning path + 1 cheatsheet                           |
| CI/CD Platforms               | 2 (GitHub Actions + CircleCI)                                        |
| Report Formats                | 5 (List, HTML, JUnit, JSON, Smart Reporter)                          |
| Lines of Test Code            | ~2,664                                                               |
| Lines of Page Object Code     | ~754                                                                 |
| Type Safety Violations        | 0 (`any` type usage: zero)                                           |
| TypeScript Strict Flags       | 10 enabled                                                           |
| ESLint Status                 | 0 errors, 1 warning                                                  |
| TypeScript Compilation        | 0 errors                                                             |
| Dev Container                 | Full setup (Dockerfile + devcontainer.json)                          |
| API Test Plugin               | pw-api-plugin 2.1.0 (conditional logging)                            |
| Zod Validation in API Tests   | 26 `.parse()` calls across all API test files                        |
| API Tests Passing             | 26/26 passing                                                        |
| WCAG 2.1 AA Coverage          | 6 accessibility tests via `@axe-core/playwright`                     |

### Test Distribution by Tag

| Tag            | Count | Purpose                                                        |
| -------------- | ----- | -------------------------------------------------------------- |
| `@smoke`       | 9     | Coffee Cart critical path; GitHub PRs run `sauce-demo` instead |
| `@sanity`      | 7     | Core feature verification                                      |
| `@regression`  | 51    | Full functional regression, nightly                            |
| `@e2e`         | 5     | Multi-page user journeys                                       |
| `@api`         | 26    | API endpoint validation                                        |
| `@a11y`        | 6     | WCAG 2.1 AA accessibility validation                           |
| `@visual`      | 7     | Screenshot baseline comparison                                 |
| `@destructive` | 2     | State-modifying (secondary tag only)                           |

### Test Distribution by Type

| Type       | Files | Tests | Scope                        |
| ---------- | ----- | ----- | ---------------------------- |
| Functional | 11    | ~72   | Single-feature UI validation |
| API        | 4     | 26    | Endpoint contracts & schemas |
| E2E        | 6     | 5+    | Cross-feature user journeys  |

---

## Detailed Category Assessments

---

### 1. Project Architecture & Organization ★★★★★

**Strengths:**

- Clear directory hierarchy: `pages/`, `tests/`, `fixtures/`, `test-data/`, `config/`, `enums/`, `helpers/`
- Tests organized by type: `functional/`, `api/`, `e2e/` under each app area
- Consistent naming: `*.page.ts`, `*.component.ts`, `*.spec.ts`, `*.factory.ts`, `*.setup.ts`
- Component composition separates reusable UI elements from page-specific logic
- `testIgnore` patterns prevent accidental runs from WIP/explore/scratch files
- `.devcontainer/` provides containerized development
- New `fixtures/accessibility/` layer cleanly separates a11y concerns from Lean POM and API fixtures
- Multi-app directory contract documented and enforced (coffee-cart and sauce-demo coexist without cross-contamination)

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 2. Lean POM & component design ★★★★★

**All five selector issues resolved:**

- `LoginPage.errorMessage` upgraded from `page.locator('[role="alert"], .error, .error-message')` → `this.form.getByRole('alert')` — scoped to form and semantic
- `AdminPage.ordersTable` upgraded from `page.locator('table, [role="table"]')` → `page.getByRole('table')` — CSS union removed
- `SnackbarComponent` upgraded from `getByTestId('snackbar')` → `getByRole('status')` — app's `Snackbar.vue` updated from `role="button"` to `role="status"` (semantically correct for a toast notification); dead `message` locator removed
- `PaymentDetailsComponent.modal` scoped to `getByRole('dialog', { name: /payment details/i })` — matches via `aria-labelledby="payment-heading"` on the payment modal exclusively
- `PromotionComponent.modal` scoped to `getByRole('dialog', { name: /promotion/i })` — app's `Promotion.vue` updated to include `role="dialog" aria-label="Promotion offer"` on the `.promo` container
- `MenuPage.getCoffeeRecipe()` fragile `.getByRole('button').locator('div')` chain replaced with `getByRole('img', { name: coffeeName })` — targets the Cup image by its semantic `alt`/`aria-label`, which is the coffee name

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 3. Dependency Injection & Fixtures ★★★★★

**Strengths:**

- Single entry point: `fixtures/pom/test-options.ts`
- 5 fixture layers now: Lean POM, pw-api, helper, network mock, accessibility
- `a11yScan` fixture cleanly injected — no test imports axe-core directly except the `[DEMO]` scenario that intentionally does so for assertion inversion
- `api` fixture returns raw `APIResponse` — idiomatic Playwright pattern
- Helper fixtures (`createdOrder`, `seededCart`) implement full setup/yield/teardown lifecycle
- Conditional fixture pattern: `LOG_API_UI` toggle avoids browser launches for API-only tests
- Tests use the `api` fixture, while helper fixtures reuse the lower-level `apiRequest()` utility from `fixtures/api/plain-function.ts` where direct request orchestration is useful
- Accessibility fixture added without disturbing existing fixture chain

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 4. Test Coverage & Quality ★★★★★

**Strengths:**

- 108 tagged tests across 7 test types — functional, API, E2E, accessibility, visual, performance, network error
- WCAG 2.1 AA coverage added: login, menu, payment modal, error state — all first-class `@a11y` tests
- Visual regression suite expanded with `[DEMO]` scenario showing side-by-side logo-absent vs logo-present baselines
- `[DEMO]` tests for both accessibility and visual regression are always-passing and designed for onboarding walkthroughs
- All API tests match actual Coffee Cart API endpoints, payloads, HTTP methods, and ID formats
- 26 API tests with Zod schema validation on every response
- Factory data for happy paths; static JSON for boundary/invalid cases
- Web-first assertions throughout; zero `waitForTimeout()` or XPath usage
- `z.strictObject()` catches unexpected fields at runtime
- `afterEach` cleanup in cart-api tests ensures test isolation
- 100% of tests use `test.step()` with Given/When/Then structure
- Exactly one tag per test (except `@destructive` paired with another tag)
- All previously noted issues resolved: hardcoded test data replaced with `generateCheckoutData()` factory, empty boolean assertion repurposed to assert non-empty state, inline modal locators replaced with scoped Lean POM assertions, visual regression baselines committed for all 7 scenarios
- Keyboard navigation test added: login form tab order (Email → Password → Sign in) verified and Enter-key activation tested with real credentials

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 5. Type Safety & Schema Validation ★★★★★

**Strengths:**

- 10 strict TypeScript flags enabled, zero `any` violations, zero compilation errors
- `moduleResolution: "bundler"` — modern ESM resolver that understands `package.json` `exports` fields; matches how Vite/esbuild resolve modules; the correct pairing for `"module": "ESNext"`
- `"DOM"` removed from tsconfig `lib` — browser globals (`document`, `window`, `HTMLElement`) are no longer available across the codebase; only `checkout.spec.ts` and `performance.spec.ts` opt in via `/// <reference lib="dom" />` (the two files with legitimate `page.evaluate()` callbacks that use DOM types)
- Zod schemas are the primary validation mechanism in API tests
- `z.strictObject()` catches unexpected fields; `z.string().startsWith('ORD-')` validates ID formats; `z.array().min(1)` enforces non-empty arrays
- 26 `.parse()` calls across 4 API test files — every API assertion is schema-validated
- `a11y-fixture.ts` uses explicit TypeScript interfaces (`A11yFixtures`) — no `any` in the new fixture layer

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 6. Data Strategy ★★★★★

**Strengths:**

- Faker factories with Zod-validated output for all happy-path data
- Factories now cover two apps: coffee-cart (checkout, order, admin/cart) and sauce-demo (auth)
- Static JSON for boundary/invalid cases: `coffeeMenu.json`, `invalidCheckout.json`, `invalidLogin.json`
- `generateUserCredentials()` reads from `TEST_*` env vars with demo fallbacks — no hardcoded credentials in the factory
- Factory override pattern uses `??` (not `||`) to correctly preserve `false`, `0`, and `''` as valid values

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 7. CI/CD Pipeline ★★★★★

**Strengths:**

- GitHub Actions: lint + **Sauce Demo** smoke on PR; on `main` push and nightly — same smoke plus sharded 4-way **Coffee Cart** regression, merge-reports (not on PRs), and quarantine; merged HTML report artifact
- CircleCI: identical strategy with `CIRCLE_NODE_INDEX`/`CIRCLE_NODE_TOTAL` sharding and JUnit test insights
- Both pipelines use `mcr.microsoft.com/playwright:v1.59.1-noble` for consistent browser rendering
- Smart Reporter build step in both pipelines (AI disabled in CI, zero API key risk)
- Artifact uploads: HTML report, traces, screenshots, JUnit XML on both platforms
- `testIgnore` patterns prevent WIP files from ever running in CI

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 8. Code Quality Gates ★★★★★

**Strengths:**

- ESLint with TypeScript and Playwright plugins: 0 errors, 1 intentional warning
- Prettier formatting on all TypeScript, JavaScript, and JSON files
- Husky v9 + lint-staged: ESLint fix + Prettier run automatically on every staged commit
- Pre-commit hook prevents non-compliant code from ever reaching the repo
- `no-explicit-any` set to error — enforced at the tooling level, not just convention
- Type-aware ESLint rules: `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`
- EditorConfig ensures consistent line endings and indentation across all editors and OS

**Note on the 1 warning:**
`fixtures/api/plain-function.ts:80` — `prefer-nullish-coalescing` for an empty-string `||` fallback on `contentType`. Intentional: `||` is the correct operator here because empty string should fall through to the default. Suppressed with a targeted `eslint-disable` comment.

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 9. Reporting & Observability ★★★★★

**Strengths:**

- 5 report formats generated on every test run: List, HTML, JUnit, JSON, Smart Reporter
- Smart Reporter provides flakiness detection, stability scoring, trend charts, failure clustering, and AI-powered fix suggestions
- LM Studio integration: local AI failure analysis with no API key — zero cost, zero data egress
- AI provider fallback chain: LM Studio → Anthropic → OpenAI → Gemini
- `pw-api-plugin` adds rich request/response cards in Trace Viewer and HTML reports (LOG_API_UI toggle)
- `LOG_API_UI=false` default: zero browser overhead for API-only test runs
- Accessibility test failures surface full axe violation payloads (rule, impact, description, affected nodes, help URL) in Smart Reporter output
- Settings UI in Smart Reporter: gear icon opens AI/LM Studio, report options, and advanced threshold tabs; settings persist to `localStorage` and can be exported
- **Percentile duration metrics:** p50/p90/p95 per test and per run; `durationBudgetMs` threshold highlights tests exceeding their performance budget
- **Defect leakage tracking (Phase 1):** `type: 'issue'` annotation badges on test cards; leakage rate displayed in the Overview tab — tracks what proportion of failures correspond to known issues vs new regressions
- **Build context filters:** browser, branch, environment, and release version chips in the Tests tab — filter runs by build metadata without leaving the report
- **Artifact downloads:** per-test ZIP, failures-only ZIP (export menu), and HAR export for network logs — artifacts retrievable directly from the report
- **Console log capture:** `consoleLog` fixture captures browser console output per test; collapsible panel in Smart Reporter test detail cards
- **Accessibility nav view:** dedicated axe rule breakdown panel, cross-run trend chart, and per-test violation badge — a11y coverage visible across the full run history
- **Artifact retention/cleanup:** `cleanOrphanedArtifacts()` removes orphaned screenshots and traces each run — report directory stays clean without manual intervention
- **CI metadata in report:** browser version, platform, and Playwright version displayed in the CI info bar — environment context captured alongside test results
- **CI Visibility audit (Audit 5):** `docs/sr-audit.md` contains a 14-dimension audit of CI visibility coverage — 1 Covered, 8 Partial, 5 Not Covered; remaining future gaps include PR comments, check annotations, CI run links in the report, and Slack notifications

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 10. Security & Credential Management ★★★★★

**Strengths:**

- Zero hardcoded credentials in framework files — all from `process.env` via `.env.*` files
- `generateUserCredentials()` and `generateAdminCredentials()` provide safe factory wrappers with env-var-first logic
- `.env.*` files excluded from version control via `.gitignore`
- Storage state files (`.auth/`) excluded from version control
- Auth setup projects reuse session state — passwords never appear in test logs or traces
- `security-testing` skill documents XSS, CSRF, headers, cookies, and auth bypass validation patterns

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 11. Documentation & Onboarding ★★★★★

**Strengths:**

- `CLAUDE.md` orchestrator: constitution, AI workflow, file locations, skills index — always loaded in Claude Code
- `.cursor/rules/rules.mdc`: identical content synced for Cursor — both AI tools share the same rules
- `docs/developer.md`: architecture overview, all patterns with working code examples, common mistakes table
- `docs/framework-onboarding.md`: step-by-step guide for Jr QA Engineers — covers project structure, running tests, Smart Reporter, page objects, fixtures, test data, API testing, accessibility (with `?a11ybreak=1` demo), visual regression (with `?visualbreak=1` demo), and framework rules
- `docs/learning-framework.md`: six-stage learning path covering all documents in recommended reading order, plus a quick-reference table by topic — designed so Jr QA Engineers know exactly what to read next at every stage of their learning
- **23 Jr QA usage guides** in `docs/usage/` — each a detailed, self-contained reference covering one topic from basics through common mistakes:
  - `dev-container.md` — step-by-step VS Code Dev Container setup, named volumes, port forwarding, troubleshooting CRLF errors and missing node_modules
  - `docker-usage.md` — what Docker is (pre-built workshop analogy), the Playwright image, how GitHub Actions and CircleCI use it, Dockerfile walkthrough, and reading CI log messages
  - `test-generator-usage.md` — scaffolding test files with `generate:test`
  - `debugging-failing-tests.md` — systematic diagnosis with trace viewer, headed mode, and Playwright Inspector
  - `playwright-cli-exploration.md` — exploring pages and capturing flows before writing selectors
  - `creating-a-page-object.md` — building and registering a page object from scratch
  - `visual-regression-baselines.md` — creating, updating, and troubleshooting visual baselines
  - `playwright-smart-reporter.md` — reading reports, trace viewer, AI fix suggestions, history trends
  - `test-data-factories.md` — Faker factories, overrides, static JSON, and when to use each
  - `understanding-fixtures.md` — every fixture explained: page objects, api, helpers, a11y, networkMock
  - `writing-api-tests.md` — from generated stub to complete API spec with schema validation
  - `authentication-storage-state.md` — storage state, auth setup files, role switching, new role onboarding
  - `accessibility-testing.md` — axe-core scanning, violation reports, keyboard navigation, scoped scans
  - `flaky-test-management.md` — identifying, quarantining, investigating, and fixing flaky tests
  - `network-mocking.md` — all six `networkMock` methods with examples and when to mock vs real backend
  - `writing-e2e-tests.md` — multi-page flows, `@destructive` tag, cleanup hooks, multi-role journeys
  - `multi-environment-testing.md` — dev/staging/production environments, `TEST_ENV`, CI pipeline setup
  - `skills-guide.md` — the skills usage playbook for all 35 AI skills, including trigger guidance and example prompts
  - `skill-prompt-examples.md` — copy-paste prompt templates for every major task
  - `skill-creator-usage.md` — creating, evaluating, and improving AI skills
  - `coffee-cart-app.md` — Coffee Cart app setup, pages, API, page objects, demo break parameters
  - `sauce-demo-app.md` — Sauce Demo test users, credentials factory, page objects, enums
  - `adding-your-own-app.md` — onboarding a new application into the framework
- **VS Code tasks** (`.vscode/tasks.json`): 15 named tasks covering the most common test runs, reporting commands, linting, TypeScript checks, `playwright-cli` launchers, and process cleanup — runnable via `Ctrl+Shift+P` → Tasks: Run Task without opening a terminal
- **VS Code snippets** (`.vscode/playwright.code-snippets`): framework-compliant snippets with tab stops and choice pickers — `pwtest` (full file), `pwt` (single test), `pom` (page object class), `ge` (constructor locator), `req` (API test), `rou` (network mock), `pwschema`, `pwfactory`, and more; all adapted to framework conventions (correct imports, constructor locators, `api`/`networkMock` fixtures)
- `docs/framework-cheatsheet.md`: two-page dense quick-reference covering all commands, test tags, selector priority, templates, fixture list, data strategy, and the full VS Code snippet prefix table — designed to stay open while writing tests
- Smart Reporter opens automatically after every local `npm test` run via `posttest` lifecycle hook (CI-guarded — does not run in CI environments)
- `?a11ybreak=1` and `?visualbreak=1` URL params permanently baked into the app — demos are repeatable, not one-time setup scripts

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 12. AI-Assisted Development ★★★★★

**Strengths:**

- 35 prescriptive skills covering every testing topic: selectors, Lean POM, fixtures, API, accessibility, visual regression, debugging, CI/CD, migration, onboarding, verification, and more
- Dual tool support: `.claude/skills/` for Claude Code, `.cursor/skills/` for Cursor — same rules, both tools
- CLAUDE.md constitution with MUST/SHOULD/WON'T rule tables — unambiguous guidance for AI code generation
- `Explore Before Generate` mandate: `playwright-cli` required before writing any selector or schema — AI cannot hallucinate selectors it hasn't observed; **No Substitute UI Exploration** rule explicitly hardened across `playwright-cli/SKILL.md`, `enums/SKILL.md`, and `fixtures/SKILL.md` (both `.claude/` and `.cursor/` copies) — IDE browser MCP, Cursor browser tools, and Playwright `codegen` are explicitly forbidden as substitutes
- `skill-creator` skill: eval runner, benchmark aggregation, description optimizer, blind comparison — skills can be measured and improved
- `pw-review` and `k6-review` skills: AI can self-audit generated test code for compliance before submitting
- `@a11y` and `@visual` tags with corresponding skills — AI knows exactly when and how to generate each test type

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 13. Cross-Platform & Environment Support ★★★★★

**Strengths:**

- Multi-environment: `dev`, `staging`, `production` via `TEST_ENV` with per-env `.env` files
- Dev Container: Dockerfile + devcontainer.json with pre-warmed npm cache, CLI browser cache on named Docker volume
- Named volume for `node_modules` avoids slow bind-mount I/O on Windows and macOS
- Cross-browser: Chromium, Firefox, WebKit configured; `chromium-admin` project for admin-role tests
- `playwright-cli-select` works across all platforms for interactive test selection
- `npm run kill` cleans up orphaned Playwright/ESLint processes (Windows PowerShell script)
- `.gitattributes` enforces `eol=lf` for shell scripts and Dockerfile to prevent CRLF issues in containers
- Windows, macOS, and Linux all supported with documented environment setup
- `Makefile` provides composable named targets: `install`, `setup`, `lint`, `test`, `smoke`, `regression`, `a11y`, `visual`, `report`, `clean` — available natively on macOS/Linux/WSL; Windows users use Git Bash or the dev container

**What would improve this:**
Already at 5 stars. No changes needed.

---

### 14. Accessibility Testing ★★★★★

**Strengths:**

- `@axe-core/playwright` integration — Deque's official WCAG scanner, industry standard for accessibility compliance
- `a11yScan` fixture in `fixtures/accessibility/a11y-fixture.ts`: reusable, composable, injected via `mergeTests()` — no test imports axe-core directly
- Fixture options: `include` (scope to element), `exclude` (skip regions), `disableRules` (targeted suppression with required documentation)
- WCAG 2.1 AA tag set: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` — comprehensive AA compliance scanning
- `@a11y` as a first-class test tag alongside `@smoke`, `@regression`, `@api`, etc.
- 6 tests covering: login page, menu page, payment details modal (scoped to `[role="dialog"]`), login error state (known app-level color contrast bug documented with `// FIXME`), keyboard navigation (login form tab order + Enter activation), and `[DEMO]` violation detection proof
- Keyboard navigation test verifies: Email → Password → Sign in tab order; Enter key on submit logs in successfully — confirmed via `playwright-cli` exploration (6 nav links precede the form in document order)
- `?a11ybreak=1` URL param permanently baked into the Coffee Cart app: sets `--primary: #d4d4d4` via body class, creating two instant color-contrast failures (~1.1:1 on button, ~1.05:1 on heading) — repeatable demo, no test setup required
- `[DEMO]` test asserts violations ARE detected (inverted assertion) — always passes, perfect for onboarding walkthroughs in Smart Reporter
- Known app bug (`#dc2626` on `#fef2f2` = 4.41:1 contrast, below required 4.5:1) correctly documented with `// FIXME: app-level bug` and suppressed with `disableRules` rather than a silently-passing test
- `a11yScan` fixture emits `axe-violations` annotation after every scan — violation count appears in Smart Reporter test detail cards, enabling trend visibility without a separate dashboard (Option A; Options B/C in `docs/todo.md`)
- Covered in `docs/framework-onboarding.md` with demo walkthrough steps

**What would improve this:**
Already at 5 stars. Potential future additions: ARIA live region assertions, axe violation trend lines in Smart Reporter (Options B/C in `docs/todo.md`).

---

## Conclusion

The framework scores **5.0 / 5.0** across all 14 categories — all Exemplary. All previously targeted assessment improvements are complete. The documentation library has expanded to 23 Jr QA usage guides, a structured learning path, and a two-page framework cheatsheet. VS Code tasks and snippets are now shipped with the repo. Future work remains in areas like axe violation trend tracking Options B/C and CI visibility enhancements.

**Key differentiators:**

1. **AI-native:** 35 prescriptive skills ensure consistent, rule-compliant code generation across Claude Code and Cursor
2. **Smart reporting:** AI-powered failure analysis with local LM Studio support — no API key or data egress required
3. **Zero type violations:** 10 strict TypeScript flags + Zod strict schemas + ESLint `no-explicit-any` = zero `any` types across the entire codebase
4. **Dual CI/CD:** Identical sharded strategies on GitHub Actions and CircleCI — no platform lock-in, 4-way parallelism on both
5. **Full quality pipeline:** EditorConfig > ESLint > Prettier > Husky > lint-staged > CI — quality gates from keystroke to deployment
6. **Containerized development:** One-click Dev Container with pre-warmed npm and browser caches — zero setup friction on any machine
7. **Visual API debugging:** `pw-api-plugin` with zero-overhead toggle — rich request/response cards in Trace Viewer when needed, no browser cost when not
8. **WCAG compliance built-in:** Dedicated `a11yScan` fixture, `@a11y` tag, `?a11ybreak=1` demo param — accessibility is a first-class testing discipline, not an afterthought
9. **Explore-before-generate discipline:** Mandatory `playwright-cli` exploration before writing any selector or schema — tests are grounded in observed behavior, not guesses
10. **Comprehensive training library:** 23 Jr QA usage guides covering every area of the framework — from first test to E2E journeys, API testing, accessibility, flaky test management, network mocking, multi-environment runs, Dev Container setup, and Docker usage. A dedicated `docs/learning-framework.md` learning path tells engineers exactly what to read and in what order. A two-page `docs/framework-cheatsheet.md` keeps all commands, tags, templates, and VS Code snippet prefixes at hand while writing tests. Smart Reporter opens automatically after every local run so the feedback loop is immediate from day one.
11. **Interactive test selection:** 8 `playwright-cli-select` modes (by file, title, tag, failed, changed, UI, headed) — engineers spend less time on tooling, more time on testing
12. **Multi-app scalability:** Directory contract documented and enforced, `app-onboarding` skill with checklists — the framework hosts multiple apps without cross-contamination and scales with the organization
13. **Cross-agent AI governance:** A single canonical skill system is mirrored across Claude Code, Cursor, and GitHub Copilot custom agents, ensuring consistent AI behavior, standards, and guardrails regardless of which assistant contributors use.
14. **Plan-to-browser verification:** Beyond test generation, the framework supports structured manual verification of feature branches against original implementation plans, using live browser checks and documented evidence to validate that intended UX matches delivered behavior.
15. **End-to-end AI operating model:** AI support spans the full lifecycle — generation, review, verification, and skill optimization — making the framework not just AI-assisted in authoring, but AI-governed in quality and continuous improvement.

---

_Updated for v1.7.0. March 26, 2026._
