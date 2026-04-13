# Skills Testing Guide

This guide explains how to manually test every framework skill and confirm that it triggers on the right prompts, stays scoped to the right job, and produces the kind of result you expect.

Use this guide when you want to:

- validate a newly added skill
- confirm an existing skill still triggers correctly after edits
- spot under-triggering or over-triggering
- test the `skill-creator` workflow itself

For day-to-day usage guidance, example prompts, and when-to-use summaries, see:

- `docs/usage/skills-guide.md`
- `docs/usage/skill-prompt-examples.md`
- `docs/usage/skill-creator-usage.md`

---

## Test Setup

Before testing skills:

1. Start from a fresh chat or reset the context enough that previous instructions will not bias the result.
2. Use a realistic user prompt, not just the skill name.
3. Keep the prompt scoped to one main task.
4. Watch whether the assistant behaves like the intended skill rather than explicitly naming the skill.
5. Record what happened.

Use this simple result template for each manual test:

```md
## Skill test result

- Skill:
- Prompt used:
- Expected behavior:
- Actual behavior:
- Verdict: Pass / Partial / Fail
- Notes:
```

---

## What Good Skill Behavior Looks Like

A skill is behaving well when:

- it activates on natural language, not only when named directly
- it uses the framework's terminology and conventions
- it stays scoped to the requested task
- it does not drift into neighboring workflows unless that helps the task
- it does not trigger for clearly unrelated work

Common failure modes:

- **Under-triggering**: the prompt should have activated the skill, but the assistant answered generically
- **Over-triggering**: the skill activates for unrelated work
- **Partial triggering**: the skill activates, but misses one or two of its key repo-specific rules
- **Wrong companion behavior**: the correct skill activates, but it fails to pull in a natural companion workflow

---

## Fast Test Packs

Use these grouped checks when you want quick confidence without testing all 35 skills one by one.

### Pack 1 — New UI test authoring

Test these together:

- `common-tasks`
- `playwright-cli`
- `test-standards`
- `selectors`
- `page-objects`
- `data-strategy`

**Lean POM shortcut:** focused prompts + automated smoke for a six-skill subset — [`skills-checklist-pack-1-lean-pom.md`](./skills-checklist-pack-1-lean-pom.md).

### Pack 2 — API and type safety

Test these together:

- `api-testing`
- `type-safety`
- `test-architecture`
- `data-strategy`

**Checklist:** prompts + pass criteria — [`skills-checklist-pack-2-api-type-safety.md`](./skills-checklist-pack-2-api-type-safety.md).

### Pack 3 — Review and debugging

Test these together:

- `pw-review`
- `debugging`
- `error-index`
- `flaky-tests`
- `advanced-assertions`

**Checklist:** prompts + pass criteria — [`skills-checklist-pack-3-review-debugging.md`](./skills-checklist-pack-3-review-debugging.md).

### Pack 4 — Workflow and repo operations

Test these together:

- `trust-but-verify`
- `ci-cd`
- `app-onboarding`
- `migration-guides`
- `skill-creator`

**Checklist:** prompts + pass criteria + negative checks — [`skills-checklist-pack-4-workflow-repo.md`](./skills-checklist-pack-4-workflow-repo.md).

---

## Skill-By-Skill Manual Tests

Each row gives you one realistic prompt and the main signs that the correct skill activated.

### Core Framework Skills

| Skill             | Prompt to test                                                                                                               | What should happen if the skill triggered correctly                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectors`       | `Review these locators and replace brittle selectors with the framework's preferred semantic strategy.`                      | The assistant should prioritize `getByRole()`-first guidance, call out brittle patterns, and stay focused on locator choice rather than rewriting the whole spec. |
| `page-objects`    | `Create a page object for the Coffee Cart stores page using constructor-assigned readonly locators and action methods only.` | The assistant should produce or describe a repo-compliant POM structure, avoid assertions in the page object, and align with fixture registration patterns.       |
| `fixtures`        | `Add a fixture for the new orders page object and register it in the merged test options setup.`                             | The assistant should focus on dependency injection, merged fixtures, and the correct registration points rather than using manual instantiation.                  |
| `type-safety`     | `Refactor this API schema code to remove any types and use strict Zod parsing throughout.`                                   | The assistant should emphasize `z.strictObject()`, strong typing, and TypeScript-safe patterns.                                                                   |
| `data-strategy`   | `Replace the remaining hardcoded checkout values with factories or static JSON where appropriate.`                           | The assistant should distinguish happy-path factory data from invalid/boundary JSON and avoid endorsing inline literals.                                          |
| `enums`           | `Move these repeated order status labels into enums and update the affected tests and helpers.`                              | The assistant should centralize repeated strings and describe the right enum organization for this repo.                                                          |
| `config`          | `Add configuration support for a new staging host and keep the env variable usage framework-compliant.`                      | The assistant should focus on `config/`, env variable handling, and consistent repo configuration patterns.                                                       |
| `helpers`         | `Extract this repeated auth payload builder into a helper and keep the responsibility out of the spec file.`                 | The assistant should distinguish helper logic from fixtures and page objects and keep the work scoped to reusable plain functions.                                |
| `common-tasks`    | `Generate a new API test for the promotions endpoint following the framework's API test conventions.`                        | The assistant should use scaffold-like prompt/template logic and align file location, imports, and conventions.                                                   |
| `refactor-values` | `We renamed the checkout success message. Refactor it safely and update every downstream reference.`                         | The assistant should think in impact analysis mode and identify cascading updates, not just a single string replacement.                                          |
| `test-standards`  | `Rewrite this functional spec so it follows our import, tagging, and Given/When/Then step conventions.`                      | The assistant should correct imports, tags, step structure, and web-first assertions.                                                                             |

### Test Design And Authoring Skills

| Skill                 | Prompt to test                                                                                                             | What should happen if the skill triggered correctly                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `test-architecture`   | `For this new admin workflow, tell me which parts should be API tests versus functional tests versus one end-to-end path.` | The assistant should reason about coverage levels instead of jumping straight into code.                         |
| `api-testing`         | `Create API tests for the orders endpoint using the api fixture, Zod validation, and proper step boundaries.`              | The assistant should use `api`, schema validation, and step-based API coverage patterns.                         |
| `forms`               | `Help me test the checkout form, including empty-state validation, card fields, and field-specific error messages.`        | The assistant should focus on form interaction methods, validation behavior, and field-specific test design.     |
| `authentication`      | `Set up storage-state-based login for the admin suite so we stop repeating the UI login flow in every test.`               | The assistant should focus on storage state reuse, auth setup files, and role/session patterns.                  |
| `advanced-assertions` | `Fix this flaky dashboard spec by replacing naive timing assumptions with polling-based assertions.`                       | The assistant should recommend `expect.poll`, `toPass`, or soft assertions rather than arbitrary waits.          |
| `visual-regression`   | `Add a visual regression test for the checkout modal and choose sane masking and threshold settings.`                      | The assistant should focus on screenshots, masking dynamic areas, baselines, and visual-specific guardrails.     |
| `accessibility`       | `Create an accessibility test for the login flow, including axe scans and a keyboard-only validation path.`                | The assistant should center on WCAG coverage, `a11yScan`, and keyboard behavior, not just functional success.    |
| `playwright-cli`      | `Use playwright-cli to explore the stores page first, capture the real selectors, then summarize what we should automate.` | The assistant should treat live browser exploration as mandatory and avoid substituting non-CLI browser tooling. |

### Debugging, Review, And Verification Skills

| Skill              | Prompt to test                                                                                                                                   | What should happen if the skill triggered correctly                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `debugging`        | `This Firefox test is failing only in CI. Walk through the framework's debugging workflow and narrow down the root cause.`                       | The assistant should use a methodical diagnosis flow rather than guessing or jumping straight to code edits.                                 |
| `error-index`      | `I am getting strict mode violation on this locator. Use the error index approach to explain the likely cause and fix.`                          | The assistant should quickly map the known error message to likely causes and targeted fixes.                                                |
| `flaky-tests`      | `This checkout spec is flaky across browsers. Diagnose the likely flakiness category and recommend the cleanest fix.`                            | The assistant should classify the flake and recommend a root-cause fix rather than just increasing retries.                                  |
| `pw-review`        | `Review these changed Playwright files for framework compliance, selector quality, and regression risk.`                                         | The assistant should respond in code-review mode with findings first, not implementation.                                                    |
| `trust-but-verify` | `Verify that this frontend branch matches the intended UX, click through the changed flow with playwright-cli, and write a verification report.` | The assistant should treat this as manual verification, not coding, and should describe requirements + diff + browser verification behavior. |
| `k6-review`        | `Review this k6 script for realistic traffic patterns, useful thresholds, and whether the browser usage makes sense.`                            | The assistant should review performance signal quality and load realism, not Playwright test style.                                          |

### Specialized Test Technique Skills

| Skill                 | Prompt to test                                                                                                            | What should happen if the skill triggered correctly                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `network-mocking`     | `Add a test that simulates the payment provider timing out without mocking our own backend endpoints.`                    | The assistant should keep mocks scoped to external dependencies and use the repo's network mock patterns.        |
| `security-testing`    | `Create security-focused checks for the login and checkout flows, especially headers, cookies, and reflected input.`      | The assistant should emphasize security headers, cookies, auth boundaries, and XSS/CSRF-style checks.            |
| `performance-testing` | `Add performance assertions for the menu page and calibrate the resource budgets based on realistic transferred size.`    | The assistant should focus on budgets, timing metrics, and performance evidence instead of generic speed advice. |
| `clock-mocking`       | `Show me how to test a session timeout banner using Playwright clock control instead of waiting in real time.`            | The assistant should use the clock API and time-control patterns.                                                |
| `iframes-shadow-dom`  | `Help me automate the payment widget inside this iframe and explain how to assert across the frame boundary.`             | The assistant should focus on frame-aware patterns and shadow DOM behavior.                                      |
| `multi-context`       | `Design a test for the admin opening a report in a new tab while another user completes the order in a separate context.` | The assistant should use multi-tab or multi-user context patterns instead of forcing a single-page solution.     |

### Platform, Workflow, And Migration Skills

| Skill              | Prompt to test                                                                                                                                             | What should happen if the skill triggered correctly                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ci-cd`            | `Update our Playwright pipeline so smoke runs on PRs, regression sharding runs nightly, and traces upload on failure.`                                     | The assistant should think in workflow/pipeline terms and cover sharding, artifacts, and CI-specific behavior.                          |
| `migration-guides` | `Translate this Cypress test into our Playwright framework style and explain the architectural changes, not just the syntax changes.`                      | The assistant should discuss migration patterns, not just line-by-line conversion.                                                      |
| `app-onboarding`   | `Help me onboard a new demo app into the framework with the right directory structure, fixtures, config, and starter tests.`                               | The assistant should focus on the repo's onboarding contract and multi-app structure.                                                   |
| `skill-creator`    | `Create a new repo skill for release-readiness verification, include eval prompts, and make the trigger description specific enough to activate reliably.` | The assistant should switch into the skill creation loop: intent capture, draft, eval prompts, iteration, and description optimization. |

---

## Negative Tests

Use these to confirm that skills do **not** over-trigger.

### `trust-but-verify` should not trigger

Prompt:

```text
I updated the API schemas and helper fixtures for the orders endpoint. Can you review the TypeScript changes and tell me if the contracts look correct?
```

Expected behavior:

- `pw-review` or `type-safety` style behavior is more likely than `trust-but-verify`
- no browser verification workflow should start

### `playwright-cli` should not trigger

Prompt:

```text
Review this config diff and tell me whether the retries and reporters make sense.
```

Expected behavior:

- the assistant should stay in code/config review mode
- it should not try to explore a live page

### `skill-creator` should not trigger

Prompt:

```text
Create a new functional test for cart discounts.
```

Expected behavior:

- `common-tasks` or authoring skills should drive the response
- the assistant should not start designing a new skill

---

## Manual Test Sequence For `skill-creator`

This is the recommended manual test path for the `skill-creator` skill itself.

### 1. Creation prompt

Use:

```text
Create a new repo skill for release-readiness verification, include eval prompts, and make the trigger description specific enough to activate reliably.
```

Expect:

- the assistant asks clarifying questions or captures intent
- it proposes a draft `SKILL.md`
- it suggests test prompts

### 2. Improvement prompt

Use:

```text
The api-testing skill is under-triggering when people ask for endpoint coverage plans. Improve the skill and add better eval prompts.
```

Expect:

- the assistant treats this as a skill-improvement task
- it focuses on the existing skill's description and test prompts

### 3. Description optimization prompt

Use:

```text
The selectors skill is triggering when people ask about CSS in general. Help optimize the description so it triggers only for Playwright locator work.
```

Expect:

- the assistant focuses on trigger quality, false positives, and evaluation queries

### 4. Finalization prompt

Use:

```text
This skill looks good. Finalize it for this repo and make sure the mirrors and indexes are updated correctly.
```

Expect:

- the assistant ensures `.cursor`, `.claude`, and `.github/agents` expectations are handled
- it should mention or run `npm run sync:github-agents` as part of the repo workflow

---

## Do We Have Good Step-By-Step Instructions For `skill-creator`?

Yes. The main step-by-step guide is:

- `docs/usage/skill-creator-usage.md`

Use that guide for the full workflow:

1. describe the skill
2. review the draft
3. agree on eval prompts
4. run with-skill vs baseline tests
5. review results
6. iterate
7. optimize the description
8. sync the final result into repo mirrors

Use **this** testing guide when you want the shorter manual QA view: what prompt to type, what success looks like, and how to tell whether the skill triggered correctly.

---

## Maintenance Notes

- Keep this file aligned with `docs/usage/skills-guide.md`
- When new skills are added, add a new manual test row here
- If a skill's trigger behavior changes, update both the example prompt and the expected behavior
