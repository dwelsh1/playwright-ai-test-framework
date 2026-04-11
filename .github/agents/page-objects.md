---
name: page-objects
description: "Lean POM — readonly constructor locators, component composition, fixture registration, tests own assertions Framework skill ID: page-objects. Canonical source: .cursor/skills/page-objects/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: page-objects
  source_path: .cursor/skills/page-objects/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/page-objects/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Page Object Model (Lean POM)

**Lean POM** in this framework means: **readonly** locators assigned in the **constructor** (lazy Playwright locators), **action** methods that encode real user steps, **assertions only in specs** (never `expect()` inside page objects), **components** for shared UI, and **no meaningless wrappers** around a single Playwright call. Form and CRUD pages must include feedback/validation locators — see the **No Feedback-Less Lean POM** rule below.

## File Locations

> **`{area}` is a placeholder.** Before creating or referencing any path below, run `ls pages/` to discover the real subdirectory names in this repo (e.g., `front-office`, `back-office`) and use those instead.

| Type         | Directory           | Naming                |
| ------------ | ------------------- | --------------------- |
| Page objects | `pages/{area}/`     | `[name].page.ts`      |
| Components   | `pages/components/` | `[name].component.ts` |

## Lean POM structure

Organize locators in three sections with comments. This makes the page object self-documenting and ensures feedback/validation locators are never overlooked.

```typescript
import { Locator, Page } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;

  // --- Interactive elements ---
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  // --- Feedback / validation messages ---
  readonly successMessage: Locator;
  readonly errorAlert: Locator;
  readonly emailFieldError: Locator;

  // --- Navigation / secondary actions ---
  readonly cancelLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Interactive elements
    this.emailInput = page.getByLabel('Email');
    this.submitButton = page.getByRole('button', { name: 'Submit' });

    // Feedback / validation messages
    this.successMessage = page.getByRole('alert').filter({ hasText: /success/i });
    this.errorAlert = page.getByRole('alert').filter({ hasText: /error|failed/i });
    this.emailFieldError = page.getByText(Messages.INVALID_EMAIL);

    // Navigation / secondary actions
    this.cancelLink = page.getByRole('link', { name: 'Cancel' });
  }

  /**
   * Description of what the action does.
   * @param {string} email - The user's email address.
   * @returns {Promise<void>}
   */
  async submitForm(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
    await this.page.waitForResponse((r) => r.url().includes('/api/submit'));
  }
}
```

## Rules

### Locators as Readonly Constructor Properties

ALWAYS define locators as `readonly` properties assigned in the constructor. Playwright locators are lazy (they don't query the DOM until acted on), so constructor assignment is safe and produces the same behavior as getter accessors with less boilerplate:

```typescript
// CORRECT -- readonly constructor assignment
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }
}

// WRONG -- getter accessors (unnecessary boilerplate)
get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit' });
}
```

### Property Order

Declare properties in this order: `page`, then public `readonly` locators, then `private readonly` locators/containers, then assign them in the constructor in the same order.

### No JSDoc on Locator Properties

NEVER add JSDoc comments to locator properties or locator-returning methods. Their names are self-documenting.

```typescript
// CORRECT -- no comment needed
readonly submitButton: Locator;

// WRONG -- locator properties don't need JSDoc
/** The submit button. */
readonly submitButton: Locator;
```

JSDoc belongs **only on action methods** (see below).

### Action Methods

- Methods should represent **complete user actions** (e.g., `login()`, `submitForm()`).
- Wait for API responses or state changes inside the action method.
- Always specify `Promise<void>` or the appropriate return type.
- Add JSDoc comments with `@param` and `@returns`.

### Assertions Stay in Tests

Page objects perform actions. Tests make assertions. Never put `expect()` calls inside page objects.

```typescript
// BAD: page object owns the assertion
async loginAndVerify(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
    await expect(this.page).toHaveURL('/dashboard'); // belongs in test
}

// GOOD: page object performs action, test asserts
async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
}

// In test:
await loginPage.login(email, password);
await expect(loginPage.page).toHaveURL(/\/dashboard/);
```

**Exception:** `waitForURL()` or `waitForResponse()` inside Lean POM methods is fine -- those are synchronization, not assertion.

### Fluent Navigation

When an action navigates to a different page, the method MAY return the destination page object. This creates a typed chain that mirrors the user flow:

```typescript
/** Returns DashboardPage on success. Call only when credentials are valid. */
async loginAs(email: string, password: string): Promise<DashboardPage> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
    await this.page.waitForURL('/dashboard');
    return new DashboardPage(this.page);
}

// Usage in test:
const dashboard = await loginPage.loginAs(email, password);
await expect(dashboard.welcomeHeading).toBeVisible();
```

**Use when:** The action always navigates (successful login, clicking a nav link).
**Avoid when:** Navigation is uncertain (form might fail validation and stay on the same page).

### Imports in Page Objects

Page objects import from `@playwright/test` (not from `test-options.ts`):

```typescript
import { expect, Locator, Page } from '@playwright/test';
```

## Component Composition

Reusable UI fragments (headers, modals, sidebars) are defined as **components** and composed into page objects:

```typescript
// pages/components/navigation.component.ts
import { Locator, Page } from '@playwright/test';

export class NavigationComponent {
  readonly page: Page;
  readonly homeLink: Locator;
  private readonly navContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navContainer = page.locator('nav, [role="navigation"]');
    this.homeLink = this.navContainer.getByRole('link', { name: 'Home' });
  }

  async clickHome(): Promise<void> {
    await this.homeLink.click();
  }

  async logout(): Promise<void> {
    await this.page.getByTestId('user-menu-button').click();
    await this.page.getByRole('button', { name: 'Logout' }).click();
  }
}
```

Compose components into page objects:

```typescript
// pages/app/dashboard.page.ts
import { Page } from '@playwright/test';
import { NavigationComponent } from '../components/navigation.component';

export class DashboardPage {
  readonly page: Page;
  readonly nav: NavigationComponent;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavigationComponent(page);
  }
}

// Usage in tests
await dashboardPage.nav.clickHome();
await dashboardPage.nav.logout();
```

## Registering New Page Objects

After creating a page object, register it in `fixtures/pom/page-object-fixture.ts`:

1. Import the class.
2. Add the type to `FrameworkFixtures`.
3. Add the fixture definition.

```typescript
import { test as base } from '@playwright/test';
import { AppPage } from '../../pages/app/app.page';
import { DashboardPage } from '../../pages/app/dashboard.page';

export type FrameworkFixtures = {
  appPage: AppPage;
  dashboardPage: DashboardPage; // Add type
  resetStorageState: () => Promise<void>;
};

export const test = base.extend<FrameworkFixtures>({
  appPage: async ({ page }, use) => {
    await use(new AppPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page)); // Add fixture
  },
  resetStorageState: async ({ context }, use) => {
    await use(async () => {
      await context.clearCookies();
      await context.clearPermissions();
    });
  },
});
```

## Exploration Before Generation (Mandatory)

Before creating or updating any page object, use **only** `playwright-cli` to navigate the live application. Read the `playwright-cli` skill first (`.claude/skills/playwright-cli/SKILL.md`).

Steps:

1. `playwright-cli open [URL]` and authenticate
2. `playwright-cli snapshot` to discover element roles, labels, and accessible names
3. Interact with forms and buttons to reveal validation messages and dynamic states
4. **If auth fails or the page does not load, stop and notify the human** — do not guess selectors

This is not optional. The `No Substitute UI Exploration` rule forbids using any other browser tool.

### No Feedback-Less Lean POM rule

```typescript
// FORBIDDEN: violates No Feedback-Less Lean POM rule
// A page object for a form with no feedback message locators
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  // Missing: successMessage, errorAlert, emailFieldError — incomplete!
}
```

Every page object for a form or CRUD screen **must** include locators for success messages, error messages, and inline validation feedback where those elements exist in the app.

## See Also

- **`selectors`** skill -- Selector priority order, forbidden patterns, and disambiguation tips for choosing between similar locators.
