# Writing E2E Journey Tests

**Audience:** Jr QA Engineers — when to write E2E tests, how they differ from functional tests, and how to write them correctly.

E2E (end-to-end) tests verify complete user journeys that span multiple pages and features. A single E2E test might log in, add items to a cart, complete a checkout, and verify the resulting order — exercising every layer of the app in one flow. This guide explains how to structure, write, and maintain E2E tests in this framework.

---

## Table of Contents

1. [E2E vs functional tests — what is the difference?](#1-e2e-vs-functional-tests--what-is-the-difference)
2. [When to write an E2E test](#2-when-to-write-an-e2e-test)
3. [The anatomy of an E2E test](#3-the-anatomy-of-an-e2e-test)
4. [The `@destructive` tag and cleanup](#4-the-destructive-tag-and-cleanup)
5. [Multi-role journeys — switching between user and admin](#5-multi-role-journeys--switching-between-user-and-admin)
6. [Combining multiple page objects in one test](#6-combining-multiple-page-objects-in-one-test)
7. [Using factories for E2E test data](#7-using-factories-for-e2e-test-data)
8. [Keeping E2E tests stable](#8-keeping-e2e-tests-stable)
9. [Common mistakes](#9-common-mistakes)

---

## 1. E2E vs functional tests — what is the difference?

|                     | Functional tests (`tests/functional/`)    | E2E tests (`tests/e2e/`)                                   |
| ------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| **Scope**           | One feature, one page                     | Multiple pages, full user journey                          |
| **What they test**  | "Does the login form validate correctly?" | "Can a user log in, place an order, and see it confirmed?" |
| **Speed**           | Fast — one or two pages                   | Slower — many pages, many steps                            |
| **Tag**             | `@smoke`, `@regression`, `@sanity`        | `@e2e`                                                     |
| **Cleanup needed?** | Sometimes                                 | Almost always — they create persistent state               |

Functional tests answer "does this feature work?" E2E tests answer "does the whole system work together for a real user scenario?"

---

## 2. When to write an E2E test

Write an E2E test when:

- The scenario requires **multiple pages** to complete (e.g., menu → cart → checkout → confirmation)
- The scenario involves **state created in one step being consumed in a later step** (e.g., an order placed by a user must appear in the admin panel)
- The scenario represents a **critical path** that a real user takes — something the business cannot afford to break
- You want to verify that **page objects and features integrate correctly** end-to-end, not just in isolation

Do **not** write an E2E test when:

- You are testing a single feature on a single page — write a functional test instead
- You are testing an API endpoint in isolation — write an API test instead
- The scenario can be adequately covered by a combination of unit and functional tests

---

## 3. The anatomy of an E2E test

E2E tests live in `tests/{area}/e2e/` and follow the same structure as other tests, but with more steps and more fixtures:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateCheckoutData,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Full Purchase Journey', () => {
  // Cleanup runs after EVERY test in this describe block,
  // even if the test fails partway through
  test.afterEach(async ({ cartPage }) => {
    await cartPage.goto();
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      await cartPage.emptyCart();
    }
  });

  test(
    'should complete full user journey from login to order confirmation',
    { tag: ['@e2e', '@destructive'] },
    async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, ordersPage, header }) => {
      const { email, password } = generateUserCredentials();
      const { name, email: checkoutEmail } = generateCheckoutData();

      await test.step('GIVEN user navigates to login', async () => {
        await loginPage.goto();
        await expect(loginPage.form).toBeVisible();
      });

      await test.step('WHEN user logs in with valid credentials', async () => {
        await loginPage.login(email, password);
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });

      await test.step('AND user adds items to cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await menuPage.addToCart(CoffeeNames.CAPPUCCINO);
      });

      await test.step('AND user proceeds to checkout', async () => {
        await header.goToCart();
        await cartPage.checkout();
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('AND user fills and submits checkout form', async () => {
        await paymentDetails.fillCheckout(name, checkoutEmail);
        await paymentDetails.submit();
        await snackbar.waitForAppear();
      });

      await test.step('THEN order appears in orders list', async () => {
        await ordersPage.goto();
        const isEmpty = await ordersPage.isEmpty();
        expect(isEmpty).toBe(false);
      });
    },
  );
});
```

Key structural rules:

- **Each step is a named `test.step()`** with a Given/When/Then/And structure
- **Generate data at the top of the test body**, not at module level
- **All page objects come from fixtures** — never `new PageObject(page)`
- **`afterEach` handles cleanup** — runs unconditionally even when the test fails

---

## 4. The `@destructive` tag and cleanup

A test is **destructive** when it creates, modifies, or deletes persistent state — data that remains after the test ends and could affect other tests. An order placed via checkout is destructive: it exists in the database after the test finishes.

Tag destructive tests with both their primary tag and `@destructive`:

```typescript
test(
  'should complete checkout',
  { tag: ['@e2e', '@destructive'] },
  async (
    {
      /* fixtures */
    },
  ) => {
    // ...
  },
);
```

**Every destructive test MUST have a cleanup hook.** Use `afterEach` to revert state changes:

```typescript
test.describe('Full Purchase Journey', () => {
  test.afterEach(async ({ cartPage }) => {
    // Clean up the cart regardless of whether the test passed or failed
    await cartPage.goto();
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      await cartPage.emptyCart();
    }
  });

  // tests...
});
```

The `afterEach` hook runs **even when the test fails**. This is intentional — a failing test at the checkout step may still have items in the cart that need cleaning up.

**What needs cleanup in E2E tests:**

| State created        | Cleanup action                   |
| -------------------- | -------------------------------- |
| Items added to cart  | `cartPage.emptyCart()`           |
| Orders placed        | Delete via admin API or admin UI |
| User account changes | Revert via API or admin          |

---

## 5. Multi-role journeys — switching between user and admin

Some E2E scenarios require actions from two different roles — a user places an order, then an admin verifies and deletes it. Handle role switching within the test by logging out and logging back in:

```typescript
test(
  'should allow admin to view orders placed by user',
  { tag: '@e2e' },
  async ({ loginPage, menuPage, cartPage, paymentDetails, snackbar, adminPage, header }) => {
    const { email, password } = generateUserCredentials();
    const { name, email: checkoutEmail } = generateCheckoutData();

    await test.step('GIVEN user places an order', async () => {
      await loginPage.goto();
      await loginPage.login(email, password);
      await menuPage.goto();
      await menuPage.addToCart(CoffeeNames.ESPRESSO);
      await header.goToCart();
      await cartPage.checkout();
      await paymentDetails.fillCheckout(name, checkoutEmail);
      await paymentDetails.submit();
      await snackbar.waitForAppear();
    });

    await test.step('AND admin logs in', async () => {
      await header.logout();
      const { email: adminEmail, password: adminPassword } = generateAdminCredentials();
      await loginPage.goto();
      await loginPage.loginAsAdmin(adminEmail, adminPassword);
    });

    await test.step('WHEN admin navigates to dashboard', async () => {
      await adminPage.goto();
      await expect(adminPage.page).toHaveURL(/\/admin/);
    });

    await test.step('THEN the order appears in the admin panel', async () => {
      await expect(adminPage.ordersTable).toBeVisible();
      const count = await adminPage.getStatNumericValue('Orders');
      expect(count).toBeGreaterThan(0);
    });
  },
);
```

This is slower than using storage state (because it navigates through the login UI twice) but necessary when the test flow requires both roles in sequence.

---

## 6. Combining multiple page objects in one test

E2E tests naturally use many page objects. Request them all in the fixture parameter list:

```typescript
async ({
  loginPage,
  menuPage,
  cartPage,
  paymentDetails,
  snackbar,
  ordersPage,
  header,
}) => {
```

**Rules for using multiple page objects:**

- Each page object is responsible for **its own page only** — never call `menuPage.something()` when you are on the cart page
- Use the **header** component (shared across pages) for navigation between pages
- Let Playwright's auto-wait do the work — navigate, then assert that the expected element is visible before continuing

```typescript
// Navigate to cart via the header component
await header.goToCart();

// Confirm you are on the cart page before interacting with cart page objects
await expect(cartPage.page).toHaveURL(/\/cart/);

// Now it is safe to use cartPage methods
await cartPage.checkout();
```

---

## 7. Using factories for E2E test data

E2E tests almost always need dynamic data. Generate it at the top of the test body, before any steps:

```typescript
test(
  'should complete full purchase',
  { tag: ['@e2e', '@destructive'] },
  async (
    {
      /* fixtures */
    },
  ) => {
    // Generate data at the top — before any test.step()
    const { email, password } = generateUserCredentials();
    const { name, email: checkoutEmail } = generateCheckoutData();
    const cartItems = generateCartItems(2); // 2 random coffee items

    await test.step('GIVEN user logs in', async () => {
      await loginPage.login(email, password);
    });

    await test.step('WHEN user adds items to cart', async () => {
      for (const item of cartItems) {
        await menuPage.addToCart(item.name);
      }
    });

    // ...
  },
);
```

**Why at the top?** Data generators are synchronous — they do not need to be inside `test.step()`. Putting them at the top makes the test easier to read and ensures every step has access to the generated values.

---

## 8. Keeping E2E tests stable

E2E tests touch more parts of the system, which means more opportunities for flakiness. Follow these practices:

**Assert before interacting with a new page:**

```typescript
// After navigating to a page, assert you arrived before interacting
await header.goToCart();
await expect(cartPage.page).toHaveURL(/\/cart/); // confirm navigation
await cartPage.checkout(); // now safe to interact
```

**Use the snackbar fixture for confirmation messages:**

```typescript
// Wait for the snackbar to appear — do not rely on a fixed timeout
await paymentDetails.submit();
await snackbar.waitForAppear();
const message = await snackbar.getMessage();
expect(message).toBeTruthy();
```

**Test only the critical assertion per step:**

Each `test.step()` should verify one thing. If a step checks too many things, it is harder to understand which assertion failed when a test breaks.

**Keep cleanup unconditional:**

```typescript
// WRONG — cleanup skipped if test fails early
test.afterEach(async ({ cartPage }) => {
  if (testPassed) {
    await cartPage.emptyCart();
  }
});

// RIGHT — always clean up regardless of test outcome
test.afterEach(async ({ cartPage }) => {
  await cartPage.goto();
  const isEmpty = await cartPage.isEmpty();
  if (!isEmpty) {
    await cartPage.emptyCart();
  }
});
```

---

## 9. Common mistakes

| Mistake                                                   | What to do instead                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Writing E2E tests for single-page scenarios               | Use a functional test — E2E tests are for multi-page journeys                               |
| Forgetting `afterEach` cleanup for destructive tests      | Every `@destructive` test must clean up state                                               |
| Using `test.afterAll` instead of `test.afterEach`         | `afterAll` runs once and misses cleanup if a test fails partway; use `afterEach`            |
| Instantiating page objects with `new Page(page)`          | Use fixture injection — all page objects come from the fixture parameter list               |
| Navigating without asserting the URL first                | Always confirm navigation with `toHaveURL(...)` before interacting                          |
| Generating test data at module level                      | Generate inside the test body so each run gets fresh data                                   |
| Logging in via the UI every run (not using storage state) | E2E tests use storage state from the setup project; only log in via UI when switching roles |
| Tagging `@destructive` tests without cleanup              | The tag is a signal to reviewers that cleanup exists — add the `afterEach`                  |
| Writing E2E tests as the only test for a feature          | E2E tests are slow; cover individual feature behaviour with functional tests first          |

---

## See also

- [Authentication & Storage State](authentication-storage-state.md) — how tests start authenticated without UI login
- [Test Data Factories](test-data-factories.md) — factory functions for checkout, cart, and credential data
- [Understanding Fixtures](understanding-fixtures.md) — all available page object fixtures
- [Flaky Test Management](flaky-test-management.md) — diagnosing and fixing intermittent E2E failures
- [Developer Guide](../developer.md) — E2E test architecture and when to add a new journey test
