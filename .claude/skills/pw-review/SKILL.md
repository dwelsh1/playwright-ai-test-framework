---
name: pw-review
description: Review Playwright test code, config, fixtures, and framework structure for correctness, resilience, maintainability, and best practices. Use when asked to review Playwright tests, configs, selectors, auth setup, flakiness, or reporting.
metadata:
  argument-hint: '[paths-or-context]'
  effort: high
---

# Playwright Code Review

Review the Playwright codebase or files referenced by: $ARGUMENTS

Your job is to perform a **senior-level Playwright code review** focused on correctness, reliability, maintainability, and test value.

## Review goals

Prioritize these outcomes:

1. Catch issues that cause flaky, brittle, misleading, or low-value tests.
2. Identify incorrect or risky Playwright usage.
3. Check whether the tests validate **user-visible behavior** rather than implementation details.
4. Improve maintainability, readability, and scalability of the suite.
5. Recommend practical fixes with examples.
6. Distinguish clearly between **must-fix issues**, **important improvements**, and **nice-to-have improvements**.

## Framework context

This skill is designed for **this specific Playwright framework**. All reviews must check compliance with the framework's mandatory rules in addition to general Playwright best practices. The full constitution is in `CLAUDE.md`. Key mandatory rules are summarized below — treat any violation as a critical issue unless clearly justified.

Reviews must explicitly validate **Lean POM** usage where page objects are involved: readonly constructor locators, actions only, no `expect()` in POM classes, and feedback locators when the UI provides them (**No Feedback-Less Lean POM**).

### MUST rules

- Import `test` and `expect` from `fixtures/pom/test-options.ts` only — never from `@playwright/test` in spec files
- Page objects must be injected via fixtures — never `new PageObject(page)` in test files
- Selector priority: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`
- API schemas must use `z.strictObject()` — never `z.object()`
- No `any` type anywhere
- Web-first assertions only — never `waitForTimeout()`
- Dynamic test data via Faker factories in `test-data/factories/` — no hardcoded test content strings
- Static boundary/invalid data in `test-data/static/` as JSON
- Enums from `enums/` for all repeated strings (routes, product names, messages, prices)
- Constants and timeouts in `config/` or `enums/` — no magic numbers inline

### WON'T rules (forbidden)

- No XPath selectors
- No `page.waitForTimeout()` or manual sleeps
- No hardcoded credentials — use `process.env`
- No tags on `test.describe()` — tags go on individual `test()` calls only
- Each test has **exactly one** tag: `@smoke`, `@sanity`, `@regression`, `@e2e`, or `@api`. `@functional` is forbidden. Only `@destructive` may be added alongside a primary tag.
- `@destructive` tests **must** have `afterEach`/`afterAll` cleanup hooks
- No JSDoc on locator properties or locator-returning methods — action methods only
- When a test has 2+ API calls, each must be in a dedicated `test.step()`

## Core review principles

Apply these principles consistently:

- Prefer assertions and interactions based on **user-visible behavior**.
- Prefer resilient locators: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, and `getByTestId` as a last resort.
- Treat CSS-heavy or DOM-structure-dependent selectors as a smell unless clearly justified.
- Favor Playwright's built-in waiting and auto-waiting behavior over manual sleeps.
- Flag `waitForTimeout()` and similar hard waits — no exceptions.
- Prefer explicit, meaningful assertions over weak visibility-only checks when stronger assertions are possible.
- Favor isolated, deterministic tests that do not depend on execution order.
- Prefer authenticated state reuse where appropriate instead of repeating expensive login flows in every test.
- Prefer root-cause fixes over simply increasing retries.
- Treat retries as a safety net, not a band-aid.
- Favor clear test intent over over-abstraction.
- Avoid burying assertions in helpers unless that pattern is intentional and consistently beneficial.

## What to review

Inspect as relevant:

- `playwright.config.ts` — project scoping, testIdAttribute, retries, workers, reporters, baseURL
- test files in `tests/{area}/`
- `fixtures/pom/test-options.ts` — single import point
- `fixtures/pom/page-object-fixture.ts` — fixture registrations
- `fixtures/api/` — API request fixtures and Zod schemas
- `fixtures/helper/` — helper fixtures for setup/teardown
- `pages/{area}/` — page objects and components
- `enums/{area}/` — enum coverage for routes, messages, product names
- `test-data/factories/{area}/` — dynamic data factories
- `test-data/static/{area}/` — static boundary/invalid data
- `config/{area}.ts` — app URL and timeout configuration
- `helpers/{area}/` — helper functions
- global setup / teardown
- CI pipeline config (`.github/workflows/`, `.circleci/`)

## Review checklist

Use [checklist.md](checklist.md) as your detailed checklist.

## Review process

1. Identify the review scope from the requested files, folders, or diff.
2. Read `playwright.config.ts` and `CLAUDE.md` first if available.
3. Scan suite structure before diving into individual files.
4. Review tests for correctness, stability, and framework compliance.
5. Review fixtures, helpers, and page objects for abstraction quality.
6. Review auth, data, and environment strategy.
7. Review execution configuration, reporting, and CI behavior.
8. Summarize findings in priority order.
9. Provide concrete fixes, code examples, or refactor suggestions for the most important issues.

## Required output format

Use this exact structure unless the user asks for another format.

### 1) Overall verdict

- 3-8 bullet summary of the suite quality.
- State whether the suite is beginner, intermediate, advanced, or enterprise-leaning.
- State whether it is likely to scale well.
- Note any critical framework compliance gaps.

### 2) Critical issues

List only issues that can produce incorrect results, severe flakiness, major maintenance risk, or framework rule violations.

For each issue include:

- **Title**
- **Why it matters**
- **Evidence** (file/path + short explanation)
- **Recommendation**
- **Example fix** if useful

### 3) Important improvements

List meaningful but non-critical improvements.

### 4) Nice-to-have improvements

List lower-priority polish or optimization ideas.

### 5) Positive findings

Call out what is well done.

### 6) Refactoring recommendations

Provide the most valuable structural improvements.

### 7) Suggested next steps

Recommend an execution order for improvements.

## What to flag aggressively

Flag these when present:

**Framework violations (critical)**

- importing `test` or `expect` from `@playwright/test` instead of `fixtures/pom/test-options.ts`
- `new PageObject(page)` inside any test file
- tags placed on `test.describe()` instead of individual `test()` calls
- tests with zero tags, more than one non-`@destructive` tag, or the forbidden `@functional` tag
- `@destructive` tests without cleanup hooks
- `z.object()` used for API schemas instead of `z.strictObject()`
- `any` type in TypeScript
- `page.waitForTimeout()` or manual sleeps
- XPath selectors
- hardcoded credential strings — must use `process.env`
- hardcoded test content strings (product names, labels, user data) — must use factories
- magic numbers inline — must use `config/` or `enums/`
- JSDoc on locator properties

**General Playwright issues**

- `waitForTimeout()` used as synchronization
- brittle nth-child / CSS-chain locators
- assertions against implementation details instead of user-visible results
- tests that combine too many responsibilities
- repeated login flows where auth state reuse would help
- hidden inter-test dependencies
- test data collisions across parallel runs
- mutable shared state across workers
- overly broad retries masking flakiness
- excessive use of `force: true`
- unreliable network assumptions
- no API/data seeding when UI setup is expensive
- page objects that are too large, vague, or assertion-heavy without clear reason
- weak naming and poor test readability
- missing cleanup where test isolation depends on it
- poor CI behavior or config mismatch between local and CI

## What good looks like

Reward these patterns:

**Framework compliance**

- all imports from `fixtures/pom/test-options.ts`
- fixture injection for all page objects
- enum usage for routes, messages, product names, prices
- factory usage for all dynamic test data
- `z.strictObject()` for all API schemas
- single tag per test from the approved set
- Given/When/Then structure inside `test.step()`
- `test.step()` wrapping each API call when 2+ exist

**General Playwright quality**

- user-centric assertions
- semantic locators in priority order
- stable fixture design
- isolated test data
- sensible storage state usage
- clear suite structure
- pragmatic abstractions
- strong debug artifacts (trace/video/screenshots) used intentionally
- CI settings that improve trust without hiding failures

## Review tone

Be direct, specific, and practical.
Do not praise weak patterns.
Do not nitpick style unless it affects test quality or maintainability.
Prefer actionable recommendations over generic advice.
Check against the framework's MUST and WON'T rules explicitly — these are non-negotiable.

## If code changes are requested

When the user asks you to fix issues after the review:

1. Start with critical issues and framework violations.
2. Preserve test intent.
3. Prefer the smallest reliable change.
4. Explain any tradeoffs.
5. Update related helpers/config when needed.
6. Run `npx tsc --noEmit` and `npx eslint --max-warnings=0` after changes.
7. Run affected tests and confirm all pass before marking done.

## If the review target is a PR or diff

Bias toward:

- framework compliance regressions
- new flakiness risks
- selector quality
- data/auth impact
- CI/runtime cost impact
- whether the change increases or reduces maintainability

## See also

These skills contain the detailed rules being reviewed against. Read them when investigating a specific area:

| Skill            | Relevant for                                            |
| ---------------- | ------------------------------------------------------- |
| `selectors`      | Locator priority, forbidden selectors, conversion guide |
| `test-standards` | Tagging rules, `test.step()`, imports, Given/When/Then  |
| `fixtures`       | Fixture injection, `test.extend()`, merging             |
| `page-objects`   | Lean POM, readonly locators, registration               |
| `type-safety`    | Zod schemas, `z.strictObject()`, no-any enforcement     |
| `data-strategy`  | Factories vs static data, when to use Faker             |
| `api-testing`    | `api` fixture, schema validation, helper fixtures       |
| `authentication` | Storage state, auth setup files, session reuse          |
| `flaky-tests`    | Flakiness taxonomy, diagnosis, quarantine               |
| `debugging`      | Systematic workflow, trace reading, error reference     |
| `ci-cd`          | GitHub Actions, CircleCI, sharding, artifact management |
