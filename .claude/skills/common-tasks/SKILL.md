---
name: common-tasks
description: AI prompt templates for common Playwright scaffold development tasks
---

# AI Prompt Templates for Playwright Scaffold

This file contains prompt templates for common development tasks. Use these as starting points when asking AI to generate code for this repository.

---

## Quick Reference

> **`{area}` is a placeholder** for the actual app-specific subdirectory. Before using any path below, check the real folder names with `ls pages/`, `ls tests/`, etc.

| Task               | Key Files                      | Primary Tool / Fixture   |
| ------------------ | ------------------------------ | ------------------------ |
| Add page object    | `pages/{area}/`                | `page-object-fixture.ts` |
| Add API schema     | `fixtures/api/schemas/{area}/` | Zod                      |
| Add test           | `tests/{area}/`                | `test-options.ts`        |
| Add API test       | `tests/{area}/api/`            | `apiRequest` fixture     |
| Add setup/teardown | `fixtures/helper/`             | `helper-fixture.ts`      |
| Add data factory   | `test-data/factories/{area}/`  | Faker + Zod              |
| Add component      | `pages/components/`            | N/A                      |

---

## Page Object Tasks

> **Important:** Before generating page objects, read the `playwright-cli` skill (`.claude/skills/playwright-cli/SKILL.md`) and use the `playwright-cli` to navigate to the target page. Discover actual element roles, labels, text content, and UI structure. This ensures accurate selectors and realistic action methods.

### Add a New Page Object (With Exploration)

```
Create a new page object for [PAGE NAME].

First, run `ls pages/` to find the correct area subdirectory (e.g., front-office, back-office).

Then use playwright-cli to navigate to [URL] and explore the page to discover:
- Element roles, labels, and accessible names
- Form field structure and validation
- Button names and available actions
- Any dynamic content or loading states

Then generate the page object with:
- File location: pages/{area}/[name].page.ts  (use real area name from ls)
- Accurate semantic locators based on exploration
- NO JSDoc on locator properties — names are self-documenting
- JSDoc with @param and @returns on action methods only
- Registration in fixtures/pom/page-object-fixture.ts
```

### Add a New Page Object (Without Exploration)

Use this when you already know the exact element structure:

```
Create a new page object for [PAGE NAME] with the following elements:
- [List of elements/locators needed]
- [Actions the page should perform]

Requirements:
- File location: pages/{area}/[name].page.ts  (run `ls pages/` first to find real area name)
- Use semantic locators (getByRole > getByLabel > getByTestId)
- Locators as readonly constructor-assigned properties
- NO JSDoc on locator properties
- JSDoc with @param and @returns on action methods only
- Register in fixtures/pom/page-object-fixture.ts
- Follow the pattern from existing page objects in pages/
```

### Add Locators to Existing Page

```
Add the following locators to [PAGE_NAME] page object:
- [Element 1]: [description]
- [Element 2]: [description]

Use getByRole() as the primary selector strategy.
Add readonly properties assigned in the constructor following the existing pattern.
```

### Add Action Method to Page Object

```
Add an action method to [PAGE_NAME] page object:
- Method name: [methodName]
- Purpose: [what it does]
- Parameters: [list parameters]
- Wait for: [API response or element state]

Include proper return type and JSDoc comment.
```

---

## Test Tasks

> **Important:** Before generating tests, navigate through the user flow to understand the actual steps and expected outcomes.

### Create a Functional Test

Functional tests verify one feature or behaviour in isolation. Each test covers a single thing.

```
Create a functional test for [FEATURE]:
- Location: tests/{area}/functional/[name].spec.ts  (run `ls tests/` first)
- Import from fixtures/pom/test-options.ts
- Use factory data from test-data/factories/{area}/ — never hardcode test content
- Use exactly ONE importance tag per test: @smoke | @sanity | @regression
- Add @destructive alongside the importance tag only if the test modifies shared state
- Structure with test.describe and test.step (Given/When/Then)
- Use beforeEach for navigation/setup

Test scenarios:
1. [Scenario 1]
2. [Scenario 2]
```

### Create an E2E Test

E2E tests chain multiple features together in a single test that mirrors a complete real user journey.

```
Create an E2E test for [USER JOURNEY].

First, run `ls tests/` to find the correct area subdirectory.

Then navigate through the full flow at [STARTING_URL] to discover:
- The complete sequence of steps from start to finish
- Elements and state at each milestone
- Final expected state

Then generate the test with:
- Location: tests/{area}/e2e/[name].spec.ts  (use real area name from ls)
- A SINGLE test covering the entire journey (not one test per step)
- Factory data from test-data/factories/{area}/
- Exactly ONE tag: @smoke | @sanity | @regression
- Steps that chain naturally: setup → action → action → ... → final assertion
```

### Add Data-Driven Tests

```
Add data-driven tests to [TEST FILE] for [SCENARIO]:
- Use static data from test-data/static/{area}/[file].json  (run `ls test-data/static/` first)
- Loop outside test blocks to generate individual tests
- Each test should have descriptive name including test data

Test data structure:
{
  "testCases": [
    { "description": "", "input": "", "expected": "" }
  ]
}
```

### Add API Test

```
Create an API test for [ENDPOINT]:
- HTTP method: [GET|POST|PUT|DELETE|PATCH]
- Endpoint: [/api/path]
- Request body schema: [describe fields]
- Expected response schema: [describe fields]

FIRST: Build a coverage plan. Before writing any code, list every status code the
OpenAPI spec (or API exploration) defines for this endpoint × method. For each status
code, state what scenario will trigger it and what the test will assert. Present the
coverage plan and get confirmation before generating code.

Requirements:
- Create Zod schema in fixtures/api/schemas/{area}/  (run `ls fixtures/api/schemas/` first)
- Use the apiRequest fixture (destructured from test context)
- Validate response with schema.parse()
- Tag with @api
- Include path parameter validation tests if the endpoint has path params
- Include 405 tests for at least one unsupported HTTP method
- Include auth matrix: 401 (no Authorization header) and 403 (wrong role/permissions) for authenticated endpoints
- Document any behavior mismatches (API != spec) with test.skip + // FIXME comment — never omit silently
```

---

## API Schema Tasks

> **Important:** For API schemas, the AI should make a request to the endpoint first to capture the actual response structure, field names, and types.

### Create a New Zod Schema (With Exploration)

```
Create a Zod schema for [ENDPOINT].

First, run `ls fixtures/api/schemas/` to find the correct area subdirectory.

Then make a request to [API_URL/endpoint] to discover:
- Actual response structure and field names
- Data types for each field
- Optional vs required fields
- Nested objects or arrays

Then generate the schema with:
- Location: fixtures/api/schemas/{area}/[name]Schema.ts  (use real area name from ls)
- Accurate field types based on actual response
- Proper Zod validators (email, uuid, url, etc.)
- Exported TypeScript type
```

### Create a New Zod Schema (Without Exploration)

```
Create a Zod schema for [API RESPONSE/REQUEST]:
- Location: fixtures/api/schemas/{area}/[name]Schema.ts  (run `ls fixtures/api/schemas/` first)
- Fields:
  - [field1]: [type] (required|optional)
  - [field2]: [type] (required|optional)

Use Zod 4 top-level validators: z.uuid(), z.email(), z.url(), z.int() etc.
Export both the schema and the inferred TypeScript type.
Follow the pattern from fixtures/api/schemas/app/userSchema.ts.
```

### Add Fields to Existing Schema

```
Add the following fields to [SCHEMA_NAME]:
- [field1]: [type with validation rules]
- [field2]: [type with validation rules]

Update the corresponding TypeScript type export.
```

---

## Data Factory Tasks

### Create a New Data Factory

```
Create a data factory for [DATA TYPE]:
- Location: test-data/factories/{area}/[name].factory.ts  (run `ls test-data/factories/` first)
- Use @faker-js/faker for data generation
- Validate output with Zod schema from fixtures/api/schemas/
- Support overrides parameter for customization
- Support seed option for reproducibility

Fields to generate:
- [field1]: [faker method to use]
- [field2]: [faker method to use]
```

### Add Static Test Data

```
Create static test data for [PURPOSE]:
- Location: test-data/static/{area}/[name].json  (run `ls test-data/static/` first)
- Use for: [boundary testing|invalid data|edge cases]

Data structure:
{
  "[category]": [
    { "description": "", "value": "" }
  ]
}
```

---

## Fixture Tasks

### Add a New Page Object Fixture

```
Create a new fixture for [PAGE OBJECT]:
- Location: fixtures/pom/page-object-fixture.ts (add to existing)
- Fixture name: [fixtureName]
- Purpose: [what page object it provides]

Requirements:
- Add type to FrameworkFixtures
- Add fixture with `async ({ page }, use) => { await use(new PageObject(page)); }`
- No separate fixture file needed for page objects
```

### Add a Helper Fixture (Setup/Teardown)

```
Create a helper fixture for [PURPOSE]:
- Location: fixtures/helper/helper-fixture.ts (add to existing)
- Fixture name: [fixtureName]
- Purpose: [what precondition it sets up and tears down]

Requirements:
- Add return type to HelperFixtures
- Use apiRequest from plain-function.ts for API calls
- Implement setup → use() → teardown pattern
- Setup: Create precondition via API before the test
- Yield: Pass created data to the test via use()
- Teardown: Clean up after the test (runs even on failure)
- Already merged into test-options.ts (no extra registration needed)
```

### Add a New Fixture Category

```
Create a new fixture category for [PURPOSE]:
- Location: fixtures/[category]/[name]-fixture.ts
- Fixture name: [fixtureName]
- Purpose: [what it provides]

Requirements:
- Export test using base.extend<FixtureType>()
- Export the fixture types
- Add cleanup logic if needed
- Merge into fixtures/pom/test-options.ts via mergeTests()
```

---

## Component Tasks

### Add a Reusable Component

```
Create a component object for [COMPONENT NAME] (e.g., header, modal, sidebar):
- Location: pages/components/[name].component.ts
- Elements: [list of elements]
- Actions: [list of actions]

The component should be composable into page objects.
Follow the pattern from pages/components/navigation.component.ts.
```

---

## Common Mistakes to Avoid

1. **DON'T** import from `@playwright/test` in spec files
   - ✅ `import { test, expect } from '../fixtures/pom/test-options'`

2. **DON'T** instantiate page objects manually
   - ❌ `const page = new AppPage(page)`
   - ✅ Use fixture: `async ({ appPage }) => { ... }`

3. **DON'T** use XPath selectors
   - ❌ `page.locator('//div[@id="test"]')`
   - ✅ `page.getByTestId('test')` or `page.getByRole(...)`

4. **DON'T** use hard waits
   - ❌ `await page.waitForTimeout(1000)`
   - ✅ `await expect(locator).toBeVisible()`

5. **DON'T** use `any` type
   - ❌ `const data: any = ...`
   - ✅ Use Zod schema types or explicit interfaces

6. **DON'T** use `z.object()` for API schemas
   - ❌ `z.object({ ... })` (silently strips unknown keys)
   - ✅ `z.strictObject({ ... })` (rejects unknown keys at runtime)

7. **DON'T** hardcode secrets
   - ❌ `password: 'secret123'`
   - ✅ `password: process.env.APP_PASSWORD`

8. **DON'T** put tags on `test.describe()` blocks
   - ❌ `test.describe('Feature @smoke', () => { ... })`
   - ✅ `test.describe('Feature', () => { test('...', { tag: '@smoke' }, ...) })`

9. **DON'T** use `@functional` or combine multiple tags (except `@destructive` alongside an importance tag)
   - ❌ `{ tag: '@functional' }` — not a valid tag
   - ❌ `{ tag: ['@smoke', '@e2e'] }` — one tag only
   - ✅ `{ tag: '@smoke' }` / `{ tag: '@e2e' }` / `{ tag: '@api' }` — one tag per test

10. **DON'T** add JSDoc comments to locator properties or locator-returning methods
    - ❌ `/** The submit button. */ readonly submitButton: Locator;`
    - ✅ `readonly submitButton: Locator;` — name is self-documenting

11. **DON'T** hardcode test content strings in static JSON or inline in tests
    - ❌ `const todos = ['Buy groceries', 'Walk the dog']`
    - ✅ `const todos = generateTodoTexts(3)` — use a Faker factory

12. **DON'T** commit explore-only or throwaway test files
    - ❌ `test('explore page', async ({ page }) => { console.log(await page.content()) })`
    - ✅ Use browser dev tools or the Explore agent instead; never commit debug scripts

13. **DON'T** forget `await` on Playwright actions or assertions
    - ❌ `expect(locator).toBeVisible()` — runs but never awaits, test passes silently
    - ✅ `await expect(locator).toBeVisible()`

14. **DON'T** use `isVisible()` / `isEnabled()` for assertions
    - ❌ `expect(await locator.isVisible()).toBeTruthy()` — no auto-retry, snapshot timing
    - ✅ `await expect(locator).toBeVisible()` — web-first, auto-retries until timeout

15. **DON'T** share mutable state between tests via module-level variables
    - ❌ `let sharedData: string;` at file scope, set in one test, read in another
    - ✅ Use `test.beforeEach()` or fixtures to create fresh state per test

16. **DON'T** hardcode full URLs when `baseURL` is configured
    - ❌ `await page.goto('https://coffee-cart.app/login')`
    - ✅ `await page.goto('/login')` — uses `baseURL` from config

17. **DON'T** assume navigation is instant after a click
    - ❌ `await button.click(); await expect(page).toHaveURL('/next')` — may race
    - ✅ `await button.click(); await page.waitForURL('/next')` — explicit sync

18. **DON'T** use `test.beforeAll()` for per-test setup
    - ❌ `test.beforeAll(async ({ page }) => { ... })` — runs once, shared state
    - ✅ `test.beforeEach(async ({ page }) => { ... })` — fresh state per test

19. **DON'T** test 400 responses with only an empty body — that is not per-field coverage
    - ❌ Single test: `body: {}` (empty body counts as one scenario, not field coverage)
    - ✅ One test per required field omission (destructure + rest to remove the field)
    - ✅ One test per required field with invalid type (spread + override with wrong type)

---

## Verification Checklist

After generating code, verify:

- [ ] Imports are from `fixtures/pom/test-options.ts`
- [ ] Locators use semantic selectors
- [ ] No `any` types used
- [ ] No hard waits (`waitForTimeout`)
- [ ] No XPath selectors
- [ ] No hardcoded credentials
- [ ] No JSDoc on locator properties/methods (JSDoc only on action methods)
- [ ] Tests use `test.step` with Given/When/Then
- [ ] Each test has exactly ONE tag from: `@smoke`, `@sanity`, `@regression`, `@e2e`, `@api` (never `@functional`)
- [ ] Tags are on individual tests, not on `test.describe()` blocks
- [ ] Tests that modify shared state are tagged `@destructive` (alongside the importance tag)
- [ ] Happy-path test data uses factories, not hardcoded strings
- [ ] Static data is only used for fixed app values (error messages, boundary inputs)
- [ ] No explore-only or throwaway test files committed
- [ ] Zod schemas use `z.strictObject()` (never `z.object()`)
- [ ] API test coverage is complete: every status code from the spec has a test (or a `test.skip` with `// FIXME` comment)
- [ ] Path parameter validation tests included for endpoints with path params (invalid formats, special chars, SQL injection candidates)
- [ ] At least one 405 (method not allowed) test per API endpoint
- [ ] Auth matrix tested: 401 (no Authorization header) and 403 (wrong role/permissions) for authenticated endpoints
- [ ] Behavior mismatches (API ≠ spec) documented with `test.skip` + `// FIXME` comment — never silently omitted
- [ ] Run all newly added/modified test files and confirm **zero failures** before finishing

---

## Running Tests to Verify

**MANDATORY:** After adding or modifying any test files, run the affected tests and confirm they all pass before marking the task complete. Do not finish the task with failing tests.

### Commands

Run a specific test file:

```bash
npx playwright test tests/app/functional/todo.spec.ts
```

Run multiple files:

```bash
npx playwright test tests/app/functional/todo.spec.ts tests/app/e2e/todo.spec.ts
```

Run by tag (useful when adding tests to an existing suite):

```bash
npx playwright test --grep @smoke
```

Run all non-destructive tests:

```bash
npm test
```

### Failure Protocol

If tests fail after generation:

1. **Read the error** -- Playwright error messages identify the failing locator, assertion, or timeout.
2. **Fix the root cause** -- Update the page object locator, action method, or assertion. Do not suppress the failure.
3. **Re-run** -- Confirm the fix makes the test pass.
4. **Do not finish** until all newly added tests pass consistently.
