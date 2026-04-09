# Test Generator Usage Guide

**Audience:** Jr QA Engineers writing their first tests in this framework.

The test generator creates a ready-to-edit test file from a template so you never have to remember which imports go at the top, what the describe block looks like, or how to structure Given/When/Then steps. You run one command, open the file, and fill in the blanks.

---

## Table of Contents

1. [What the generator does](#1-what-the-generator-does)
2. [Before you run it](#2-before-you-run-it)
3. [Running the generator](#3-running-the-generator)
4. [What gets created](#4-what-gets-created)
5. [Worked example — functional test](#5-worked-example--functional-test)
6. [Worked example — API test](#6-worked-example--api-test)
7. [Worked example — E2E test](#7-worked-example--e2e-test)
8. [Filling in the TODOs](#8-filling-in-the-todos)
9. [Running your finished test](#9-running-your-finished-test)
10. [Common mistakes](#10-common-mistakes)

---

## 1. What the generator does

Running `npm run generate:test` creates a `.spec.ts` file at the right path for the test type you choose. It pre-fills:

- The correct import line (always `fixtures/pom/test-options`, never `@playwright/test`)
- A `test.describe()` block named after your area and page
- A `test.beforeEach()` for functional tests (navigate + assert page loaded)
- A test with the right tag (`@smoke`, `@api`, or `@e2e`)
- Given / When / Then steps with `// TODO` comments to guide you

You fill in the TODOs. The generator never touches the app or runs tests — it only creates the file.

---

## 2. Before you run it

You need:

- Dependencies installed: `npm ci` (done once after cloning)
- The Coffee Cart app running: `cd d:/gitrepos/coffee-cart && npm run dev`

You do **not** need to know the selectors yet. The generator creates the stub first; you discover selectors using `playwright-cli` after.

---

## 3. Running the generator

```bash
npm run generate:test -- --type <type> --area <area> --name <name>
```

| Flag     | Required | Values                     | Description                             |
| -------- | -------- | -------------------------- | --------------------------------------- |
| `--type` | Yes      | `functional`, `api`, `e2e` | Which test template to use              |
| `--area` | Yes      | e.g. `coffee-cart`         | The app subdirectory under `tests/`     |
| `--name` | Yes      | e.g. `stores`              | The file name (no `.spec.ts` extension) |

**Output path:**

```
tests/{area}/{type}/{name}.spec.ts
```

For example:

```bash
npm run generate:test -- --type functional --area coffee-cart --name stores
# creates: tests/coffee-cart/functional/stores.spec.ts
```

To see all options at any time:

```bash
npm run generate:test -- --help
```

---

## 4. What gets created

The generator replaces the `{{PLACEHOLDER}}` tokens in the template with your values and writes the file. Your `--area` and `--name` are automatically title-cased in the describe block — `coffee-cart` becomes `Coffee Cart`, `my-feature` becomes `My Feature`.

All remaining `TODO` placeholders are left for you to fill in. There are no clever guesses — the file is intentionally incomplete so you don't ship a test with wrong selectors.

---

## 5. Worked example — functional test

### Step 1: Generate the file

```bash
npm run generate:test -- --type functional --area coffee-cart --name stores
```

Output:

```
  Created: tests/coffee-cart/functional/stores.spec.ts

  Next steps:
    1. Explore the page with playwright-cli:
       playwright-cli open http://localhost:5273
       playwright-cli snapshot
    2. Replace all TODO placeholders in tests/coffee-cart/functional/stores.spec.ts
    3. Run: npx playwright test tests/coffee-cart/functional/stores.spec.ts --project=chromium
```

### Step 2: Open the generated file

`tests/coffee-cart/functional/stores.spec.ts` looks like this right after generation:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Coffee Cart — Stores', () => {
  test.beforeEach(async ({ TODO_pageFixture }) => {
    await TODO_pageFixture.goto();
    await expect(TODO_pageFixture.TODO_readyLocator).toBeVisible();
  });

  test(
    'TODO: describe what this test verifies',
    { tag: '@smoke' },
    async ({ TODO_pageFixture }) => {
      await test.step('GIVEN TODO', async () => {
        // TODO
      });

      await test.step('WHEN TODO', async () => {
        // TODO
      });

      await test.step('THEN TODO', async () => {
        // TODO
      });
    },
  );
});
```

### Step 3: Explore the page with playwright-cli

Before writing any selectors or steps, open the live page and take a snapshot to see what's there:

```bash
playwright-cli open http://localhost:5273
playwright-cli snapshot
playwright-cli close
```

The snapshot shows you every interactive element with its role, label, and accessible name — this is where you discover what to put in `getByRole()` and `getByLabel()`.

### Step 4: Fill in the TODOs

Replace `TODO_pageFixture` with the fixture name for the page you're testing (e.g. `menuPage`, `loginPage`, `cartPage`). Replace `TODO_readyLocator` with a locator that confirms the page has loaded. Fill in the test name and each step.

Here is the same file after filling everything in:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Coffee Cart — Stores', () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await expect(menuPage.coffeeList).toBeVisible();
  });

  test('should display the full coffee menu', { tag: '@smoke' }, async ({ menuPage }) => {
    await test.step('GIVEN user is on the menu page', async () => {
      await expect(menuPage.page).toHaveURL(/\//);
    });

    await test.step('WHEN the page finishes loading', async () => {
      await expect(menuPage.coffeeList).toBeVisible();
    });

    await test.step('THEN at least one coffee item is shown', async () => {
      await expect(menuPage.coffeeList).not.toBeEmpty();
    });
  });
});
```

> **How do I know the fixture name?**
> Open `fixtures/pom/page-object-fixture.ts` — every fixture is listed there with its type. Or check `docs/framework-onboarding.md` Section 9 for the most common ones.

---

## 6. Worked example — API test

### Step 1: Generate the file

```bash
npm run generate:test -- --type api --area coffee-cart --name promotions
```

Creates `tests/coffee-cart/api/promotions.spec.ts`:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { TODO_Schema } from '../../../fixtures/api/schemas/coffee-cart/TODO_schema.ts';

test.describe('Coffee Cart API — Promotions', () => {
  test('GET /api/TODO returns valid schema', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN GET /api/TODO is called', async () => {
      const response = await api.get('/api/TODO');
      expect(response.status()).toBe(200);
      const body = await response.json();
      TODO_Schema.parse(body);
    });
  });
});
```

### Step 2: Find the real endpoint and schema

Check what schemas already exist:

```bash
ls fixtures/api/schemas/coffee-cart/
```

If a schema for the endpoint you're testing already exists, import it. If not, you'll need to create one — see `docs/developer.md` under "Zod Schemas" for how to do that.

### Step 3: Fill in the TODOs

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { CoffeeListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';

test.describe('Coffee Cart API — Menu', () => {
  test('GET /api/coffees returns valid schema', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN GET /api/coffees is called', async () => {
      const response = await api.get('/api/coffees');
      expect(response.status()).toBe(200);
      const body = await response.json();
      CoffeeListResponseSchema.parse(body);
    });
  });
});
```

> **Note:** The API template is a starting point for a single happy-path test. Real API spec files have many tests covering different status codes. See `tests/coffee-cart/api/menu-api.spec.ts` for a full example.

---

## 7. Worked example — E2E test

### Step 1: Generate the file

```bash
npm run generate:test -- --type e2e --area coffee-cart --name guest-checkout
```

Creates `tests/coffee-cart/e2e/guest-checkout.spec.ts`:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Coffee Cart — Guest Checkout', () => {
  test('TODO: describe what this test verifies', { tag: '@e2e' }, async ({ TODO_fixtures }) => {
    await test.step('GIVEN TODO', async () => {
      // TODO
    });

    await test.step('WHEN TODO', async () => {
      // TODO
    });

    await test.step('THEN TODO', async () => {
      // TODO
    });
  });
});
```

### Step 2: Identify the fixtures you need

E2E tests often span multiple pages, so you'll use several fixtures. List them all in the function signature, comma-separated:

```typescript
async ({ menuPage, cartPage, paymentDetails, snackbar }) => {
```

### Step 3: Fill in the steps

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Coffee Cart — Guest Checkout', () => {
  test(
    'should complete a purchase from menu to order confirmation',
    { tag: '@e2e' },
    async ({ menuPage, cartPage, paymentDetails, snackbar }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN user has an item in the cart', async () => {
        await menuPage.goto();
        await menuPage.addToCart(CoffeeNames.AMERICANO);
        await menuPage.header.goToCart();
        await expect(cartPage.checkoutButton).toBeVisible();
      });

      await test.step('WHEN user completes checkout', async () => {
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, email);
        await paymentDetails.submit();
      });

      await test.step('THEN order confirmation is shown', async () => {
        await expect(snackbar.message).toBeVisible();
      });
    },
  );
});
```

---

## 8. Filling in the TODOs

Here is a quick reference for every placeholder you'll encounter:

| Placeholder         | What to replace it with                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `TODO_pageFixture`  | The fixture name for the page: `loginPage`, `menuPage`, `cartPage`, `ordersPage`, `adminPage` |
| `TODO_readyLocator` | A locator that confirms the page loaded: `loginPage.submitButton`, `menuPage.coffeeList`      |
| `TODO: describe...` | A plain-English sentence: `'should display coffee prices on the menu'`                        |
| `GIVEN TODO`        | What's already true before the action: `'user is on the login page'`                          |
| `WHEN TODO`         | The action being tested: `'user submits valid credentials'`                                   |
| `THEN TODO`         | The expected outcome: `'user is redirected to the menu page'`                                 |
| `TODO_fixtures`     | (E2E only) Comma-separated fixture names: `menuPage, cartPage, paymentDetails`                |
| `TODO_Schema`       | (API only) The Zod schema name: `CoffeeListResponseSchema`, `CartResponseSchema`              |
| `TODO_schema.ts`    | (API only) The schema file name: `coffeeSchema`, `cartSchema`                                 |
| `/api/TODO`         | (API only) The real endpoint path: `/api/coffees`, `/api/cart`                                |

### The selector rule

Never guess selectors. Always explore the live page first:

```bash
playwright-cli open http://localhost:5273/login
playwright-cli snapshot
playwright-cli close
```

The snapshot output shows you the role and accessible name of every element. Use that to write `getByRole()`, `getByLabel()`, or `getByText()` — in that priority order.

### Choosing the right tag

Change `@smoke` to the tag that matches what the test covers:

| Tag           | Use when the test covers…                             |
| ------------- | ----------------------------------------------------- |
| `@smoke`      | The most critical path — login, core action, redirect |
| `@sanity`     | A quick check that a feature basically works          |
| `@regression` | Detailed feature behavior, edge cases                 |
| `@e2e`        | A multi-page user journey (already set for E2E)       |
| `@api`        | An API endpoint (already set for API)                 |

---

## 9. Running your finished test

```bash
# Run just your new file
npx playwright test tests/coffee-cart/functional/stores.spec.ts --project=chromium

# Run it headed to watch the browser
npx playwright test tests/coffee-cart/functional/stores.spec.ts --project=chromium --headed

# Run it in debug mode (Playwright Inspector opens — step through each action)
npx playwright test tests/coffee-cart/functional/stores.spec.ts --project=chromium --debug
```

If the test passes, open Smart Reporter to see the step timeline:

```bash
npm run report:smart
```

---

## 10. Common mistakes

| Mistake                                | What to do instead                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Left a `TODO_` placeholder in the file | Replace every `TODO_` before running — the test will fail or not compile     |
| Chose `@functional` as the tag         | `@functional` is forbidden. Use `@smoke`, `@sanity`, or `@regression`        |
| Added two importance tags              | One tag only — `{ tag: '@smoke' }`, not `{ tag: ['@smoke', '@regression'] }` |
| Imported from `@playwright/test`       | Always import from `../../../fixtures/pom/test-options`                      |
| Wrote `new MenuPage(page)`             | Use the fixture: `async ({ menuPage }) => { ... }`                           |
| Hardcoded `'John Doe'` in a test       | Use `generateCheckoutData().name` from the factory                           |
| Copied a CSS selector from DevTools    | Use `getByRole()` or `getByLabel()` — never CSS or XPath                     |
| Ran without exploring first            | Always run `playwright-cli snapshot` before writing selectors                |

---

## See also

- [Framework Onboarding Guide](../framework-onboarding.md) — end-to-end walkthrough for new contributors
- [Developer Guide](../developer.md) — selectors, fixtures, tags, and patterns in depth
- [Selectors skill](.claude/skills/selectors/SKILL.md) — full selector priority rules with examples
- [Test Standards skill](.claude/skills/test-standards/SKILL.md) — tagging, step structure, import rules
