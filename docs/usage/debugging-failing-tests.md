# Debugging Failing Tests

**Audience:** Jr QA Engineers — what to do when a test fails.

A test failure always has a reason. This guide gives you a systematic way to find it, using the right tool for each type of failure. Follow the steps in order — most failures resolve by step 2 or 3.

---

## Table of Contents

1. [Start here — read the error message](#1-start-here--read-the-error-message)
2. [Step 2 — Run in headed mode](#2-step-2--run-in-headed-mode)
3. [Step 3 — Open the trace viewer](#3-step-3--open-the-trace-viewer)
4. [Step 4 — Use debug mode (Playwright Inspector)](#4-step-4--use-debug-mode-playwright-inspector)
5. [Step 5 — Use UI mode for selector problems](#5-step-5--use-ui-mode-for-selector-problems)
6. [Common error messages decoded](#6-common-error-messages-decoded)
7. [CI failures — reading traces from artifacts](#7-ci-failures--reading-traces-from-artifacts)
8. [Things that look like fixes but aren't](#8-things-that-look-like-fixes-but-arent)
9. [Before you ask for help](#9-before-you-ask-for-help)

---

## 1. Start here — read the error message

When a test fails, Playwright prints an error to the terminal. Before doing anything else, read it fully.

A typical failure looks like this:

```
✘  should display coffee items (5.0s)

  Error: locator.click: Error: strict mode violation:
  getByRole('button', { name: 'Add to cart' }) resolved to 9 elements

     at MenuPage.addToCart (pages/coffee-cart/menu.page.ts:61:42)
     at tests/coffee-cart/functional/menu.spec.ts:28:7
```

Three things to read from every error:

1. **The error type** — `strict mode violation`, `waiting for locator`, `Timeout exceeded`, etc. Each has a known cause (see [Section 6](#6-common-error-messages-decoded))
2. **The file and line number** — `menu.spec.ts:28` tells you exactly where the test failed
3. **The call stack** — working bottom-up shows you the chain: test → page object → locator call

> **If the error message mentions "call log"**, scroll down past the first error line. The call log shows every action Playwright tried before giving up — it often shows the selector it was looking for and how many times it retried.

---

## 2. Step 2 — Run in headed mode

Headed mode opens a real browser window so you can watch what happens. This catches the majority of failures because you can see exactly where the browser gets stuck or goes wrong.

```bash
npx playwright test tests/coffee-cart/functional/menu.spec.ts --project=chromium --headed
```

Add `--slow-mo=500` to slow each action down by 500ms so you can follow along:

```bash
npx playwright test tests/coffee-cart/functional/menu.spec.ts --project=chromium --headed --slow-mo=500
```

**What to look for:**

- Does the page load at all?
- Does the element the test is looking for appear on screen?
- Does anything happen at the moment of failure, or does the test just time out waiting?
- Is the browser on the wrong page when the failure occurs?

---

## 3. Step 3 — Open the trace viewer

Playwright records a **trace** on the first retry of any failing test (configured in `playwright.config.ts`). A trace is a recording of everything that happened — every action, every screenshot, every network request.

### Finding the trace

After a test run, traces are saved to `test-results/`. Open Smart Reporter to navigate to them:

```bash
npm run report:smart
```

Click the failing test in the left sidebar → click **Trace** in the detail card → the trace viewer opens in the browser.

Or open a trace file directly:

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### Reading the trace — in order

The trace viewer has five tabs. Check them in this order:

| Tab         | What to look for                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| **Actions** | Click each action to see the before/after screenshot. Find the step where things went wrong.                         |
| **Console** | JavaScript errors from the app (red entries). These often explain why a button didn't respond or a page didn't load. |
| **Network** | Failed requests (red rows — 4xx/5xx). A 401 means auth failed. A 500 means the server errored.                       |
| **Source**  | The test source code with the failing line highlighted.                                                              |
| **Call**    | The exact arguments Playwright used — useful when a locator looks right but is slightly off.                         |

> **Tip:** The Actions tab screenshot shows the state of the page **at the moment of failure** — not after the error. This is usually exactly what you need to see.

---

## 4. Step 4 — Use debug mode (Playwright Inspector)

Debug mode pauses the test at each step and opens the Playwright Inspector — a panel where you can step through actions one at a time and try selectors live against the real page.

**On Windows (PowerShell):**

```powershell
$env:PWDEBUG=1; npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium
```

**On Mac/Linux:**

```bash
PWDEBUG=1 npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium
```

The Inspector opens alongside the browser. Use the **▶ Step** button to advance one action at a time. When you reach the failing action, the page is still live — you can:

- Type a selector in the "Pick locator" field and press Enter to test it
- Click "Pick locator" then hover elements in the browser to get the best selector suggestion
- Inspect the DOM in browser DevTools while the test is paused

> **You can also add `await page.pause()` inside a test** to pause at a specific point without running from the beginning. Remove it before committing — it hangs forever in CI.

---

## 5. Step 5 — Use UI mode for selector problems

UI mode is a full interactive test runner. It's most useful when you're not sure which selector is wrong and want to explore the DOM visually.

```bash
npx playwright test --ui
```

In UI mode:

- Select the failing test from the left sidebar
- Click **▶ Run** to run it
- Click any step in the timeline to see the DOM snapshot at that point
- Use **Pick locator** (the crosshair icon) to hover any element and get a suggested locator

---

## 6. Common error messages decoded

| Error                                               | What it means                                      | What to do                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `strict mode violation: ... resolved to N elements` | Your locator matched more than one element         | Narrow it: add `{ exact: true }`, scope to a parent container, or use `.filter()`                                            |
| `waiting for locator ... to be visible`             | The element doesn't exist or is hidden             | Check the selector. Confirm the page state matches what the test expects (is the user logged in? is the modal open?).        |
| `Timeout 30000ms exceeded`                          | An action or assertion took longer than 30 seconds | The element never appeared. Check if the app is running. Look at the network tab in the trace for failed API calls.          |
| `net::ERR_CONNECTION_REFUSED`                       | The app server isn't running                       | Start Coffee Cart: `cd d:/gitrepos/coffee-cart && npm run dev`                                                               |
| `Cannot find module`                                | Wrong import path in the test file                 | The import should be from `../../../fixtures/pom/test-options` — check the number of `../` levels matches the file location. |
| `Element is not an <input>`                         | `fill()` was called on a non-input element         | You're using `getByText()` or `getByRole('heading')` instead of `getByLabel()` or `getByRole('textbox')`.                    |
| `Expected: true / Received: false`                  | A boolean assertion failed                         | The condition wasn't met — read the step description to understand what should have been true.                               |
| `Expected: "X" / Received: "Y"`                     | Text or value didn't match                         | The page showed something different from what the test expected. Check if test data or app state is wrong.                   |
| `forbidOnly`                                        | `test.only()` was left in the code                 | Remove `test.only()` before pushing — it's forbidden in CI.                                                                  |

---

## 7. CI failures — reading traces from artifacts

When a test passes locally but fails in CI, the trace from CI is your best tool.

**GitHub Actions:**

1. Go to the failed workflow run on GitHub
2. Click **Artifacts** at the bottom of the page
3. Download `smoke-traces` or `regression-report`
4. Extract the zip, then open the trace:

```bash
npx playwright show-trace path/to/trace.zip
```

**Common reasons a test passes locally but fails in CI:**

- The app isn't running in CI (check the "Wait for SUT" step in the pipeline log)
- A different browser version renders things slightly differently (especially for visual tests)
- A timing issue that only appears under the slower CI machine — look at the Network tab for slow API responses
- Auth state wasn't created — check if the setup project ran before the test project

---

## 8. Things that look like fixes but aren't

### Adding `waitForTimeout`

```typescript
// WRONG — hides the real problem, makes the test slow and fragile
await page.waitForTimeout(3000);
await expect(page.getByText('Order confirmed')).toBeVisible();

// RIGHT — Playwright already waits. If this times out, diagnose why the text never appears.
await expect(page.getByText('Order confirmed')).toBeVisible();
```

`waitForTimeout` is a hard sleep. It doesn't fix the cause — it just delays the failure long enough that it passes some of the time, making the test flaky.

### Increasing the timeout without understanding why

```typescript
// WRONG — 60 seconds doesn't fix a missing element
await expect(locator).toBeVisible({ timeout: 60_000 });

// RIGHT — find out why the element never appears:
// - Is the API call failing? Check the Network tab.
// - Is the selector wrong? Check with the Inspector.
// - Is the page on the wrong URL? Add a URL assertion in the preceding step.
```

### Commenting out the failing assertion

```typescript
// WRONG — test passes but no longer verifies anything
// await expect(snackbar.message).toBeVisible();
```

If an assertion is wrong, fix it. If it's a known bug in the app, use `test.skip()` with a `// FIXME` comment instead:

```typescript
test.skip(true, '// FIXME: snackbar missing after checkout — app bug #123');
```

---

## 9. Before you ask for help

Run through this checklist first — it answers the most common follow-up questions:

- [ ] Is the Coffee Cart app running? (`curl http://localhost:3002/api/coffees`)
- [ ] Does the test fail consistently or only sometimes? (sometimes = flaky, see the flaky tests section in `docs/developer.md`)
- [ ] What exact error message does it print?
- [ ] Did you run in `--headed` mode and watch what happens?
- [ ] Did you open the trace viewer and check the Actions and Network tabs?
- [ ] Does the test pass when run in isolation? (`npx playwright test <file> --project=chromium`)
- [ ] Did you recently change the test file, a page object, or a fixture?

Bringing these answers to a code review or Slack conversation will get you to a solution much faster.

---

## See also

- [playwright-cli Exploration Guide](playwright-cli-exploration.md) — discover correct selectors before writing tests
- [Developer Guide](../developer.md) — test tags, selectors, and framework patterns
- [Framework Onboarding](../framework-onboarding.md) — Section 6 for reading Smart Reporter output
