# Framework Onboarding Guide

**For Jr QA Engineers — Playwright AI Test Framework**

Welcome to the team. This guide walks you through everything you need to understand the framework, run the tests, and write your first spec. All examples use the **Coffee Cart** app — a real web application we control at `d:/gitrepos/coffee-cart` — so you can explore, break things, and experiment without affecting anything shared.

---

## Table of Contents

1. [What This Framework Is](#1-what-this-framework-is)
2. [Prerequisites & Setup](#2-prerequisites--setup)
3. [Start the Coffee Cart App](#3-start-the-coffee-cart-app)
4. [Project Structure](#4-project-structure)
5. [Running Tests](#5-running-tests)
6. [Reading the Smart Reporter](#6-reading-the-smart-reporter)
7. [How a Test Is Built](#7-how-a-test-is-built)
8. [Page Objects](#8-page-objects)
9. [Fixtures — Dependency Injection](#9-fixtures--dependency-injection)
10. [Test Data — Factories & Static Files](#10-test-data--factories--static-files)
11. [API Testing](#11-api-testing)
12. [Accessibility Testing](#12-accessibility-testing)
13. [Visual Regression Testing](#13-visual-regression-testing)
14. [The Rules](#14-the-rules)
15. [Next Steps](#15-next-steps)

---

## 1. What This Framework Is

This is a **Playwright + TypeScript** test automation framework. It tests the Coffee Cart web app across three layers:

| Layer      | Location                        | What it tests                          |
| ---------- | ------------------------------- | -------------------------------------- |
| Functional | `tests/coffee-cart/functional/` | Single-feature UI flows                |
| API        | `tests/coffee-cart/api/`        | HTTP endpoints, request/response shape |
| E2E        | `tests/coffee-cart/e2e/`        | Multi-page user journeys               |

The framework is designed so that when you run a test, you get:

- A **pass/fail** result with step-level detail
- A **Smart Reporter** with AI-powered failure analysis, trace viewer, and test history
- **Screenshots and videos** automatically captured on failure

---

## 2. Prerequisites & Setup

You have two ways to set up your environment. The Dev Container is recommended — it requires no manual installation of Node.js or browsers.

### Option A — Dev Container (recommended)

The Dev Container gives you a fully configured environment inside VS Code with a single click. You only need:

- **Docker Desktop** — [download here](https://www.docker.com/products/docker-desktop)
- **VS Code** — [download here](https://code.visualstudio.com)
- **Dev Containers extension** — search "Dev Containers" in the VS Code Extensions panel and install it

Once those are installed:

1. Open the project folder in VS Code
2. Click **Reopen in Container** when prompted (or press `F1` → `Dev Containers: Reopen in Container`)
3. Wait for the build to complete — `npm ci`, the Smart Reporter build, and browser installation all run automatically

That is it. Skip the "Install dependencies" step below — the container handles everything.

> **New to Docker?** Read the [Dev Container Guide](usage/dev-container.md) for a full step-by-step walkthrough, and the [Docker Usage Guide](usage/docker-usage.md) to understand what Docker is and how it fits into this framework.

---

### Option B — Local setup (manual)

If you prefer to install everything on your machine directly:

**You need:**

- **Node.js 22+** — check with `node -v`
- **VS Code** (recommended) or any editor with TypeScript support
- **Git** — check with `git --version`

**Install dependencies:**

```bash
# From the framework root: d:/gitrepos/playwright-ai-test-framework
npm ci
npx playwright install chromium
```

**Build the Smart Reporter** (required before running tests):

```bash
npm run build:smart-reporter
```

**Environment file:**

```bash
# The dev env file already exists at env/.env.dev
# No action needed — it points to http://localhost:5273 by default
```

---

## 3. Start the Coffee Cart App

The tests run against a **locally hosted** Coffee Cart app. You need this running before you run any tests.

```bash
# In a separate terminal, go to the coffee-cart directory
cd d:/gitrepos/coffee-cart
npm ci
npm run dev
```

You should see output like:

```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5273/
```

Open `http://localhost:5273` in your browser to confirm it's running. You'll see a login page.

**Test credentials:**

| Role  | Email             | Password |
| ----- | ----------------- | -------- |
| User  | user@example.com  | password |
| Admin | admin@example.com | admin    |

---

## 4. Project Structure

Here is how the framework is organized. Read this once — it tells you where everything lives.

```
playwright-ai-test-framework/
│
├── tests/                          ← All test specs
│   └── coffee-cart/
│       ├── functional/             ← UI feature tests (login, menu, checkout…)
│       ├── api/                    ← API endpoint tests
│       ├── e2e/                    ← Full journey tests
│       ├── auth.user.setup.ts      ← Runs once to save logged-in user session
│       └── auth.admin.setup.ts     ← Runs once to save admin session
│
├── pages/                          ← Page Objects (how to interact with pages)
│   ├── coffee-cart/                ← One file per page (login, menu, cart…)
│   └── components/                 ← Reusable UI parts (header, snackbar…)
│
├── fixtures/                       ← Dependency injection setup
│   ├── pom/
│   │   ├── test-options.ts         ← THE single import for test and expect
│   │   └── page-object-fixture.ts  ← Registers all page objects as fixtures
│   ├── api/                        ← API request fixtures and Zod schemas
│   ├── accessibility/              ← a11yScan fixture (axe-core)
│   ├── helper/                     ← Setup/teardown helpers (e.g. seeded cart)
│   └── network/                    ← Network mock fixture
│
├── test-data/
│   ├── factories/coffee-cart/      ← Dynamic data (Faker-powered)
│   └── static/coffee-cart/         ← Fixed data (invalid inputs, boundary cases)
│
├── enums/coffee-cart/              ← Constants: routes, messages, coffee names…
├── config/                         ← App URLs, timeouts
├── env/                            ← Environment files (.env.dev, .env.staging…)
└── playwright.config.ts            ← Browser projects, timeouts, reporters
```

> **Rule of thumb:** If you're looking for _how to click something_, check `pages/`. If you're looking for _test data_, check `test-data/`. If you're looking for _a constant string_, check `enums/`.

---

## 5. Running Tests

### Run everything (Chromium)

```bash
npm test
```

**Windows / one command:** `npm run test:report` runs the same default Chromium command as `npm test` (via Node) and opens the Smart Report afterward — no bash required. In CI, the report step is skipped.

### Run a specific file

```bash
npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium
```

### Run by tag

Every test has exactly one tag. Use `--grep` to filter:

```bash
npx playwright test --project=chromium --grep @smoke      # Critical path only
npx playwright test --project=chromium --grep @regression  # Full regression suite
npx playwright test --project=chromium --grep @api         # API tests only
```

**Tag meanings:**

| Tag            | Count | When it runs                   | What it covers                                                 |
| -------------- | ----- | ------------------------------ | -------------------------------------------------------------- |
| `@smoke`       | 13    | Coffee Cart gate (`main` CI)   | Critical path; GitHub **PR** job runs Sauce Demo, not `@smoke` |
| `@sanity`      | 7     | After deploy                   | Core feature verification                                      |
| `@regression`  | 45    | Nightly                        | Full functional regression                                     |
| `@e2e`         | 6     | Nightly                        | Multi-page user journeys                                       |
| `@api`         | 25    | Nightly + local                | API contracts; GitHub **PR** job does not run API suite        |
| `@a11y`        | 6     | Nightly + on-demand            | WCAG 2.1 AA accessibility validation                           |
| `@visual`      | 6     | Nightly (main branch only)     | Screenshot baseline comparison                                 |
| `@destructive` | 2     | Nightly (secondary only)       | State-modifying tests with cleanup                             |
| `@flaky`       | —     | Nightly (quarantine job)       | Known-intermittent tests, non-blocking                         |
| `@responsive`  | —     | **mobile-chrome** project only | Viewport/layout checks (desktop projects exclude via config)   |
| `@graphql`     | —     | With `@api` / API project      | GraphQL-over-HTTP specs (see GraphQL doc)                      |

**Responsive runs:** `npx playwright test --project=mobile-chrome` picks up tests tagged `@responsive` (Pixel 7 profile). Desktop `chromium` / `firefox` / `webkit` do not run those tests by default.

**Template specs:** files named `template-*.spec.ts` are in **`testIgnore`** — copy one as a starting point and rename it; placeholders never run in CI.

### Run a single test by name

```bash
npx playwright test --project=chromium --grep "should login successfully"
```

### Run headed (see the browser)

```bash
npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium --headed
```

### Run in UI mode (interactive explorer)

```bash
npx playwright test --ui
```

### Re-run only failed tests

```bash
npm run select:failed
```

---

## 6. Reading the Smart Reporter

After every test run, a report is generated at `playwright-report/smart-report.html`. Open it with:

```bash
npm run report:smart
```

What you'll see:

- **Left sidebar** — file tree with pass/fail counts per file
- **Test list** — click any test to see its detail card
- **Step timeline** — each `test.step()` with duration, visible in the card
- **Screenshots / Videos** — captured automatically on failure
- **Trace viewer** — embedded Playwright trace for failed tests (timeline of every action)
- **AI analysis** — on failure, the reporter calls an AI model to explain the error and suggest a fix
- **Test history** — stability score, flakiness indicator, duration trends over time

When a test fails, the step label tells you exactly where it broke:

```
✓ GIVEN user is on the login page          (0.3s)
✓ WHEN user enters valid credentials       (0.2s)
✗ THEN user is redirected to the menu     (5.0s)  ← failure here
```

---

## 7. How a Test Is Built

Open `tests/coffee-cart/functional/login.spec.ts` as your first read. Every test in this framework follows the same pattern:

```typescript
// 1. Always import from this path — never from @playwright/test directly
import { test, expect } from '../../../fixtures/pom/test-options';

// 2. Import factory data (not hardcoded strings)
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';

// 3. Import enums for any constant strings
import { Routes } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Login', () => {
  test(
    'should login successfully as user and redirect to menu',
    { tag: '@smoke' }, // 4. Exactly ONE tag
    async ({ loginPage, menuPage }) => {
      // 5. Page objects via fixtures — never new LoginPage(page)
      const { email, password } = generateUserCredentials(); // 6. Factory data

      await test.step('GIVEN user is on login page', async () => {
        await loginPage.goto();
        await expect(loginPage.emailInput).toBeVisible(); // 7. Web-first assertions
      });

      await test.step('WHEN user enters valid credentials', async () => {
        await loginPage.login(email, password);
      });

      await test.step('THEN user is on the menu page', async () => {
        await expect(menuPage.page).toHaveURL(Routes.MENU); // 8. Enums for strings
      });
    },
  );
});
```

**Key rules to remember:**

- Import `test` and `expect` from `fixtures/pom/test-options` — not from `@playwright/test`
- One tag per test, no exceptions
- Steps follow Given/When/Then — one action per step
- Never hardcode strings — use factories for names/emails, enums for routes/messages

---

## 8. Page Objects

A **Lean POM** page object is a class that represents a page or component. It has two things:

1. **Locators** — properties that describe how to find elements
2. **Action methods** — functions that perform interactions

Open `pages/coffee-cart/login.page.ts`:

```typescript
export class LoginPage {
  readonly emailInput: Locator; // ← locator property: just describes the element
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.emailInput = page.getByLabel(/email/i); // ← getByRole/Label/Text priority
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    // ← action method: does something
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**Selector priority** (highest to lowest — always use the highest one you can):

1. `getByRole()` — matches ARIA roles (button, heading, textbox, link…)
2. `getByLabel()` — matches form labels
3. `getByPlaceholder()` — matches placeholder text
4. `getByText()` — matches visible text
5. `getByTestId()` — last resort, uses `data-testid` attribute

You **never** instantiate a Page Object in a test. You receive it as a fixture parameter:

```typescript
// ✓ Correct — received as fixture
async ({ loginPage }) => { ... }

// ✗ Wrong — never do this in a test
const loginPage = new LoginPage(page);
```

---

## 9. Fixtures — Dependency Injection

**Fixtures** are how page objects and other helpers are provided to your tests. They live in `fixtures/` and are all merged into a single `test` export in `fixtures/pom/test-options.ts`.

When you write `async ({ loginPage, menuPage, snackbar })` in a test, Playwright creates fresh instances of those objects for that test automatically.

**Available fixtures** (the most common ones):

| Fixture          | What it is                        |
| ---------------- | --------------------------------- |
| `loginPage`      | Coffee Cart login page            |
| `menuPage`       | Coffee Cart menu/product list     |
| `cartPage`       | Shopping cart page                |
| `ordersPage`     | Orders history page               |
| `adminPage`      | Admin dashboard                   |
| `header`         | Navigation header component       |
| `paymentDetails` | Checkout payment modal            |
| `snackbar`       | Toast notification component      |
| `a11yScan`       | Accessibility scanner (axe-core)  |
| `api`            | Authenticated API request client  |
| `seededCart`     | Pre-fills cart, cleans up after   |
| `createdOrder`   | Creates an order, cleans up after |

You never need to import or construct these — just list them as function parameters.

---

## 10. Test Data — Factories & Static Files

There are two kinds of test data:

### Factories (dynamic, Faker-powered)

Use factories for **happy path** data — valid names, emails, quantities. Every call generates unique values, so tests don't interfere with each other.

```typescript
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { generateOrderPayload } from '../../../test-data/factories/coffee-cart/order.factory';

const { email, password } = generateUserCredentials();
// → { email: 'user@example.com', password: 'password' }

const order = generateOrderPayload();
// → { name: 'Alice Johnson', email: 'alice.j@email.com', items: [...], subscribe: true }
```

### Static files (fixed JSON)

Use static data for **boundary cases, invalid inputs, and error scenarios** — things where the specific value matters.

```typescript
import invalidLoginData from '../../../test-data/static/coffee-cart/invalidLogin.json' assert { type: 'json' };

const { email, password } = invalidLoginData[0]!;
// → { email: 'user@example.com', password: 'WrongPassword123!' }
```

**Quick rule:** If the test is about a valid happy path, use a factory. If the test is about a specific error condition, use a static file.

---

## 11. API Testing

API tests make HTTP requests directly and validate the response shape using **Zod schemas**. They don't open a browser.

Open `tests/coffee-cart/api/menu-api.spec.ts` as a starting example. That file defines `COFFEES_URL` from `config.apiUrl` and `COFFEE_CART_API_ENDPOINTS.COFFEES` before the test:

```typescript
test('GET /api/coffees returns a valid menu', { tag: '@api' }, async ({ api }) => {
  await test.step('WHEN request is made to GET /api/coffees', async () => {
    response = await api.get(COFFEES_URL);
  });

  await test.step('THEN response status is 200', async () => {
    expect(response.status()).toBe(200);
  });

  await test.step('THEN response body matches the coffees schema', async () => {
    const body = await response.json();
    CoffeesResponseSchema.parse(body); // ← Zod validates the shape
  });
});
```

**Zod schemas** live in `fixtures/api/schemas/coffee-cart/`. They describe what the API is supposed to return. If the API changes — returns a new field, renames one, removes one — the schema fails the test immediately with a clear message.

```typescript
// Example schema: z.strictObject() rejects any unknown fields
export const CoffeeItemSchema = z.strictObject({
  name: z.string(),
  price: z.number().positive(),
  recipe: z.array(RecipeItemSchema),
});
```

**GraphQL:** Coffee Cart exposes **`POST /api/graphql`** (same menu data as REST). See **[GraphQL API testing](usage/graphql-api-testing.md)**, runnable examples in `tests/coffee-cart/api/graphql-menu.spec.ts`, and the ignored starter **`tests/coffee-cart/api/template-graphql.spec.ts`** (rename before use).

---

## 12. Accessibility Testing

Accessibility tests verify the app meets **WCAG 2.1 AA** standards using **axe-core**. This catches issues like insufficient color contrast, missing form labels, and images without alt text.

The `a11yScan` fixture is available in all tests — just add it as a parameter.

### Running a basic scan

```typescript
test('login page meets WCAG 2.1 AA', { tag: '@regression' }, async ({ loginPage, a11yScan }) => {
  await test.step('GIVEN user is on the login page', async () => {
    await loginPage.goto();
    await expect(loginPage.submitButton).toBeVisible();
  });

  await test.step('THEN the page passes WCAG 2.1 AA', async () => {
    await a11yScan(); // ← scans the full page
  });
});
```

### Scan options

```typescript
// Scan only the checkout modal
await a11yScan({ include: '[role="dialog"]' });

// Exclude a third-party widget you don't control
await a11yScan({ exclude: ['#third-party-chat'] });

// Disable a specific rule (with a FIXME comment explaining why)
// FIXME: known contrast bug in app — remove once dev team fixes #dc2626 color
await a11yScan({ disableRules: ['color-contrast'] });
```

### Demo: Watch the scanner catch a real violation

The Coffee Cart app has a special URL parameter `?a11ybreak=1` that intentionally introduces WCAG violations — the button text becomes near-invisible and the heading loses contrast.

**Run the demo test:**

```bash
npx playwright test tests/coffee-cart/functional/accessibility.spec.ts \
  --project=chromium \
  --grep "a11ybreak" \
  --headed
```

This test **passes** — it asserts that violations _are_ detected. Open Smart Reporter after the run (`npm run report:smart`) and click on the test to see the formatted violation output:

```
{
  "rule": "color-contrast",
  "impact": "serious",
  "description": "Ensure contrast between foreground and background meets WCAG 2 AA",
  "nodes": 2,
  "help": "https://dequeuniversity.com/rules/axe/4.11/color-contrast"
}
```

Also click the **♿ Accessibility** nav item in the Smart Reporter sidebar to see the dedicated Accessibility view — it shows a rule breakdown table, the tests that had violations, and a trend chart across runs.

**To see the scanner fail (what a real blocking violation looks like):**

1. Open `tests/coffee-cart/functional/accessibility.spec.ts`
2. Find the `[DEMO]` test
3. In the THEN step, replace the custom assertions with `await a11yScan()`
4. Run the test — it will fail with the violation report rendered in the reporter

When you're done exploring, revert the change. The real tests in the file already demonstrate the correct patterns.

**What axe-core catches (~30–40% of all a11y issues):**

- Color contrast failures
- Missing ARIA labels
- Images without alt text
- Form inputs without labels
- Keyboard focus issues (structural)

The remaining ~60–70% requires manual keyboard navigation testing — tab through the form, verify focus traps in modals, confirm nothing is mouse-only.

---

## 13. Visual Regression Testing

Visual regression tests take a **screenshot** of a page and compare it to a stored **baseline image**. If anything changes visually — a moved button, a missing logo, a color change — the test fails and shows you exactly what changed.

Open `tests/coffee-cart/functional/visual-regression.spec.ts`:

```typescript
test('login page matches baseline screenshot', { tag: '@regression' }, async ({ page }) => {
  await test.step('GIVEN user navigates to login page', async () => {
    await page.goto(Routes.LOGIN);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  await test.step('THEN the login page matches the baseline', async () => {
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.01, // ← allows up to 1% pixel difference
      animations: 'disabled', // ← prevents animation frames from causing false failures
    });
  });
});
```

Baseline screenshots live in `tests/coffee-cart/functional/visual-regression.spec.ts-snapshots/`.

### Demo: Watch visual regression catch a change

The Coffee Cart app has a URL parameter `?visualbreak=1` that hides the Coffee Cart logo on the login page. There is a dedicated demo test that uses this parameter.

**Step 1 — Look at the two baselines side by side:**

Open these two files and compare them:

- `visual-regression.spec.ts-snapshots/login-page-chromium-win32.png` — normal login page (logo present)
- `visual-regression.spec.ts-snapshots/login-page-visual-break-chromium-win32.png` — broken login page (logo absent)

This is exactly what a visual regression diff catches: the logo is in one, gone in the other.

**Step 2 — Simulate a real failure:**

```bash
# 1. Delete the visual-break baseline to force a "no baseline" failure
del "tests\coffee-cart\functional\visual-regression.spec.ts-snapshots\login-page-visual-break-chromium-win32.png"

# 2. Run just the demo test
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts \
  --project=chromium \
  --grep "visualbreak"

# The test will fail: "snapshot doesn't exist"
# Open Smart Reporter to see the diff view
npm run report:smart
```

**Step 3 — Restore the baseline:**

```bash
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts \
  --project=chromium \
  --grep "visualbreak" \
  --update-snapshots
```

The test passes again.

### Updating baselines after intentional UI changes

If a developer makes a deliberate UI change (new button style, updated layout), the visual tests will fail. To accept the change and update the baseline:

```bash
npx playwright test --project=chromium --update-snapshots
```

Only run `--update-snapshots` when you have intentionally changed the UI and visually confirmed the new screenshots look correct. Never run it to make failing tests pass without reviewing what changed.

---

## 14. The Rules

The framework has mandatory rules enforced by the AI skills, ESLint, and code review. Here are the most important ones for day-to-day work.

### Must do

| Rule                                                    | Example                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| Import `test`/`expect` from `fixtures/pom/test-options` | `import { test, expect } from '../../../fixtures/pom/test-options'` |
| One tag per test                                        | `{ tag: '@smoke' }`                                                 |
| Use factory data for valid inputs                       | `generateCheckoutData()` not `'John Smith'`                         |
| Use enums for repeated strings                          | `Routes.LOGIN` not `'/login'`                                       |
| Use web-first assertions                                | `expect(locator).toBeVisible()`                                     |
| Wrap each step in `test.step()`                         | Given/When/Then structure                                           |

### Must not do

| Rule                                      | What to do instead                                              |
| ----------------------------------------- | --------------------------------------------------------------- |
| `import { test } from '@playwright/test'` | Import from `fixtures/pom/test-options`                         |
| `new LoginPage(page)` in a test           | Use the `loginPage` fixture                                     |
| `page.waitForTimeout(2000)`               | Use web-first assertions — Playwright auto-waits                |
| XPath selectors                           | Use `getByRole()`, `getByLabel()`, etc.                         |
| Hardcode `'user@example.com'` in a test   | Use `generateUserCredentials()`                                 |
| Multiple tags on one test                 | Exactly one tag (plus `@destructive` or `@flaky` if applicable) |
| `z.object()` in API schemas               | Use `z.strictObject()` — rejects unknown keys                   |

---

## 15. Next Steps

Now that you've read the guide, work through these in order:

1. **Get tests running** — start the app, run `npm test`, confirm you see passing tests
2. **Open Smart Reporter** — run `npm run report:smart`, click through a test's trace
3. **Read a real test** — open `tests/coffee-cart/functional/login.spec.ts` and trace through it line by line
4. **Read the page object** — open `pages/coffee-cart/login.page.ts` and match each locator to the element in the browser
5. **Run the a11y demo** — follow Section 12, watch violations appear in the reporter
6. **Run the visual demo** — follow Section 13, delete the baseline, watch the failure, restore it
7. **Write a test** — use the generator to scaffold a stub, then fill in the TODOs:
   ```bash
   npm run generate:test -- --type functional --area coffee-cart --name my-feature
   playwright-cli open http://localhost:5273   # explore selectors
   # fill in the generated file, then:
   npx playwright test tests/coffee-cart/functional/my-feature.spec.ts --project=chromium
   ```

When you're ready to write your first real test, read the skill files in `.claude/skills/` — they have deep detail on selectors, page objects, API testing, and more. The `common-tasks` skill has prompt templates if you want AI help scaffolding a new spec.

> **VS Code users:** The project ships with pre-configured tasks and snippets.
>
> - **Tasks** — press `Ctrl+Shift+P` → "Tasks: Run Task" to run any npm command without opening a terminal. Includes all test, report, lint, and utility commands.
> - **Snippets** — type a prefix and press `Tab` to insert a complete code block. Type `pwtest` for a full test file, `pom` for a Page Object class, `req` for an API test, and more. All snippets follow framework conventions. Prefixes are listed in the [Framework Cheatsheet](framework-cheatsheet.md#vs-code-integration).

> **Tip:** Run `npm run onboard` at any time to replay this walkthrough interactively with live test output at each step.

### Further reading

| Topic                              | Document                                                            |
| ---------------------------------- | ------------------------------------------------------------------- |
| Dev Container setup (recommended)  | [Dev Container Guide](usage/dev-container.md)                       |
| What Docker is and how CI uses it  | [Docker Usage Guide](usage/docker-usage.md)                         |
| Full recommended reading order     | [Learning Path](learning-framework.md)                              |
| All AI skills and when to use them | [Skills Guide](usage/skills-guide.md)                               |
| VS Code tasks and snippet prefixes | [Framework Cheatsheet](framework-cheatsheet.md#vs-code-integration) |

---

_Last updated: March 2026_
