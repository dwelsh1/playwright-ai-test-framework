# Flaky Test Management

**Audience:** Jr QA Engineers — how to identify, tag, investigate, fix, and retire flaky tests.

A flaky test is one that passes sometimes and fails sometimes without any code change. It is one of the most damaging things in a test suite — it erodes trust in the results, trains engineers to ignore failures, and makes it hard to know when a real regression has occurred. This guide explains how to handle flaky tests systematically.

---

## Table of Contents

1. [What makes a test flaky?](#1-what-makes-a-test-flaky)
2. [How the framework detects flakiness](#2-how-the-framework-detects-flakiness)
3. [Tagging a flaky test with `@flaky`](#3-tagging-a-flaky-test-with-flaky)
4. [The quarantine CI job](#4-the-quarantine-ci-job)
5. [Investigating the root cause](#5-investigating-the-root-cause)
6. [Common flakiness causes and fixes](#6-common-flakiness-causes-and-fixes)
7. [Fixing vs tolerating](#7-fixing-vs-tolerating)
8. [Removing the `@flaky` tag once fixed](#8-removing-the-flaky-tag-once-fixed)
9. [Common mistakes](#9-common-mistakes)

---

## 1. What makes a test flaky?

A test is flaky when its result depends on something it does not control. The most common causes:

**Timing issues** — the test acts before the page or API is ready:

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Fragile — clicks before the button is fully interactive
await menuPage.addToCartButton.click();

// Resilient — Playwright auto-waits for visibility and stability
await expect(menuPage.getAddToCartButton(CoffeeNames.ESPRESSO)).toBeVisible();
await menuPage.addToCart(CoffeeNames.ESPRESSO);
```

**Shared state** — one test leaves data that breaks the next:

```typescript
// Test A adds a coffee to cart, then fails mid-test
// Test B expects an empty cart but finds leftover cart state
```

**Race conditions** — two tests modify the same resource at the same time (common with stateful API endpoints when tests run in parallel).

**Environment instability** — CI machines are slower than local; a test that passes locally in 2 seconds times out in CI in 5 seconds.

**Animation timing** — a button is technically visible but still animating in; click events are swallowed.

---

## 2. How the framework detects flakiness

After every CI run, the Smart Reporter tracks test history. A test marked **flaky** in a run means it **failed on attempt 1 but passed on a later retry**.

You can also check `test-results/flaky-tests.json` after any run with retries enabled — the `detect-flaky.js` script writes this file automatically:

```json
[
  {
    "title": "should add item to cart and checkout",
    "file": "tests/coffee-cart/e2e/full-purchase.spec.ts",
    "flaky": true
  }
]
```

In the Smart Reporter, flaky tests show a **yellow indicator** and have a stability score below the threshold. Open the test's history section to see how many recent runs were clean passes vs retry-passes.

---

## 3. Tagging a flaky test with `@flaky`

When you identify a test as flaky, tag it immediately. This moves it to the quarantine pipeline so it stops blocking the main build while you investigate.

`@flaky` is a **secondary tag** — it goes alongside the primary tag, not instead of it:

```typescript
// Primary tag stays. @flaky is added alongside.
test(
  'should complete checkout',
  { tag: ['@smoke', '@flaky'] }, // ← both tags
  async ({ menuPage, cartPage, paymentDetails }) => {
    // ...
  },
);
```

Do not change or remove the primary tag (`@smoke`, `@regression`, etc.) — it tells you what the test covers. `@flaky` just says it is currently unreliable.

Tag the test in a PR with a comment explaining what you observed:

```typescript
// FLAKY: intermittently fails in CI with "waiting for locator to be visible" on the
// snackbar. Passes locally every time. Suspected timing issue on slower CI machines.
// Tracked: #456
test(
  'should show confirmation after checkout',
  { tag: ['@smoke', '@flaky'] },
  async (
    {
      /* ... */
    },
  ) => {
    /* ... */
  },
);
```

---

## 4. The quarantine CI job

The `@flaky` tag activates a dedicated quarantine job in CI. This job:

- Runs on push and nightly (same as the main suite)
- Uses `--retries=3` — the test gets four total attempts before being called a failure
- Runs with `continue-on-error: true` — failures in this job **do not block the build**
- Uploads a `quarantine-report` artifact so you can see which quarantined tests are still failing

This means:

- The main build stays green even when a quarantined test fails
- You can still see whether the flaky test passed eventually (in the quarantine report)
- Fixing the test and removing `@flaky` promotes it back into the blocking main suite

---

## 5. Investigating the root cause

Once the test is quarantined, investigate methodically:

**Step 1 — Reproduce it locally**

Run the test 10 times in a loop:

```bash
for i in {1..10}; do npx playwright test tests/coffee-cart/e2e/full-purchase.spec.ts --project=chromium; done
```

If it fails in the loop, you can debug it locally. If it only fails in CI, proceed to Step 2.

**Step 2 — Download the CI trace**

From the GitHub Actions run where it failed, download the `quarantine-report` artifact. Open the trace:

```bash
npx playwright show-trace path/to/trace.zip
```

In the trace viewer:

- **Actions tab** — find the action that failed; look at the before/after screenshot
- **Network tab** — check for slow or failed API responses at the moment of failure
- **Console tab** — check for JavaScript errors from the app

**Step 3 — Check timing**

If the failure is always on the same step (e.g. "waiting for snackbar to be visible"), timing is the most likely cause. Look at the step duration in the report. If it is consistently near the timeout limit (e.g. 4.8s for a 5s expect timeout), the app is taking too long to respond on CI.

**Step 4 — Check for shared state**

Run the test in isolation:

```bash
npx playwright test tests/coffee-cart/e2e/full-purchase.spec.ts --project=chromium
```

Then run the full suite and see if the test only fails when run alongside others. If so, another test is leaving dirty state.

---

## 6. Common flakiness causes and fixes

### Timing — element not yet interactive

```typescript
// Problem: clicking before the button is interactive
await page.getByRole('button', { name: /checkout/i }).click();

// Fix: assert it is visible first (Playwright auto-waits but some edge cases slip through)
await expect(page.getByRole('button', { name: /checkout/i })).toBeEnabled();
await page.getByRole('button', { name: /checkout/i }).click();
```

### Animation — element visible but still animating

```typescript
// Problem: element is visible but mid-animation; click lands on wrong coordinates
await modal.click();

// Fix: wait for animation to complete (CSS transition ends)
await expect(modal).not.toHaveCSS('opacity', '0');
await modal.click();
```

### Missing `await` — fire-and-forget action

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Problem: forgot await — next action runs before this one completes
menuPage.addToCart(CoffeeNames.ESPRESSO); // missing await
await header.goToCart();

// Fix:
await menuPage.addToCart(CoffeeNames.ESPRESSO);
await header.goToCart();
```

### Shared API state — no cleanup

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Problem: test adds to cart but never cleans up on failure
await api.post(CART_URL, { data: { name: CoffeeNames.ESPRESSO } });
// If the test fails here, the cart is dirty for the next test

// Fix: use afterEach to clean up unconditionally
test.afterEach(async ({ api }) => {
  await api.delete(CART_URL);
});
```

### Parallel writes to shared state

```typescript
// Problem: two tests both POST to /api/cart simultaneously
// Fix: add serial mode to the describe block
test.describe('Cart tests', () => {
  test.describe.configure({ mode: 'serial' });
  // ...
});
```

### Hard-coded timeouts (wrong fix)

```typescript
// WRONG — hides the timing problem, makes the test slow and still flaky
await page.waitForTimeout(2000);

// RIGHT — use a web-first assertion that waits for the actual condition
await expect(snackbar.message).toBeVisible();
```

---

## 7. Fixing vs tolerating

Not every flaky test has an obvious fix. Here is how to decide what to do:

| Situation                                                 | Action                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Root cause found — app has a real race condition          | Fix the app code; remove `@flaky` after fix is deployed                    |
| Root cause found — test timing issue                      | Fix the test (add proper assertion, await, cleanup); remove `@flaky`       |
| Root cause is CI environment slowness only                | Consider raising `actionTimeout` for specific steps; document the decision |
| Root cause unknown after investigation                    | Keep `@flaky`, re-examine after the next framework or app update           |
| Test has been quarantined for 2+ sprints with no progress | Escalate for a dedicated investigation; do not leave `@flaky` indefinitely |

`@flaky` is a temporary state. A test should not stay tagged `@flaky` forever — either fix it or remove it (with a documented reason if the feature it tests is no longer critical).

---

## 8. Removing the `@flaky` tag once fixed

After fixing the root cause:

1. Remove `@flaky` from the `tag` array
2. Run the test 10+ times locally to confirm it is stable:
   ```bash
   for i in {1..10}; do npx playwright test path/to/spec.ts --project=chromium; done
   ```
3. Push to a branch and watch the CI run — confirm it passes in the main suite, not just quarantine
4. If the test has only a single primary tag remaining, simplify the syntax:

   ```typescript
   // Before
   {
     tag: ['@smoke', '@flaky'];
   }

   // After
   {
     tag: '@smoke';
   }
   ```

---

## 9. Common mistakes

| Mistake                                                        | What to do instead                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Adding `waitForTimeout` to "fix" a flaky test                  | This hides the cause; use a web-first assertion instead                   |
| Skipping the test entirely with `test.skip`                    | Use `@flaky` — the test keeps running in quarantine so you can monitor it |
| Leaving `@flaky` for months without investigation              | Set a deadline; escalate if no fix after two sprints                      |
| Removing `@flaky` without confirming stability                 | Run the test 10+ times and through a full CI run before removing the tag  |
| Adding `@flaky` without a comment explaining what was observed | Always add a comment — it helps the next person investigating             |

---

## See also

- [Debugging Failing Tests](debugging-failing-tests.md) — trace viewer and systematic diagnosis workflow
- [Smart Reporter Usage Guide](playwright-smart-reporter.md) — reading stability scores and flakiness history
- [Developer Guide](../developer.md) — flaky test workflow and quarantine CI job details
