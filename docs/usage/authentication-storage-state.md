# Authentication & Storage State

**Audience:** Jr QA Engineers — why tests don't log in through the UI every run, and how auth state works.

Most tests in this framework run as a logged-in user without ever visiting the login page. This guide explains how that works, what happens when auth state breaks, and how to create a new auth setup for a different role.

---

## Table of Contents

1. [Why tests don't log in via the UI every time](#1-why-tests-dont-log-in-via-the-ui-every-time)
2. [How storage state works](#2-how-storage-state-works)
3. [The auth setup files](#3-the-auth-setup-files)
4. [How setup runs before tests](#4-how-setup-runs-before-tests)
5. [Where the auth state files are stored](#5-where-the-auth-state-files-are-stored)
6. [When auth state expires or breaks](#6-when-auth-state-expires-or-breaks)
7. [Tests that need to be unauthenticated](#7-tests-that-need-to-be-unauthenticated)
8. [Tests that need to log in as a specific role](#8-tests-that-need-to-log-in-as-a-specific-role)
9. [Adding auth for a new role](#9-adding-auth-for-a-new-role)
10. [Common mistakes](#10-common-mistakes)

---

## 1. Why tests don't log in via the UI every time

Imagine a test suite with 50 tests that all need a logged-in user. If each test logs in via the UI (fill email → fill password → click login → wait for redirect), that is 50 UI login sequences per run — adding minutes of login time and making every test depend on the login page working correctly.

The solution is to log in **once**, save the resulting browser state (cookies, session tokens, localStorage) to a file, and then load that saved state into every test that needs it. Tests start as if they are already logged in.

This is Playwright's **storage state** feature.

---

## 2. How storage state works

When a user logs in, the browser receives session data — usually a cookie or a token in localStorage. Every subsequent request includes that session data to prove the user is authenticated.

`page.context().storageState({ path: 'file.json' })` captures all of this — cookies, localStorage, sessionStorage — and saves it to a JSON file. When a test loads that file via `storageState: 'file.json'` in the project config, the browser context starts with all that session data already set. The server sees an authenticated session without any login UI interaction having taken place.

---

## 3. The auth setup files

There are two auth setup files in `tests/coffee-cart/`:

**`auth.user.setup.ts`** — logs in as a regular user and saves to `.auth/coffee-cart/userStorageState.json`:

```typescript
setup('authenticate as user', async ({ page }) => {
  await page.goto(Routes.LOGIN);
  await page.getByRole('textbox', { name: 'Email' }).fill(Credentials.USER_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(Credentials.USER_PASSWORD);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/(?:menu|home|$)/);
  await page.context().storageState({ path: StorageStatePaths.USER });
});
```

**`auth.admin.setup.ts`** — logs in as an admin and saves to `.auth/coffee-cart/adminStorageState.json`:

```typescript
setup('authenticate as admin', async ({ page }) => {
  await page.goto(Routes.LOGIN);
  await page.getByRole('textbox', { name: 'Email' }).fill(Credentials.ADMIN_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(Credentials.ADMIN_PASSWORD);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/admin/);
  await page.context().storageState({ path: StorageStatePaths.ADMIN });
});
```

These use the `setup` alias of `test` (imported from `@playwright/test` directly — setup files are the one exception to the "import from test-options" rule). The `/* eslint-disable playwright/expect-expect */` comment at the top suppresses a lint rule that would otherwise flag tests with no assertions.

---

## 4. How setup runs before tests

Playwright's project system handles the ordering. In `playwright.config.ts`, the test projects declare `dependencies`:

```typescript
// Setup projects run first
{ name: 'user-setup',  testMatch: 'auth.user.setup.ts' },
{ name: 'admin-setup', testMatch: 'auth.admin.setup.ts' },

// Test projects declare which setup they depend on
{
  name: 'chromium',
  use: { storageState: StorageStatePaths.USER },
  dependencies: ['user-setup'],
},
{
  name: 'chromium-admin',
  use: { storageState: StorageStatePaths.ADMIN },
  dependencies: ['admin-setup'],
  testMatch: ['**/admin-dashboard.spec.ts'],
},
```

When you run `npm test`:

1. `user-setup` runs first — logs in as user, writes `userStorageState.json`
2. `chromium` tests run — each test starts with user storage state already loaded
3. `admin-setup` runs first for admin tests — writes `adminStorageState.json`
4. `chromium-admin` tests run with admin storage state

You never need to trigger this manually. It happens automatically every time.

---

## 5. Where the auth state files are stored

Auth state is saved to `.auth/coffee-cart/`:

```
.auth/
└── coffee-cart/
    ├── userStorageState.json
    └── adminStorageState.json
```

These files are gitignored — they contain session tokens and should never be committed. On a fresh clone (or after deleting `.auth/`), the setup projects recreate them on the first test run.

---

## 6. When auth state expires or breaks

If the session expires (the server rejects the stored token) or the auth state file is missing, tests will fail by landing on the login page instead of the expected page. You will see errors like:

```
Error: waiting for locator 'getByRole("heading", { name: /menu/i })' to be visible
```

or the test navigating to `/login` unexpectedly.

**Fix:** Delete the stale auth state file and let the setup re-create it:

```bash
rm .auth/coffee-cart/userStorageState.json
npm test
```

The `user-setup` project will log in fresh and write a new file before the tests run.

If auth is failing because credentials changed, update the `Credentials` enum in `enums/coffee-cart/coffee-cart.ts` or the environment variables in `env/.env.dev`.

---

## 7. Tests that need to be unauthenticated

Some tests verify the login page itself or test what happens when a user is not logged in. These tests must not start with an authenticated session.

Use the `resetStorageState` fixture to clear authentication for a specific test:

```typescript
test(
  'should redirect to login when unauthenticated',
  { tag: '@regression' },
  async ({ page, resetStorageState }) => {
    await test.step('GIVEN user is not logged in', async () => {
      await resetStorageState();
    });

    await test.step('WHEN user navigates to a protected page', async () => {
      await page.goto('/orders');
    });

    await test.step('THEN user is redirected to login', async () => {
      await expect(page).toHaveURL(/\/login/);
    });
  },
);
```

`resetStorageState()` clears cookies and permissions for the current browser context without affecting other tests.

---

## 8. Tests that need to log in as a specific role

Most tests run as the default user (loaded via `storageState`). Admin tests run in the `chromium-admin` project and automatically get admin storage state.

For a test that needs to **switch** from user to admin mid-test (like verifying an admin can see orders a user just placed), log out and log back in within the test itself:

```typescript
await test.step('AND admin logs in', async () => {
  await header.logout();
  const { email, password } = generateAdminCredentials();
  await loginPage.goto();
  await loginPage.loginAsAdmin(email, password);
});
```

This is the pattern used in `full-purchase.spec.ts`. It is slower than storage state but necessary when the test flow requires both roles.

---

## 9. Adding auth for a new role

If you add a new user role to the app, follow these steps:

**Step 1 — Create the setup file:**

```typescript
// tests/coffee-cart/auth.manager.setup.ts
import { test as setup } from '@playwright/test';
import { StorageStatePaths } from '../../enums/coffee-cart/coffee-cart';

setup('authenticate as manager', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env['MANAGER_EMAIL']!);
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env['MANAGER_PASSWORD']!);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/\/manager-dashboard/);
  await page.context().storageState({ path: '.auth/coffee-cart/managerStorageState.json' });
});
```

**Step 2 — Add the path to the `StorageStatePaths` enum:**

```typescript
export enum StorageStatePaths {
  USER = '.auth/coffee-cart/userStorageState.json',
  ADMIN = '.auth/coffee-cart/adminStorageState.json',
  MANAGER = '.auth/coffee-cart/managerStorageState.json', // ← add this
}
```

**Step 3 — Register the setup project and test project in `playwright.config.ts`:**

```typescript
{ name: 'manager-setup', testMatch: 'auth.manager.setup.ts' },
{
  name: 'chromium-manager',
  use: { ...devices['Desktop Chrome'], storageState: StorageStatePaths.MANAGER },
  dependencies: ['manager-setup'],
  testMatch: ['**/manager-*.spec.ts'],
},
```

**Step 4 — Add credentials to the env files** (`env/.env.dev`, `env/.env.staging`).

---

## 10. Common mistakes

| Mistake                                                         | What to do instead                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Writing login steps in `beforeEach` for every test              | Storage state handles login once — tests start authenticated                   |
| Committing `.auth/` files to git                                | These are gitignored for good reason — they contain session tokens             |
| Wondering why tests fail after a password change                | Update credentials in `env/.env.dev` and delete the stale `.auth/` files       |
| Running admin tests without the admin project                   | Use `--project=chromium-admin` or let `npm test` run all projects              |
| Using `resetStorageState` when you actually need the admin role | `resetStorageState` clears auth entirely; use `loginAsAdmin()` to switch roles |

---

## See also

- [Understanding Fixtures](understanding-fixtures.md) — how the `resetStorageState` fixture works
- [Multi-Environment Testing](multi-environment-testing.md) — credentials per environment
- [Developer Guide](../developer.md) — full authentication architecture details
