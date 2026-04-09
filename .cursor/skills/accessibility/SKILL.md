---
name: accessibility
description: Accessibility testing with axe-core -- WCAG compliance, scoped scans, keyboard navigation, and ARIA validation
---

# Accessibility Testing

We enforce `getByRole()` for locators, which ensures our selectors are accessibility-aware. This skill extends that philosophy to dedicated accessibility testing -- automated WCAG violation detection and keyboard navigation verification.

## Prerequisites

Install `@axe-core/playwright`:

```bash
npm install -D @axe-core/playwright
```

## Quick Reference

```typescript
import AxeBuilder from '@axe-core/playwright';

// Full page scan
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);

// WCAG AA only (standard compliance target)
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

// Scoped scan -- specific region
const results = await new AxeBuilder({ page }).include('#main-content').analyze();

// Exclude third-party widgets you don't control
const results = await new AxeBuilder({ page }).exclude('.third-party-widget').analyze();
```

## Rules

### ALWAYS Use `withTags()` for WCAG Level

Target a specific WCAG compliance level. Running all rules produces noise from best-practice checks that aren't WCAG requirements.

```typescript
// GOOD -- targets WCAG 2.1 AA (standard for most organizations)
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

// AVOID -- runs everything including non-WCAG best practices
const results = await new AxeBuilder({ page }).analyze();
```

### WCAG Tag Reference

| Tag                        | Level       | When to Use                       |
| -------------------------- | ----------- | --------------------------------- |
| `wcag2a` + `wcag2aa`       | WCAG 2.0 AA | Minimum for most projects         |
| `+ wcag21a` + `wcag21aa`   | WCAG 2.1 AA | Standard target (recommended)     |
| `+ wcag22aa`               | WCAG 2.2 AA | Latest standard                   |
| `+ wcag2aaa` / `wcag21aaa` | AAA         | Government, healthcare (strict)   |
| `best-practice`            | Advisory    | Non-blocking, use `expect.soft()` |

### ALWAYS Format Violations for Readable Output

Raw axe violations are hard to read. Format them on failure:

```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

const violations = results.violations.map((v) => ({
  rule: v.id,
  impact: v.impact,
  description: v.description,
  nodes: v.nodes.length,
  help: v.helpUrl,
}));

expect(results.violations, JSON.stringify(violations, null, 2)).toEqual([]);
```

### ALWAYS Scan After Page is Interactive

Run axe scans after the page is fully loaded and interactive -- not during loading states:

```typescript
// BAD -- scanning during loading spinner
await page.goto('/dashboard');
const results = await new AxeBuilder({ page }).analyze();

// GOOD -- wait for content to render
await page.goto('/dashboard');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
const results = await new AxeBuilder({ page }).analyze();
```

### Scan Dynamic UI States

Modals, dropdowns, and expandable sections must be scanned in their open state:

```typescript
// Scan a modal after it opens
await page.getByRole('button', { name: 'Delete account' }).click();
await expect(page.getByRole('dialog')).toBeVisible();

const results = await new AxeBuilder({ page })
  .include('[role="dialog"]')
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();

expect(results.violations).toEqual([]);
```

## Scoped Scans

Focus scans on specific regions or exclude areas you don't control:

```typescript
// Scan only the checkout form
const results = await new AxeBuilder({ page }).include('#checkout-form').analyze();

// Scan page excluding third-party elements
const results = await new AxeBuilder({ page })
  .exclude('#intercom-widget')
  .exclude('.ad-banner')
  .analyze();

// Scan multiple regions
const results = await new AxeBuilder({ page })
  .include('#navigation')
  .include('#main-content')
  .include('#footer')
  .analyze();
```

## Keyboard Navigation Testing

axe-core catches structural violations but NOT keyboard usability. Test critical flows with keyboard:

```typescript
test('login form is keyboard navigable', { tag: '@regression' }, async ({ page }) => {
  await test.step('GIVEN login page is loaded', async () => {
    await page.goto('/login');
  });

  await test.step('WHEN user tabs through the form', async () => {
    await page.keyboard.press('Tab'); // Focus email
    await expect(page.getByLabel(/email/i)).toBeFocused();

    await page.keyboard.press('Tab'); // Focus password
    await expect(page.getByLabel(/password/i)).toBeFocused();

    await page.keyboard.press('Tab'); // Focus submit
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeFocused();
  });

  await test.step('THEN Enter submits the form', async () => {
    await page.keyboard.press('Shift+Tab'); // Back to password
    await page.getByLabel(/password/i).fill('test');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    // Assert form submitted
  });
});
```

### Focus Trap Testing

Modals and dialogs MUST trap focus -- Tab should cycle within the dialog, not escape to the page behind it:

```typescript
test('modal traps focus', { tag: '@regression' }, async ({ page }) => {
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Tab through all focusable elements in the dialog
  const dialog = page.getByRole('dialog');
  const focusableCount = await dialog
    .locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    .count();

  for (let i = 0; i < focusableCount + 1; i++) {
    await page.keyboard.press('Tab');
    // Focus should stay within the dialog
    const activeElement = page.locator(':focus');
    await expect(dialog).toContainText((await activeElement.textContent()) || '');
  }

  // Escape closes the dialog
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

## Reusable Accessibility Fixture

Create a fixture to standardize scans across all tests:

```typescript
// fixtures/accessibility/a11y-fixture.ts
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type A11yFixtures = {
  a11yScan: (options?: { include?: string; exclude?: string[] }) => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  a11yScan: async ({ page }, use) => {
    await use(async (options = {}) => {
      let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

      if (options.include) builder = builder.include(options.include);
      if (options.exclude) {
        for (const selector of options.exclude) {
          builder = builder.exclude(selector);
        }
      }

      const results = await builder.analyze();

      const violations = results.violations.map((v) => ({
        rule: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        help: v.helpUrl,
      }));

      expect(results.violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  },
});

// Usage in test:
test('dashboard is accessible', { tag: '@regression' }, async ({ page, a11yScan }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading')).toBeVisible();
  await a11yScan({ exclude: ['.ad-banner'] });
});
```

## Gradual Adoption Strategy

When adding accessibility tests to an existing app with violations:

1. **Start with `disableRules()`** to exclude known violations during migration:

```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules(['color-contrast', 'link-name']) // Fix these in Sprint 3
  .analyze();
```

2. **Remove disabled rules one at a time** as fixes ship
3. **Track progress** with a violation count that must not increase

## Anti-Patterns

| Don't                                  | Problem                                         | Do Instead                                            |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Skip accessibility tests entirely      | Legal risk, excludes users                      | Add axe scans to key pages                            |
| Scan only the homepage                 | Most violations are in forms and interactive UI | Scan login, checkout, settings, modals                |
| Run axe during loading state           | Spinner has no content -- false clean result    | Wait for page to be interactive                       |
| Disable rules permanently              | Violations rot and multiply                     | Track disabled rules, fix on a schedule               |
| Only use axe (no keyboard testing)     | axe catches ~30-40% of issues                   | Supplement with keyboard nav tests for critical flows |
| Test accessibility in a separate suite | Violations regress silently                     | Include scans inline with functional tests            |

## See Also

- **`selectors`** skill -- Our `getByRole()` priority ensures selectors are accessibility-aware.
- **`fixtures`** skill -- Registering the `a11yScan` fixture in `test-options.ts`.
- **`test-standards`** skill -- Test structure and tagging for accessibility test files.
