# Creating a Page Object

**Audience:** Jr QA Engineers adding their first page objects to the framework.

A page object is a TypeScript class that represents one page or component in the app. It holds the selectors for that page and the actions a user can perform on it. Tests use the page object instead of calling Playwright directly — which means if the app's HTML changes, you fix it in one place, not in every test.

This guide walks through building a page object from scratch, step by step, using a real example.

---

## Table of Contents

1. [What a page object contains](#1-what-a-page-object-contains)
2. [Before you start — explore the page](#2-before-you-start--explore-the-page)
3. [Step 1 — Create the file](#3-step-1--create-the-file)
4. [Step 2 — Write the class skeleton](#4-step-2--write-the-class-skeleton)
5. [Step 3 — Add locators](#5-step-3--add-locators)
6. [Step 4 — Add action methods](#6-step-4--add-action-methods)
7. [Step 5 — Register the fixture](#7-step-5--register-the-fixture)
8. [Step 6 — Use it in a test](#8-step-6--use-it-in-a-test)
9. [Composing with components](#9-composing-with-components)
10. [Common mistakes](#10-common-mistakes)

---

## 1. What a page object contains

A page object has three things:

1. **Locators** — `readonly` properties that return a `Locator`. These describe where elements are on the page. They are never `async`.
2. **Action methods** — `async` methods that perform a user action: clicking a button, filling a form, navigating somewhere. These are always `async`.
3. **A constructor** — takes a `Page` object, assigns it to `this.page`, and defines all the locators.

Here is the LoginPage — the simplest example in the framework:

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /login/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

---

## 2. Before you start — explore the page

Before writing any selectors, open the live page with `playwright-cli` and take a snapshot. This tells you the real role and accessible name of every element.

```bash
playwright-cli open http://localhost:5273/login
playwright-cli snapshot
playwright-cli close
```

Example output:

```
- form ""
  - group "Login"
    - textbox "Email address"
    - textbox "Password"
    - button "Login"
```

Each line in the snapshot maps directly to a Playwright locator. See [playwright-cli Exploration Guide](playwright-cli-exploration.md) for a full walkthrough.

---

## 3. Step 1 — Create the file

Page objects live in `pages/{area}/`. The file name follows the pattern `[name].page.ts`.

Example — adding a page object for a new "Promotions" page in Coffee Cart:

```
pages/coffee-cart/promotions.page.ts
```

First, check what already exists so you can follow the same naming:

```bash
ls pages/coffee-cart/
```

```
admin.page.ts
cart.page.ts
login.page.ts
menu.page.ts
orders.page.ts
```

---

## 4. Step 2 — Write the class skeleton

Every page object starts with the same skeleton:

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Promotions page object
 */
export class PromotionsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/promotions');
  }
}
```

Three rules for the skeleton:

- Import `Page` and `Locator` from `@playwright/test` (this is the only file type that imports directly from `@playwright/test` — test files always import from `fixtures/pom/test-options`)
- `page` is always `readonly`
- `goto()` navigates to the page's URL — include it even if you do not use it in your first test

---

## 5. Step 3 — Add locators

Add a `readonly` property for each element you need to interact with or assert against. Assign them in the constructor.

Selectors come from the snapshot you took in Step 2. Use this priority order:

| Priority             | Use when                                          | Example                                              |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `getByRole()`        | For buttons, links, headings, checkboxes          | `page.getByRole('button', { name: /add to cart/i })` |
| `getByLabel()`       | For form inputs with visible labels               | `page.getByLabel(/email/i)`                          |
| `getByPlaceholder()` | For inputs with no label but a placeholder        | `page.getByPlaceholder(/search/i)`                   |
| `getByText()`        | For static text that identifies an element        | `page.getByText(/no promotions available/i)`         |
| `getByTestId()`      | Last resort — only when element has `data-testid` | `page.getByTestId('promo-card')`                     |

**Never use:**

- CSS selectors: `page.locator('.promo-card')`
- XPath: `page.locator('//div[@class="promo"]')`
- Positional selectors: `page.locator('ul > li:nth-child(2)')`

Here is the promotions page with locators added:

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Promotions page object
 */
export class PromotionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly promotionList: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /promotions/i });
    this.promotionList = page.getByRole('list', { name: /promotions/i });
    this.emptyMessage = page.getByText(/no promotions available/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/promotions');
  }
}
```

### Scoping locators to a parent

If the page has repeated elements (like a list of cards), scope child locators to their parent container so they do not match the wrong element:

```typescript
constructor(page: Page) {
  this.page = page;
  // Scope to the form first, then find children within it
  const form = page.locator('form');
  this.emailInput = form.getByLabel(/email/i);
  this.passwordInput = form.getByLabel(/password/i);
  this.submitButton = form.getByRole('button', { name: /login/i });
}
```

This prevents accidental matches when a similar element exists elsewhere on the page (like a second form in a modal).

### Locators that need a parameter

When you need a locator that targets one item from a list (like one coffee card), use a method that returns a `Locator` rather than storing it as a property:

```typescript
// Not a property — takes a parameter, returns a locator
getPromotionCard(title: string): Locator {
  return this.promotionList.getByRole('listitem').filter({
    has: this.page.getByRole('heading', { name: title }),
  });
}
```

> **Rule:** If the locator needs a parameter, it is a method. If it is always the same element, it is a `readonly` property.

---

## 6. Step 4 — Add action methods

Action methods are `async` functions that perform something a user would do. They use the locators you defined in the constructor.

```typescript
/**
 * Claim a promotion by title
 * @param title - The visible title of the promotion card
 */
async claimPromotion(title: string): Promise<void> {
  const card = this.getPromotionCard(title);
  await card.getByRole('button', { name: /claim/i }).click();
}
```

Rules for action methods:

- Always `async` and always return a `Promise<void>` (or `Promise<T>` if returning a value)
- Add a JSDoc comment (`/** ... */`) that describes what the method does — include `@param` for each parameter
- Do NOT add JSDoc to locator properties — only to methods that perform actions
- Keep each method focused on one action; do not bundle multiple unrelated actions together

### Reading a value from the page

When a method reads something from the page (like getting the count of items), it returns a typed value:

```typescript
/**
 * Get the number of promotion cards currently shown
 */
async getPromotionCount(): Promise<number> {
  return this.promotionList.getByRole('listitem').count();
}
```

---

## 7. Step 5 — Register the fixture

Tests access page objects through **fixtures** — they are injected automatically rather than constructed manually. You must register your new page object in two files.

### File 1: `fixtures/pom/page-object-fixture.ts`

Add the type to `FrameworkFixtures` and the fixture initializer to the `test.extend` block:

```typescript
// 1. Add the import at the top
import { PromotionsPage } from '../../pages/coffee-cart/promotions.page';

// 2. Add to the FrameworkFixtures type
export type FrameworkFixtures = {
  loginPage: LoginPage;
  menuPage: MenuPage;
  // ... existing fixtures ...
  /** Promotions page object */
  promotionsPage: PromotionsPage;   // ← add this
};

// 3. Add the fixture initializer inside test.extend<FrameworkFixtures>({...})
promotionsPage: async ({ page }, use) => {
  await use(new PromotionsPage(page));
},
```

### File 2: `fixtures/pom/test-options.ts`

This file exports the combined `test` and `expect` that tests import. Check whether it re-exports from `page-object-fixture.ts` or needs the new type merged in. In most cases it just re-exports:

```typescript
export { test, expect } from './page-object-fixture';
```

No changes needed here unless a new fixture type is introduced that is not yet covered by the merge chain.

### Verification

Run a quick check to confirm the fixture compiles:

```bash
npx tsc --noEmit
```

No output means it compiled cleanly.

---

## 8. Step 6 — Use it in a test

Once registered, the fixture is available in any test file that imports from `fixtures/pom/test-options`:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Coffee Cart — Promotions', () => {
  test.beforeEach(async ({ promotionsPage }) => {
    await promotionsPage.goto();
    await expect(promotionsPage.heading).toBeVisible();
  });

  test('should display the promotions list', { tag: '@smoke' }, async ({ promotionsPage }) => {
    await test.step('GIVEN user is on the promotions page', async () => {
      await expect(promotionsPage.page).toHaveURL(/\/promotions/);
    });

    await test.step('THEN at least one promotion is shown', async () => {
      const count = await promotionsPage.getPromotionCount();
      expect(count).toBeGreaterThan(0);
    });
  });
});
```

Run the test:

```bash
npx playwright test tests/coffee-cart/functional/promotions.spec.ts --project=chromium
```

---

## 9. Composing with components

Some UI elements appear on multiple pages — the navigation bar, snackbar messages, modals. These live in `pages/components/` as separate classes.

To include a component in your page object, instantiate it in the constructor:

```typescript
import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';

export class PromotionsPage {
  readonly page: Page;
  readonly header: HeaderComponent; // ← component property
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page); // ← instantiate in constructor
    this.heading = page.getByRole('heading', { name: /promotions/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/promotions');
  }
}
```

In a test, you access the component through the page object:

```typescript
// Navigate to cart via the header component
await promotionsPage.header.goToCart();
```

Look at `pages/coffee-cart/menu.page.ts` to see how `HeaderComponent` and `PromotionComponent` are composed in a real page object.

---

## 10. Common mistakes

| Mistake                                                       | What to do instead                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `new PromotionsPage(page)` inside a test                      | Register the fixture and use `async ({ promotionsPage })`                   |
| CSS selector: `page.locator('.promo-card')`                   | Use `getByRole()`, `getByLabel()`, or `getByText()` from the snapshot       |
| `async` locator property: `get heading() { return await ...}` | Locators are synchronous — define them in the constructor, not with `await` |
| JSDoc on locator properties                                   | JSDoc is for action methods only — never add it to locator properties       |
| Importing from `@playwright/test` in a test file              | Import from `../../../fixtures/pom/test-options` in test files              |
| Skipping exploration and guessing selectors                   | Always run `playwright-cli snapshot` before writing locators                |
| One enormous method that does five things                     | Split into focused methods: one action per method                           |
| Forgetting to register in `page-object-fixture.ts`            | Always add both the type and the fixture initializer                        |

---

## See also

- [playwright-cli Exploration Guide](playwright-cli-exploration.md) — discover selectors before writing code
- [Test Generator Usage](test-generator-usage.md) — scaffold the test file that uses your page object
- [Developer Guide](../developer.md) — POM patterns, selector rules, and fixture registration in depth
