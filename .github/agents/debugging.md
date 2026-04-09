---
name: debugging
description: "Debugging workflow, tool selection, error index, and anti-patterns for diagnosing test failures Framework skill ID: debugging. Canonical source: .cursor/skills/debugging/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: debugging
  source_path: .cursor/skills/debugging/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/debugging/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Debugging Test Failures

## Systematic Workflow

Follow this order. Do NOT skip to step 5 -- most issues resolve by step 2.

```
1. Read the FULL error message
   └─ Check the Error Quick Reference below for known patterns
   └─ Read the call log -- it shows what Playwright tried before timeout
2. Run with --ui to see what happened visually
   └─ Timeline shows every action, screenshot at failure point
3. Enable tracing if not already on
   └─ use: { trace: 'on' } temporarily in playwright.config.ts
4. Check the network tab in trace for API failures
   └─ Missing responses, 4xx/5xx, CORS errors
5. Insert page.pause() at the failure point
   └─ Inspect live DOM, try selectors in console
6. Check browser console for JavaScript errors
   └─ page.on('console') or console tab in trace
```

## Tool Selection

Pick the right tool based on the failure type:

| Failure Type                       | First Tool                           | Why                                                              |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Element not found (wrong selector) | UI Mode (`--ui`)                     | See the DOM at failure, try selectors in Pick Locator            |
| Element not found (timing)         | Trace Viewer -- Actions tab          | Compare before/after screenshots to see if element appeared late |
| Wrong text / value                 | Trace Viewer -- Actions tab          | Inspect actual DOM content at each step                          |
| Test hangs / times out             | `DEBUG=pw:api npx playwright test`   | See which API call is waiting and never resolving                |
| Network / API failure              | Trace Viewer -- Network tab          | See request/response status codes, payloads, timing              |
| Auth / session issues              | Network tab or `page.on('response')` | Check for 401/403, missing cookies/tokens                        |
| Visual rendering wrong             | `--headed --slow-mo=500`             | Watch the actual rendering in the browser                        |
| JavaScript error in app            | `page.on('console')`                 | Catch uncaught exceptions and error logs                         |
| CI-only failure                    | Trace Viewer (from CI artifact)      | Reproduce exact CI state without running locally                 |
| Flaky / intermittent               | `trace: 'on'` + retries              | Compare passing and failing traces side by side                  |
| State pollution                    | `test.only()` on the failing test    | If it passes alone, another test is leaking state                |

## Debugging Commands

```bash
# UI Mode -- interactive visual debugging (local only)
npx playwright test tests/checkout.spec.ts --ui

# Headed mode with slow motion -- watch the browser
npx playwright test tests/checkout.spec.ts --headed --slow-mo=500

# Playwright Inspector -- step through actions one at a time
# Bash:
PWDEBUG=1 npx playwright test tests/login.spec.ts
# PowerShell:
$env:PWDEBUG=1; npx playwright test tests/login.spec.ts

# Verbose API logs -- see every Playwright API call with timing
# Bash:
DEBUG=pw:api npx playwright test tests/slow-test.spec.ts
# PowerShell:
$env:DEBUG="pw:api"; npx playwright test tests/slow-test.spec.ts

# View a trace file from CI
npx playwright show-trace test-results/trace.zip
```

## Trace Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // 'on-first-retry' -- captures trace on first retry (recommended for CI)
    // 'on' -- captures every run (use temporarily for stubborn failures)
    // 'retain-on-failure' -- captures every run, keeps only failures
    trace: 'on-first-retry',
  },
});
```

### Reading a Trace -- What to Check in Order

1. **Actions tab** -- every Playwright action with before/after screenshots
2. **Console tab** -- browser console output (errors, warnings, logs)
3. **Network tab** -- every HTTP request with status, timing, bodies
4. **Source tab** -- test source code highlighting the failing line
5. **Call tab** -- exact arguments and return values of each Playwright call

## Manual Artifact Capture

Use these APIs when you need to capture a specific state or flow that config-driven artifacts would miss — for example, capturing the exact moment a layout breaks or tracing a single scenario within a longer test.

### Screenshots

```typescript
// Capture the full page at a specific point
await page.screenshot({ path: 'artifacts/after-login.png', fullPage: true });

// Capture just one component
await page.locator('[data-testid="chart"]').screenshot({ path: 'artifacts/chart.png' });

// Capture current viewport only (default)
await page.screenshot({ path: 'artifacts/viewport.png' });
```

**When to use:** when you need a snapshot at a step that doesn't correspond to an assertion failure — e.g. immediately after a complex animation, before a modal closes, or to compare two states side by side.

**Remove before committing** unless the screenshot is part of a visual regression test (see `visual-regression` skill).

### Playwright Trace (recommended)

`context.tracing` produces a `.zip` viewable with `npx playwright show-trace` — the same format as config-driven traces.

```typescript
test('diagnose flaky flow', async ({ page, context }) => {
  await context.tracing.start({ screenshots: true, snapshots: true });

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay' }).click();
  // ... steps to capture ...

  await context.tracing.stop({ path: 'artifacts/checkout-trace.zip' });
});
```

```bash
# View the captured trace
npx playwright show-trace artifacts/checkout-trace.zip
```

**When to use:** when `trace: 'on-first-retry'` doesn't capture the scenario you need — for example, tracing a `beforeEach` flow or a setup step that runs before the test body.

**Remove before committing.** Manual tracing adds overhead and is not needed once the issue is resolved.

### Chrome Performance Trace (CDP)

`browser.startTracing()` captures a Chrome DevTools performance profile — useful for diagnosing JavaScript execution, layout thrash, or rendering bottlenecks. This is different from the Playwright trace: it produces a JSON file you open in the Chrome DevTools **Performance** tab, not `show-trace`.

```typescript
test('profile slow render', async ({ page, browser }) => {
  await browser.startTracing(page, {
    path: 'artifacts/perf-trace.json',
    screenshots: true,
    snapshots: true,
  });

  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load Data' }).click();
  await expect(page.getByTestId('data-table')).toBeVisible();

  await browser.stopTracing();
  // Open artifacts/perf-trace.json in Chrome DevTools > Performance tab
});
```

**When to use:** diagnosing slow rendering or JavaScript performance — not for selector or assertion debugging (use Playwright trace for that).

**Remove before committing.**

## `page.pause()` -- Inline Breakpoints

Insert `page.pause()` to pause execution and inspect live DOM:

```typescript
await page.goto('/checkout');
await page.getByLabel('Email').fill('user@example.com');
await page.pause(); // Inspector opens -- try selectors, inspect state
await page.getByRole('button', { name: 'Continue' }).click();
```

**NEVER commit `page.pause()`.** It hangs indefinitely in CI. Remove before committing.

## Error Quick Reference

Common Playwright errors and their fixes:

| Error Message                       | Cause                               | Fix                                                                                   |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `Target closed`                     | Page navigated away during action   | Wait for navigation: `await page.waitForURL('/next')` before next action              |
| `waiting for locator to be visible` | Element not in DOM or hidden        | Verify selector with Inspector. Ensure precondition (API response, auth state) is met |
| `strict mode violation`             | Locator matched multiple elements   | Narrow the locator: add `{ exact: true }`, scope to parent, or use `.filter()`        |
| `Element is not an <input>`         | `fill()` on non-input element       | Use `getByLabel()` or `getByRole('textbox')` instead of `getByText()`                 |
| `Timeout 30000ms exceeded`          | Action or assertion took too long   | Check if element exists. Wait for API response. Don't increase timeout blindly        |
| `net::ERR_CONNECTION_REFUSED`       | App server not running              | Start the app first or configure `webServer` in `playwright.config.ts`                |
| `frame was detached`                | iFrame removed during action        | Wait for frame to be stable before interacting                                        |
| `Node is not an Element`            | Stale ElementHandle after re-render | Use Locator API (re-queries on every action), never `page.$()`                        |
| `Cannot find module`                | Wrong import path                   | Check relative path. Spec files import from `fixtures/pom/test-options`               |

## Anti-Patterns

### DON'T add `waitForTimeout` to fix timing issues

```typescript
// WRONG -- arbitrary delay, masks the real problem
await submitButton.click();
await page.waitForTimeout(3000);
await expect(page.getByText('Success')).toBeVisible();

// RIGHT -- wait for the actual condition
await submitButton.click();
await expect(page.getByText('Success')).toBeVisible();
```

If the default timeout is insufficient, diagnose _why_ the operation is slow, then either:

- Fix the application performance
- Increase the specific assertion timeout: `await expect(locator).toBeVisible({ timeout: 15_000 })`
- Wait for a prerequisite: `await page.waitForResponse('**/api/submit')`

### DON'T sprinkle `console.log` everywhere

```typescript
// WRONG
console.log('page loaded');
console.log('button found:', await el.isVisible());
console.log('button text:', await el.textContent());

// RIGHT -- use page.pause() at the point of interest
await page.pause();
```

### DON'T leave `page.pause()` or `test.only()` in committed code

Both will cause CI failures. `page.pause()` hangs forever. `test.only()` skips all other tests (and `forbidOnly: !!process.env.CI` catches this).

### DON'T debug CI failures without traces

```typescript
// WRONG -- no traces in CI
use: { trace: 'off' }

// RIGHT -- always capture traces on failure
retries: process.env.CI ? 2 : 0,
use: { trace: 'on-first-retry' }
```

## VS Code Integration

Install **Playwright Test for VS Code** (`ms-playwright.playwright`):

- **Run/debug individual tests** -- click the green play button next to `test()`
- **Set breakpoints** -- click the gutter; tests pause at breakpoints automatically
- **Pick locator** -- hover elements to get the best selector
- **Show browser** -- check "Show Browser" in the testing sidebar
- **Watch mode** -- re-run tests on file save

## Troubleshooting

| Symptom                                  | Likely Cause                          | Fix                                           |
| ---------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Inspector does not open with `PWDEBUG=1` | Running headless or workers > 1       | Add `--headed --workers=1`                    |
| Trace is empty or missing                | `trace: 'off'` or test did not retry  | Set `trace: 'on'` temporarily                 |
| `page.pause()` does nothing              | Running headless                      | Add `--headed` or set `PWDEBUG=1`             |
| Screenshots are blank                    | Viewport not set or wrong project     | Set `viewport` in config                      |
| Network events not firing                | Listener attached after `page.goto()` | Attach `page.on('request')` before navigation |

## See Also

- **`flaky-tests`** skill -- Diagnosis flowchart and prevention checklist for intermittent failures.
- **`test-standards`** skill -- Test annotations (`test.skip()`, `test.fail()`, `test.fixme()`) for managing known issues.
