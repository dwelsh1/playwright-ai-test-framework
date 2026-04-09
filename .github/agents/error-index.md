---
name: error-index
description: "Quick reference for Playwright error messages with causes and fixes Framework skill ID: error-index. Canonical source: .cursor/skills/error-index/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: error-index
  source_path: .cursor/skills/error-index/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/error-index/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Playwright Error Index

Search for your exact error message. Each entry gives the cause and a working fix.

## Locator & Element Errors

### "locator.click: Target closed"

**Cause:** Page navigated away or closed before the action completed.

```typescript
// WRONG -- click triggers navigation, next action fails
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.getByRole('button', { name: 'Settings' }).click(); // Target closed

// RIGHT -- wait for navigation before next action
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.waitForURL('**/dashboard');
await page.getByRole('button', { name: 'Settings' }).click();
```

### "waiting for locator('...') to be visible"

**Cause:** Element never appeared in the DOM or is hidden (`display: none`, `visibility: hidden`, zero size).

```typescript
// Check: does the locator match anything?
console.log(await page.getByRole('button', { name: 'Submit' }).count());
// If 0: wrong selector or precondition not met

// RIGHT -- wait for data to load before asserting
await page.waitForResponse((r) => r.url().includes('/api/data') && r.status() === 200);
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
```

### "strict mode violation"

**Cause:** Locator matched multiple elements. Playwright refuses to act on ambiguous matches.

```typescript
// WRONG -- matches multiple buttons
await page.getByRole('button', { name: 'Save' }).click();

// RIGHT -- use exact matching
await page.getByRole('button', { name: 'Save', exact: true }).click();

// RIGHT -- scope to parent
await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();

// RIGHT -- filter in a list
await page
  .getByRole('listitem')
  .filter({ hasText: 'Project Alpha' })
  .getByRole('button', { name: 'Delete' })
  .click();
```

### "Element is not an \<input\>, \<textarea\> or [contenteditable]"

**Cause:** `fill()` called on a non-input element (e.g., `<div>`, `<label>`, `<form>`).

```typescript
// WRONG -- targets the label text, not the input
await page.getByText('Email').fill('user@example.com');

// RIGHT -- getByLabel finds the associated input
await page.getByLabel('Email').fill('user@example.com');

// RIGHT -- target by role
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
```

### "Node is not an Element" (stale ElementHandle)

**Cause:** Using legacy `page.$()` API; DOM node was replaced by re-render.

```typescript
// WRONG -- stale handle after re-render
const button = await page.$('button.submit');
await button!.click(); // Node is not an Element

// RIGHT -- locator always re-queries
const button = page.getByRole('button', { name: 'Submit' });
await button.click(); // works after re-render
```

## Navigation & Timeout Errors

### "Timeout 30000ms exceeded"

**Cause:** Action or assertion took longer than the configured timeout.

**Diagnosis:**

1. Does the element exist? Check with Inspector or `page.pause()`
2. Is the element hidden? Check CSS `display`, `visibility`, `opacity`
3. Is an API response slow? Add `page.waitForResponse()` before the assertion
4. Is the timeout too low for CI? Increase per-assertion, not globally

```typescript
// Per-assertion timeout (don't increase global timeout)
await expect(page.getByText('Processing complete')).toBeVisible({ timeout: 15_000 });

// Wait for slow API before asserting
await page.waitForResponse((r) => r.url().includes('/api/process'));
await expect(page.getByText('Complete')).toBeVisible();
```

### "net::ERR_CONNECTION_REFUSED"

**Cause:** Application server not running or wrong URL.

**Fix:** Start the app first, or configure `webServer` in `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
},
```

### "frame was detached"

**Cause:** iFrame was removed from the DOM during interaction.

```typescript
// Wait for frame to be stable before interacting
const frame = page.frameLocator('#payment-iframe');
await expect(frame.getByRole('button', { name: 'Pay' })).toBeVisible();
await frame.getByRole('button', { name: 'Pay' }).click();
```

## Assertion Errors

### "expect(locator).toBeVisible() — locator resolved to X elements"

**Cause:** Same as strict mode violation -- locator matched multiple elements.

```typescript
// Assert count instead of visibility
await expect(page.getByRole('listitem')).toHaveCount(5);

// Or assert on a specific one
await expect(page.getByRole('listitem').first()).toBeVisible();
```

### "expect(received).toEqual(expected)" with API response

**Cause:** Response body doesn't match expected shape. Often a schema mismatch.

```typescript
// Use Zod schema validation for clear error messages
const result = schema.safeParse(body);
if (!result.success) {
  console.error('Schema validation failed:', result.error.format());
}
expect(result.success).toBe(true);
```

## Configuration Errors

### "Cannot find module '...'"

**Cause:** Wrong import path in test file.

**Fix:** Spec files import from `fixtures/pom/test-options`, not `@playwright/test`:

```typescript
// WRONG
import { test, expect } from '@playwright/test';

// RIGHT
import { expect, test } from '../../../fixtures/pom/test-options';
```

### "browserType.launch: Executable doesn't exist"

**Cause:** Playwright browsers not installed.

```bash
npx playwright install
```

## See Also

- **`debugging`** skill -- Systematic debugging workflow and tool selection.
- **`flaky-tests`** skill -- Diagnosis flowchart for intermittent failures.
