# Learning Path — Playwright AI Framework

**Audience:** Jr QA Engineers joining the project for the first time.

This guide tells you what to read, in what order, and why. Skip around if you already know certain topics, but the order below is designed to build your understanding progressively — each document assumes you have read the ones before it.

---

## Stage 1 — Get oriented (start here)

These documents give you the big picture before you touch any code. Read them before anything else.

| Order | Document                                        | What you will learn                                                                                                                                                                                    |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | [Framework Onboarding](framework-onboarding.md) | How to install the project, run the tests for the first time, and get a live demo of every test type running locally. Step-by-step walkthrough including accessibility and visual regression.          |
| 2     | [Developer Guide](developer.md)                 | The full architecture — page objects, fixtures, test types, folder structure, authentication, CI pipelines, and how everything connects. Your reference document for how the framework is designed.    |
| 2b    | [Dev Container Guide](usage/dev-container.md)   | How to set up and use the VS Code Dev Container — the fastest way to get a fully working environment with zero local installation beyond Docker and VS Code. Read this if you are using the container. |
| 2c    | [Docker Usage Guide](usage/docker-usage.md)     | What Docker is, how the CI pipeline uses it, and how the Playwright image ensures consistent test runs. Read this to understand what CI logs mean and why "it works in Docker" matters.                |
| 2d    | [Framework Cheatsheet](framework-cheatsheet.md) | A dense two-page quick reference covering all npm commands, test tags, selector priority, templates, fixtures, and VS Code tasks and snippet prefixes. Keep it open while writing tests.               |

**After Stage 1 you should be able to:** clone the repo, install dependencies (locally or via Dev Container), start the app, and run the test suite locally.

---

## Stage 2 — Run and understand existing tests

Before writing your own tests, understand how to work with the tests that already exist.

| Order | Document                                                         | What you will learn                                                                                                                                         |
| ----- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3     | [Smart Reporter Usage Guide](usage/playwright-smart-reporter.md) | How to read the test report that opens after every run — passed/failed indicators, stability scores, the trace viewer, and AI-powered fix suggestions.      |
| 4     | [Debugging Failing Tests](usage/debugging-failing-tests.md)      | A systematic workflow for diagnosing why a test failed — trace viewer tabs, screenshot analysis, error message quick reference, and when to use which tool. |
| 5     | [Flaky Test Management](usage/flaky-test-management.md)          | What flaky tests are, how the framework detects them, how to quarantine a flaky test with `@flaky`, and how to investigate and fix the root cause.          |

**After Stage 2 you should be able to:** read the Smart Reporter, diagnose a failing test using traces and screenshots, and quarantine a flaky test while you investigate it.

---

## Stage 2b — Understand the demo apps

Before writing tests, understand what apps you are testing against and how they work.

| Order | Document                                          | What you will learn                                                                                                                       |
| ----- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 3b    | [Coffee Cart App Guide](usage/coffee-cart-app.md) | How to start Coffee Cart, its pages and API endpoints, available page objects, auth credentials, and the demo break parameters.           |
| 3c    | [Sauce Demo App Guide](usage/sauce-demo-app.md)   | What Sauce Demo is, the six built-in test users and their behaviours, available page objects, credentials factory, and how to build URLs. |

**After Stage 2b you should know:** what apps are under test, how to start them, and what pages/endpoints exist before you write a single test.

---

## Stage 3 — Explore and write your first test

Now you are ready to write tests. This stage covers the tools and concepts you need for your first test from scratch.

| Order | Document                                                                | What you will learn                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6     | [playwright-cli Exploration Guide](usage/playwright-cli-exploration.md) | How to open a live page in the browser, read snapshots to discover element roles and labels, interact with the page, and capture a user flow — all before writing any code.       |
| 7     | [Test Generator Usage](usage/test-generator-usage.md)                   | How to scaffold a correctly structured test file in one command — the right folder, the right imports, and the right placeholder structure — instead of creating it from scratch. |
| 8     | [Understanding Fixtures](usage/understanding-fixtures.md)               | Every fixture the framework provides — page objects, the `api` fixture, helper fixtures, accessibility, network mocking — what each one does and how to request it in a test.     |
| 9     | [Test Data Factories](usage/test-data-factories.md)                     | How to generate realistic test data with Faker factory functions, how to override specific fields, and when to use static JSON files instead.                                     |

**After Stage 3 you should be able to:** explore a page with `playwright-cli`, scaffold a test file with the generator, request page object fixtures, and call factory functions for test data.

---

## Stage 4 — Write specific test types

With the basics in place, this stage covers each test type in depth.

| Order | Document                                                  | What you will learn                                                                                                                                                                   |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10    | [Creating a Page Object](usage/creating-a-page-object.md) | How to build a page object from scratch — class skeleton, locator pattern priority, action methods with JSDoc, and how to register it in the fixture system so tests can use it.      |
| 11    | [Writing Full API Tests](usage/writing-api-tests.md)      | From a generated stub to a production-quality API spec — URL construction, making requests, validating responses with Zod schemas, status code coverage, serial mode, and cleanup.    |
| 12    | [Writing E2E Journey Tests](usage/writing-e2e-tests.md)   | Multi-page flows that span the full user journey — when E2E tests are the right choice, the `@destructive` tag and cleanup hooks, multi-role scenarios, and keeping E2E tests stable. |

**After Stage 4 you should be able to:** build a new page object, write a full API test spec with schema validation, and write a multi-page E2E journey test with proper cleanup.

---

## Stage 5 — Specialised testing areas

These guides cover areas of the framework you will use for specific types of coverage. Read them when your work requires that test type.

| Order | Document                                                                       | What you will learn                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13    | [Authentication & Storage State](usage/authentication-storage-state.md)        | Why tests do not log in via the UI every run, how storage state is created and loaded, what to do when auth breaks, and how to add a new user role.                          |
| 14    | [Multi-Environment Testing](usage/multi-environment-testing.md)                | The three environments (dev, staging, production), how to switch between them, which tests run in each environment, and how CI targets different environments automatically. |
| 15    | [Accessibility Testing](usage/accessibility-testing.md)                        | How axe-core WCAG 2.1 AA scanning works, how to read violation reports, how to write accessibility tests, how to scope scans, and how to disable a rule for a known app bug. |
| 16    | [Visual Regression — Managing Baselines](usage/visual-regression-baselines.md) | How screenshot comparison works, creating and updating baselines, reading failure diffs, masking dynamic content, and dealing with CI vs local rendering differences.        |
| 17    | [Network Mocking](usage/network-mocking.md)                                    | How to simulate server errors, timeouts, offline mode, and custom API responses using the `networkMock` fixture — and when to mock vs use the real backend.                  |
| 18    | [Helpers Reference Guide](usage/helpers-usage.md)                              | The utility functions in `helpers/` — price formatting, clipboard reading, download content — when to use them and how they differ from fixtures.                            |

---

## Stage 6 — Advanced topics

These guides cover topics that come up once you are comfortable with the basics and are working on more complex scenarios.

| Order | Document                                            | What you will learn                                                                                                                                 |
| ----- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19    | [Skills Guide](usage/skills-guide.md)               | The skills usage playbook for all 35 AI skills — what each one does, when it should trigger, and example prompts for AI-assisted work.              |
| 20    | [Adding Your Own App](usage/adding-your-own-app.md) | How to onboard a completely new application into the framework — directory structure, fixture registration, config, auth setup, and CI integration. |
| 21    | [Skill Creator Usage](usage/skill-creator-usage.md) | How to create, test, and improve AI skills that guide Claude and Cursor to generate framework-compliant code.                                       |
| 22    | [Scripts Reference Guide](usage/scripts-usage.md)   | What every script in `scripts/` does, when to run it manually, the npm commands that wrap each one, and recommendations for new utilities.          |

---

## Quick Reference — document by topic

If you are looking for a specific topic rather than following the learning path in order:

| Topic                                 | Document                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Coffee Cart app setup and structure   | [Coffee Cart App Guide](usage/coffee-cart-app.md)                              |
| Sauce Demo app and test users         | [Sauce Demo App Guide](usage/sauce-demo-app.md)                                |
| First time setup                      | [Framework Onboarding](framework-onboarding.md)                                |
| Setting up the Dev Container          | [Dev Container Guide](usage/dev-container.md)                                  |
| How Docker and CI work                | [Docker Usage Guide](usage/docker-usage.md)                                    |
| Architecture overview                 | [Developer Guide](developer.md)                                                |
| Reading test reports                  | [Smart Reporter Usage Guide](usage/playwright-smart-reporter.md)               |
| A test is failing                     | [Debugging Failing Tests](usage/debugging-failing-tests.md)                    |
| A test is sometimes failing           | [Flaky Test Management](usage/flaky-test-management.md)                        |
| Exploring a page before writing tests | [playwright-cli Exploration Guide](usage/playwright-cli-exploration.md)        |
| Creating a new test file              | [Test Generator Usage](usage/test-generator-usage.md)                          |
| What fixtures are available           | [Understanding Fixtures](usage/understanding-fixtures.md)                      |
| Test data — names, emails, payloads   | [Test Data Factories](usage/test-data-factories.md)                            |
| Building a new page object            | [Creating a Page Object](usage/creating-a-page-object.md)                      |
| Writing API tests                     | [Writing Full API Tests](usage/writing-api-tests.md)                           |
| Writing multi-page journey tests      | [Writing E2E Journey Tests](usage/writing-e2e-tests.md)                        |
| Login / auth state                    | [Authentication & Storage State](usage/authentication-storage-state.md)        |
| Running against staging or production | [Multi-Environment Testing](usage/multi-environment-testing.md)                |
| Accessibility (WCAG) testing          | [Accessibility Testing](usage/accessibility-testing.md)                        |
| Screenshot comparison tests           | [Visual Regression — Managing Baselines](usage/visual-regression-baselines.md) |
| Simulating server errors / offline    | [Network Mocking](usage/network-mocking.md)                                    |
| All AI skills and example prompts     | [Skills Guide](usage/skills-guide.md)                                          |
| Adding a new app to the framework     | [Adding Your Own App](usage/adding-your-own-app.md)                            |
| Creating AI skills                    | [Skill Creator Usage](usage/skill-creator-usage.md)                            |
| Utility helper functions              | [Helpers Reference Guide](usage/helpers-usage.md)                              |
| What each npm script does             | [Scripts Reference Guide](usage/scripts-usage.md)                              |
| VS Code tasks and snippet prefixes    | [Framework Cheatsheet](framework-cheatsheet.md#vs-code-integration)            |
