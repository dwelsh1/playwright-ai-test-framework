# Skills Usage Playbook

This repo now has **35 skills**. This document is the practical usage guide: when each skill should trigger, when it should not, and what a good user prompt looks like.

Use this playbook when:

- you want to know which skill should activate for a task
- you want better prompts for Claude, Cursor, or GitHub Copilot
- you are evaluating whether a skill is too narrow, too broad, or missing trigger language

The canonical skill sources live here:

- `.cursor/skills/{name}/SKILL.md`
- `.claude/skills/{name}/SKILL.md`
- `.github/agents/{name}.md` is the generated GitHub mirror

After editing any skill, run:

```bash
npm run sync:github-agents
```

---

## How To Prompt Skills Well

You usually do **not** need to name the skill explicitly. Natural requests work better when they clearly describe:

1. The goal: create, review, debug, verify, migrate, or refactor
2. The scope: page object, test file, branch, CI pipeline, performance script, etc.
3. The constraints: app area, tag, browser, environment, branch scope, or acceptance criteria
4. The desired output: code, review findings, verification report, or recommendation

Strong prompt patterns:

- `Create a functional test for...`
- `Review these Playwright tests for flakiness...`
- `Verify this frontend branch still matches the intended UX and acceptance criteria...`
- `Refactor these enums safely and tell me what else must change...`
- `Help me debug this failing Firefox test...`

Weak prompt patterns:

- `help with this`
- `make it better`
- `fix Playwright`
- `review this` without context

---

## Quick Skill Bundles

These are the most common combinations.

| If you want to...                                     | Start with         | Common companion skills                                                          |
| ----------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| Add a new UI test                                     | `common-tasks`     | `playwright-cli`, `test-standards`, `selectors`, `page-objects`, `data-strategy` |
| Add a new API test                                    | `common-tasks`     | `api-testing`, `type-safety`, `data-strategy`, `test-architecture`               |
| Add or update a page object                           | `playwright-cli`   | `page-objects`, `selectors`, `fixtures`                                          |
| Review test quality                                   | `pw-review`        | `test-standards`, `selectors`, `flaky-tests`                                     |
| Debug a failing test                                  | `debugging`        | `error-index`, `flaky-tests`, `advanced-assertions`                              |
| Verify a finished UI branch against expected behavior | `trust-but-verify` | `playwright-cli`                                                                 |
| Safely change test data or enums                      | `refactor-values`  | `data-strategy`, `enums`, `type-safety`                                          |
| Onboard a new app into the framework                  | `app-onboarding`   | `common-tasks`, `fixtures`, `page-objects`, `config`                             |
| Set up CI or sharding                                 | `ci-cd`            | `test-architecture`, `visual-regression`, `flaky-tests`                          |
| Migrate from Cypress or Selenium                      | `migration-guides` | `selectors`, `page-objects`, `test-standards`                                    |

---

## Read First By Situation

**Brand new to the framework**

1. `test-standards`
2. `selectors`
3. `page-objects`
4. `fixtures`
5. `common-tasks`

**Writing new tests**

1. `common-tasks`
2. `playwright-cli`
3. `test-standards`
4. `data-strategy`
5. `type-safety`

**Debugging**

1. `error-index`
2. `debugging`
3. `flaky-tests`

**Reviewing or verifying finished work**

1. `pw-review`
2. `trust-but-verify`
3. `k6-review` for k6 scripts only

---

## Skill-By-Skill Playbook

### Core Framework Skills

| Skill             | Use when                                                                                         | Do not use when                                                         | Example prompt                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `selectors`       | You need locator strategy help, better selectors, or selector review                             | The task is mostly test structure or fixture design                     | `Review these locators and replace brittle selectors with the framework's preferred strategy.`                               |
| `page-objects`    | You are creating or updating a page object or component class                                    | You only need a test file and no POM changes                            | `Create a page object for the Coffee Cart stores page using constructor-assigned readonly locators and action methods only.` |
| `fixtures`        | You need dependency injection, new fixtures, or merged `test-options` updates                    | You are only changing assertions inside one existing test               | `Add a fixture for the new orders page object and register it in the merged test options setup.`                             |
| `type-safety`     | You are touching TypeScript typing, Zod schemas, inferred types, or strict mode issues           | The task is mostly CI or browser flow verification                      | `Refactor this schema and helper code to remove any types and use strict Zod parsing throughout.`                            |
| `data-strategy`   | You are deciding between factories, static JSON, or shared test data                             | The task is selector-only or CI-only                                    | `Replace the remaining hardcoded checkout values with factories or static JSON where appropriate.`                           |
| `enums`           | You are centralizing repeated strings such as routes, messages, roles, or product names          | The string appears once and has no reuse value                          | `Move these repeated order status labels into enums and update the affected tests and helpers.`                              |
| `config`          | You are changing env vars, app URLs, timeout constants, or config layout                         | The task is only test assertions                                        | `Add configuration support for a new staging host and keep the env variable usage framework-compliant.`                      |
| `helpers`         | You need shared utility logic that does not belong in a page object or fixture                   | The work should really be test setup handled by a fixture               | `Extract this repeated auth payload builder into a helper and keep the responsibility out of the spec file.`                 |
| `common-tasks`    | You want prompt templates for generating tests, page objects, schemas, factories, or helpers     | You are reviewing existing code rather than generating new code         | `Generate a new API test for the promotions endpoint following the framework's API test conventions.`                        |
| `refactor-values` | You are changing enum values, static data, routes, labels, or other values with cascading impact | You are adding a brand-new feature rather than changing existing values | `We renamed the checkout success message. Refactor it safely and update every downstream reference.`                         |
| `test-standards`  | You want to structure or review spec files for tags, steps, imports, and assertions              | The task is only browser exploration before writing code                | `Rewrite this functional spec so it follows our import, tagging, and Given/When/Then step conventions.`                      |

### Test Design And Authoring Skills

| Skill                 | Use when                                                                                           | Do not use when                                                        | Example prompt                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `test-architecture`   | You need to decide whether coverage should be API, functional, E2E, a11y, or visual                | You already know the exact test type and just need implementation help | `For this new admin workflow, tell me which parts should be API tests versus functional tests versus one end-to-end path.` |
| `api-testing`         | You are writing or reviewing API tests, schema validation, or helper-fixture setup                 | The task is pure UI behavior with no direct HTTP calls                 | `Create API tests for the orders endpoint using the api fixture, Zod validation, and proper step boundaries.`              |
| `forms`               | You are automating forms, validation messages, selects, uploads, wizards, or typed input behavior  | The page has no meaningful form interaction                            | `Help me test the checkout form, including empty-state validation, card fields, and field-specific error messages.`        |
| `authentication`      | You are dealing with login flows, storage state, OAuth, session reuse, or MFA                      | The feature is unrelated to auth or session setup                      | `Set up storage-state-based login for the admin suite so we stop repeating the UI login flow in every test.`               |
| `advanced-assertions` | You need `expect.poll`, soft assertions, retry blocks, or custom matcher guidance                  | The existing basic assertions are already correct and sufficient       | `Fix this flaky dashboard spec by replacing naive timing assumptions with polling-based assertions.`                       |
| `visual-regression`   | You are creating or reviewing screenshot tests, baselines, masks, or diff thresholds               | The change has no visual snapshot value                                | `Add a visual regression test for the checkout modal and choose sane masking and threshold settings.`                      |
| `accessibility`       | You are adding or reviewing axe checks, keyboard interaction, focus management, or WCAG assertions | The task is only functional happy-path behavior                        | `Create an accessibility test for the login flow, including axe scans and a keyboard-only validation path.`                |
| `playwright-cli`      | You need to inspect the live UI before writing or updating page objects, selectors, or tests       | You are only reviewing static code or changing CI                      | `Use playwright-cli to explore the stores page first, capture the real selectors, then summarize what we should automate.` |

### Debugging, Review, And Verification Skills

| Skill              | Use when                                                                                                    | Do not use when                                                                      | Example prompt                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `debugging`        | A test is failing and you need a methodical diagnosis workflow                                              | You just need a quick code review of a diff                                          | `This Firefox test is failing only in CI. Walk through the framework's debugging workflow and narrow down the root cause.`                       |
| `error-index`      | You have a recognizable Playwright error message and want likely causes fast                                | The problem is broad and not tied to a specific error message                        | `I am getting strict mode violation on this locator. Use the error index approach to explain the likely cause and fix.`                          |
| `flaky-tests`      | A test passes sometimes and fails sometimes, or retries are hiding instability                              | The test is consistently broken for an obvious reason                                | `This checkout spec is flaky across browsers. Diagnose the likely flakiness category and recommend the cleanest fix.`                            |
| `pw-review`        | You want a senior-level review of Playwright code quality, compliance, flakiness, and maintainability       | You want the assistant to implement code immediately                                 | `Review these changed Playwright files for framework compliance, selector quality, and regression risk.`                                         |
| `trust-but-verify` | A UI feature branch is implemented and you want to confirm it matches the intended behavior in the live app | The change is backend-only, API-only, or you want code fixes instead of verification | `Verify that this frontend branch matches the intended UX, click through the changed flow with playwright-cli, and write a verification report.` |
| `k6-review`        | You want a review of k6 scripts, thresholds, load shape, realism, or performance signal quality             | The change is a Playwright test rather than a k6 script                              | `Review this k6 script for realistic traffic patterns, useful thresholds, and whether the browser usage makes sense.`                            |

### Specialized Test Technique Skills

| Skill                 | Use when                                                                                 | Do not use when                                                 | Example prompt                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `network-mocking`     | You need route interception, simulated outages, timeouts, or external dependency mocking | The test should hit your real app API end to end                | `Add a test that simulates the payment provider timing out without mocking our own backend endpoints.`                    |
| `security-testing`    | You are validating XSS, CSRF, cookie flags, headers, or auth bypass scenarios            | The change is ordinary UI behavior with no security angle       | `Create security-focused checks for the login and checkout flows, especially headers, cookies, and reflected input.`      |
| `performance-testing` | You need Core Web Vitals, timing budgets, resource-size checks, or throttling guidance   | The change is purely functional and speed is not being assessed | `Add performance assertions for the menu page and calibrate the resource budgets based on realistic transferred size.`    |
| `clock-mocking`       | The feature depends on time, expiry, countdowns, sessions, scheduling, or date displays  | Time is not a factor in the behavior under test                 | `Show me how to test a session timeout banner using Playwright clock control instead of waiting in real time.`            |
| `iframes-shadow-dom`  | The UI involves iframes, nested frames, or shadow roots                                  | The page is ordinary DOM and standard locators are enough       | `Help me automate the payment widget inside this iframe and explain how to assert across the frame boundary.`             |
| `multi-context`       | You need new tabs, popups, OAuth windows, or multiple users/contexts                     | The flow happens in one page and one browser context only       | `Design a test for the admin opening a report in a new tab while another user completes the order in a separate context.` |

### Platform, Workflow, And Migration Skills

| Skill              | Use when                                                                                                 | Do not use when                                                    | Example prompt                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci-cd`            | You are setting up or revising GitHub Actions, CircleCI, Docker, sharding, retries, or artifact handling | The work is a local-only test change with no pipeline implications | `Update our Playwright pipeline so smoke runs on PRs, regression sharding runs nightly, and traces upload on failure.`                              |
| `migration-guides` | You are converting Cypress or Selenium patterns to Playwright                                            | The work is greenfield Playwright code                             | `Translate this Cypress test into our Playwright framework style and explain the architectural changes, not just the syntax changes.`               |
| `app-onboarding`   | You are onboarding a new application area into the framework or removing a demo app                      | You are only adding one ordinary test to an existing app           | `Help me onboard a new demo app into the framework with the right directory structure, fixtures, config, and starter tests.`                        |
| `skill-creator`    | You want to create, improve, benchmark, or optimize a skill and its trigger description                  | The task is ordinary test or framework work unrelated to skills    | `Create a new repo skill for PR release verification, include eval prompts, and make the trigger description specific enough to activate reliably.` |

---

## Per-Skill Prompt Examples

Use these when you want to explicitly test whether a skill triggers the way you expect.

### `selectors`

Prompt: `Review these Coffee Cart locators and replace any brittle selectors with the framework's preferred semantic locator strategy.`

### `page-objects`

Prompt: `Create a page object for the admin orders page with constructor-assigned readonly locators and action methods only.`

### `fixtures`

Prompt: `Add a fixture for the new promotion page object and merge it into test-options so specs can inject it.`

### `type-safety`

Prompt: `Refactor this API schema code to eliminate any types and make the Zod parsing fully strict and inferred.`

### `data-strategy`

Prompt: `Replace the remaining hardcoded emails and coffee names with factories, enums, or static JSON as appropriate.`

### `enums`

Prompt: `Move these repeated route and status strings into enums and update all affected tests and helpers.`

### `config`

Prompt: `Add configuration support for a new environment host and keep the env variable usage Windows-safe and framework-compliant.`

### `helpers`

Prompt: `Extract this repeated order payload construction into a helper instead of duplicating it across tests and fixtures.`

### `common-tasks`

Prompt: `Generate a new functional test for cart discounts following the framework's file placement, import, and tagging conventions.`

### `refactor-values`

Prompt: `We renamed the admin dashboard metric labels. Refactor the values safely and show me every dependent file that must change.`

### `test-standards`

Prompt: `Rewrite this spec so it uses the correct imports, one allowed tag, and Given/When/Then steps with web-first assertions.`

### `test-architecture`

Prompt: `For the new checkout feature, tell me which scenarios belong in API tests, which in functional tests, and which need one E2E flow.`

### `api-testing`

Prompt: `Create API tests for the orders endpoint using the api fixture, strict schemas, and dedicated steps for each API call.`

### `forms`

Prompt: `Help me automate the checkout form, including invalid inputs, required fields, and the submit behavior for each field state.`

### `authentication`

Prompt: `Set up reusable admin authentication for this suite so we stop repeating UI login in every spec file.`

### `advanced-assertions`

Prompt: `Replace these weak timing assumptions with expect.poll or toPass so the dashboard assertions become reliable.`

### `visual-regression`

Prompt: `Add a visual regression test for the cart drawer and recommend what should be masked versus left visible.`

### `accessibility`

Prompt: `Create accessibility coverage for the login page with axe scans plus a keyboard-only validation path.`

### `playwright-cli`

Prompt: `Use playwright-cli to inspect the Coffee Cart stores page and summarize the real locators and flow before we write code.`

### `debugging`

Prompt: `This test fails only on Firefox in CI. Walk through a proper debugging workflow and identify the most likely root cause.`

### `error-index`

Prompt: `I am seeing a Playwright strict mode violation on this locator. Use the error index approach to explain the likely cause and fix.`

### `flaky-tests`

Prompt: `This spec passes on rerun but fails randomly in the full suite. Diagnose the likely flakiness category and the cleanest fix.`

### `pw-review`

Prompt: `Review this Playwright diff for correctness, flakiness risk, selector quality, and framework rule violations.`

### `trust-but-verify`

Prompt: `Verify that this frontend branch matches the intended UX, use playwright-cli to check the live flow, and write a verification report.`

### `k6-review`

Prompt: `Review this k6 script for realistic traffic shape, meaningful thresholds, and whether it produces trustworthy performance signals.`

### `network-mocking`

Prompt: `Add a test that simulates the payment provider failing without mocking our own backend API.`

### `security-testing`

Prompt: `Create security checks for the login and checkout flows, especially headers, cookies, CSRF behavior, and reflected input.`

### `performance-testing`

Prompt: `Add performance assertions for the menu page and propose realistic resource and timing budgets for local and CI runs.`

### `clock-mocking`

Prompt: `Show me how to test a countdown timer and session expiry warning using Playwright clock mocking instead of real waits.`

### `iframes-shadow-dom`

Prompt: `Help me automate the embedded payment widget inside this iframe and explain the right frame-aware assertion strategy.`

### `multi-context`

Prompt: `Design a test for a popup-based login flow and a second user acting in a separate browser context at the same time.`

### `ci-cd`

Prompt: `Update our Playwright pipeline so smoke runs on PRs, regression sharding runs nightly, and failure artifacts are uploaded cleanly.`

### `migration-guides`

Prompt: `Convert this Cypress flow into our Playwright framework style and explain the architecture differences, not just the syntax.`

### `app-onboarding`

Prompt: `Help me onboard a new app into the framework with the right config, fixtures, directories, starter tests, and cleanup guidance.`

### `skill-creator`

Prompt: `Create a new skill for release-readiness verification, include eval prompts, and improve the description so it triggers reliably.`

---

## Skill Coverage Summary

The repo currently includes these 35 skills:

- `accessibility`
- `advanced-assertions`
- `api-testing`
- `app-onboarding`
- `authentication`
- `ci-cd`
- `clock-mocking`
- `common-tasks`
- `config`
- `data-strategy`
- `debugging`
- `enums`
- `error-index`
- `fixtures`
- `flaky-tests`
- `forms`
- `helpers`
- `iframes-shadow-dom`
- `k6-review`
- `migration-guides`
- `multi-context`
- `network-mocking`
- `page-objects`
- `performance-testing`
- `playwright-cli`
- `pw-review`
- `refactor-values`
- `security-testing`
- `selectors`
- `skill-creator`
- `test-architecture`
- `test-standards`
- `trust-but-verify`
- `type-safety`
- `visual-regression`

---

## Maintenance Notes

- Keep the count in this file in sync with `.cursor/skills/`
- Keep wording aligned with the current framework terminology, especially the `api` fixture name
- After adding or editing a skill, mirror the change in `.claude/skills/` and re-run `npm run sync:github-agents`
- If a skill is hard to trigger naturally, improve the `description` first before adding more body text
