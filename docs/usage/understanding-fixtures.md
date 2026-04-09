# Understanding Fixtures

**Audience:** Jr QA Engineers — what fixtures are, why they exist, and how to use every fixture available in this framework.

Fixtures are the mechanism that makes page objects, the API client, and other test utilities available inside your tests without you having to set them up manually. This guide explains how they work and walks through every fixture the framework provides.

---

## Table of Contents

1. [What is a fixture?](#1-what-is-a-fixture)
2. [The one import rule](#2-the-one-import-rule)
3. [Page object fixtures](#3-page-object-fixtures)
4. [The `api` fixture](#4-the-api-fixture)
5. [Helper fixtures — pre-built setup and teardown](#5-helper-fixtures--pre-built-setup-and-teardown)
6. [The `a11y` fixture — accessibility scans](#6-the-a11y-fixture--accessibility-scans)
7. [The `networkMock` fixture](#7-the-networkmock-fixture)
8. [Combining fixtures in one test](#8-combining-fixtures-in-one-test)
9. [How the fixture chain works](#9-how-the-fixture-chain-works)
10. [Common mistakes](#10-common-mistakes)

---

## 1. What is a fixture?

A fixture is a value that Playwright sets up before your test runs and tears down after. You request a fixture by naming it in the test function's parameter list — Playwright takes care of creating it, passing it in, and cleaning it up.

Compare the manual approach to the fixture approach:

```typescript
// WRONG — manual setup, fragile
test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page); // manually constructing
  await loginPage.goto();
  // ...
});

// RIGHT — fixture injection, clean
test('login test', async ({ loginPage }) => {
  // loginPage is injected
  await loginPage.goto();
  // ...
});
```

The fixture version is simpler: you just name what you need and Playwright provides it. If the page object's constructor changes, you fix it in one place (the fixture registration) — not in every test.

### Fixtures also manage lifecycle

Some fixtures do real work before and after a test:

- A helper fixture might create an order via the API before the test and delete it after
- The `a11y` fixture sets up the axe-core scanner and tears it down when done
- Playwright's built-in `page` fixture creates a browser context before and closes it after

This setup/teardown happens automatically — you do not need `beforeEach` or `afterEach` hooks for anything that has a fixture.

---

## 2. The one import rule

Always import `test` and `expect` from this path:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
```

This is the only import you need. `test-options.ts` merges all fixtures — page objects, API client, helpers, accessibility, network mocking — into a single extended `test` object. Every fixture described in this guide is available through this one import.

**Never import from `@playwright/test` directly in test files:**

```typescript
// WRONG — misses all framework fixtures
import { test, expect } from '@playwright/test';

// RIGHT — includes everything
import { test, expect } from '../../../fixtures/pom/test-options';
```

The number of `../` levels depends on how deep your test file is:

- `tests/coffee-cart/functional/` → `'../../../fixtures/pom/test-options'`
- `tests/coffee-cart/api/` → `'../../../fixtures/pom/test-options'`
- `tests/coffee-cart/e2e/` → `'../../../fixtures/pom/test-options'`

---

## 3. Page object fixtures

These fixtures give you a pre-constructed page object for each page in the app. Use them by naming them in the test function signature.

### Coffee Cart pages

| Fixture      | Type         | What it represents                                   |
| ------------ | ------------ | ---------------------------------------------------- |
| `loginPage`  | `LoginPage`  | The `/login` page — email/password form              |
| `menuPage`   | `MenuPage`   | The `/` menu page — coffee listings                  |
| `cartPage`   | `CartPage`   | The `/cart` page — cart contents and checkout button |
| `ordersPage` | `OrdersPage` | The `/orders` page — order history                   |
| `adminPage`  | `AdminPage`  | The `/admin` page — order management                 |

### Shared components

| Fixture          | Type                      | What it represents                                |
| ---------------- | ------------------------- | ------------------------------------------------- |
| `header`         | `HeaderComponent`         | The navigation bar and cart icon                  |
| `paymentDetails` | `PaymentDetailsComponent` | The checkout modal form                           |
| `snackbar`       | `SnackbarComponent`       | The toast notification that appears after actions |
| `promotion`      | `PromotionComponent`      | The promotional banner/modal                      |

### Using page fixtures

Name the fixtures you need in the test function's async parameter:

```typescript
test(
  'should add item and go to cart',
  { tag: '@smoke' },
  async ({ menuPage, cartPage, header }) => {
    await menuPage.goto();
    await menuPage.addToCart('Espresso');
    await header.goToCart();
    await expect(cartPage.checkoutButton).toBeVisible();
  },
);
```

You can also use `page` directly (Playwright's built-in `Page` object) when you need to do something the page objects do not cover:

```typescript
test('login page matches baseline', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveScreenshot('login-page.png');
});
```

---

## 4. The `api` fixture

The `api` fixture gives you an HTTP client for calling the app's API endpoints directly — no browser, no UI. It exposes `get`, `post`, `put`, `patch`, `delete`, `head`, and `fetch` methods.

```typescript
test('should return 200 from GET /api/coffees', { tag: '@api' }, async ({ api }) => {
  const response = await api.get(`${config.apiUrl}/api/coffees`);
  expect(response.status()).toBe(200);
});
```

### Sending a request body

Use the `data` option for JSON request bodies:

```typescript
const response = await api.post(`${config.apiUrl}/api/cart`, {
  data: { name: 'Espresso' },
});
```

### Reading the response

```typescript
const response = await api.get(`${config.apiUrl}/api/coffees`);

// Status code
expect(response.status()).toBe(200);

// Response body as JSON
const body = await response.json();

// Response headers
const contentType = response.headers()['content-type'];
```

### The `api` fixture vs `request`

The framework uses the `api` fixture (from `pw-api-plugin`) rather than Playwright's built-in `request` fixture. The `api` fixture adds visual request/response cards to the Trace Viewer when `LOG_API_UI=true` — useful when debugging API test failures. In normal usage the two behave identically.

---

## 5. Helper fixtures — pre-built setup and teardown

Helper fixtures handle recurring setup patterns that would otherwise require repetitive `beforeEach` + `afterEach` boilerplate. They run setup before the test and teardown after it automatically.

### `createdOrder`

Creates a real order in the database **before** the test starts, and deletes it **after** the test ends. Use this when your test needs a pre-existing order to work with (e.g. testing the orders list page or the admin dashboard).

```typescript
test(
  'should show order in orders list',
  { tag: '@regression' },
  async ({ ordersPage, createdOrder }) => {
    await test.step('GIVEN an order exists', async () => {
      // createdOrder is already created — it contains the full order data
      expect(createdOrder.orderId).toMatch(/^ORD-/);
    });

    await test.step('WHEN user visits the orders page', async () => {
      await ordersPage.goto();
    });

    await test.step('THEN the order appears in the list', async () => {
      await expect(ordersPage.getOrderRow(createdOrder.orderId)).toBeVisible();
    });
  },
);
```

You do not need to clean up — the fixture deletes the order automatically after the test finishes, whether the test passes or fails.

### `seededCart`

Populates the cart with two items via the API before the test. Clears the cart afterwards.

```typescript
test('should show cart total', { tag: '@regression' }, async ({ cartPage, seededCart }) => {
  await test.step('GIVEN cart is pre-populated', async () => {
    // seededCart contains the items that were added: [{ name, quantity }, ...]
    expect(seededCart.length).toBeGreaterThan(0);
  });

  await test.step('WHEN user opens the cart', async () => {
    await cartPage.goto();
  });

  await test.step('THEN cart total is displayed', async () => {
    await expect(cartPage.total).toBeVisible();
  });
});
```

### When to use helper fixtures vs `beforeEach`

| Situation                                                               | Use                           |
| ----------------------------------------------------------------------- | ----------------------------- |
| Setup that is reused across many tests (order creation, cart seeding)   | Helper fixture                |
| Setup that is specific to one test file (navigate + assert page loaded) | `beforeEach` in the spec file |
| Teardown that must run even if the test fails                           | Helper fixture (guaranteed)   |
| Teardown that only matters when the test passes                         | `afterEach` in the spec file  |

---

## 6. The `a11y` fixture — accessibility scans

The `a11y` fixture provides `a11yScan()` — a function that runs an axe-core accessibility scan on the current page state and throws if WCAG 2.1 AA violations are found.

```typescript
test('login page has no accessibility violations', { tag: '@a11y' }, async ({ page, a11yScan }) => {
  await test.step('GIVEN user is on the login page', async () => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  await test.step('THEN the page has no WCAG violations', async () => {
    await a11yScan();
  });
});
```

### Scoping a scan to part of the page

Pass a CSS selector to scan only a specific section:

```typescript
await a11yScan({ selector: 'form' });
```

This is useful when you know another part of the page has a known violation you are not responsible for, or when you want to focus the scan on the feature you just built.

### What violations look like

When `a11yScan()` finds violations, the test fails with a formatted list:

```
Accessibility violations found:
  1. [critical] Elements must have sufficient color contrast
     - Affected elements: .btn-primary
  2. [serious] Form elements must have labels
     - Affected elements: input[type="email"]
```

The violation level (`critical`, `serious`, `moderate`, `minor`) tells you the impact. `critical` and `serious` must be fixed before shipping.

---

## 7. The `networkMock` fixture

The `networkMock` fixture lets you intercept HTTP requests made by the browser and return fake responses. Use it when you want to test how the UI behaves when an API returns an error or slow response — without needing the real API to fail.

```typescript
test(
  'should show error message when API fails',
  { tag: '@regression' },
  async ({ page, networkMock }) => {
    await test.step('GIVEN the menu API returns 500', async () => {
      await networkMock.mockRoute('**/api/coffees', {
        status: 500,
        body: { error: 'Server error' },
      });
    });

    await test.step('WHEN user navigates to the menu', async () => {
      await page.goto('/');
    });

    await test.step('THEN an error message is shown', async () => {
      await expect(page.getByRole('alert')).toBeVisible();
    });
  },
);
```

Network mocking is for testing **UI error handling** — what the user sees when something goes wrong. Do not use it for happy-path tests or API-correctness tests (use the real API for those).

---

## 8. Combining fixtures in one test

You can use as many fixtures as you need in a single test. Name them all in the async parameter, comma-separated:

```typescript
test(
  'should complete checkout and show confirmation',
  { tag: '@e2e' },
  async ({ menuPage, cartPage, paymentDetails, snackbar, header }) => {
    const { name, email } = generateCheckoutData();

    await test.step('GIVEN user adds an item to cart', async () => {
      await menuPage.goto();
      await menuPage.addToCart('Espresso');
    });

    await test.step('WHEN user completes checkout', async () => {
      await header.goToCart();
      await cartPage.checkout();
      await paymentDetails.fillCheckout(name, email);
      await paymentDetails.submit();
    });

    await test.step('THEN confirmation snackbar appears', async () => {
      await expect(snackbar.message).toBeVisible();
    });
  },
);
```

Playwright creates and manages all the fixtures in the parameter list. You never need to instantiate any of them yourself.

---

## 9. How the fixture chain works

You do not need to understand this to write tests, but it helps when reading framework code or debugging fixture errors.

`fixtures/pom/test-options.ts` merges all fixture groups into one `test` object using `mergeTests()`:

```typescript
// test-options.ts (simplified)
import { mergeTests } from '@playwright/test';
import { test as pageObjectFixture } from './page-object-fixture';
import { test as pwApiFixture } from '../api/pw-api-fixture';
import { test as helperFixture } from '../helper/helper-fixture';
import { test as networkMockFixture } from '../network/network-mock-fixture';
import { test as a11yFixture } from '../accessibility/a11y-fixture';

export const test = mergeTests(
  pageObjectFixture, // loginPage, menuPage, cartPage, etc.
  pwApiFixture, // api
  helperFixture, // createdOrder, seededCart
  networkMockFixture, // networkMock
  a11yFixture, // a11yScan
);
```

When you write `async ({ loginPage, api, createdOrder })`, Playwright looks up each name in the merged fixture registry and runs the setup function for each one. After the test, it runs the teardown for each in reverse order.

---

## 10. Common mistakes

| Mistake                                                                | What to do instead                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `import { test } from '@playwright/test'` in a test file               | Import from `'../../../fixtures/pom/test-options'`                              |
| `new LoginPage(page)` inside a test                                    | Use `async ({ loginPage })` — fixture injection                                 |
| Using `beforeEach` to create an order that needs to be deleted         | Use `createdOrder` helper fixture — it handles teardown automatically           |
| Calling `a11yScan()` before the page is fully loaded                   | Wait for a key element to be visible before scanning                            |
| Combining `page` and `loginPage` and wondering why there are two pages | They use the same underlying `page` — `loginPage.page === page`                 |
| Forgetting to name a fixture and getting `undefined`                   | Check the spelling in the async parameter list matches the fixture name exactly |

---

## See also

- [Creating a Page Object](creating-a-page-object.md) — how to build and register a new fixture
- [Writing Full API Tests](writing-api-tests.md) — using the `api` and `createdOrder` fixtures in API specs
- [Developer Guide](../developer.md) — fixture architecture and how to register new ones
