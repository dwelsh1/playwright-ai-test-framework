---
name: flaky-tests
description: "Flaky test diagnosis, taxonomy, prevention checklist, and quarantine strategy Framework skill ID: flaky-tests. Canonical source: .cursor/skills/flaky-tests/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: flaky-tests
  source_path: .cursor/skills/flaky-tests/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/flaky-tests/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Flaky Tests

## Diagnosis Flowchart

Every flaky test falls into one of four categories. Follow this decision tree to identify which:

```
Test is flaky
|
+-- Does it fail locally with --repeat-each=20?
|   |
|   +-- YES --> TIMING / ASYNC issue
|   |           - Missing await
|   |           - Using waitForTimeout instead of web-first assertions
|   |           - Race condition between action and assertion
|   |           - Not waiting for API response before asserting
|   |
|   +-- NO --> Does it fail only in CI?
|       |
|       +-- YES --> ENVIRONMENT issue
|       |           - Different viewport/screen size
|       |           - Missing fonts causing layout shift
|       |           - Slower CI machines hitting timeouts
|       |           - External services unavailable
|       |
|       +-- NO --> Does it fail only when run with other tests?
|           |
|           +-- YES --> ISOLATION issue
|           |           - Shared mutable state (module-level variables)
|           |           - Database/API state from previous test
|           |           - localStorage/cookies leaking between tests
|           |           - Parallel tests colliding on unique constraints
|           |
|           +-- NO --> INFRASTRUCTURE issue
|                       - Browser process crash
|                       - Out of memory
|                       - File system or network instability
```

## Taxonomy

| Category           | Symptom                         | Root Cause                                        | Diagnosis                                      |
| ------------------ | ------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| **Timing / Async** | Fails intermittently everywhere | Race conditions, missing `await`, arbitrary waits | Fails locally with `--repeat-each=20`          |
| **Test Isolation** | Fails only with other tests     | Shared mutable state, data collisions             | Passes with `--grep "test name" --workers=1`   |
| **Environment**    | Fails only in CI                | Different OS, viewport, fonts, latency            | Compare CI traces with local traces            |
| **Infrastructure** | Random unrelated failures       | Browser crash, OOM, DNS issues                    | No pattern; errors reference browser internals |

## Detection Commands

```bash
# Burn-in test -- run 20 times to expose flakiness
npx playwright test tests/checkout.spec.ts --repeat-each=20

# Run single test in isolation
npx playwright test tests/checkout.spec.ts --grep "adds item" --workers=1

# Run with tracing on every attempt for comparison
npx playwright test --retries=3 --trace=on

# Run fully parallel to expose isolation issues
npx playwright test --fully-parallel --workers=4
```

## Fixes by Category

### Timing / Async

```typescript
// BAD -- arbitrary delay
await page.getByRole('button', { name: 'Refresh' }).click();
await page.waitForTimeout(3000);
await expect(page.getByTestId('data-table')).toBeVisible();

// GOOD -- auto-retrying assertion
await page.getByRole('button', { name: 'Refresh' }).click();
await expect(page.getByTestId('data-table')).toBeVisible();
```

```typescript
// BAD -- does not wait for API response
await page.getByRole('button', { name: 'Load More' }).click();
await expect(page.getByRole('listitem')).toHaveCount(20);

// GOOD -- waits for API response before asserting
const responsePromise = page.waitForResponse(
  (resp) => resp.url().includes('/api/users') && resp.status() === 200,
);
await page.getByRole('button', { name: 'Load More' }).click();
await responsePromise;
await expect(page.getByRole('listitem')).toHaveCount(20);
```

```typescript
// BAD -- clicks during animation
await page.getByRole('button', { name: 'Open' }).click();
await page.getByRole('button', { name: 'Confirm' }).click(); // may miss

// GOOD -- waits for stable state
await page.getByRole('button', { name: 'Open' }).click();
await expect(page.getByRole('dialog')).toBeVisible();
await page.getByRole('button', { name: 'Confirm' }).click();
```

### Test Isolation

```typescript
// BAD -- all parallel tests use the same email
await page.getByLabel('Email').fill('test@example.com');

// GOOD -- unique data per test (use Faker factories)
const { email } = generateUserCredentials();
await page.getByLabel('Email').fill(email);
```

```typescript
// BAD -- module-level mutable state shared across tests
let sharedData: string;

// GOOD -- fresh state per test via fixtures and beforeEach
test.beforeEach(async ({ loginPage }) => {
  const { email, password } = generateUserCredentials();
  await loginPage.goto();
  await loginPage.login(email, password);
});
```

### Environment

- Set explicit `viewport` in config (same locally and CI)
- Use `reducedMotion: 'reduce'` to disable CSS animations
- Increase timeouts for CI: `timeout: process.env.CI ? 60_000 : 30_000`
- Stub flaky external services with `page.route()`

## Quarantine Strategy

When a flaky test cannot be fixed immediately:

```typescript
// Option 1: test.fixme() -- skips with a reason (preferred)
test.fixme('checkout with promo code', async ({ page }) => {
  // TODO(TICKET-1234): Flaky due to race condition in promo API
});

// Option 2: test.fail() -- inverts expectation (alerts when bug is fixed)
test('known broken: export to PDF', async ({ page }) => {
  test.fail();
  // When this starts passing, test.fail() makes it fail -- reminding you to remove it
});
```

**Rules:**

- ALWAYS file a ticket when quarantining
- NEVER leave quarantined tests indefinitely -- review monthly
- Use `test.fixme()` over `test.skip()` to signal intent to implement

## Prevention Checklist

Apply these rules from the start to prevent flakiness:

| #   | Rule                          | How                                                                 |
| --- | ----------------------------- | ------------------------------------------------------------------- |
| 1   | Auto-retrying assertions only | `await expect(locator).toBeVisible()`, never `waitForTimeout()`     |
| 2   | Wait for API responses        | `page.waitForResponse()` before asserting on data                   |
| 3   | Unique data per test          | Faker factories via `test-data/factories/`, never hardcoded strings |
| 4   | No shared mutable state       | No module-level `let` variables. Use fixtures and `beforeEach`      |
| 5   | Disable CSS animations        | `reducedMotion: 'reduce'` in config                                 |
| 6   | Explicit viewport             | Same `viewport` setting locally and in CI                           |
| 7   | Use `baseURL`                 | Relative paths only: `page.goto('/login')`                          |
| 8   | Role-based locators           | `getByRole()` is resilient to implementation changes                |
| 9   | Traces on failure             | `trace: 'on-first-retry'` in CI                                     |
| 10  | `forbidOnly` in CI            | `forbidOnly: !!process.env.CI` catches leftover `.only()`           |
| 11  | Run fully parallel locally    | Expose isolation issues before they reach CI                        |
| 12  | Burn-in new tests             | `--repeat-each=10` locally before committing                        |

## Anti-Patterns

| Don't                                        | Problem                                          | Do Instead                                       |
| -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Increase timeout to 120s                     | Masks the real issue, slows CI                   | Diagnose the root cause                          |
| Use `waitForTimeout(N)`                      | Too slow on fast machines, too fast on slow ones | Use web-first assertions or `waitForResponse()`  |
| Ignore flaky tests                           | Erodes trust, real bugs slip through             | Diagnose immediately or quarantine with a ticket |
| Add `--retries=3` and call it fixed          | Retries hide flakiness, they don't fix it        | Use retries to _detect_, not to paper over       |
| Use `test.describe.serial()` to fix ordering | Hides isolation bugs, slows the suite            | Fix the isolation issue                          |
| Run `--repeat-each=100` in CI                | Multiplies CI time by 100x                       | Run burn-in locally or in a nightly job          |

## See Also

- **`debugging`** skill -- Tool selection and error quick reference for diagnosing failures.
- **`test-standards`** skill -- Test annotations for managing known issues (`test.fixme()`, `test.fail()`).
