# Accessibility Testing

**Audience:** Jr QA Engineers — how to run, read, and write accessibility tests.

Accessibility tests check that the app can be used by people with disabilities — screen reader users, keyboard-only users, people with low vision. This framework uses **axe-core** to scan pages for WCAG 2.1 AA violations automatically. This guide explains how to run the existing tests, read violation reports, and write new accessibility tests.

---

## Table of Contents

1. [What accessibility tests check](#1-what-accessibility-tests-check)
2. [Running the accessibility tests](#2-running-the-accessibility-tests)
3. [Reading a violation report](#3-reading-a-violation-report)
4. [WCAG violation levels — what each one means](#4-wcag-violation-levels--what-each-one-means)
5. [Common WCAG violations and what causes them](#5-common-wcag-violations-and-what-causes-them)
6. [Writing a new accessibility test](#6-writing-a-new-accessibility-test)
7. [Scoping a scan to part of the page](#7-scoping-a-scan-to-part-of-the-page)
8. [Testing keyboard navigation](#8-testing-keyboard-navigation)
9. [Disabling a rule for a known app bug](#9-disabling-a-rule-for-a-known-app-bug)
10. [Accessibility view in the Smart Reporter](#10-accessibility-view-in-the-smart-reporter)
11. [Exporting axe results for CI tooling](#11-exporting-axe-results-for-ci-tooling)
12. [Common mistakes](#12-common-mistakes)

---

## 1. What accessibility tests check

Accessibility tests scan the page using **axe-core** — an automated WCAG (Web Content Accessibility Guidelines) auditing library. It checks things like:

- **Color contrast** — is there enough contrast between text and its background for people with low vision?
- **Form labels** — does every input have a label that screen readers can announce?
- **Image alt text** — do images have descriptive alternative text?
- **ARIA roles** — are interactive elements correctly marked up for assistive technology?
- **Keyboard focus** — can every interactive element be reached and operated with a keyboard?
- **Heading structure** — are headings used in a logical order (h1 → h2 → h3)?

Automated scanning catches roughly 30–40% of accessibility issues. The tests in this framework cover that automated layer. Manual testing (using a screen reader, testing with keyboard only) is done separately.

---

## 2. Running the accessibility tests

```bash
# Run all @a11y tests
npx playwright test --project=chromium --grep "@a11y"
```

Or run just the accessibility spec:

```bash
npx playwright test tests/coffee-cart/functional/accessibility.spec.ts --project=chromium
```

Tests that pass mean no axe-core violations were found on those pages. The Smart Reporter opens automatically after the run — click any failing test to see the formatted violation list.

---

## 3. Reading a violation report

When `a11yScan()` finds violations, the test fails with a JSON array showing every violation. Here is what it looks like:

```json
[
  {
    "rule": "color-contrast",
    "impact": "serious",
    "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
    "nodes": 2,
    "help": "https://dequeuniversity.com/rules/axe/4.4/color-contrast"
  },
  {
    "rule": "label",
    "impact": "critical",
    "description": "Ensures every form element has a label",
    "nodes": 1,
    "help": "https://dequeuniversity.com/rules/axe/4.4/label"
  }
]
```

Each entry tells you:

| Field         | What it means                                                                   |
| ------------- | ------------------------------------------------------------------------------- |
| `rule`        | The axe rule ID — search this in the axe documentation for the full explanation |
| `impact`      | How serious the issue is: `critical`, `serious`, `moderate`, or `minor`         |
| `description` | Plain-English description of what the rule checks                               |
| `nodes`       | How many elements on the page have this violation                               |
| `help`        | Link to the full rule documentation with examples and fixes                     |

Open the `help` URL for any violation — it shows exactly what the problem is and how to fix it at the HTML level.

---

## 4. WCAG violation levels — what each one means

| Level      | Meaning                                                                     | Action required                   |
| ---------- | --------------------------------------------------------------------------- | --------------------------------- |
| `critical` | Blocks some users completely — a screen reader user cannot use this feature | Fix before shipping               |
| `serious`  | Creates significant barriers — some users cannot access content             | Fix before shipping               |
| `moderate` | Makes things harder but not impossible — degrades the experience            | Fix in current sprint if possible |
| `minor`    | Small inconvenience — most users unaffected                                 | Backlog and schedule              |

For new features, aim to have zero `critical` and `serious` violations before the feature goes live.

---

## 5. Common WCAG violations and what causes them

| Rule ID          | What it checks                                  | Common cause                                                                                         |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `color-contrast` | Text has enough contrast against its background | Text color too close to background — needs at least 4.5:1 ratio for normal text                      |
| `label`          | Every form input has an associated label        | `<input>` without a `<label>` or `aria-label` — assistive tech cannot announce what the field is for |
| `image-alt`      | Images have alternative text                    | `<img>` with no `alt` attribute or `alt=""` on a meaningful image                                    |
| `heading-order`  | Headings follow a logical order                 | Jumping from `h1` to `h3`, skipping `h2`                                                             |
| `button-name`    | Buttons have accessible names                   | `<button>` with only an icon and no text or `aria-label`                                             |
| `link-name`      | Links have accessible names                     | `<a>` tags with only an icon and no text or `aria-label`                                             |
| `region`         | Page content is inside landmark regions         | Content outside `<main>`, `<nav>`, `<header>`, `<footer>`                                            |

---

## 6. Writing a new accessibility test

The pattern for an accessibility test is: navigate to the page, wait for it to fully load, then call `a11yScan()`.

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Coffee Cart — Accessibility', () => {
  test('cart page meets WCAG 2.1 AA', { tag: '@a11y' }, async ({ cartPage, a11yScan }) => {
    await test.step('GIVEN user is on the cart page', async () => {
      await cartPage.goto();
      await expect(cartPage.page).toHaveURL(/\/cart/);
    });

    await test.step('THEN the page passes WCAG 2.1 AA', async () => {
      await a11yScan();
    });
  });
});
```

**Important:** Always wait for the page to be in a meaningful state before scanning. If you scan too early — before content has loaded — axe may miss violations or flag false positives.

```typescript
// WRONG — page may still be loading
await cartPage.goto();
await a11yScan();

// RIGHT — wait for a key element before scanning
await cartPage.goto();
await expect(cartPage.page).toHaveURL(/\/cart/); // confirms navigation complete
await a11yScan();
```

### Scanning interactive states

Many violations only appear when a component is in a specific state — an error message, an open modal, a focused input. Test those states too:

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test(
  'checkout modal meets WCAG 2.1 AA',
  { tag: '@a11y' },
  async ({ menuPage, cartPage, paymentDetails, a11yScan }) => {
    await test.step('GIVEN user has opened the checkout modal', async () => {
      await menuPage.goto();
      await menuPage.addToCart(CoffeeNames.ESPRESSO);
      await menuPage.header.goToCart();
      await cartPage.checkout();
      await expect(paymentDetails.submitButton).toBeVisible();
    });

    await test.step('THEN the modal passes WCAG 2.1 AA', async () => {
      await a11yScan({ include: '[role="dialog"]' });
    });
  },
);
```

The `include` option scopes the scan to just the modal — see [Section 7](#7-scoping-a-scan-to-part-of-the-page).

---

## 7. Scoping a scan to part of the page

By default, `a11yScan()` scans the entire page. You can limit the scan to a specific CSS selector:

```typescript
// Scan only the payment modal
await a11yScan({ include: '[role="dialog"]' });

// Scan only the navigation
await a11yScan({ include: 'nav' });

// Scan only the login form
await a11yScan({ include: 'form' });
```

You can also exclude sections:

```typescript
// Scan the whole page except the cookie banner
await a11yScan({ exclude: ['#cookie-banner'] });

// Exclude multiple elements
await a11yScan({ exclude: ['header', '.third-party-widget'] });
```

Use `exclude` when part of the page has a known violation in code you do not own (a third-party widget, a vendored component). Narrow exclusions — exclude only what you cannot fix, not entire sections of the page.

---

## 8. Testing keyboard navigation

Automated scans check markup but cannot fully verify keyboard behaviour. Write dedicated keyboard navigation tests for interactive flows:

```typescript
test('login form is keyboard operable', { tag: '@a11y' }, async ({ loginPage }) => {
  const { email, password } = generateUserCredentials();

  await test.step('GIVEN user is on the login page', async () => {
    await loginPage.goto();
    await expect(loginPage.submitButton).toBeVisible();
  });

  await test.step('WHEN user tabs through the form', async () => {
    await loginPage.emailInput.focus();
    await expect(loginPage.emailInput).toBeFocused();

    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();

    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.submitButton).toBeFocused();
  });

  await test.step('THEN Enter submits the form', async () => {
    await loginPage.emailInput.focus();
    await loginPage.page.keyboard.type(email);
    await loginPage.page.keyboard.press('Tab');
    await loginPage.page.keyboard.type(password);
    await loginPage.page.keyboard.press('Tab');
    await loginPage.page.keyboard.press('Enter');
    await expect(loginPage.page).not.toHaveURL(/\/login/);
  });
});
```

Key keyboard interactions to test for new features:

- All form inputs reachable via Tab in a logical order
- Buttons and links activatable with Enter or Space
- Modal dialogs trappable (Tab cycles within the modal, Escape closes it)
- Dropdown menus navigable with arrow keys

---

## 9. Disabling a rule for a known app bug

Sometimes a WCAG violation exists in the app but has not been fixed yet. Do not skip the entire test — disable only the specific rule and add a comment explaining why:

```typescript
await test.step('THEN the error state passes WCAG 2.1 AA', async () => {
  // FIXME: error message text (#dc2626 on #fef2f2) has contrast ratio 4.41:1 — just below
  // the required 4.5:1. App-level bug; remove this exclusion once the app fixes the color.
  await a11yScan({ disableRules: ['color-contrast'] });
});
```

Rules to disable:

```typescript
await a11yScan({ disableRules: ['color-contrast', 'region'] });
```

Guidelines for using `disableRules`:

- Only disable the specific failing rule, never all rules
- Always add a `// FIXME:` comment with the bug reference and the exact violation value
- Create a bug ticket for the app team and link it in the comment
- Remove the disabled rule once the app fixes the underlying issue

---

## 10. Accessibility view in the Smart Reporter

After every test run, the Smart Reporter includes a dedicated **♿ Accessibility** nav item in the sidebar (it only appears when at least one test has been scanned with `a11yScan()`).

### What the Accessibility view shows

| Section                   | Description                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Summary bar**           | Total violations found, tests scanned, tests with violations, clean tests                          |
| **Rule breakdown table**  | Every axe rule that fired across all tests — rule ID, worst impact level, number of tests affected |
| **Affected test list**    | Each test that had violations, with a "View test →" link to jump to its detail card                |
| **Cross-run trend chart** | Total axe violations per run across your history (appears when ≥ 2 runs have axe data)             |

### Axe badges on test cards

Each test card in the report shows a small badge next to the test name:

- **♿ ✓** (green) — the test was scanned and found no violations
- **♿ N** (red, where N is a number) — the test was scanned and found N violations

Tests that were never scanned with `a11yScan()` have no badge.

### How to open it

```bash
npm test
# Smart Reporter opens automatically — click ♿ Accessibility in the left sidebar
```

If you need the trend chart with cross-run history, make sure you have run tests more than once. History is stored in `playwright-report/test-history.json` — do not delete this file between runs.

---

## 11. Exporting axe results for CI tooling

Every time `a11yScan()` runs, the fixture writes a per-test artifact to `test-results/axe-results/`. After the test run completes, merge all per-test files into a single report:

```bash
npm run report:axe
```

This produces `test-results/axe-results.json` — a JSON array sorted by test title:

```json
[
  {
    "test": "cart page meets WCAG 2.1 AA",
    "file": "tests/coffee-cart/functional/accessibility.spec.ts",
    "violations": 0,
    "rules": [],
    "date": "2026-03-26T10:00:00.000Z",
    "status": "passed"
  },
  {
    "test": "login page meets WCAG 2.1 AA",
    "file": "tests/coffee-cart/functional/accessibility.spec.ts",
    "violations": 2,
    "rules": [{ "id": "color-contrast", "impact": "serious" }],
    "date": "2026-03-26T10:00:02.000Z",
    "status": "failed"
  }
]
```

A CI step can parse this file to post a PR comment, publish to a dashboard (DataDog, Grafana), or fail the build when violations exceed a threshold.

**Note:** Per-test files are written concurrently by parallel workers, but each worker writes its own separate file to avoid race conditions. The merge script combines them after the run.

---

## 12. Common mistakes

| Mistake                                            | What to do instead                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Scanning before the page is fully loaded           | Wait for a key element with `expect(...).toBeVisible()` before calling `a11yScan()` |
| Excluding entire sections to hide violations       | Exclude only specific elements; narrow exclusions to what you cannot fix            |
| Using `disableRules` without a `// FIXME:` comment | Always document why a rule is disabled and reference the bug                        |
| Only scanning the happy-path page state            | Also scan error states, open modals, and expanded components                        |
| Treating axe-core as the complete picture          | Automated scanning covers ~30–40% of issues — combine with keyboard testing         |
| Tagging accessibility tests with `@regression`     | Use `@a11y` — it is the correct tag and runs the right CI pipeline                  |
| Deleting `playwright-report/` between runs         | Keep the folder — deleting it resets the axe trend history to zero                  |

---

## See also

- [Understanding Fixtures](understanding-fixtures.md) — the `a11y` fixture and `a11yScan()` options
- [Debugging Failing Tests](debugging-failing-tests.md) — how to read violation output in the trace viewer
- [Developer Guide](../developer.md) — accessibility architecture and axe-core configuration
