---
name: advanced-assertions
description: "Advanced assertion patterns -- soft assertions, polling, expect.toPass(), custom matchers, and retry logic Framework skill ID: advanced-assertions. Canonical source: .cursor/skills/advanced-assertions/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: advanced-assertions
  source_path: .cursor/skills/advanced-assertions/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/advanced-assertions/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Advanced Assertions

Beyond basic `toBeVisible()` and `toHaveText()` -- patterns for complex assertion scenarios.

## Quick Reference

```typescript
// Soft assertions -- collect all failures, don't stop on first
await expect.soft(page.getByText('Name')).toBeVisible();
await expect.soft(page.getByText('Email')).toBeVisible();
await expect.soft(page.getByText('Phone')).toBeVisible();
// Test continues even if some fail -- all failures reported at end

// Polling assertion -- retry until condition met
await expect
  .poll(
    async () => {
      const response = await page.request.get('/api/status');
      return (await response.json()).status;
    },
    { timeout: 30_000 },
  )
  .toBe('complete');

// Retry block -- retry entire block until it passes
await expect(async () => {
  const response = await page.request.get('/api/job/123');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('done');
}).toPass({ timeout: 30_000 });
```

## Rules

### ALWAYS Use Web-First Assertions as Default

Standard web-first assertions (`toBeVisible()`, `toHaveText()`, `toHaveURL()`) auto-retry and cover 90% of cases. Use advanced patterns only when standard assertions can't express the check.

### Use `expect.soft()` for Non-Critical Multi-Checks

Soft assertions don't stop the test on failure. Use them when you want to check multiple independent things and report all failures:

```typescript
test('profile page shows all user details', { tag: '@regression' }, async ({ page }) => {
  await page.goto('/profile');

  // All checks run even if some fail
  await expect.soft(page.getByLabel('Name')).toHaveValue('John Doe');
  await expect.soft(page.getByLabel('Email')).toHaveValue('john@example.com');
  await expect.soft(page.getByLabel('Phone')).toHaveValue('+1234567890');
  await expect.soft(page.getByLabel('City')).toHaveValue('New York');
});
```

**When to use:** Visual validation pages, profile pages, dashboards where multiple fields should be checked independently.

**When NOT to use:** Sequential flows where a failure in step 1 makes step 2 meaningless.

### Use `expect.poll()` for Non-UI Conditions

`expect.poll()` retries a function until the assertion passes. Use it for API polling or computed values:

```typescript
// Wait for async job to complete
await expect
  .poll(
    async () => {
      const response = await page.request.get('/api/jobs/abc123');
      const body = await response.json();
      return body.status;
    },
    {
      message: 'Job did not complete in time',
      timeout: 60_000,
      intervals: [1_000, 2_000, 5_000], // backoff: 1s, 2s, then 5s
    },
  )
  .toBe('completed');
```

### Use `expect().toPass()` for Multi-Step Retry

When you need to retry an entire block of assertions (not just one value):

```typescript
// Retry entire block until all assertions pass
await expect(async () => {
  const response = await page.request.get('/api/report');
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.rows.length).toBeGreaterThan(0);
  expect(data.status).toBe('ready');
}).toPass({
  timeout: 30_000,
  intervals: [1_000, 2_000, 5_000],
});
```

### NEVER Mix Soft and Hard Assertions Carelessly

If a soft assertion fails, the test continues but still reports failure at the end. Don't use soft assertions for preconditions:

```typescript
// BAD -- precondition should be hard, stops if page isn't loaded
await expect.soft(page.getByRole('heading')).toBeVisible(); // page not loaded, but continues
await page.getByRole('button', { name: 'Save' }).click(); // crashes

// GOOD -- hard assertion for precondition, soft for independent checks
await expect(page.getByRole('heading')).toBeVisible(); // stops if page not loaded
await expect.soft(page.getByLabel('Name')).toHaveValue('John');
await expect.soft(page.getByLabel('Email')).toHaveValue('john@test.com');
```

## Custom Matchers

Extend `expect` with domain-specific matchers:

```typescript
// playwright.config.ts or a setup file
import { expect } from '@playwright/test';

expect.extend({
  async toHaveValidationError(locator, expectedMessage: string) {
    const errorElement = locator.locator('~ .error-message, + .error-message');
    let pass = false;
    let actualText = '';

    try {
      await expect(errorElement).toBeVisible({ timeout: 5_000 });
      actualText = (await errorElement.textContent()) || '';
      pass = actualText.includes(expectedMessage);
    } catch {
      pass = false;
    }

    return {
      pass,
      message: () =>
        pass
          ? `Expected field NOT to have validation error "${expectedMessage}"`
          : `Expected validation error "${expectedMessage}" but got "${actualText}"`,
    };
  },
});

// Usage
await expect(page.getByLabel('Email')).toHaveValidationError('Invalid email format');
```

## Assertion Timeout Strategies

```typescript
// Per-assertion timeout (preferred)
await expect(page.getByText('Processing complete')).toBeVisible({ timeout: 15_000 });

// Per-poll timeout with intervals
await expect
  .poll(fetchStatus, {
    timeout: 60_000,
    intervals: [1_000, 2_000, 5_000, 10_000],
  })
  .toBe('done');

// NEVER increase global timeout to fix one slow assertion
// BAD: playwright.config.ts → expect: { timeout: 60_000 }
```

## Anti-Patterns

| Don't                                     | Problem                            | Do Instead                                         |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| Use `expect.soft()` for preconditions     | Test continues in broken state     | Hard assertion for setup, soft for validation      |
| Poll without timeout                      | Hangs indefinitely                 | Always set explicit `timeout`                      |
| Use `expect().toPass()` for simple waits  | Overcomplicated                    | Use `toBeVisible()` or `toHaveText()` with timeout |
| Increase global `expect.timeout`          | Hides slow tests                   | Set timeout per-assertion                          |
| Create custom matchers for one-off checks | Over-engineering                   | Only extract when used 3+ times                    |
| Use `expect.poll()` for UI elements       | Web-first assertions already retry | Use `toBeVisible()`, `toHaveText()`                |

## See Also

- **`test-standards`** skill -- Standard assertion patterns and web-first rules.
- **`flaky-tests`** skill -- Using polling assertions to fix timing flakiness.
- **`api-testing`** skill -- Schema-based API response assertions.
