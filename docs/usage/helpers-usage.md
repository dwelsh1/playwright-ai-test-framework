# Helpers Reference Guide

**Audience:** Developers and QA Engineers — what each helper function in the `helpers/` folder does, when to use it, and how it differs from fixtures and factories.

---

## Table of Contents

1. [What helpers are — and what they are not](#1-what-helpers-are--and-what-they-are-not)
2. [Folder structure](#2-folder-structure)
3. [coffee-cart helpers](#3-coffee-cart-helpers)
   - [formatPrice](#formatprice)
4. [util helpers](#4-util-helpers)
   - [readClipboard](#readclipboard)
   - [readDownloadAsText](#readdownloadastext)
5. [Changes made](#5-changes-made)

---

## 1. What helpers are — and what they are not

The `helpers/` folder contains **plain TypeScript functions** — no Playwright fixtures, no dependency injection, no `page` or `request` context injected by the framework. They are utilities called directly with explicit arguments.

This distinguishes them from two closely related concepts:

| Concept                       | Location                            | How it gets `page`/`request`            | Used in                                   |
| ----------------------------- | ----------------------------------- | --------------------------------------- | ----------------------------------------- |
| **Helper function**           | `helpers/{area}/`                   | Passed explicitly as a parameter        | Tests, setup scripts, and other functions |
| **Helper fixture**            | `fixtures/helper/helper-fixture.ts` | Injected by Playwright's fixture system | Tests, via `{ createdOrder, seededCart }` |
| **Page object action method** | `pages/{area}/`                     | Owned by the page object (`this.page`)  | Tests, via `{ menuPage, cartPage }` etc.  |

The practical rule: if a function is a pure utility (takes a value, returns a value) or needs explicit context passed in, it belongs in `helpers/`. If it needs setup/teardown lifecycle management with automatic cleanup, it belongs in `fixtures/helper/`.

---

## 2. Folder structure

```
helpers/
├── coffee-cart/
│   └── price.helper.ts          # Currency formatting for price assertions
└── util/
    ├── clipboard.ts             # Read browser clipboard content
    └── download.ts              # Read downloaded file content as text
```

---

## 3. coffee-cart helpers

### formatPrice

**File:** `helpers/coffee-cart/price.helper.ts`

**Signature:**

```typescript
export function formatPrice(amount: number): string;
```

**What it does:** Converts a numeric dollar amount to the formatted currency string the Coffee Cart UI displays — `"$X.XX"` with exactly two decimal places.

```typescript
formatPrice(5); // "$5.00"
formatPrice(6.5); // "$6.50"
formatPrice(2 * CoffeePrices.ESPRESSO + CoffeePrices.CAPPUCCINO); // "$16.50"
```

**When to use it:** When asserting exact cart totals or product prices in UI tests. Combine it with `CoffeePrices` enum values so the assertion stays in sync with the app's data automatically — no hardcoded strings.

```typescript
import { formatPrice } from '../../../helpers/coffee-cart/price.helper';
import { CoffeePrices } from '../../../enums/coffee-cart/coffee-cart';

// Assert exact total after adding 2 Espressos + 1 Cappuccino
const expectedTotal = formatPrice(2 * CoffeePrices.ESPRESSO + CoffeePrices.CAPPUCCINO);
const total = await cartPage.getTotal();
expect(total).toBe(expectedTotal); // "$16.50"
```

**When not to use it:** If you only need to verify the price is in the right format (not a specific value), a regex is simpler:

```typescript
expect(total).toMatch(/\$\d+\.\d{2}/);
```

**Where it is used:** `tests/coffee-cart/functional/cart.spec.ts` — the `'Cart — Exact Price Calculation'` describe block adds known quantities via API and asserts the exact total using `formatPrice` with `CoffeePrices` enum values.

---

## 4. util helpers

These helpers are generic utilities with no dependency on any specific app. They can be imported by any test area.

---

### readClipboard

**File:** `helpers/util/clipboard.ts`

**Signature:**

```typescript
export async function readClipboard(page: Page): Promise<string>;
```

**What it does:** Reads the current clipboard text content from the browser. Returns whatever text is currently in the clipboard — useful for asserting that a "Copy" button interaction actually put the right value there.

**Setup required:** The browser context must have the `clipboard-read` permission granted before calling. This is done once per test or describe block:

```typescript
await page.context().grantPermissions(['clipboard-read']);
```

**When to use it:** When testing "Copy to clipboard" interactions — order IDs, share links, coupon codes, API keys, or any other feature that copies text to the clipboard.

```typescript
import { readClipboard } from '../../../helpers/util/clipboard';

test('should copy order ID to clipboard', { tag: '@regression' }, async ({ page, ordersPage }) => {
  await page.context().grantPermissions(['clipboard-read']);

  await test.step('WHEN user clicks the copy button', async () => {
    await ordersPage.copyOrderIdButton.click();
  });

  await test.step('THEN clipboard contains the order ID', async () => {
    const copied = await readClipboard(page);
    expect(copied).toMatch(/^[A-Z0-9]{8,}$/);
  });
});
```

**Note:** This helper is available but not yet used in any test — no clipboard copy feature currently exists in Coffee Cart or Sauce Demo. Add a test when that feature is implemented.

---

### readDownloadAsText

**File:** `helpers/util/download.ts`

**Signature:**

```typescript
export async function readDownloadAsText(download: Download): Promise<string>;
```

**What it does:** Reads the content of a Playwright `Download` object as a UTF-8 string. Useful for asserting the content of exported files — CSV exports, JSON downloads, text reports.

Throws an error with a clear message if the download path is null (indicating the download failed or was cancelled).

**When to use it:** When the app exports data to a file and you need to assert the file's contents rather than just that a download occurred.

```typescript
import { readDownloadAsText } from '../../../helpers/util/download';

test('should export orders as CSV', { tag: '@regression' }, async ({ adminPage }) => {
  let download;

  await test.step('WHEN admin exports orders', async () => {
    [download] = await Promise.all([
      adminPage.page.waitForEvent('download'),
      adminPage.exportButton.click(),
    ]);
  });

  await test.step('THEN CSV contains the order header row', async () => {
    const content = await readDownloadAsText(download);
    expect(content).toContain('Order ID,Email,Total,Date');
  });
});
```

**Note:** This helper is available but not yet used in any test — Coffee Cart and Sauce Demo do not currently have file export features. Add a test when export functionality is added.

---

## 5. Changes made

The following changes were made when this guide was written. Documented here for historical context.

### Removed

**`helpers/coffee-cart/auth.helper.ts`** contained `authenticateUser()` and `saveStorageState()` — both unused. These were designed for an API-based authentication approach that was never adopted. The actual auth setup files use Playwright's native `page.context().storageState()` approach, which is simpler and does not require these helpers.

**`helpers/util/util.ts`** contained `formatDate()` — also unused. Removed to keep the helpers folder clean. If date formatting is needed in future tests, it can be reintroduced at that point.

---

## See also

- [Understanding Fixtures](understanding-fixtures.md) — the `createdOrder` and `seededCart` helper fixtures (these live in `fixtures/helper/`, not `helpers/`)
- [Authentication & Storage State](authentication-storage-state.md) — how the auth setup files work without needing auth helper functions
- [Test Data Factories](test-data-factories.md) — Faker-based factories for generating dynamic test data
- [Writing Full API Tests](writing-api-tests.md) — how end-user API specs use the `api` fixture, distinct from the lower-level `apiRequest()` utility used internally by helper fixtures
