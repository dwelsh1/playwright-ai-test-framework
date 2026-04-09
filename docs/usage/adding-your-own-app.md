# Adding Your Own App to the Framework

_Audience: Junior Automation Engineer_
_Last updated: 2026-03-23_

This guide walks you through two common tasks:

- **Part 1** — Understand the two demo apps that come with this framework, remove them, and replace them with tests for your own app
- **Part 2** — Migrate existing Cypress tests into this framework

You do not need to know how the framework was built — just follow each step in order.

---

## Part 1 — Replacing the Demo Apps with Your Own App

### Understanding the two demo apps

This framework ships with two demo apps. They exist purely as examples — they show you the correct folder structure, file naming, and patterns to follow. Your job is to replace them with your own app.

---

#### Demo App 1 — Coffee Cart (local app)

|                          |                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it is**           | A small coffee ordering web app that runs on your local machine                                                                                                                            |
| **Where it lives**       | Its own separate repository (`coffee-cart` repo, not this one)                                                                                                                             |
| **How tests hit it**     | The app runs on `localhost:5273` (frontend) and `localhost:3002` (API). Your machine must be running Coffee Cart before tests can execute.                                                 |
| **What it demonstrates** | API testing, UI testing, full E2E flows, authentication with storage state, network mocking, visual regression                                                                             |
| **Framework files**      | `tests/coffee-cart/`, `pages/coffee-cart/`, `enums/coffee-cart/`, `config/coffee-cart.ts`, `test-data/factories/coffee-cart/`, `fixtures/api/schemas/coffee-cart/`, `helpers/coffee-cart/` |

---

#### Demo App 2 — Sauce Demo (internet app)

|                          |                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **What it is**           | A public demo e-commerce site available on the internet at `https://www.saucedemo.com`                                        |
| **Where it lives**       | It is a live website — no local setup needed, no separate repo                                                                |
| **How tests hit it**     | Tests navigate directly to `https://www.saucedemo.com`. As long as your machine has an internet connection, tests can run.    |
| **What it demonstrates** | Onboarding an external/internet app with its own Playwright project, `testIdAttribute` configuration, login via the test flow |
| **Framework files**      | `tests/sauce-demo/`, `pages/sauce-demo/`, `enums/sauce-demo/`, `config/sauce-demo.ts`, `test-data/factories/sauce-demo/`      |

---

### Which demo app is most like your app?

Before you start, decide which demo app your own app most resembles:

- **Your app runs locally (like Coffee Cart):** your testers start the app on their machine or in CI before running tests. Follow the Coffee Cart removal and replacement steps.
- **Your app is hosted on the internet or a shared server (like Sauce Demo):** tests point at a URL that is always running — no local startup needed. Follow the Sauce Demo removal and replacement steps.
- **You have both a locally hosted app AND an internet-hosted app:** follow both sets of steps.

---

### Removing the Coffee Cart demo

You can leave the Coffee Cart files in place while learning the framework. When you are ready to remove them, delete the following:

**Files and folders to delete:**

```
tests/coffee-cart/
pages/coffee-cart/
pages/components/          ← coffee-cart-specific components (header, snackbar, etc.)
enums/coffee-cart/
config/coffee-cart.ts
test-data/factories/coffee-cart/
test-data/static/coffee-cart/
fixtures/api/schemas/coffee-cart/
fixtures/helper/helper-fixture.ts   ← if it only contains coffee-cart setup
helpers/coffee-cart/
.auth/coffee-cart/                  ← saved auth sessions (if they exist)
```

**Edits required after deletion:**

1. **`fixtures/pom/page-object-fixture.ts`** — remove all coffee-cart imports (`LoginPage`, `MenuPage`, `CartPage`, `OrdersPage`, `AdminPage`, `HeaderComponent`, `PaymentDetailsComponent`, `SnackbarComponent`, `PromotionComponent`) and their fixture registrations.

2. **`playwright.config.ts`** — remove the `user-setup`, `admin-setup`, `chromium`, `firefox`, `webkit`, and `chromium-admin` projects (all the coffee-cart projects). Also remove the import of `StorageStatePaths` at the top of the file.

3. **`fixtures/pom/test-options.ts`** — if `helperFixture` only contains coffee-cart helpers, remove it from `mergeTests()`.

4. **`.env.example`** — remove the coffee-cart variables (`APP_URL`, `API_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`).

> **Tip:** Run `npx tsc --noEmit` after deleting files to see a TypeScript error list of any remaining references you missed. Fix each one before proceeding.

---

### Removing the Sauce Demo demo

**Files and folders to delete:**

```
tests/sauce-demo/
pages/sauce-demo/
enums/sauce-demo/
config/sauce-demo.ts
test-data/factories/sauce-demo/
docs/usage/sauce-demo-app.md        ← the active guide for the demo app
```

**Edits required after deletion:**

1. **`fixtures/pom/page-object-fixture.ts`** — remove the three sauce-demo imports (`SdLoginPage`, `SdInventoryPage`, `SdProductDetailPage`) and their fixture registrations (`sdLoginPage`, `sdInventoryPage`, `sdProductDetailPage`).

2. **`playwright.config.ts`** — remove the `sauce-demo` project block entirely.

3. **`.env.example`** — remove the sauce-demo variables (`SAUCE_DEMO_URL`, `SAUCE_DEMO_USERNAME`, `SAUCE_DEMO_PASSWORD`).

> **Tip:** Run `npx tsc --noEmit` after deleting to confirm no remaining references.

---

### Adding your own app

Once you have removed the demo apps (or set them aside), follow the steps below for each app you want to test. Repeat the entire process for each additional app.

The files you will create are:

```
enums/{your-app}/                               ← routes, product names, messages, etc.
config/{your-app}.ts                            ← app URL
test-data/factories/{your-app}/auth.factory.ts  ← login credentials
pages/{your-app}/login.page.ts                  ← login page object
pages/{your-app}/product-list.page.ts           ← product listing page object
pages/{your-app}/product-detail.page.ts         ← product detail page object
tests/{your-app}/e2e/{name}.spec.ts             ← your test
```

The files you will edit are:

```
fixtures/pom/page-object-fixture.ts  ← register your page objects
playwright.config.ts                 ← add your app as a project
.env.example                         ← document your environment variables
```

> **What is `{your-app}`?** The folder name you choose for your app. Pick a short, lowercase, hyphenated name — for example `my-shop`, `portal`, or `admin-panel`. Use the **same name in every folder and file**.

---

### Step 1 — Create your enums

Enums are TypeScript constants that replace hardcoded strings. Instead of writing `'Blue Widget'` directly in a test, you write `ProductNames.BLUE_WIDGET`. If the text on the page changes, you update only the enum — not every test that uses it.

**Create the file:** `enums/{your-app}/{your-app}.ts`

```typescript
// enums/my-shop/my-shop.ts

/** Frontend route paths */
export enum Routes {
  LOGIN = '/', // path to your login page
  PRODUCTS = '/products', // path to your product listing page
  CART = '/cart', // path to your cart page
}

/** Text that appears in the page header */
export enum AppText {
  HEADER_TITLE = 'My Shop', // exact brand name shown in the header
}

/** Product names exactly as they appear on the page */
export enum ProductNames {
  BLUE_WIDGET = 'Blue Widget',
  RED_GADGET = 'Red Gadget',
}

/** Product prices exactly as shown in the UI */
export enum ProductPrices {
  BLUE_WIDGET = '$19.99',
  RED_GADGET = '$34.99',
}
```

> **How do I find the right values?** Open your app in a browser and copy the text character-for-character, including capitalisation and currency symbols.

---

### Step 2 — Create the app config

The config file holds your app's URL. It reads from an environment variable so tests can point at dev, staging, or production without code changes.

**Create the file:** `config/{your-app}.ts`

```typescript
// config/my-shop.ts

export const myShopConfig = {
  /** Frontend application URL */
  appUrl: process.env['MY_SHOP_URL'] ?? 'http://localhost:3000',
};
```

Replace `http://localhost:3000` with your app's local URL.

**If your app is an internet-hosted app** (always running, no local setup), set the default to the real URL:

```typescript
appUrl: process.env['MY_SHOP_URL'] ?? 'https://www.my-shop.com',
```

---

### Step 3 — Create the credentials factory

Your tests need to log in. The factory reads credentials from environment variables so passwords never appear in source code.

**Create the file:** `test-data/factories/{your-app}/auth.factory.ts`

```typescript
// test-data/factories/my-shop/auth.factory.ts

/**
 * Generates valid login credentials for My Shop.
 * Reads from environment variables; falls back to local dev defaults.
 * @param overrides - Optional field overrides for specific test scenarios
 * @returns Login credentials object
 */
export const generateMyShopCredentials = (overrides?: { username?: string; password?: string }) => {
  return {
    username: overrides?.username ?? process.env['MY_SHOP_USERNAME'] ?? 'testuser',
    password: overrides?.password ?? process.env['MY_SHOP_PASSWORD'] ?? 'testpassword',
  };
};
```

> **Why environment variables?** Real passwords must never be committed to source control. In CI, they are stored as secrets and injected at runtime.

---

### Step 4 — Create your page objects

A page object is a TypeScript class that knows how to find elements on one page and interact with them. Tests use the page object instead of writing selectors directly, which means if the page changes you only need to update the page object — not every test.

#### How to choose the right selector

Playwright selectors must follow this priority order:

| Priority | Method                                    | When to use                                            |
| -------- | ----------------------------------------- | ------------------------------------------------------ |
| 1st      | `getByRole('button', { name: 'Submit' })` | Element has a semantic role + accessible name          |
| 2nd      | `getByLabel('Email')`                     | Input paired with a `<label>` element                  |
| 3rd      | `getByPlaceholder('Enter email')`         | Input with a placeholder but no label                  |
| 4th      | `getByText('Submit')`                     | Non-interactive text elements                          |
| Last     | `getByTestId('submit-btn')`               | Element has a `data-testid` (or `data-test`) attribute |

**Never use:** CSS classes (`.btn-primary`), element IDs (`#submit`), or XPath (`//div[@class]`). These break when developers change the page styling.

> **Finding the accessible name:** In Chrome DevTools, click the element, open the **Accessibility** panel, and look for the **Name** field. That is the name Playwright sees.

#### 4a — Login page object

**Create:** `pages/{your-app}/login.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { Routes } from '../../enums/my-shop/my-shop';

export class MyShopLoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username'); // adjust to match your label
    this.passwordInput = page.getByLabel('Password'); // adjust to match your label
    this.loginButton = page.getByRole('button', { name: 'Log in' }); // adjust to match your button text
  }

  /**
   * Navigate to the login page.
   */
  async goto(): Promise<void> {
    await this.page.goto(Routes.LOGIN);
  }

  /**
   * Fill in credentials and submit the login form.
   * @param username - App username
   * @param password - App password
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

#### 4b — Product listing page object

**Create:** `pages/{your-app}/product-list.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';
import { ProductNames } from '../../enums/my-shop/my-shop';

export class MyShopProductListPage {
  readonly page: Page;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('My Shop', { exact: true }); // adjust to match your header text
  }

  /**
   * Click a product to navigate to its detail page.
   * @param name - Product name from the ProductNames enum
   */
  async clickProduct(name: ProductNames): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).first().click();
  }
}
```

#### 4c — Product detail page object

**Create:** `pages/{your-app}/product-detail.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class MyShopProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.getByTestId('product-name'); // adjust to match your app
    this.productPrice = page.getByTestId('product-price'); // adjust to match your app
  }
}
```

> **What if my app has no `data-testid` attributes?** Ask your developer to add them — this is standard practice and makes tests far more reliable. If that is not possible, use `getByText()` or a role-based locator scoped to the product container instead.

---

### Step 5 — Register your page objects as fixtures

The framework injects page objects into tests automatically. For this to work, every page object must be registered in one central file.

**Edit:** `fixtures/pom/page-object-fixture.ts`

Add three things:

**1 — Imports** (after the last existing import line):

```typescript
import { MyShopLoginPage } from '../../pages/my-shop/login.page';
import { MyShopProductListPage } from '../../pages/my-shop/product-list.page';
import { MyShopProductDetailPage } from '../../pages/my-shop/product-detail.page';
```

**2 — Fixture types** (inside the `FrameworkFixtures` type block, before the closing `}`):

```typescript
// My Shop page objects
myShopLoginPage: MyShopLoginPage;
myShopProductListPage: MyShopProductListPage;
myShopProductDetailPage: MyShopProductDetailPage;
```

**3 — Fixture implementations** (inside the `test.extend<FrameworkFixtures>({...})` block, before the closing `}`):

```typescript
myShopLoginPage: async ({ page }, use) => {
  await use(new MyShopLoginPage(page));
},

myShopProductListPage: async ({ page }, use) => {
  await use(new MyShopProductListPage(page));
},

myShopProductDetailPage: async ({ page }, use) => {
  await use(new MyShopProductDetailPage(page));
},
```

---

### Step 6 — Add your app as a Playwright project

Playwright **projects** let each app run at its own URL with its own settings.

**Edit:** `playwright.config.ts` — add a new block inside the `projects` array:

```typescript
// ── My Shop ────────────────────────────────────────────────

{
  name: 'my-shop',
  testDir: 'tests/my-shop',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env['MY_SHOP_URL'] ?? 'http://localhost:3000',

    // ONLY add this line if your app uses data-test attributes instead of data-testid.
    // If you are unsure, leave it out and add it later if getByTestId() fails.
    // testIdAttribute: 'data-test',
  },
},
```

**If your app requires login before tests run** (like Coffee Cart does with its auth setup files), also add a setup project:

```typescript
{
  name: 'my-shop-setup',
  testDir: 'tests/my-shop',
  testMatch: 'auth.setup.ts',
},
{
  name: 'my-shop',
  testDir: 'tests/my-shop',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env['MY_SHOP_URL'] ?? 'http://localhost:3000',
    storageState: '.auth/my-shop/user.json',
  },
  dependencies: ['my-shop-setup'],
},
```

If your tests log in as part of the test flow (like Sauce Demo), you do not need a setup project — use the simpler block above.

---

### Step 7 — Write your test

**Create:** `tests/{your-app}/e2e/{flow-name}.spec.ts`

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateMyShopCredentials } from '../../../test-data/factories/my-shop/auth.factory';
import { AppText, ProductNames, ProductPrices, Routes } from '../../../enums/my-shop/my-shop';
import { myShopConfig } from '../../../config/my-shop';

test.describe('My Shop — Product Browse', () => {
  test(
    'should view product price after login',
    { tag: '@e2e' },
    async ({ myShopLoginPage, myShopProductListPage, myShopProductDetailPage }) => {
      const { username, password } = generateMyShopCredentials();

      await test.step('GIVEN user is on the login page', async () => {
        await myShopLoginPage.goto();
        await expect(myShopLoginPage.loginButton).toBeVisible();
      });

      await test.step('WHEN user signs in with valid credentials', async () => {
        await myShopLoginPage.login(username, password);
      });

      await test.step('THEN user is on the products page', async () => {
        await expect(myShopProductListPage.page).toHaveURL(
          `${myShopConfig.appUrl}${Routes.PRODUCTS}`,
        );
      });

      await test.step('AND the store header is visible', async () => {
        await expect(myShopProductListPage.headerTitle).toHaveText(AppText.HEADER_TITLE);
      });

      await test.step('WHEN user clicks on Blue Widget', async () => {
        await myShopProductListPage.clickProduct(ProductNames.BLUE_WIDGET);
      });

      await test.step('THEN product price is $19.99', async () => {
        await expect(myShopProductDetailPage.productPrice).toHaveText(ProductPrices.BLUE_WIDGET);
      });
    },
  );
});
```

---

### Step 8 — Add environment variables to `.env.example`

**Edit:** `.env.example` — add a new section:

```
# ── My Shop ───────────────────────────────────────────────────────────────
# Set MY_SHOP_URL to your staging URL in CI secrets.
MY_SHOP_URL=http://localhost:3000
MY_SHOP_USERNAME=testuser
MY_SHOP_PASSWORD=testpassword
```

---

### Step 9 — Run your test

```bash
npx playwright test tests/my-shop/ --project=my-shop
```

Common failure causes:

| Symptom                               | Likely cause                                     | Fix                                                                          |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `element not found` for a login field | Selector doesn't match your form                 | Inspect the element; check the label, placeholder, or role                   |
| `element not found` for a price       | Wrong `data-test` vs `data-testid`               | Add `testIdAttribute: 'data-test'` to your project in `playwright.config.ts` |
| URL assertion fails after login       | App redirects to a path different from your enum | Update `Routes.PRODUCTS` in your enums to match the actual redirect URL      |
| `toHaveText` fails on price           | Extra whitespace or different currency format    | Open DevTools and copy the exact text content from the DOM                   |
| Test can't connect to the app         | App isn't running (local apps only)              | Start your local app before running tests                                    |

---

### Step 10 — Lint check

```bash
npx eslint tests/my-shop/ pages/my-shop/ enums/my-shop/ --max-warnings=0
```

Auto-fix formatting errors if needed:

```bash
npx eslint tests/my-shop/ pages/my-shop/ enums/my-shop/ --fix
```

---

## Part 2 — Migrating Cypress Tests to This Framework

If your team already has Cypress tests, you can bring them into this framework. The goal is **not** to translate them line-by-line — it is to rewrite them using Playwright's patterns. Line-by-line translation carries over bad habits and produces unreliable tests.

> **Migrate one test file at a time.** Do not attempt to migrate the entire suite at once. Migrate, verify, merge — then move to the next file.

---

### Key differences to understand first

| Topic               | Cypress                                           | This Framework                                               |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| **How tests run**   | Cypress runs inside the browser                   | Playwright runs in Node.js and remote-controls the browser   |
| **`await`**         | Not needed — Cypress auto-chains commands         | Required on every action and assertion                       |
| **Selectors**       | `cy.get('.class')` — CSS selectors everywhere     | `getByRole()`, `getByLabel()` — accessibility-first          |
| **Page objects**    | Often skipped — selectors written inline in tests | Mandatory — all selectors live in page objects               |
| **Login**           | `cy.login()` custom command, runs in `beforeEach` | Storage state file (login once, session reused by all tests) |
| **Network mocking** | `cy.intercept()`                                  | `page.route()`                                               |
| **Imports**         | Global `cy` object, no import needed              | `import { test, expect } from 'fixtures/pom/test-options'`   |
| **Assertions**      | `.should('be.visible')`                           | `await expect(locator).toBeVisible()` (auto-retries)         |

---

### Step 1 — List the pages your Cypress test visits

Read through your Cypress test and write down every page it navigates to. Each page needs a page object in this framework.

**Example Cypress test** (what you are starting from):

```javascript
// Cypress (before migration)
describe('Product page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('#username').type('testuser');
    cy.get('#password').type('secret');
    cy.get('[data-cy="login-btn"]').click();
  });

  it('shows the correct product price', () => {
    cy.contains('Blue Widget').click();
    cy.get('.product-price').should('have.text', '$19.99');
  });
});
```

Pages visited: **login page**, **product list page**, **product detail page**. You need a page object for each one.

---

### Step 2 — Map your Cypress commands to Playwright equivalents

| Cypress                                          | Playwright equivalent                                           |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `cy.visit('/login')`                             | `await page.goto('/login')`                                     |
| `cy.get('input').type('text')`                   | `await page.getByLabel('Username').fill('text')`                |
| `cy.get('[data-cy="btn"]').click()`              | `await page.getByTestId('btn').click()`                         |
| `cy.contains('Blue Widget').click()`             | `await page.getByRole('link', { name: 'Blue Widget' }).click()` |
| `cy.get('.price').should('have.text', '$19.99')` | `await expect(page.getByTestId('price')).toHaveText('$19.99')`  |
| `cy.get('.item').should('be.visible')`           | `await expect(page.getByRole('listitem')).toBeVisible()`        |
| `cy.intercept('GET', '/api/products')`           | `await page.route('**/api/products', handler)`                  |
| `cy.wait('@alias')`                              | `await page.waitForResponse('**/api/products')`                 |
| `cy.fixture('data.json')`                        | `import data from '../test-data/static/my-shop/data.json'`      |

> **On selectors:** Cypress tests often use CSS classes (`.product-price`) or custom `data-cy` attributes. When migrating, convert these to `getByRole()` or `getByLabel()` where possible. Use `getByTestId()` as a fallback. Never keep CSS class selectors.

---

### Step 3 — Create page objects for each page

Follow **Part 1, Step 4** above — one page object per page. Translate each Cypress `cy.get()` call into a locator property on the appropriate page object class.

**Translating the example:**

```typescript
// pages/my-shop/login.page.ts

constructor(page: Page) {
  this.page = page;
  // Cypress used cy.get('#username') — we use getByLabel() instead
  this.usernameInput = page.getByLabel('Username');
  this.passwordInput = page.getByLabel('Password');
  // Cypress used cy.get('[data-cy="login-btn"]') — if your app uses data-cy,
  // set testIdAttribute: 'data-cy' in playwright.config.ts, then use getByTestId()
  this.loginButton = page.getByRole('button', { name: 'Log in' });
}
```

> **How do I find the accessible name for an element?** In Chrome DevTools, click the element, open the **Accessibility** panel, and look for the **Name** field. That is the name Playwright sees.

---

### Step 4 — Handle the Cypress `beforeEach` login

Cypress tests typically log in inside `beforeEach`. In this framework you have two options:

**Option A — Log in inside the test (simpler, good for 1–4 tests):**

```typescript
await test.step('GIVEN user is logged in', async () => {
  await myShopLoginPage.goto();
  await myShopLoginPage.login(username, password);
  await expect(myShopProductListPage.page).toHaveURL(/\/products/);
});
```

**Option B — Storage state (faster, recommended for 5+ tests that all require login):**

Create `tests/my-shop/auth.setup.ts`:

```typescript
import { test as setup } from '../../fixtures/pom/test-options';
import { generateMyShopCredentials } from '../../test-data/factories/my-shop/auth.factory';

const authFile = '.auth/my-shop/user.json';

setup('authenticate as standard user', async ({ page }) => {
  const { username, password } = generateMyShopCredentials();
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/products');
  await page.context().storageState({ path: authFile });
});
```

Then update `playwright.config.ts` to add a setup project and reference the storage state (see **Part 1, Step 6** for the pattern). The session is saved to `.auth/my-shop/user.json` and reused by all tests in the suite, so the login flow only runs once.

> **Which option should I use?** Use Option A if you have 1–4 tests. Use Option B if you have 5 or more tests that all require login — it is significantly faster since login only runs once per test run instead of once per test.

---

### Step 5 — Rewrite the test

**Before (Cypress):**

```javascript
describe('Product page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('#username').type('testuser');
    cy.get('#password').type('secret');
    cy.get('[data-cy="login-btn"]').click();
  });

  it('shows the correct product price', () => {
    cy.contains('Blue Widget').click();
    cy.get('.product-price').should('have.text', '$19.99');
  });
});
```

**After (Playwright):**

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateMyShopCredentials } from '../../../test-data/factories/my-shop/auth.factory';
import { ProductNames, ProductPrices, Routes } from '../../../enums/my-shop/my-shop';
import { myShopConfig } from '../../../config/my-shop';

test.describe('My Shop — Product Browse', () => {
  test(
    'should show the correct product price',
    { tag: '@e2e' },
    async ({ myShopLoginPage, myShopProductListPage, myShopProductDetailPage }) => {
      const { username, password } = generateMyShopCredentials();

      await test.step('GIVEN user is logged in', async () => {
        await myShopLoginPage.goto();
        await myShopLoginPage.login(username, password);
        await expect(myShopProductListPage.page).toHaveURL(
          `${myShopConfig.appUrl}${Routes.PRODUCTS}`,
        );
      });

      await test.step('WHEN user clicks on Blue Widget', async () => {
        await myShopProductListPage.clickProduct(ProductNames.BLUE_WIDGET);
      });

      await test.step('THEN the product price is $19.99', async () => {
        await expect(myShopProductDetailPage.productPrice).toHaveText(ProductPrices.BLUE_WIDGET);
      });
    },
  );
});
```

**What changed and why:**

| Cypress                                             | Playwright                                                     | Reason                                          |
| --------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `cy.get('#username').type(...)`                     | `page.getByLabel('Username').fill(...)`                        | Accessible selector; no fragile IDs             |
| `cy.contains('Blue Widget').click()`                | `myShopProductListPage.clickProduct(ProductNames.BLUE_WIDGET)` | Moved to page object; string replaced with enum |
| `cy.get('.product-price').should('have.text', ...)` | `expect(locator).toHaveText(ProductPrices.BLUE_WIDGET)`        | Web-first assertion; price from enum            |
| `describe` / `it`                                   | `test.describe` / `test` with `{ tag: '@e2e' }`                | Framework tagging convention                    |
| `beforeEach` login                                  | First `test.step`                                              | Login is part of the flow, not hidden setup     |
| No `await` anywhere                                 | `await` on every action                                        | Playwright is promise-based                     |

---

### Step 6 — Check for forbidden patterns

Before committing, search your migrated test for anything that is not allowed:

```bash
# Should return no results in your migrated files:
grep -rn "waitForTimeout\|page.pause" tests/my-shop/
grep -rn "new.*Page(page)" tests/my-shop/
grep -rn "from '@playwright/test'" tests/my-shop/
grep -rn "xpath\|XPath\|\/\/" tests/my-shop/
```

| If you find...                            | Replace with...                                                   |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `page.waitForTimeout(3000)`               | A web-first assertion: `await expect(locator).toBeVisible()`      |
| `new LoginPage(page)` inside a test       | The fixture parameter: `myShopLoginPage` (injected automatically) |
| `import { test } from '@playwright/test'` | `import { test } from '../../../fixtures/pom/test-options'`       |
| XPath selectors                           | `getByRole()`, `getByLabel()`, or `getByText()`                   |
| Hardcoded strings like `'Blue Widget'`    | Enum value: `ProductNames.BLUE_WIDGET`                            |

---

### Step 7 — Run and verify

```bash
npx playwright test tests/my-shop/ --project=my-shop
```

All migrated tests must pass before you mark the migration complete.

---

### Step 8 — Migration checklist

- [ ] Selectors use `getByRole()`, `getByLabel()`, `getByPlaceholder()`, `getByText()`, or `getByTestId()` — no CSS classes, IDs, or XPath
- [ ] Every action and assertion has `await`
- [ ] All selectors are inside page objects — none written directly in test files
- [ ] Page objects are registered in `fixtures/pom/page-object-fixture.ts`
- [ ] `test` and `expect` are imported from `fixtures/pom/test-options.ts`
- [ ] Test data uses factories (`test-data/factories/`) or static JSON (`test-data/static/`)
- [ ] No hardcoded strings — product names, routes, and messages all come from enums
- [ ] Login is handled via a factory + page object, or a storage state setup file
- [ ] No `page.waitForTimeout()` or `sleep`-style waits anywhere
- [ ] Each test has exactly one tag: `@smoke`, `@regression`, `@e2e`, or `@api`
- [ ] Tests use Given / When / Then structure with `test.step()`
- [ ] `npx eslint tests/my-shop/ --max-warnings=0` passes with no errors
- [ ] All tests pass: `npx playwright test tests/my-shop/ --project=my-shop`

---

## Part 3 — Using AI to Do This Work for You

Both Claude Code and Cursor Agent can do most of the work in Parts 1 and 2 for you. Both tools read the framework rules automatically — Claude Code loads `CLAUDE.md` and the `app-onboarding` skill; Cursor loads `.cursor/rules/rules.mdc` and the same skill. This means you do not need to explain the framework conventions in your prompt — they are already loaded.

The key to getting good output is writing a **complete prompt** that gives the AI all the facts it needs. A vague prompt produces vague code. A specific prompt produces working code.

Both tools can also run terminal commands. This means they can:

- Run `playwright-cli` to explore your app before writing any selectors
- Run `npx playwright test` to verify the generated tests pass
- Run `npx eslint --fix` to auto-correct formatting
- Run `npx tsc --noEmit` to catch type errors

> **The most important rule:** Always tell the AI to explore the page with `playwright-cli` before writing selectors. If you skip this step, the AI will guess selectors and some will be wrong.

---

### Tier 1 — Quick one-liner prompts

Use these for small, focused tasks on an app that is already set up in the framework.

**Add a product to an existing app:**

```
Add "Blue Widget" at "$19.99" to the ProductNames and ProductPrices enums in enums/my-shop/my-shop.ts
```

**Update a product price:**

```
Update the price of SAUCE_LABS_BACKPACK in enums/sauce-demo/sauce-demo.ts to "$31.99"
```

**Add a new route:**

```
Add a CHECKOUT route "/checkout" to the Routes enum in enums/my-shop/my-shop.ts
```

---

### Tier 2 — Medium prompts (single file generation)

Use these when you need one new file created, such as a page object for a page you just discovered.

**Create a page object (with exploration):**

```
Create a page object for the checkout page at [YOUR_APP_URL/checkout].

First use playwright-cli to navigate to [URL] and discover the actual
element roles, labels, and accessible names.

Then create pages/my-shop/checkout.page.ts with:
- Locators for all interactive elements you find
- An action method for filling and submitting the form
- Registration in fixtures/pom/page-object-fixture.ts
```

**Write a test for a page that already has page objects:**

```
Write a @smoke test for my-shop that verifies a logged-in user can see
the product listing page and it shows at least one product.

Use the myShopLoginPage and myShopProductListPage fixtures.
Use generateMyShopCredentials() for the login data.
Put the test in tests/my-shop/functional/product-list.spec.ts
```

**Migrate a single Cypress test:**

```
Migrate this Cypress test to our Playwright framework:

[paste your Cypress test here]

The app is my-shop. Page objects already exist in pages/my-shop/.
Rewrite using our framework patterns — do not translate line-by-line.
Put the result in tests/my-shop/e2e/product-browse.spec.ts
After writing, run the test with --project=my-shop and confirm it passes.
```

---

### Tier 3 — Full onboarding prompt

Use this when onboarding a brand new app from scratch. Copy the entire prompt, fill in every line, and send it.

```
Onboard a new app called "{app-name}" into this Playwright framework.

App details:
- Type: [local running on localhost | internet-hosted]
- Base URL: [e.g. http://localhost:3000 or https://www.myapp.com]
- Login page path: [e.g. / or /login]
- Post-login landing path: [e.g. /products or /dashboard]
- Login field 1: [label or placeholder text, e.g. "Email address"]
- Login field 2: [label or placeholder text, e.g. "Password"]
- Login button text: [exact text on the button]
- Header brand text: [exact text shown in the app header after login]
- Products to include in enums:
    - [Product Name 1]: [price e.g. $19.99]
    - [Product Name 2]: [price e.g. $34.99]
- Env var prefix: [e.g. MY_APP → MY_APP_URL, MY_APP_USERNAME, MY_APP_PASSWORD]
- Does the app use data-test attributes instead of data-testid? [yes/no]

Steps:
1. Use playwright-cli to navigate to [BASE_URL] and explore the login page.
   Discover the exact accessible names, roles, placeholders, and labels.
2. After login, explore the landing page to find the header element and
   product links.
3. Click the first product and explore the detail page to find the price element.
4. Generate all files in this order:
   - enums/{app-name}/{app-name}.ts
   - config/{app-name}.ts
   - test-data/factories/{app-name}/auth.factory.ts
   - pages/{app-name}/login.page.ts
   - pages/{app-name}/[landing].page.ts
   - pages/{app-name}/[detail].page.ts
   - Update fixtures/pom/page-object-fixture.ts
   - Update playwright.config.ts
   - tests/{app-name}/e2e/product-browse.spec.ts
   - Update .env.example
5. Run: npx eslint tests/{app-name}/ pages/{app-name}/ --fix
6. Run: npx playwright test tests/{app-name}/ --project={app-name} --retries=0
7. Confirm all tests pass before finishing.
```

---

### Removing a demo app with AI

```
Remove the Coffee Cart demo app from this framework completely.

Delete all files and folders under:
  tests/coffee-cart/, pages/coffee-cart/, pages/components/,
  enums/coffee-cart/, config/coffee-cart.ts,
  test-data/factories/coffee-cart/, test-data/static/coffee-cart/,
  fixtures/api/schemas/coffee-cart/, helpers/coffee-cart/

Then clean up all references:
- fixtures/pom/page-object-fixture.ts — remove all coffee-cart imports and registrations
- playwright.config.ts — remove user-setup, admin-setup, chromium, firefox, webkit, chromium-admin projects
- fixtures/pom/test-options.ts — remove any now-unused fixture imports
- .env.example — remove APP_URL, API_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD,
  TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD

After deleting:
- Run npx tsc --noEmit and fix every remaining reference
- Run npx eslint --max-warnings=0
- Run the remaining test suite to confirm nothing was broken
```

```
Remove the Sauce Demo demo app from this framework completely.

Delete all files and folders under:
  tests/sauce-demo/, pages/sauce-demo/, enums/sauce-demo/,
  config/sauce-demo.ts, test-data/factories/sauce-demo/

Then clean up all references:
- fixtures/pom/page-object-fixture.ts — remove SdLoginPage, SdInventoryPage,
  SdProductDetailPage imports and registrations
- playwright.config.ts — remove the sauce-demo project block
- .env.example — remove SAUCE_DEMO_URL, SAUCE_DEMO_USERNAME, SAUCE_DEMO_PASSWORD

After deleting:
- Run npx tsc --noEmit and fix every remaining reference
- Run npx eslint --max-warnings=0
```

---

### After AI generates code — always verify

Do not commit AI-generated code until you have confirmed these yourself:

- [ ] `npx eslint tests/{your-app}/ pages/{your-app}/ --max-warnings=0` — no errors
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npx playwright test tests/{your-app}/ --project={your-app} --retries=0` — all tests pass
- [ ] No hardcoded strings in test files — all from enums
- [ ] No `new PageObject(page)` in test files — fixtures only
- [ ] `import { test, expect }` comes from `fixtures/pom/test-options.ts` not `@playwright/test`
- [ ] No `page.waitForTimeout()` anywhere

If the AI misses any of these, paste the failing output back and ask it to fix the specific issue.

---

## Quick reference — what to change for a new app

| What you need to change                         | File to edit                                     |
| ----------------------------------------------- | ------------------------------------------------ |
| Product names, prices, route paths, header text | `enums/{your-app}/{your-app}.ts`                 |
| App URL                                         | `config/{your-app}.ts` and `.env.example`        |
| Login credentials                               | `test-data/factories/{your-app}/auth.factory.ts` |
| How the login form is filled                    | `pages/{your-app}/login.page.ts`                 |
| How a product is clicked in the listing         | `pages/{your-app}/product-list.page.ts`          |
| How the price is located on the detail page     | `pages/{your-app}/product-detail.page.ts`        |
| Make page objects available to tests            | `fixtures/pom/page-object-fixture.ts`            |
| Run tests at the right URL                      | `playwright.config.ts`                           |
| The test steps themselves                       | `tests/{your-app}/e2e/{name}.spec.ts`            |
