---
name: test-standards
description: "Test file structure, tagging, step patterns, and import rules Framework skill ID: test-standards. Canonical source: .cursor/skills/test-standards/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: test-standards
  source_path: .cursor/skills/test-standards/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/test-standards/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Test Standards

## Imports

**ALWAYS** import `test` and `expect` from the merged fixture file:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
```

**NEVER** import from `@playwright/test` in spec files.

## Test File Structure

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ appPage }) => {
    await appPage.openHomePage();
  });

  test('should do expected behavior', { tag: '@smoke' }, async ({ appPage }) => {
    await test.step('GIVEN initial state', async () => {
      // setup/preconditions
    });

    await test.step('WHEN user performs action', async () => {
      // action
    });

    await test.step('THEN expected result occurs', async () => {
      // assertions
    });
  });
});
```

## Test File Location and Type

> **`{area}` is a placeholder.** Before creating or referencing any path below, run `ls tests/` to discover the real subdirectory names in this repo (e.g., `front-office`, `back-office`) and use those instead.

| Test Type  | Directory                  | What it covers                                         |
| ---------- | -------------------------- | ------------------------------------------------------ |
| Functional | `tests/{area}/functional/` | One feature or behaviour in isolation                  |
| API        | `tests/{area}/api/`        | API contracts and response validation                  |
| E2E        | `tests/{area}/e2e/`        | A complete multi-feature user journey in a single test |
| Setup      | `tests/{area}/`            | Auth or precondition setup (`.setup.ts`)               |

**Functional vs E2E distinction:**

- A **functional test** isolates and verifies a single behaviour (e.g., "adding a todo updates the count"). Each test covers one thing.
- An **E2E test** chains multiple features together in one test that mirrors a real user journey from start to finish (e.g., add items → complete → filter → clear → verify final state). An E2E file typically contains one or a few high-level scenario tests.

## Tagging Rules

### One Tag Per Test

Each test has **exactly one** tag chosen from the list below. `@functional` is **not** a valid tag.

```typescript
// CORRECT
test('should login successfully', { tag: '@smoke' }, async ({ appPage }) => { ... });
test('should validate cart flow', { tag: '@e2e' }, async ({ checkoutPage }) => { ... });
test('should return user profile', { tag: '@api' }, async ({ apiRequest }) => { ... });

// WRONG -- @functional is not a valid tag
test('should login', { tag: '@functional' }, async ({ appPage }) => { ... });

// WRONG -- mixing tags
test('should login', { tag: ['@smoke', '@e2e'] }, async ({ appPage }) => { ... });

// FORBIDDEN -- tags on describe
test.describe('Feature @smoke', () => { ... });
```

The only exception: `@destructive` tests combine their importance tag with `@destructive`:

```typescript
test('should delete all users', { tag: ['@regression', '@destructive'] }, async () => { ... });
```

### Available Tags

Exactly **one** of the following per test:

| Tag           | Used for                                                 |
| ------------- | -------------------------------------------------------- |
| `@smoke`      | Critical path functional tests, run first and frequently |
| `@sanity`     | Key functionality verification                           |
| `@regression` | Full regression coverage of a single behaviour           |
| `@e2e`        | End-to-end multi-feature user journey tests              |
| `@api`        | API contract and schema validation tests                 |

**Cross-cutting tag** (add alongside one of the above when applicable):

- `@destructive` -- Modifies shared application state. Excluded from `npm test`. Run via `npm run test:destructive` with single worker.

### No Explore-Only Test Files

NEVER commit test files whose sole purpose is exploration, dumping HTML, or manual inspection. These are temporary debugging aids and must never be checked into the repository.

```typescript
// FORBIDDEN -- exploration artifact
test('explore page @explore', async ({ page }) => {
  await page.goto('/some-url');
  const html = await page.content();
  console.log(html); // never commit this
});
```

## Test Steps (Given/When/Then)

Use `test.step()` for readable structure and better HTML report output:

```typescript
test('should show error for invalid login', { tag: '@regression' }, async ({ appPage }) => {
  await test.step('GIVEN user is on the login page', async () => {
    await expect(appPage.loginButton).toBeVisible();
  });

  await test.step('WHEN user enters invalid credentials', async () => {
    await appPage.login('bad@email.com', 'wrongpass');
  });

  await test.step('THEN error message is displayed', async () => {
    await expect(appPage.errorMessage).toBeVisible();
  });
});
```

## Assertions

Use **web-first assertions** only. These auto-wait and retry until the condition is met or timeout:

```typescript
// CORRECT -- web-first assertions
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Expected text');
await expect(locator).toBeEnabled();
await expect(locator).toHaveCount(3);

// FORBIDDEN -- hard waits
await page.waitForTimeout(1000); // NEVER use this
```

## Data-Driven Tests

Loop **outside** test blocks to generate individual test cases:

```typescript
import testData from '../../../test-data/static/app/invalidCredentials.json';

const { invalidCredentials } = testData;

for (const { description, email, password } of invalidCredentials) {
  test(`should show error for ${description}`, { tag: '@regression' }, async ({ appPage }) => {
    await appPage.login(email, password);
    await expect(appPage.errorMessage).toBeVisible();
  });
}
```

## Setup and Teardown

- Use `test.beforeEach()` for per-test setup.
- Use `test.afterEach()` for per-test cleanup when fixtures don't handle it.
- Use `resetStorageState` fixture when testing login flows in authenticated projects:

```typescript
test.beforeEach(async ({ resetStorageState, appPage }) => {
  await resetStorageState();
  await appPage.openHomePage();
});
```

## Destructive Tests

Tests tagged `@destructive` modify shared application state (e.g., deleting data, changing global settings, resetting configurations). They follow strict rules:

### MUST Include Cleanup Hooks

Every `@destructive` test **MUST** use `test.afterEach()` or `test.afterAll()` to revert any state changes, ensuring subsequent tests run against a clean environment:

```typescript
test.describe('admin data management', () => {
  test.afterEach(async ({ apiRequest }) => {
    // REQUIRED: Revert state changes made by the test
    await apiRequest({
      method: 'POST',
      url: ApiEndpoints.RESET_DATA,
      baseUrl: process.env.API_URL,
    });
  });

  test(
    'should delete all inactive users',
    { tag: ['@destructive', '@regression'] },
    async ({ apiRequest }) => {
      // Test that modifies shared state
    },
  );
});
```

### Execution Rules

- **Excluded from `npm test`** -- The base command uses `--grep-invert @destructive` to prevent destructive tests from running in parallel with the full suite.
- **Tag-specific commands** (`test:smoke`, `test:api`, etc.) use `--grep` to select only matching tests. If a test is tagged both `@smoke` and `@destructive`, it runs because the author deliberately chose that combination.
- **Dedicated command** -- `npm run test:destructive` runs only destructive tests with `--workers=1` for sequential execution.

## Test Annotations

Use annotations to manage test execution when tests need to be skipped, are known to fail, or require special handling:

```typescript
// Skip a test unconditionally
test.skip('should handle edge case', async () => { ... });

// Skip conditionally (e.g., platform-specific)
test('should render correctly', async ({ browserName }) => {
  test.skip(browserName === 'webkit', 'Not supported on WebKit yet');
  // ...
});

// Mark a test as expected to fail (test still runs, passes if it fails)
test('should handle known bug', async () => {
  test.fail();
  // test body -- Playwright expects this to fail
});

// Mark a test as not yet implemented (skips, but signals intent to implement)
test.fixme('should validate complex form', async () => {
  // TODO: implement after form redesign
});

// Triple the default timeout for slow tests
test('should process large dataset', async () => {
  test.slow();
  // ...
});
```

### When to Use Each

| Annotation     | Use When                                                                |
| -------------- | ----------------------------------------------------------------------- |
| `test.skip()`  | Test is not applicable in certain conditions (browser, OS, environment) |
| `test.fail()`  | Known bug exists -- test documents expected failure until the fix ships |
| `test.fixme()` | Test is a placeholder -- not yet implemented, skip until ready          |
| `test.slow()`  | Test legitimately needs more time (complex flows, large data)           |

### Serial Test Execution

When tests within a describe block **must** run in order (e.g., a multi-step workflow where each test depends on the previous), use `test.describe.serial()`:

```typescript
test.describe.serial('Multi-step onboarding', () => {
  test('Step 1: create account', { tag: '@e2e' }, async ({ page }) => {
    // ...
  });

  test('Step 2: verify email', { tag: '@e2e' }, async ({ page }) => {
    // Depends on Step 1 completing first
  });

  test('Step 3: complete profile', { tag: '@e2e' }, async ({ page }) => {
    // Depends on Step 2 completing first
  });
});
```

**Use sparingly.** Most tests should be independent. Serial execution is only for true multi-step workflows where test isolation is impractical.

## Advanced Assertions

### Soft Assertions

Use `expect.soft()` to collect multiple failures in a single test instead of stopping at the first failure:

```typescript
import { generateUser } from '../../../test-data/factories/app/user.factory';

test(
  'should display correct user profile',
  { tag: '@regression' },
  async ({ profilePage, createdUser }) => {
    // createdUser is a helper fixture that creates the user via API before the test
    await test.step('THEN all profile fields are correct', async () => {
      await expect.soft(profilePage.nameField).toHaveText(createdUser.name);
      await expect.soft(profilePage.emailField).toHaveText(createdUser.email);
      await expect.soft(profilePage.roleField).toHaveText(createdUser.role);
      // All three are checked even if the first fails
    });
  },
);
```

**Use when:** Verifying multiple independent properties of the same state (form fields, table row values, dashboard cards). Avoids the fix-one-run-again loop.
**Avoid when:** Assertions are dependent -- if the first failure means subsequent checks are meaningless.

### Polling Assertions

Use `expect.poll()` for non-DOM conditions that need retry logic (API state, computed values):

```typescript
test('should process order', { tag: '@regression' }, async ({ apiRequest }) => {
  await test.step('THEN order status updates to completed', async () => {
    await expect
      .poll(
        async () => {
          const { body } = await apiRequest({ method: 'GET', url: '/api/orders/123' });
          return body.status;
        },
        { timeout: 30_000, intervals: [1_000, 2_000, 5_000] },
      )
      .toBe('completed');
  });
});
```

**Use when:** Waiting for backend state changes (order processing, async jobs, eventual consistency).
**Avoid when:** Checking DOM state -- use standard web-first assertions instead.

## Test Independence

Tests MUST be independent. No test should depend on the outcome or side-effects of another test. Use fixtures and `beforeEach` for shared setup.

## See Also

- **`data-strategy`** skill -- Factories vs static data, when to use which for data-driven tests.
- **`api-testing`** skill -- API test structure, `test.step()` patterns for multi-call tests, and `apiRequest` fixture usage.
- **`selectors`** skill -- Selector priority order, Exploration-First Workflow, and Feedback & Validation Message Selectors.
- **`page-objects`** skill -- Lean POM, three-section locator structure, readonly locators, and exploration requirements.
