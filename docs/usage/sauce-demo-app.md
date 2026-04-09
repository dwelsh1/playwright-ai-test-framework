# Sauce Demo App — Test Guide

**Audience:** Jr QA Engineers — what the Sauce Demo app is, how credentials work, and how tests are organized against it.

Sauce Demo is the second demo app included in the framework. Unlike Coffee Cart (which runs locally), Sauce Demo is a publicly hosted website maintained by Sauce Labs as a testing practice target. It requires no local setup — tests run against the live site. This guide explains the app, its users, and how the framework tests against it.

---

## Table of Contents

1. [What is Sauce Demo?](#1-what-is-sauce-demo)
2. [No local setup required](#2-no-local-setup-required)
3. [The test users — each behaves differently](#3-the-test-users--each-behaves-differently)
4. [App structure — pages](#4-app-structure--pages)
5. [Page objects available](#5-page-objects-available)
6. [How tests connect to the app](#6-how-tests-connect-to-the-app)
7. [Running Sauce Demo tests](#7-running-sauce-demo-tests)
8. [Test data — credentials factory](#8-test-data--credentials-factory)
9. [Common mistakes](#9-common-mistakes)

---

## 1. What is Sauce Demo?

[Sauce Demo](https://www.saucedemo.com) (`https://www.saucedemo.com`) is a publicly accessible e-commerce demo app built by Sauce Labs. It is designed specifically for testing practice:

- Multiple built-in user accounts that behave differently (one is slow, one is locked out)
- A product inventory page with sorting and filtering
- Individual product detail pages with prices
- A cart, checkout flow, and order confirmation

All credentials are published openly on the login page — this is intentional. The app is a test target, not a production service.

---

## 2. No local setup required

Unlike Coffee Cart, **Sauce Demo requires no local setup**. The app is always live at `https://www.saucedemo.com`. Just run the tests:

```bash
npx playwright test tests/sauce-demo/ --project=chromium
```

There is no server to start, no Docker container to run, and no `webServer` config needed. Tests hit the public internet.

**Note:** Because the app is external and publicly hosted, occasionally it may be slow or temporarily unavailable. If tests fail with connection errors, check that `https://www.saucedemo.com` is reachable in your browser first.

---

## 3. The test users — each behaves differently

Sauce Demo ships with six built-in users, all using the same password (`secret_sauce`). Each user exhibits a different behaviour designed to expose specific test problems:

| Username                  | Behaviour                                      | When to use                        |
| ------------------------- | ---------------------------------------------- | ---------------------------------- |
| `standard_user`           | Normal — all features work correctly           | Happy-path tests                   |
| `locked_out_user`         | Login is blocked — error message shown         | Testing the locked-out error state |
| `problem_user`            | Broken product images, wrong links             | Testing error-prone UI states      |
| `performance_glitch_user` | Login and page loads are artificially slow     | Performance-sensitive tests        |
| `error_user`              | Cart and checkout have intermittent failures   | Error handling tests               |
| `visual_user`             | UI has visual differences from `standard_user` | Visual regression tests            |

The framework's `generateSauceDemoCredentials()` factory defaults to `standard_user` / `secret_sauce`. For tests that need a specific user type, pass an override:

```typescript
const { username, password } = generateSauceDemoCredentials({
  username: 'locked_out_user',
});
```

---

## 4. App structure — pages

| Page              | URL                         | What it does                                                |
| ----------------- | --------------------------- | ----------------------------------------------------------- |
| Login             | `/`                         | Username + password form; redirects to inventory on success |
| Inventory         | `/inventory.html`           | Lists all 6 products with add-to-cart buttons and sorting   |
| Product Detail    | `/inventory-item.html?id=N` | Shows product name, description, price, and add-to-cart     |
| Cart              | `/cart.html`                | Shows cart contents; proceed to checkout                    |
| Checkout Step 1   | `/checkout-step-one.html`   | First name, last name, zip/postal code                      |
| Checkout Step 2   | `/checkout-step-two.html`   | Order summary before confirming                             |
| Checkout Complete | `/checkout-complete.html`   | Confirmation page                                           |

---

## 5. Page objects available

| Page object    | Fixture name          | File                                      | What it covers                                        |
| -------------- | --------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Login page     | `sdLoginPage`         | `pages/sauce-demo/login.page.ts`          | Username/password inputs, login button, error message |
| Inventory page | `sdInventoryPage`     | `pages/sauce-demo/inventory.page.ts`      | Product list, add-to-cart buttons, cart badge         |
| Product detail | `sdProductDetailPage` | `pages/sauce-demo/product-detail.page.ts` | Product name, price, description, add-to-cart         |

Request them in tests via their fixture names:

```typescript
async ({ sdLoginPage, sdInventoryPage, sdProductDetailPage }) => {
```

The `sd` prefix distinguishes Sauce Demo page objects from Coffee Cart page objects — both sets live in the same fixture chain without conflict.

---

## 6. How tests connect to the app

Tests use `sauceDemoConfig` from `config/sauce-demo.ts` for the base URL — never hardcoded:

```typescript
import { sauceDemoConfig } from '../../../config/sauce-demo';
import { Routes } from '../../../enums/sauce-demo/sauce-demo';

// Full URL built from config + enum
await expect(sdInventoryPage.page).toHaveURL(`${sauceDemoConfig.appUrl}${Routes.INVENTORY}`);
// → https://www.saucedemo.com/inventory.html
```

The `sauceDemoConfig.appUrl` defaults to `https://www.saucedemo.com` but can be overridden via the `SAUCE_DEMO_URL` environment variable — useful if you are running a local mock of the app.

### Enums for routes and products

All URL paths and product names are defined in `enums/sauce-demo/sauce-demo.ts`:

```typescript
import { Routes, ProductNames, ProductPrices } from '../../../enums/sauce-demo/sauce-demo';

// Routes
Routes.LOGIN; // → '/'
Routes.INVENTORY; // → '/inventory.html'
Routes.CART; // → '/cart.html'

// Products
ProductNames.SAUCE_LABS_BACKPACK; // → 'Sauce Labs Backpack'
ProductNames.SAUCE_LABS_ONESIE; // → 'Sauce Labs Onesie'

// Prices
ProductPrices.SAUCE_LABS_BACKPACK; // → '$29.99'
ProductPrices.SAUCE_LABS_ONESIE; // → '$7.99'
```

Always use these enums — never hardcode product names or prices directly in tests.

---

## 7. Running Sauce Demo tests

```bash
# All Sauce Demo tests
npx playwright test tests/sauce-demo/ --project=chromium

# Specific spec file
npx playwright test tests/sauce-demo/e2e/product-browse.spec.ts --project=chromium
npx playwright test tests/sauce-demo/e2e/cart-management.spec.ts --project=chromium

# All tests (Coffee Cart + Sauce Demo together)
npm test
```

Sauce Demo tests are tagged `@e2e`. They do not have `@smoke` or `@api` tags because:

- The app has no API that the framework tests directly
- The tests are journey-level flows, not isolated feature checks

---

## 8. Test data — credentials factory

Use `generateSauceDemoCredentials()` from the factory — never hardcode usernames:

```typescript
import { generateSauceDemoCredentials } from '../../../test-data/factories/sauce-demo/auth.factory';

// Default: standard_user / secret_sauce
const { username, password } = generateSauceDemoCredentials();

// Override to test a specific user type
const { username, password } = generateSauceDemoCredentials({
  username: 'performance_glitch_user',
});

// Override both
const { username, password } = generateSauceDemoCredentials({
  username: 'problem_user',
  password: 'secret_sauce',
});
```

The factory reads from `SAUCE_DEMO_USERNAME` and `SAUCE_DEMO_PASSWORD` environment variables first, falling back to the published demo defaults. This means CI can substitute different credentials without changing test code.

### A complete login test

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateSauceDemoCredentials } from '../../../test-data/factories/sauce-demo/auth.factory';
import { Routes } from '../../../enums/sauce-demo/sauce-demo';
import { sauceDemoConfig } from '../../../config/sauce-demo';

test(
  'should log in and reach inventory',
  { tag: '@e2e' },
  async ({ sdLoginPage, sdInventoryPage }) => {
    const { username, password } = generateSauceDemoCredentials();

    await test.step('GIVEN user is on the login page', async () => {
      await sdLoginPage.goto();
      await expect(sdLoginPage.loginButton).toBeVisible();
    });

    await test.step('WHEN user logs in', async () => {
      await sdLoginPage.login(username, password);
    });

    await test.step('THEN user lands on the inventory page', async () => {
      await expect(sdInventoryPage.page).toHaveURL(`${sauceDemoConfig.appUrl}${Routes.INVENTORY}`);
    });
  },
);
```

---

## 9. Common mistakes

| Mistake                                                       | What to do instead                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hardcoding `'standard_user'` in a test                        | Use `generateSauceDemoCredentials()` — reads from env vars                               |
| Hardcoding `'https://www.saucedemo.com/inventory.html'`       | Use `${sauceDemoConfig.appUrl}${Routes.INVENTORY}`                                       |
| Hardcoding `'Sauce Labs Backpack'`                            | Use `ProductNames.SAUCE_LABS_BACKPACK` from the enum                                     |
| Hardcoding `'$29.99'`                                         | Use `ProductPrices.SAUCE_LABS_BACKPACK` from the enum                                    |
| Not prefixing Sauce Demo page object fixture names with `sd`  | The `sd` prefix is required to distinguish from Coffee Cart fixtures                     |
| Expecting the app to be up when it might be unreachable       | Sauce Demo is external — check the site is reachable if connection errors appear         |
| Testing with `locked_out_user` and expecting login to succeed | `locked_out_user` is always blocked — use it only in tests that verify the error message |
| Importing `test` and `expect` from `@playwright/test`         | Always import from `fixtures/pom/test-options`                                           |

---

## See also

- [Adding Your Own App](adding-your-own-app.md) — how Sauce Demo was onboarded as a second app in the framework
- [Understanding Fixtures](understanding-fixtures.md) — how Sauce Demo page objects are registered alongside Coffee Cart
- [Test Data Factories](test-data-factories.md) — factory pattern used by `generateSauceDemoCredentials()`
- [Writing E2E Journey Tests](writing-e2e-tests.md) — the E2E test patterns used in Sauce Demo specs
