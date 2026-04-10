# Framework Cheatsheet

---

## Commands

### Run Tests

| Command                                  | What it does                                    |
| ---------------------------------------- | ----------------------------------------------- |
| `npm test`                               | Chromium, 4 workers, Smart Reporter opens after |
| `npm run test:smoke`                     | `@smoke` tagged tests only                      |
| `npm run test:env:staging`               | All tests against staging                       |
| `npm run test:env:staging:smoke`         | Smoke against staging                           |
| `npm run test:env:production`            | Smoke against production                        |
| `npx playwright test [file]`             | Single spec file                                |
| `npx playwright test --grep @tag`        | Tests matching a tag                            |
| `npx playwright test --headed`           | See the browser                                 |
| `npx playwright test --debug`            | Playwright Inspector                            |
| `npx playwright test --ui`               | Interactive UI mode                             |
| `npx playwright test --update-snapshots` | Refresh visual baselines                        |

### Reports

| Command                      | What it does                                         |
| ---------------------------- | ---------------------------------------------------- |
| `npm run report:smart`       | Open Smart Reporter (AI analysis, trends)            |
| `npm run report:smart:serve` | Serve Smart Reporter (enables trace viewer)          |
| `npm run report:html`        | Open Playwright HTML report                          |
| `npm run report:axe`         | Merge axe results to `test-results/axe-results.json` |

### Interactive Selection

| Command                 | What it does                             |
| ----------------------- | ---------------------------------------- |
| `npm run select`        | Pick by spec / title / tag interactively |
| `npm run select:failed` | Re-run last failed tests                 |
| `npm run select:ui`     | Pick tests, then open in Playwright UI   |
| `npm run select:headed` | Pick tests, then run in headed mode      |

### Utilities

| Command                        | What it does                              |
| ------------------------------ | ----------------------------------------- |
| `npm run generate:test`        | Scaffold a new spec stub from template    |
| `npm run onboard`              | Interactive onboarding walkthrough        |
| `npm run check:env`            | Verify env file and app port reachability |
| `npm run reset:auth`           | Delete stale auth storage state           |
| `npm run clean`                | Remove test results, reports, auth state  |
| `npm run detect:flaky`         | Detect flaky tests from last run          |
| `npm run report:summary`       | Print pass/fail/skip count to terminal    |
| `npm run build:smart-reporter` | Build Smart Reporter (once after clone)   |
| `npm run lint:fix`             | ESLint auto-fix                           |
| `npm run format`               | Prettier format                           |

---

## Test Tags

| Tag            | When                | Coverage                                                                  |
| -------------- | ------------------- | ------------------------------------------------------------------------- |
| `@smoke`       | Coffee Cart gate    | Critical path; **GitHub PRs** run `sauce-demo` instead (public AUT)       |
| `@sanity`      | After deploy        | Core feature verification                                                 |
| `@regression`  | Nightly             | Full functional suite                                                     |
| `@e2e`         | Nightly             | Multi-page user journeys                                                  |
| `@api`         | Nightly + local     | API contracts; not in the GitHub **PR** job (Sauce Demo smoke only on PR) |
| `@a11y`        | Nightly + on-demand | WCAG 2.1 AA scanning                                                      |
| `@visual`      | Nightly (main only) | Screenshot baseline comparison                                            |
| `@destructive` | Nightly secondary   | State-modifying — needs `afterEach` cleanup                               |
| `@flaky`       | Quarantine job      | Known-intermittent, non-blocking                                          |

**Rules:** Exactly **one** primary tag per test. Only `@destructive` and `@flaky` may be added alongside.
Never put tags on `test.describe()` — only on individual tests.

---

## Selector Priority

```
1. getByRole('button', { name: /submit/i })    ← always try first
2. getByLabel(/email/i)                        ← form inputs
3. getByPlaceholder(/search/i)
4. getByText('Confirm')
5. getByTestId('submit-btn')                   ← last resort only
```

**Never use:** XPath · CSS class selectors as primary · `locator('div > span')`

---

## Test File Template

```typescript
import { test, expect } from '../../../fixtures/pom/test-options'; // ← ALWAYS this import
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { Routes, Messages } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Feature name', () => {
  test(
    'should do something meaningful',
    { tag: '@smoke' }, // ← exactly ONE tag
    async ({ loginPage, menuPage }) => {
      // ← fixtures, never new PageObject(page)
      const data = generateCheckoutData(); // ← factory for happy-path data

      await test.step('GIVEN precondition', async () => {
        await loginPage.goto();
        await expect(loginPage.emailInput).toBeVisible();
      });

      await test.step('WHEN action occurs', async () => {
        await loginPage.login(data.email, data.password);
      });

      await test.step('THEN outcome is verified', async () => {
        await expect(menuPage.page).toHaveURL(Routes.MENU); // ← enum, not string literal
      });
    },
  );
});
```

---

## Page Object Template

```typescript
import { type Page, type Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /page title/i });
    this.submitButton = page.getByRole('button', { name: /submit/i });
    this.errorMessage = page.getByRole('alert'); // ← always include feedback locators
  }

  /** @param url - full URL or path to navigate to */
  async goto(url = '/my-page'): Promise<void> {
    await this.page.goto(url);
  }

  /** @param value - value to submit */
  async submit(value: string): Promise<void> {
    await this.submitButton.click();
  }
}
```

Register in `fixtures/pom/page-object-fixture.ts` after creating. Never `new MyPage(page)` in tests.

---

---

## Fixtures — Quick Reference

| Fixture          | Type        | What it provides                               |
| ---------------- | ----------- | ---------------------------------------------- |
| `loginPage`      | Page object | Coffee Cart login page                         |
| `menuPage`       | Page object | Menu / product list                            |
| `cartPage`       | Page object | Shopping cart                                  |
| `ordersPage`     | Page object | Orders history                                 |
| `adminPage`      | Page object | Admin dashboard                                |
| `header`         | Component   | Navigation header                              |
| `paymentDetails` | Component   | Checkout payment modal                         |
| `snackbar`       | Component   | Toast notification                             |
| `promotion`      | Component   | Promotion/discount banner                      |
| `api`            | API client  | Authenticated HTTP request client              |
| `a11yScan`       | Function    | axe-core WCAG 2.1 AA scanner                   |
| `networkMock`    | Helper      | Route interception (errors, timeouts, offline) |
| `seededCart`     | Helper      | Pre-fills cart, cleans up after test           |
| `createdOrder`   | Helper      | Creates an order, cleans up after test         |
| `consoleLog`     | Helper      | Captures browser console output                |

All imported via: `import { test, expect } from 'fixtures/pom/test-options'`

---

## Project Structure — Key Paths

```
fixtures/pom/test-options.ts          ← single import point for test + expect
fixtures/pom/page-object-fixture.ts   ← register new page objects here
fixtures/api/pw-api-fixture.ts        ← api fixture
fixtures/api/schemas/coffee-cart/     ← Zod response schemas
fixtures/helper/helper-fixture.ts     ← seededCart, createdOrder, consoleLog
fixtures/accessibility/a11y-fixture.ts
fixtures/network/network-mock-fixture.ts

pages/coffee-cart/                    ← page objects (one file per page)
pages/components/                     ← reusable UI components

tests/coffee-cart/functional/         ← UI feature tests
tests/coffee-cart/api/                ← API tests
tests/coffee-cart/e2e/                ← journey tests
tests/coffee-cart/auth.user.setup.ts  ← login once, reuse session
tests/coffee-cart/auth.admin.setup.ts

test-data/factories/coffee-cart/      ← Faker-powered dynamic data
test-data/static/coffee-cart/         ← fixed JSON (invalid/boundary cases)

enums/coffee-cart/                    ← routes, messages, endpoints, names
enums/util/                           ← shared roles, HTTP status codes
config/                               ← app URLs, timeouts
env/.env.dev                          ← local environment (default)
env/.env.staging
env/.env.production
```

---

## Data Strategy

| Situation                  | Use             | Example                          |
| -------------------------- | --------------- | -------------------------------- |
| Valid / happy-path inputs  | Factory (Faker) | `generateCheckoutData()`         |
| Error / boundary / invalid | Static JSON     | `invalidLogin.json`              |
| Repeated string constant   | Enum            | `Routes.LOGIN`, `Messages.ERROR` |
| API endpoint path          | Enum            | `ApiEndpoints.COFFEES`           |

**Never** hardcode `'john.doe@example.com'` or `'/login'` directly in a test.

---

## Zod Schema Rules

```typescript
// CORRECT — strictObject rejects unknown fields
export const UserSchema = z.strictObject({
  id: z.number(),
  email: z.string().email(),
  role: z.string(),
});

// FORBIDDEN — z.object silently strips unknown fields
export const UserSchema = z.object({ ... });
```

Use in tests: `UserSchema.parse(await response.json())` — throws on mismatch.

---

## Must / Must Not

| Must                                                          | Must Not                                         |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Import `test`/`expect` from `fixtures/pom/test-options`       | Import from `@playwright/test` in spec files     |
| Use fixtures — `async ({ loginPage })`                        | `new LoginPage(page)` in tests                   |
| One tag per test                                              | Multiple primary tags or tags on `describe`      |
| `getByRole()` first                                           | XPath selectors — ever                           |
| Web-first assertions: `expect(locator).toBeVisible()`         | `page.waitForTimeout()`                          |
| Factory data for valid inputs                                 | Hardcoded names/emails in tests                  |
| `z.strictObject()` for API schemas                            | `z.object()` — silently strips fields            |
| `afterEach` cleanup on `@destructive` tests                   | Leave state dirty after destructive tests        |
| Explore UI with `playwright-cli` before creating page objects | IDE browser MCP / Cursor browser tools / codegen |
| `test.step()` for each Given/When/Then                        | Flat tests without steps                         |

---

## Accessibility & Visual Helpers

```typescript
// Accessibility — full page scan
await a11yScan();

// Scoped scan
await a11yScan({ include: '[role="dialog"]' });

// Exclude known third-party issue
// FIXME: known contrast bug — remove once fixed
await a11yScan({ disableRules: ['color-contrast'] });

// Visual regression
await expect(page).toHaveScreenshot('my-page.png', {
  maxDiffPixelRatio: 0.01,
  animations: 'disabled',
});
```

Demo break params: `?a11ybreak=1` · `?visualbreak=1`

---

## Network Mock Helpers

```typescript
// Server error
await networkMock.simulateServerError('**/api/orders');

// Timeout
await networkMock.simulateTimeout('**/api/coffees');

// Offline mode
await networkMock.goOffline();
await networkMock.goOnline();

// Custom response
await networkMock.mockResponse('**/api/user', { status: 401, body: { error: 'Unauthorised' } });
```

---

## API Test Structure

```typescript
test('GET /api/coffees returns valid menu', { tag: '@api' }, async ({ api }) => {
  let response: APIResponse;

  await test.step('WHEN GET /api/coffees is called', async () => {
    response = await api.get(COFFEES_URL);
  });

  await test.step('THEN status is 200', async () => {
    expect(response.status()).toBe(200);
  });

  await test.step('THEN body matches coffees schema', async () => {
    CoffeesResponseSchema.parse(await response.json());
  });
});
```

Run API tests without browser: `npx playwright test tests/coffee-cart/api/ --project=chromium-api`

---

## Environment Switching

```powershell
$env:TEST_ENV="staging"; npx playwright test --project=chromium --grep @smoke
$env:TEST_ENV="production"; npx playwright test --project=chromium --grep @smoke
```

Config files: `env/.env.dev` · `env/.env.staging` · `env/.env.production`

---

## Auth Storage State

Auth runs once automatically before tests (`auth.user.setup.ts`, `auth.admin.setup.ts`).
State saved to `.auth/`. Reused by all tests — no per-test login.

```bash
npm run reset:auth    # force re-login on next run (fixes stale sessions)
```

---

## VS Code Integration

### Tasks — Ctrl+Shift+P → "Tasks: Run Task"

| Task label                                   | npm equivalent                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `Test: Run All`                              | `npm test`                                                                 |
| `Test: Smoke (Chromium)`                     | `npm run test:smoke`                                                       |
| `Test: Regression (Chromium)`                | `npx playwright test --project=chromium --grep @regression`                |
| `Test: Accessibility (@a11y)`                | `npx playwright test --project=chromium --grep @a11y`                      |
| `Test: Visual Regression (@visual)`          | `npx playwright test --project=chromium --grep @visual`                    |
| `Test: Staging Smoke (Chromium)`             | `npm run test:env:staging:smoke`                                           |
| `Test: Current File (Chromium)`              | `npx playwright test "${relativeFile}" --project=chromium`                 |
| `Test: Update Visual Baselines`              | `npx playwright test --project=chromium --grep @visual --update-snapshots` |
| `Lint`                                       | `npm run lint`                                                             |
| `TypeCheck`                                  | `npx tsc --noEmit`                                                         |
| `Report: Open Smart Reporter`                | `npm run report:smart`                                                     |
| `Report: Serve Smart Reporter (Coffee Cart)` | `npm run report:smart:serve -- coffee-cart`                                |
| `Report: Build Smart Reporter`               | `npm run build:smart-reporter`                                             |
| `playwright-cli: Open Login Page`            | `playwright-cli open http://localhost:5273/login`                          |
| `playwright-cli: Open Menu Page`             | `playwright-cli open http://localhost:5273`                                |
| `Kill: Playwright Processes`                 | `npm run kill`                                                             |

Full task list in `.vscode/tasks.json`.

### Snippets — type prefix + Tab

| Prefix         | What it inserts                                                |
| -------------- | -------------------------------------------------------------- |
| `pwimport`     | Framework import line (`fixtures/pom/test-options`)            |
| `pwtest`       | Full test file — import, describe, tag picker, Given/When/Then |
| `pwt`          | Single `test()` block with tag picker and steps                |
| `pwd`          | `test.describe()` block                                        |
| `pwgiven`      | `GIVEN` test step                                              |
| `pwwhen`       | `WHEN` test step                                               |
| `pwthen`       | `THEN` test step                                               |
| `pwand`        | `AND` test step                                                |
| `pwts`         | Generic `test.step()`                                          |
| `pwbeforeeach` | `test.beforeEach` hook                                         |
| `pwaftereach`  | `test.afterEach` cleanup hook                                  |
| `pom`          | Page Object class with constructor locators                    |
| `ge`           | Constructor locator line (add inside POM constructor)          |
| `pwaction`     | Page object action method with JSDoc                           |
| `req`          | API test using `api` fixture                                   |
| `rou`          | Network mock using `networkMock` fixture                       |
| `pwa11y`       | Accessibility test with `a11yScan` fixture                     |
| `pwvisual`     | Visual regression test                                         |
| `pwe2e`        | E2E journey test                                               |
| `pwschema`     | Zod schema (`z.strictObject`) + inferred type                  |
| `pwfactory`    | Faker factory function with Zod validation                     |
| `pwresponse`   | `page.waitForResponse()` + `.json()`                           |
| `cl`           | `console.log()`                                                |
| `exv`          | `await expect(...).toBeVisible()`                              |
| `exe`          | `await expect(...).toEqual()`                                  |

Full snippet definitions in `.vscode/playwright.code-snippets`.

---

## Documentation Map

| Need                                 | Document                                     |
| ------------------------------------ | -------------------------------------------- |
| First time setup                     | `docs/framework-onboarding.md`               |
| What to read and in what order       | `docs/learning-framework.md`                 |
| Dev Container setup                  | `docs/usage/dev-container.md`                |
| Full architecture reference          | `docs/developer.md`                          |
| Reading the Smart Reporter           | `docs/usage/playwright-smart-reporter.md`    |
| Diagnosing a failure                 | `docs/usage/debugging-failing-tests.md`      |
| Exploring pages before writing tests | `docs/usage/playwright-cli-exploration.md`   |
| Building a page object               | `docs/usage/creating-a-page-object.md`       |
| Writing API tests                    | `docs/usage/writing-api-tests.md`            |
| Writing E2E journey tests            | `docs/usage/writing-e2e-tests.md`            |
| Accessibility testing                | `docs/usage/accessibility-testing.md`        |
| Visual regression baselines          | `docs/usage/visual-regression-baselines.md`  |
| Flaky test management                | `docs/usage/flaky-test-management.md`        |
| Network mocking                      | `docs/usage/network-mocking.md`              |
| All fixtures explained               | `docs/usage/understanding-fixtures.md`       |
| Test data factories                  | `docs/usage/test-data-factories.md`          |
| Auth / storage state                 | `docs/usage/authentication-storage-state.md` |
| Multi-environment testing            | `docs/usage/multi-environment-testing.md`    |
| All npm scripts                      | `docs/usage/scripts-usage.md`                |
| All AI skills                        | `docs/usage/skills-guide.md`                 |
