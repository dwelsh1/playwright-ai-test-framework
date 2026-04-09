# playwright-cli Exploration Guide

**Audience:** Jr QA Engineers — how to explore a live page before writing selectors or tests.

One of the most common mistakes when writing Playwright tests is guessing selectors. `playwright-cli` is a browser automation tool that opens a real browser, shows you every interactive element on the page, and lets you try interactions — all before you write a single line of test code. This guide teaches you how to use it.

---

## Table of Contents

1. [Why explore before writing?](#1-why-explore-before-writing)
2. [Opening a page](#2-opening-a-page)
3. [Reading a snapshot](#3-reading-a-snapshot)
4. [Translating a snapshot into selectors](#4-translating-a-snapshot-into-selectors)
5. [Interacting with the page](#5-interacting-with-the-page)
6. [Following a full user flow](#6-following-a-full-user-flow)
7. [Exploring pages that require login](#7-exploring-pages-that-require-login)
8. [Saving state between sessions](#8-saving-state-between-sessions)
9. [Common mistakes](#9-common-mistakes)

---

## 1. Why explore before writing?

When you guess a selector — or copy one from browser DevTools — you often get something like this:

```typescript
// Fragile — breaks if the developer changes the HTML structure
page.locator('#app > div.menu-container > ul > li:nth-child(3) > button');
```

This type of selector breaks the moment the developer reorganizes the HTML, even if the button itself is unchanged. It also doesn't describe what the element **is** to a reader.

The right approach uses accessible names that come from the page's own structure:

```typescript
// Resilient — looks for a button called "Add Espresso to cart", like a user would
page.getByRole('button', { name: /Add Espresso to cart/i });
```

To write this, you need to know the button's role and its accessible name. `playwright-cli` tells you both, directly, from the live page.

---

## 2. Opening a page

Make sure Coffee Cart is running first:

```bash
cd d:/gitrepos/coffee-cart && npm run dev
```

Then open a browser and navigate to the page you want to explore:

```bash
playwright-cli open http://localhost:5273
```

A browser window opens. The terminal waits for your next command.

To navigate to a different page:

```bash
playwright-cli goto http://localhost:5273/login
```

To close the browser when you are done:

```bash
playwright-cli close
```

---

## 3. Reading a snapshot

A **snapshot** is a plain-text description of everything on the current page — every element, its role, its label, and whether it is interactive. Take one at any time:

```bash
playwright-cli snapshot
```

You will see output like this:

```
- document
  - main
    - form ""
      - group "Login"
        - textbox "Email address"
        - textbox "Password"
        - button "Login"
    - alert (if an error is shown)
```

Each line shows:

- The **role** — what kind of element it is (`textbox`, `button`, `heading`, `list`, `listitem`, etc.)
- The **accessible name** in quotes — what a screen reader or Playwright's `getByRole()` uses to identify it

### What the roles mean

| Role       | HTML element                          | Playwright locator                            |
| ---------- | ------------------------------------- | --------------------------------------------- |
| `button`   | `<button>` or `<input type="submit">` | `getByRole('button', { name: '...' })`        |
| `textbox`  | `<input type="text">` / `<textarea>`  | `getByLabel('...')` or `getByRole('textbox')` |
| `heading`  | `<h1>` through `<h6>`                 | `getByRole('heading', { name: '...' })`       |
| `link`     | `<a href="...">`                      | `getByRole('link', { name: '...' })`          |
| `list`     | `<ul>` / `<ol>`                       | `getByRole('list')`                           |
| `listitem` | `<li>`                                | `getByRole('listitem')`                       |
| `checkbox` | `<input type="checkbox">`             | `getByLabel('...')`                           |
| `img`      | `<img alt="...">`                     | `getByRole('img', { name: '...' })`           |
| `alert`    | `role="alert"`                        | `getByRole('alert')`                          |

---

## 4. Translating a snapshot into selectors

Here is the login page snapshot and the selectors it produces:

**Snapshot output:**

```
- form ""
  - group "Login"
    - textbox "Email address"
    - textbox "Password"
    - button "Login"
```

**Translated to Playwright locators:**

```typescript
// textbox "Email address" → use getByLabel() for form inputs
page.getByLabel(/email address/i);

// textbox "Password" → same pattern
page.getByLabel(/password/i);

// button "Login" → getByRole with the button name
page.getByRole('button', { name: /login/i });
```

> **Why use `/regex/i` instead of `'exact string'`?** The `/i` flag makes the match case-insensitive, so your test keeps working even if the label text changes from "Email address" to "Email Address". For button names especially, this prevents a lot of unnecessary failures.

### Selector priority order

Use the first option that applies:

1. `getByRole()` — for buttons, links, headings, checkboxes
2. `getByLabel()` — for form inputs (text, password, select, textarea)
3. `getByPlaceholder()` — when there is no visible label
4. `getByText()` — for static text content that identifies an element
5. `getByTestId()` — only when the element has a `data-testid` attribute

Never use CSS selectors like `page.locator('.btn-primary')` or XPath.

---

## 5. Interacting with the page

You can interact with elements in the snapshot using their element reference codes (`e1`, `e2`, etc.). These appear in the snapshot output:

```
playwright-cli snapshot
```

```
- button "Login" [ref=e7]
```

Then:

```bash
playwright-cli click e7
playwright-cli fill e3 "user@example.com"
playwright-cli fill e5 "secret123"
playwright-cli press Enter
```

After each command, a new snapshot is printed so you can see what changed.

> **Note:** Element refs (`e3`, `e7`) are only for exploration. Never copy them into test code — they are session-specific and will not work in automated tests. Use the role and accessible name from the snapshot instead.

### Taking a named snapshot at a key point

Save a snapshot at a specific moment to refer back to later:

```bash
playwright-cli snapshot --filename=after-login.yaml
```

The file is saved in `.playwright-cli/` in the project root. It is gitignored automatically.

---

## 6. Following a full user flow

Here is a complete example: exploring the add-to-cart flow on the Coffee Cart menu page.

**Step 1 — Open the menu page**

```bash
playwright-cli open http://localhost:5273
playwright-cli snapshot
```

**Snapshot (abbreviated):**

```
- list ""
  - listitem ""
    - img "Espresso"
    - heading "Espresso $8.00"
    - button "Add Espresso to cart"
  - listitem ""
    - img "Espresso Macchiato"
    - heading "Espresso Macchiato $12.00"
    - button "Add Espresso Macchiato to cart"
```

**Step 2 — Click "Add Espresso to cart"**

```bash
playwright-cli click e5
playwright-cli snapshot --filename=after-add-to-cart.yaml
```

**Snapshot shows the snackbar appeared:**

```
- alert ""
  - paragraph "Espresso was added successfully"
```

**Step 3 — Navigate to the cart**

```bash
playwright-cli click e2
playwright-cli snapshot --filename=cart-page.yaml
```

**Translated selectors from exploration:**

```typescript
// Menu page
get coffeeList(): Locator {
  return this.page.getByRole('list').filter({ has: this.page.getByRole('heading') });
}

getAddToCartButton(coffeeName: string): Locator {
  return this.page.getByRole('button', { name: new RegExp(`Add ${coffeeName} to cart`, 'i') });
}

// Snackbar
get message(): Locator {
  return this.page.getByRole('alert').getByRole('paragraph');
}
```

**Step 4 — Close the browser**

```bash
playwright-cli close
```

---

## 7. Exploring pages that require login

Some pages redirect you to login if you are not authenticated. Navigate to the login page first, then authenticate, then navigate to the page you want to explore.

```bash
playwright-cli open http://localhost:5273/login
playwright-cli snapshot

playwright-cli fill e3 "user@example.com"
playwright-cli fill e5 "user-password"
playwright-cli click e7

playwright-cli snapshot
playwright-cli goto http://localhost:5273/orders
playwright-cli snapshot --filename=orders-page.yaml
```

---

## 8. Saving state between sessions

If you need to explore multiple pages without logging in every time, save the browser's auth state and load it next time:

```bash
# After logging in — save state
playwright-cli state-save auth-state.json

# In a new session — load state first, then navigate
playwright-cli open http://localhost:5273
playwright-cli state-load auth-state.json
playwright-cli goto http://localhost:5273/orders
playwright-cli snapshot
playwright-cli close
```

> **Do not commit `auth-state.json`** — it contains cookies and session tokens. The file is gitignored if saved to `.playwright-cli/`.

---

## 9. Common mistakes

| Mistake                                          | What to do instead                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Copying element refs (`e3`, `e7`) into test code | Use the role and accessible name from the snapshot                   |
| Using `getByText()` for form inputs              | Form inputs have labels — use `getByLabel()`                         |
| Writing selectors without exploring first        | Always run `playwright-cli snapshot` before writing locators         |
| Using CSS selectors from DevTools                | CSS selectors are fragile — use `getByRole()` or `getByLabel()`      |
| Exploring without the app running                | Start Coffee Cart first: `cd d:/gitrepos/coffee-cart && npm run dev` |
| Trying to match snapshot role names exactly      | Use case-insensitive regex: `/email address/i` not `'Email address'` |

---

## See also

- [Test Generator Usage](test-generator-usage.md) — scaffold a test file after exploring
- [Creating a Page Object](creating-a-page-object.md) — put your discovered selectors into a page object
- [Developer Guide](../developer.md) — selector rules and framework patterns
