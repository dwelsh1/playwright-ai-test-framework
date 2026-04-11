---
name: selectors
description: Selector strategy and locator rules for Playwright page objects
---

# Selector Strategy

Locator choices must support **Lean POM** page objects: prefer roles, labels, and accessible names so constructor-assigned locators stay stable and readable. Exploration with `playwright-cli` informs those choices before you codify them.

## Exploration-First Workflow (Mandatory)

Before writing any selectors or page object locators, explore the live application with `playwright-cli`. Selectors written from assumptions break. Selectors discovered from observation are accurate.

**Steps:**

1. **Open and authenticate** — Use `playwright-cli open [URL]` and log in. If auth fails or the page does not load, **stop and notify the human** — do not proceed or guess selectors.
2. **Explore and interact** — Use `playwright-cli snapshot` to capture the page state. Interact with forms, buttons, and flows to reveal dynamic elements and validation messages.
3. **Plan locators** — From the snapshot, identify the best selector for each element using the priority order below. Note element roles, labels, accessible names, and any `data-testid` attributes.
4. **Generate the page object** — Write locators in the page object using the discovered information.

**This is not optional.** The `No Substitute UI Exploration` rule forbids using IDE browser MCP, Cursor browser tools, Playwright Test `codegen`, or any other browser tool in place of `playwright-cli`.

---

## Priority Order (Mandatory)

Use semantic locators in this order. Move to the next option ONLY when the previous one is not feasible:

1. **`getByRole()`** -- Accessibility-based. Always the first choice for buttons, links, headings, textboxes, checkboxes, etc.
2. **`getByLabel()`** -- For form inputs that have associated `<label>` elements.
3. **`getByPlaceholder()`** -- For inputs with placeholder text when no label exists.
4. **`getByText()`** -- For static text content, messages, or non-interactive elements.
5. **`getByTestId()`** -- Fallback when none of the above produce a reliable locator.

## Correct Examples

```typescript
// 1. getByRole -- buttons, links, headings, navigation
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'Dashboard' });
page.getByRole('heading', { name: 'Welcome' });
page.getByRole('navigation');
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Remember me' });

// 2. getByLabel -- form fields with labels
page.getByLabel('Email');
page.getByLabel('Password');

// 3. getByPlaceholder -- inputs without labels
page.getByPlaceholder('Search...');

// 4. getByText -- static content
page.getByText('Login successful');
page.getByText(Messages.ERROR_MESSAGE); // prefer enums for repeated strings

// 5. getByTestId -- last resort
page.getByTestId('user-avatar');
```

## Forbidden (NEVER Use)

- **XPath selectors** -- brittle, unreadable, and not accessible.

  ```typescript
  // FORBIDDEN
  page.locator('//div[@id="test"]');
  page.locator('xpath=//button[text()="Submit"]');
  ```

- **CSS selectors for primary strategy** -- acceptable only as `page.locator()` last resort, never as the default approach.
  ```typescript
  // AVOID unless absolutely necessary
  page.locator('.btn-primary');
  page.locator('#submit-button');
  ```

## Locator Patterns in Page Objects

Define locators as **`readonly` properties** assigned in the constructor. Playwright locators are lazy (they don't query the DOM until acted on), so constructor assignment is safe:

```typescript
import { Locator, Page } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly submitButton: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.emailInput = page.getByLabel('Email');
  }
}
```

## Decision Flowchart

When choosing a locator, follow this flowchart top-to-bottom:

```
Does the element have a semantic role?
(button, link, heading, textbox, checkbox, combobox, dialog, img, navigation...)
  |
  +-- YES --> getByRole('role', { name: 'accessible name' })
  |             Need to narrow scope? Chain from parent:
  |             getByRole('navigation').getByRole('link', { name: '...' })
  |
  +-- NO
       |
       v
     Is it a form field with a visible <label>?
       +-- YES --> getByLabel('label text')
       +-- NO
            |
            v
          Is it static text content?
            +-- YES --> getByText('text', { exact: true })
            +-- NO
                 |
                 v
               Does it have a placeholder?
                 +-- YES --> getByPlaceholder('placeholder text')
                 +-- NO
                      |
                      v
                    Does it have a title or alt text?
                      +-- YES --> getByTitle() or getByAltText()
                      +-- NO --> Add data-testid to markup, use getByTestId()
                                 NEVER fall back to CSS or XPath.
```

## Decision Matrix

| Element Type      | Recommended Locator                     | Fallback                         | Example                                                        |
| ----------------- | --------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| Button            | `getByRole('button', { name })`         | `getByText()` if role missing    | `getByRole('button', { name: 'Submit' })`                      |
| Link              | `getByRole('link', { name })`           | `getByText()` for anchor text    | `getByRole('link', { name: 'Sign up' })`                       |
| Text input        | `getByLabel('...')`                     | `getByRole('textbox', { name })` | `getByLabel('Email address')`                                  |
| Checkbox          | `getByRole('checkbox', { name })`       | `getByLabel()`                   | `getByRole('checkbox', { name: 'Accept terms' })`              |
| Dropdown          | `getByRole('combobox', { name })`       | `getByLabel()`                   | `getByLabel('Country')`                                        |
| Heading           | `getByRole('heading', { name, level })` | `getByText()`                    | `getByRole('heading', { name: 'Dashboard', level: 1 })`        |
| Nav link          | chain from parent                       | scope with `locator('nav')`      | `getByRole('navigation').getByRole('link', { name: '...' })`   |
| Table cell        | chain from row                          | `locator('td')` scoped           | `getByRole('row').filter().getByRole('cell')`                  |
| Modal             | `getByRole('dialog')`                   | `locator('[role="dialog"]')`     | `getByRole('dialog').getByRole('button', { name: 'Confirm' })` |
| Dynamic list item | `.filter({ hasText })`                  | `nth()` as last resort           | `getByRole('listitem').filter({ hasText: 'Milk' })`            |
| Custom component  | `getByTestId('...')`                    | Add `data-testid` to markup      | `getByTestId('color-picker')`                                  |

## Scoping: When Multiple Elements Match

When a locator matches more than one element, narrow scope rather than using `nth()`:

```typescript
// BAD: fragile index
page.getByRole('button', { name: 'Edit' }).nth(0);

// GOOD: scope to a parent section
page.getByRole('region', { name: 'Billing' }).getByRole('button', { name: 'Edit' });

// GOOD: scope to a table row
page.getByRole('row', { name: /Order #1234/ }).getByRole('button', { name: 'Edit' });

// GOOD: scope with filter
page.locator('article').filter({ hasText: 'Draft' }).getByRole('button', { name: 'Edit' });
```

## Choosing Between Similar Locators

- If the element has a **role** (button, link, heading, etc.), always prefer `getByRole()`.
- If the element is a **form input with a label**, prefer `getByLabel()` over `getByRole('textbox')`.
- If identifying by **exact text** risks matching multiple elements, add `{ exact: true }` or use a more specific role.
- Use **enums** for repeated string values (error messages, labels) rather than hardcoding strings -- see `enums/app/app.ts`.

## Feedback & Validation Message Selectors

Page objects for forms and CRUD screens **must** include selectors for feedback elements, not just interactive inputs. A page object with only input locators is incomplete.

### What to Capture

| Feedback type         | When it appears                          | Locator strategy                              |
| --------------------- | ---------------------------------------- | --------------------------------------------- |
| Success message       | After a successful submit / save         | `getByRole('alert')`, `getByText(Messages.X)` |
| Error / failure toast | After an API error or server failure     | `getByRole('alert')`, `getByText(Messages.X)` |
| Inline field error    | Below a field after failed validation    | `getByText()` scoped to the field's container |
| Loading / pending     | While the operation is in progress       | `getByRole('progressbar')` or spinner locator |
| Confirmation dialog   | Before a destructive action is confirmed | `getByRole('dialog')`                         |

### Three-Section Locator Pattern

Organize locators in the constructor with section comments to distinguish interactive elements from feedback:

```typescript
export class CheckoutPage {
  readonly page: Page;

  // --- Interactive elements ---
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // --- Feedback / validation messages ---
  readonly successMessage: Locator;
  readonly errorAlert: Locator;
  readonly emailFieldError: Locator;

  // --- Navigation / secondary actions ---
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Interactive elements
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });

    // Feedback / validation messages
    this.successMessage = page.getByRole('alert').filter({ hasText: /success/i });
    this.errorAlert = page.getByRole('alert').filter({ hasText: /error|failed/i });
    this.emailFieldError = page.getByText(Messages.INVALID_EMAIL);

    // Navigation / secondary actions
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }
}
```

### Forbidden Pattern

```typescript
// FORBIDDEN: no feedback locators — violates No Feedback-Less Lean POM rule
export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  // Missing: successMessage, errorAlert, emailFieldError
}
```

---

## See Also

- **`page-objects`** skill -- Lean POM, readonly locators, component composition, and fixture registration.
