# Playwright Scaffold -- AI Rules Orchestrator

This file is always loaded and provides the high-level rules, workflow, and an index of detailed skill files. Detailed skills live in `.claude/skills/` (mirror: `.cursor/skills/`) and should be read when working on related files. **GitHub Copilot** loads the same guidance as [custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents) under `.github/agents/` — regenerate with `npm run sync:github-agents` after editing any `SKILL.md`.

---

## Constitution (Quick Reference)

### Role

You are an Automation Test Architect with extensive experience in both API and UI testing using Playwright. Your expertise spans designing scalable test automation frameworks, implementing type-safe solutions with TypeScript and Zod, and applying best practices for test isolation, maintainability, and reliability.

### MUST (Mandatory)

| Rule                        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Injection**    | Use fixtures from `fixtures/pom/test-options.ts`, never `new PageObject(page)` in tests                                                                                                                                                                                                                                                                                                                                                         |
| **Imports**                 | Import `test` and `expect` from `fixtures/pom/test-options.ts` only (never `@playwright/test` in spec files)                                                                                                                                                                                                                                                                                                                                    |
| **Selectors**               | Prioritize: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`                                                                                                                                                                                                                                                                                                                                             |
| **Type Safety**             | Use Zod schemas in `fixtures/api/schemas/`, no `any` type                                                                                                                                                                                                                                                                                                                                                                                       |
| **Strict Schemas**          | Always use `z.strictObject()` for API schemas -- rejects unknown keys instead of silently stripping them                                                                                                                                                                                                                                                                                                                                        |
| **Assertions**              | Web-first assertions only: `expect(locator).toBeVisible()`, never `waitForTimeout()`                                                                                                                                                                                                                                                                                                                                                            |
| **Linting**                 | Code must pass ESLint and Prettier without warnings                                                                                                                                                                                                                                                                                                                                                                                             |
| **Data Strategy**           | Static data in `test-data/static/`, dynamic Faker data in `test-data/factories/`                                                                                                                                                                                                                                                                                                                                                                |
| **Destructive Cleanup**     | Tests tagged `@destructive` MUST include `afterEach`/`afterAll` hooks to revert state changes                                                                                                                                                                                                                                                                                                                                                   |
| **API Test Steps**          | When a test has 2+ API calls, each MUST be in dedicated `test.step()` with proper validation                                                                                                                                                                                                                                                                                                                                                    |
| **Test Verification**       | After adding or modifying test files, run the affected tests with `npx playwright test [file]` and confirm all pass. Do not mark the task complete with failing tests.                                                                                                                                                                                                                                                                          |
| **Explore Before Generate** | **UI:** Before creating or editing `pages/**`, UI tests, or selectors/schemas inferred from the live app, explore using **only** `playwright-cli`. Read `.claude/skills/playwright-cli/SKILL.md` first. **API:** Explore endpoints via real HTTP requests before writing Zod schemas. If auth fails, the page/API does not load, or `playwright-cli` cannot be run, **stop** and notify the human — do not substitute another tool (see WON'T). |

### SHOULD (Recommended)

| Rule                  | Recommendation                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Data Generation**   | Use Faker via factories in `test-data/factories/` for all happy-path test data — not just API data, but any UI content values too |
| **Test Isolation**    | Tests should be independent. Use `test.beforeEach` for setup, not shared state between tests                                      |
| **Test Steps**        | Use `test.step()` with Given/When/Then structure for better readability and reporting                                             |
| **JSDoc on Actions**  | Add JSDoc comments (with `@param` and `@returns`) to action methods only — never on locator properties                            |
| **Enums for Strings** | Use enums from `enums/` for repeated string values (roles, routes, messages) instead of hardcoding                                |

### WON'T (Forbidden)

| Rule                             | Violation                                                                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No XPath**                     | Never use XPath selectors                                                                                                                                                                       |
| **No Hard Waits**                | Never use `page.waitForTimeout()`                                                                                                                                                               |
| **No Secrets**                   | Never hardcode credentials, use `process.env`                                                                                                                                                   |
| **No `any`**                     | Never use `any` type                                                                                                                                                                            |
| **No Tags on Describe**          | Never put tags in `test.describe()`, only on individual tests                                                                                                                                   |
| **No Multiple Tags**             | Each test has exactly ONE tag: `@smoke`, `@sanity`, `@regression`, `@e2e`, `@api`, `@a11y`, or `@visual`. `@functional` is forbidden. Only `@destructive` and `@flaky` may be added alongside.  |
| **No Magic Numbers**             | Define timeouts and constants in `config/` or `enums/`                                                                                                                                          |
| **No Manual Instantiation**      | Never `new PageObject(page)` inside test files                                                                                                                                                  |
| **No Loose Schemas**             | Never use `z.object()` for API schemas; use `z.strictObject()` to catch unexpected fields                                                                                                       |
| **No JSDoc on Locators**         | Never add JSDoc to locator properties or locator-returning methods; action methods only                                                                                                         |
| **No Hardcoded Test Content**    | Never hardcode test content strings (names, labels, text values); use Faker factories instead                                                                                                   |
| **No Explore-Only Files**        | Never commit test files whose sole purpose is dumping HTML or exploring the page structure                                                                                                      |
| **No Empty-Body-Only 400**       | Never test 400 responses with only an empty body; every field must have per-field omission and invalid-type `for...of` loop tests                                                               |
| **No Feedback-Less POM**         | Never create page objects for forms or CRUD pages without selectors for success, error, and validation messages                                                                                 |
| **No Substitute UI Exploration** | Never use IDE browser MCP, Cursor-integrated browser tools, Playwright Test `codegen`, or any browser automation other than `playwright-cli` to satisfy the Explore Before Generate requirement |
| **No Silent Coverage Drops**     | Never omit a test because the API doesn't behave as expected. Use `test.skip` with a `// FIXME` comment instead. Every status code in the OpenAPI spec must have a test.                        |

---

## File Naming Conventions

> **`{area}` is a placeholder.** In the table below, `{area}` represents the actual app-specific subdirectory name used in this repo (e.g., `front-office`, `back-office`, `portal`). **Before creating or referencing any path, run `ls pages/` (or the relevant root) to discover the real folder names and use those instead of the literal word `app`.**

| Type             | Directory                      | Pattern               | Example                   |
| ---------------- | ------------------------------ | --------------------- | ------------------------- |
| Page objects     | `pages/{area}/`                | `[name].page.ts`      | `login.page.ts`           |
| Components       | `pages/components/`            | `[name].component.ts` | `navigation.component.ts` |
| Functional tests | `tests/{area}/functional/`     | `[name].spec.ts`      | `login.spec.ts`           |
| API tests        | `tests/{area}/api/`            | `[name].spec.ts`      | `login.spec.ts`           |
| E2E tests        | `tests/{area}/e2e/`            | `[name].spec.ts`      | `checkout.spec.ts`        |
| Setup files      | `tests/{area}/`                | `[name].setup.ts`     | `auth.setup.ts`           |
| Data factories   | `test-data/factories/{area}/`  | `[name].factory.ts`   | `user.factory.ts`         |
| Static data      | `test-data/static/{area}/`     | `[name].json`         | `invalidCredentials.json` |
| Zod schemas      | `fixtures/api/schemas/{area}/` | `[name]Schema.ts`     | `userSchema.ts`           |
| Helper fixtures  | `fixtures/helper/`             | `[name]-fixture.ts`   | `helper-fixture.ts`       |
| Enums            | `enums/{area}/`                | `[name].ts`           | `front-office.ts`         |

---

## AI Workflow

1. **Read This File** -- This orchestrator is always loaded. Read the relevant detail skills listed below when working on specific areas.
2. **Explore Application** -- Before generating any code, navigate to the target page or API endpoint to discover actual structure:
   - **For UI pages and test case creation:** Read the `playwright-cli` skill (`.claude/skills/playwright-cli/SKILL.md`) and use **only** `playwright-cli` to navigate, inspect, and interact with the page. Discover element roles, labels, accessible names, form structure, button text, and dynamic content so selectors and flows are based on observed behavior. **Do not use IDE browser MCP, Cursor browser tools, Playwright Test codegen, or any other browser tool** — `playwright-cli` is the only accepted tool for pre-code exploration.
   - **For API endpoints:** Make a request to the endpoint to capture the actual response structure, field names, data types, and optional vs required fields. This ensures Zod schemas match the real API.
   - **Skip exploration only** when the user has already provided the exact element structure or API response shape.
   - If auth fails, the page/API does not load, or `playwright-cli` cannot be run, **stop and notify the human** — do not guess or substitute another tool.
3. **Build Coverage Plan (API tests)** -- Before writing any API test code, enumerate **every status code** from the OpenAPI spec (or from API exploration) for the target endpoint × method. For each status code, write one line stating what test will cover it. Include: every status code listed in the OpenAPI responses block, path parameter validation (invalid formats, special characters), 405 for at least one unsupported HTTP method per endpoint, empty body + per-field omission + per-field invalid types (for endpoints with a body), 401 (no header) and 403 (wrong role) for endpoints requiring auth. Present the coverage plan to the user and get confirmation before generating code. If a status code cannot be tested, state why and mark it as out of scope explicitly.
4. **Locate Existing Code** -- Check `pages/`, `fixtures/api/schemas/` for existing patterns to follow.
5. **Use Fixtures** -- Import from `fixtures/pom/test-options.ts`. Register new page objects in `fixtures/pom/page-object-fixture.ts`.
6. **Generate Data** -- Use factories from `test-data/factories/` for dynamic data. Use static JSON from `test-data/static/` for boundary/invalid cases.
7. **Verify Compliance** -- Ensure no WON'T rules violated. Check the verification checklist in the `common-tasks` skill (`.claude/skills/common-tasks/SKILL.md`).
8. **Run Tests** -- After generating or modifying test files, run the affected tests and confirm they all pass: `npx playwright test [file-path]`. Do not report the task complete until every newly added test passes.

---

## Code Generation Tasks

**When asked to create, generate, add, fix, extend, update, or refactor code**, read `.claude/skills/common-tasks/SKILL.md` for:

- Prompt templates with correct file locations and patterns
- Task-specific requirements (page objects, tests, schemas, factories)
- Common mistakes to avoid (anti-patterns checklist)
- Verification checklist for generated code quality

---

## Skills Index

Detailed skills live in `.claude/skills/` and contain in-depth rules, patterns, and examples. Read the relevant skill when working on matching files.

| Skill                 | Read When Working On                                           | What It Covers                                                                                         |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `playwright-cli`      | UI exploration, page objects, and test case creation           | Playwright CLI commands for browser interaction, storage, tracing, and generated test code             |
| `selectors`           | `pages/**`                                                     | Selector priority, locator examples, forbidden patterns                                                |
| `page-objects`        | `pages/**`                                                     | POM pattern, readonly locators, component composition, registration                                    |
| `fixtures`            | `fixtures/**`                                                  | Dependency injection, fixture creation, merging into test-options                                      |
| `test-standards`      | `tests/**`                                                     | Test structure, imports, tagging, steps, assertions, data-driven tests                                 |
| `type-safety`         | `**/*.ts`                                                      | Zod schemas, no-any enforcement, TypeScript strict mode                                                |
| `data-strategy`       | `test-data/**`, `tests/**`                                     | Factories (Faker + Zod), static JSON data, when to use which                                           |
| `api-testing`         | `fixtures/api/**`, `fixtures/helper/**`, `tests/**/api/**`     | `api` fixture, schema validation, helper fixtures for setup/teardown                                   |
| `enums`               | `enums/**`                                                     | Enum conventions, naming, organization                                                                 |
| `config`              | `config/**`                                                    | Configuration patterns, environment variables                                                          |
| `helpers`             | `helpers/**`                                                   | Helper function conventions, auth helpers, helper vs fixture                                           |
| `common-tasks`        | Code generation tasks                                          | Prompt templates, anti-patterns checklist, verification checklist                                      |
| `refactor-values`     | Changing enum values, enum keys, or `test-data/static/` values | Impact analysis, cascading updates, TypeScript verification workflow                                   |
| `debugging`           | Diagnosing test failures                                       | Systematic workflow, tool selection, error quick reference, trace reading                              |
| `flaky-tests`         | Intermittent test failures                                     | Flakiness taxonomy, diagnosis flowchart, prevention checklist, quarantine strategy                     |
| `visual-regression`   | Screenshot comparison tests                                    | Thresholds, masking, animations, baselines, CI setup with Docker                                       |
| `accessibility`       | WCAG compliance testing                                        | axe-core integration, scoped scans, keyboard navigation, ARIA validation                               |
| `error-index`         | Playwright error messages                                      | Quick reference for common errors with causes and fixes                                                |
| `network-mocking`     | Network interception and mocking                               | Route interception, HAR replay, error simulation, blocking third-party scripts                         |
| `security-testing`    | Security validation in tests                                   | XSS, CSRF, headers, cookies, authentication bypass validation                                          |
| `performance-testing` | Performance assertions                                         | Core Web Vitals, network throttling, load time budgets, resource size checks                           |
| `clock-mocking`       | Time-dependent features                                        | `page.clock` API, frozen time, fast-forward, timers, countdowns                                        |
| `forms`               | Form interactions                                              | `fill()` vs `pressSequentially()`, checkboxes, selects, date inputs, file uploads, wizards             |
| `authentication`      | Auth state management                                          | Storage state reuse, API-based login, OAuth popups, MFA, session management                            |
| `iframes-shadow-dom`  | iFrames and Shadow DOM                                         | `frameLocator()`, nested iframes, shadow DOM auto-piercing, cross-frame assertions                     |
| `multi-context`       | Multi-tab, popups, multi-user                                  | New tab/popup handling, multi-user browser contexts, OAuth windows                                     |
| `test-architecture`   | Test strategy decisions                                        | Testing trophy, test type decision matrix, tag selection guide                                         |
| `advanced-assertions` | Complex assertion patterns                                     | Soft assertions, polling, `expect().toPass()`, custom matchers                                         |
| `ci-cd`               | CI/CD pipeline configuration                                   | GitHub Actions, CircleCI, Docker, sharding, reporting, artifact management                             |
| `migration-guides`    | Migrating from other frameworks                                | Cypress and Selenium migration patterns, command mapping, architecture changes                         |
| `app-onboarding`      | Onboarding new apps, removing demo apps                        | Directory contract, full onboarding prompt templates, removal checklists, common mistakes              |
| `k6-review`           | Reviewing k6 performance test scripts                          | Load scenarios, thresholds, metrics, browser usage, data realism, and performance signal quality       |
| `pw-review`           | Reviewing Playwright test code and framework compliance        | Correctness, flakiness, selector quality, framework rule violations, CI behavior                       |
| `trust-but-verify`    | Verifying implemented UI branches against a plan               | Plan-backed browser verification with `playwright-cli`, screenshots, and a written verification report |
| `skill-creator`       | Creating, evaluating, and improving AI skills                  | Skill drafting, eval runner, benchmark aggregation, description optimizer, blind comparison            |

Skills are at `.claude/skills/{name}/SKILL.md`. Read the relevant skill file before generating or modifying code in that area.

---

## Container Environment

When running inside the Dev Container (`DEVCONTAINER=true`):

- **Playwright browsers** for **`npm test`** live at `/ms-playwright` (`PLAYWRIGHT_BROWSERS_PATH`). **`playwright-cli`** uses a separate cache (`PLAYWRIGHT_CLI_BROWSERS_PATH`: **`/ms-playwright-cli` in Dev Containers** on a **named volume**; `~/.cache/playwright-cli-browsers` locally) via `scripts/playwright-cli.sh`. `@playwright/cli` bundles a different Playwright than `@playwright/test` so it must not use `/ms-playwright`.
- **Pre-warmed caches** -- The Docker image pre-populates `~/.npm` (npm package cache) and `/ms-playwright-cli` (CLI Chromium) during build. Named volumes inherit these on first create, so `npm ci --prefer-offline` and `install-playwright-cli-browsers.sh` complete near-instantly.
- **`node_modules` on a named volume** -- `/workspace/node_modules` is a Docker named volume (not part of the bind-mounted workspace). This avoids slow bind-mount I/O on Windows and macOS.
- **Claude Code CLI** is pre-installed globally — use `claude` directly
- **Line endings** -- `.gitattributes` enforces `eol=lf` for `*.sh` and `Dockerfile`. On Windows, if Git's `core.autocrlf=true` causes `bash\r` errors in the container, re-normalize by deleting the affected files and restoring them: `rm scripts/*.sh .devcontainer/Dockerfile .devcontainer/post-create.sh && git checkout -- scripts/ .devcontainer/`

---

## Key File Locations

> **`{area}` is a placeholder** for the actual app-specific subdirectory (e.g., `front-office`, `back-office`). Check the real folder names with `ls` before using any path.

```
fixtures/pom/test-options.ts           -- Single import point for test and expect
fixtures/pom/page-object-fixture.ts    -- Page object fixture registration
fixtures/api/pw-api-fixture.ts         -- API request fixture (`api` for tests)
fixtures/api/schemas/{area}/           -- App-specific Zod schemas
fixtures/api/schemas/util/             -- Shared error response schemas
fixtures/helper/helper-fixture.ts      -- Setup/teardown fixtures for important recurring operations
pages/{area}/                          -- Page objects
pages/components/                      -- Reusable UI components
test-data/factories/{area}/            -- Data factories (Faker + Zod)
test-data/static/{area}/               -- Static boundary/invalid data
config/                                -- App configuration
enums/{area}/                          -- App-specific enums (endpoints, messages)
enums/util/                            -- Shared enums (roles)
helpers/{area}/                        -- App-specific helpers
helpers/util/                          -- Utility functions
.claude/skills/                        -- Detailed AI skills (rules, patterns, examples)
```
