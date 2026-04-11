---
name: fixtures
description: Fixture dependency injection pattern and fixture creation rules
---

# Fixtures and Dependency Injection

**Lean POM** page objects are always injected through fixtures (`test.extend` / merged `test-options`), never constructed ad hoc in specs. Register new page objects in `fixtures/pom/` after their Lean POM shape is complete (including feedback locators where applicable).

## Core Rule

**ALWAYS** use fixtures for dependency injection. **NEVER** instantiate page objects manually in test files.

```typescript
// CORRECT -- use the fixture
test('example', async ({ appPage }) => {
  await appPage.openHomePage();
});

// FORBIDDEN -- manual instantiation
test('example', async ({ page }) => {
  const appPage = new AppPage(page); // NEVER do this
});
```

## Single Import Point

All test files MUST import `test` and `expect` from the merged fixture file:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
```

**NEVER** import from `@playwright/test` in spec files:

```typescript
// FORBIDDEN in spec files
import { test, expect } from '@playwright/test';
```

## Fixture Architecture

```
fixtures/pom/test-options.ts              ← Single import point (merges all fixtures)
    ├── fixtures/pom/page-object-fixture.ts       ← Page object fixtures
    ├── fixtures/api/api-request-fixture.ts       ← API request fixture (apiRequest for tests)
    └── fixtures/helper/helper-fixture.ts         ← Setup/teardown fixtures (important recurring operations)
```

`test-options.ts` uses `mergeTests()` to combine fixture layers:

```typescript
import { test as base, mergeTests, request } from '@playwright/test';
import { test as pageObjectFixture } from './page-object-fixture';
import { test as apiRequestFixture } from '../api/api-request-fixture';
import { test as helperFixture } from '../helper/helper-fixture';

const test = mergeTests(pageObjectFixture, apiRequestFixture, helperFixture);
const expect = base.expect;
export { test, expect, request };
```

## Prerequisites for New Page Object Fixtures

Before registering a new page object fixture, confirm both of the following are true:

1. **The page object was created after exploring the page with `playwright-cli`** — not IDE browser MCP, Cursor browser tools, or Playwright Test `codegen` (see **No Substitute UI Exploration** rule in `.cursor/rules/rules.mdc`). If `playwright-cli` cannot run, stop and notify the human before proceeding.
2. **The page object includes locators for success messages, error messages, and inline validation feedback** where those elements exist in the application. A page object with only interactive element locators is incomplete (see **No Feedback-Less Lean POM** rule).

If either condition is not met, complete it before registering the fixture.

---

## Adding a New Fixture

### Step 1: Create the fixture file

```typescript
// fixtures/[category]/[name]-fixture.ts
import { test as base } from '@playwright/test';
import { MyNewPage } from '../../pages/app/my-new.page';

export type MyFixtures = {
  myNewPage: MyNewPage;
};

export const test = base.extend<MyFixtures>({
  myNewPage: async ({ page }, use) => {
    await use(new MyNewPage(page));
  },
});
```

### Step 2: Register in the right place (ex.`page-object-fixture.ts`)

For page objects, add directly to the existing fixture:

```typescript
// fixtures/pom/page-object-fixture.ts
export type FrameworkFixtures = {
  appPage: AppPage;
  myNewPage: MyNewPage; // Add the type
  resetStorageState: () => Promise<void>;
};

export const test = base.extend<FrameworkFixtures>({
  appPage: async ({ page }, use) => {
    await use(new AppPage(page));
  },
  myNewPage: async ({ page }, use) => {
    await use(new MyNewPage(page)); // Add the fixture
  },
  resetStorageState: async ({ context }, use) => {
    await use(async () => {
      await context.clearCookies();
      await context.clearPermissions();
    });
  },
});
```

### Step 3: Merge into `test-options.ts` (only for new fixture categories)

If adding a completely new fixture category (not a page object), merge it:

```typescript
const test = mergeTests(pageObjectFixture, apiRequestFixture, newCategoryFixture);
```

## Built-in Fixtures

| Fixture             | Source                   | Purpose                                                              |
| ------------------- | ------------------------ | -------------------------------------------------------------------- |
| `appPage`           | `page-object-fixture.ts` | Main application page object                                         |
| `resetStorageState` | `page-object-fixture.ts` | Clears cookies and permissions (for login tests)                     |
| `apiRequest`        | `api-request-fixture.ts` | Type-safe API request function (primary tool for API calls in tests) |
| `createdResource`   | `helper-fixture.ts`      | Example setup/teardown fixture (replace with your own)               |

### `apiRequest` Fixture vs. Helper Fixtures

Use `apiRequest` directly for all API calls in tests. Create helper fixtures only for critical, recurring setup/teardown reused across many test files. See the `api-testing` skill for the full decision guide, lifecycle pattern, and rule of thumb.

## Cleanup Pattern

For fixtures that need teardown, use the `use` callback pattern:

```typescript
myFixture: async ({ page }, use) => {
    // Setup
    const resource = await createResource();

    await use(resource);

    // Teardown (runs after test)
    await resource.cleanup();
},
```
