# Developer Guide

This guide walks you through the framework's architecture, conventions, and how to add tests and **Lean POM** page objects. It's written for developers who are new to the codebase.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Concepts](#key-concepts)
- [Your First Test](#your-first-test)
- [Page Objects](#page-objects)
- [Components](#components)
- [Fixtures (Dependency Injection)](#fixtures-dependency-injection)
- [Test Data](#test-data)
- [Selectors](#selectors)
- [Test Tags](#test-tags)
- [API Testing](#api-testing)
- [Zod Schemas](#zod-schemas)
- [Enums](#enums)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Generation](#generating-a-test-stub)
- [Onboarding Script](#interactive-onboarding)
- [Reports](#reports)
- [Code Quality](#code-quality)
- [Common Mistakes](#common-mistakes)

---

## Architecture Overview

```
Test File (.spec.ts)
    │
    ├── imports test, expect from ──► fixtures/pom/test-options.ts (single import point)
    │
    ├── uses page objects via fixtures ──► fixtures/pom/page-object-fixture.ts
    │   (never instantiates page objects directly)
    │
    ├── uses test data from ──► test-data/factories/ (Faker, dynamic)
    │                          test-data/static/   (JSON, boundary cases)
    │
    └── validates API responses with ──► fixtures/api/schemas/ (Zod)
```

The framework enforces **fixture-based dependency injection**. Tests never create page objects manually — they receive them as function parameters, pre-configured and ready to use.

---

## Key Concepts

| Concept         | What It Means                                                                    | Where It Lives          |
| --------------- | -------------------------------------------------------------------------------- | ----------------------- |
| **Page Object** | A class that represents a page, holding locators and action methods              | `pages/coffee-cart/`    |
| **Component**   | A reusable UI element shared across pages (header, modal, snackbar)              | `pages/components/`     |
| **Fixture**     | Dependency injection — tests declare what they need and receive it automatically | `fixtures/pom/`         |
| **Factory**     | A function that generates dynamic test data using Faker                          | `test-data/factories/`  |
| **Schema**      | A Zod object that validates API response shapes at runtime                       | `fixtures/api/schemas/` |
| **Enum**        | A TypeScript enum for repeated string values (routes, messages)                  | `enums/`                |

---

## Your First Test

### Step 1: Understand the import

Every test file starts with the same import:

```typescript
import { test, expect } from '../../../fixtures/pom/test-options';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';
```

**Never** import from `@playwright/test` in spec files. The `test-options.ts` file merges all fixtures together so you get page objects, API helpers, and components via destructuring.

### Step 2: Write a test

```typescript
import { test, expect } from '../../../fixtures/pom/test-options';

test.describe('Menu Page', () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
  });

  test('should display coffee items', { tag: '@smoke' }, async ({ menuPage }) => {
    await test.step('GIVEN user is on the menu page', async () => {
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
    });

    await test.step('WHEN the page loads', async () => {
      // Page is already loaded from beforeEach
    });

    await test.step('THEN coffee cards are visible', async () => {
      const card = menuPage.getCoffeeCard(CoffeeNames.ESPRESSO);
      await expect(card).toBeVisible();
    });
  });
});
```

### What's happening here

1. **`{ menuPage }`** — The `menuPage` fixture is injected automatically. You don't create it.
2. **`{ tag: '@smoke' }`** — Every test gets exactly one importance tag.
3. **`test.step('GIVEN/WHEN/THEN', ...)`** — Steps provide structure and show up in reports.
4. **`await expect(...).toBeVisible()`** — Web-first assertions auto-retry until timeout.

### Step 3: Run it

```bash
npx playwright test tests/coffee-cart/functional/menu.spec.ts --project=chromium
```

---

## Page objects (Lean POM)

The framework uses **Lean POM**: readonly constructor locators, action methods, **no `expect()` in page objects** (tests assert), and components for shared UI. Details live in `.cursor/skills/page-objects/SKILL.md`.

Page objects live in `pages/coffee-cart/` and follow this pattern:

```typescript
import { Page, Locator } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';

export class LoginPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  private readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.form = page.locator('form:not([aria-label="Payment form"])');
    this.emailInput = this.form.getByLabel(/email/i);
    this.passwordInput = this.form.getByLabel(/password/i);
    this.submitButton = this.form.getByRole('button', { name: /login|sign in|submit/i });
    this.errorMessage = page.getByRole('alert');
  }

  /** Log in with email and password */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Navigate to login page */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }
}
```

### Rules

- **Locators** are `readonly` properties assigned in the constructor. Playwright locators are lazy — they don't query the DOM until you act on them, so assigning them in the constructor is safe.
- **No JSDoc on locator properties.** The property name should be self-documenting (`emailInput`, `submitButton`).
- **JSDoc on action methods only** — methods like `login()` and `goto()` get `@param` and `@returns` documentation.
- **Components** (like `HeaderComponent`) are instantiated in the constructor and exposed as `readonly` properties.
- **Parameterized locators** stay as methods: `getCoffeeCard(name: string): Locator` — these can't be assigned in the constructor because they depend on runtime arguments.

### Adding a new page object

1. Create the file: `pages/coffee-cart/[name].page.ts`
2. Register it in `fixtures/pom/page-object-fixture.ts`:

```typescript
// Add to imports
import { MyNewPage } from '../../pages/coffee-cart/my-new.page';

// Add to FrameworkFixtures type
export type FrameworkFixtures = {
  // ... existing fixtures
  myNewPage: MyNewPage;
};

// Add to test.extend
export const test = base.extend<FrameworkFixtures>({
  // ... existing fixtures
  myNewPage: async ({ page }, use) => {
    await use(new MyNewPage(page));
  },
});
```

3. Use it in tests: `async ({ myNewPage }) => { ... }`

---

## Components

Components represent reusable UI elements that appear on multiple pages. They live in `pages/components/` and follow the same pattern as page objects.

```typescript
import { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page;
  readonly menuLink: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuLink = page.getByRole('link', { name: /menu/i });
    this.cartLink = page.getByRole('link', { name: /cart/i });
  }

  /** Get the cart item count from the header badge */
  async getCartCount(): Promise<string> {
    return (await this.cartLink.textContent()) || '0';
  }
}
```

Page objects **compose** components by instantiating them in the constructor:

```typescript
export class MenuPage {
  readonly header: HeaderComponent;

  constructor(page: Page) {
    this.header = new HeaderComponent(page);
  }
}
```

Tests access components through the page object: `menuPage.header.getCartCount()`.

Components are also registered as standalone fixtures in `page-object-fixture.ts` for tests that only need the component.

---

## Fixtures (Dependency Injection)

Fixtures are how Playwright provides test dependencies. Instead of manually creating objects, you declare what you need and Playwright provides it.

### How it works

```
test-options.ts ─── mergeTests() ─── page-object-fixture.ts  (page objects)
                                 ├── pw-api-fixture.ts        (api — pw-api-plugin)
                                 ├── helper-fixture.ts        (setup/teardown)
                                 └── network-mock-fixture.ts  (network mocking)
```

`test-options.ts` is the single import point. It merges all fixture categories so tests get everything from one import.

### Using fixtures in tests

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Destructure the fixtures you need — Playwright only creates what you ask for
test('should add item to cart', async ({ menuPage, cartPage, header }) => {
  await menuPage.goto();
  await menuPage.addToCart(CoffeeNames.ESPRESSO);
  await expect(header.cartLink).toContainText('1');
});
```

### Helper fixtures (setup/teardown)

Helper fixtures create preconditions via API before a test and clean up after — even on failure:

```typescript
// createdOrder: creates an order via checkout API, deletes it after the test
test('should display order in list', async ({ createdOrder, ordersPage }) => {
  await ordersPage.goto();
  const row = ordersPage.getOrderRow(createdOrder.orderId);
  await expect(row).toBeVisible();
  // createdOrder is automatically deleted after this test
});

// seededCart: adds items to cart via API, clears cart after the test
test('should show seeded cart items', async ({ seededCart, cartPage }) => {
  await cartPage.goto();
  for (const item of seededCart) {
    await expect(cartPage.getCartItemRow(item.name)).toBeVisible();
  }
  // Cart is automatically cleared after this test
});
```

Helper fixtures live in `fixtures/helper/helper-fixture.ts` and are already merged into `test-options.ts`.

### Key rule

**Never create page objects manually in tests:**

```typescript
// WRONG — bypasses fixture system
const loginPage = new LoginPage(page);

// RIGHT — use fixture injection
test('...', async ({ loginPage }) => { ... });
```

---

## Authentication & Storage State

The framework uses Playwright setup projects to log in once and share the authenticated state across all tests.

### How it works

1. **Setup projects** in `playwright.config.ts` run dedicated auth setup files before any test project — `auth.user.setup.ts` for user auth, `auth.admin.setup.ts` for admin auth
2. Each setup file logs in and saves storage state to `.auth/` files
3. Browser projects declare `dependencies` and `storageState` to reuse the session

```
user-setup  (auth.user.setup.ts)  ──► .auth/coffee-cart/userStorageState.json  ──► chromium, firefox, webkit
admin-setup (auth.admin.setup.ts) ──► .auth/coffee-cart/adminStorageState.json ──► chromium-admin
```

### Available projects

| Project          | Auth  | Tests                                               |
| ---------------- | ----- | --------------------------------------------------- |
| `chromium`       | User  | All tests except admin                              |
| `firefox`        | User  | All tests except admin                              |
| `webkit`         | User  | All tests except admin                              |
| `chromium-admin` | Admin | `admin-dashboard.spec.ts`, `admin-workflow.spec.ts` |

### Running with auth

```bash
# Run all tests (auth setup runs automatically)
npm test

# Run only admin tests
npx playwright test --project=chromium-admin
```

Tests no longer need to log in manually — the storage state is injected automatically.

---

## Test Data

### Dynamic data (Faker factories)

For happy-path test data, use factories that generate realistic random data:

```typescript
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';

const checkout = generateCheckoutData();
// { name: "Jane Smith", email: "jane.smith@example.com", subscribe: true }

// Override specific fields
const customCheckout = generateCheckoutData({ name: 'Custom Name' });
```

Some factories return **Zod-validated** output — the data is parsed through the schema before being returned, so it's guaranteed to match the API contract:

```typescript
import { generateOrderPayload } from '../../../test-data/factories/coffee-cart/order.factory';
import { generateCartItem } from '../../../test-data/factories/coffee-cart/admin.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Returns a Zod-validated CheckoutRequest with random coffee items
const order = generateOrderPayload();

// Returns a Zod-validated CartItem
const item = generateCartItem({ name: CoffeeNames.ESPRESSO });
```

Factories live in `test-data/factories/coffee-cart/`.

### Static data (JSON)

For boundary cases, invalid data, and fixed app values (like the coffee menu), use static JSON:

```json
// test-data/static/coffee-cart/coffeeMenu.json
{
  "coffees": [
    { "name": "Espresso", "price": "$10.00" },
    { "name": "Americano", "price": "$7.00" }
  ]
}
```

Import in tests:

```typescript
import coffeeMenuData from '../../../test-data/static/coffee-cart/coffeeMenu.json' assert { type: 'json' };
```

### When to use which

| Scenario                                         | Use                   |
| ------------------------------------------------ | --------------------- |
| User names, emails, addresses                    | Factory (Faker)       |
| Form validation (too-long strings, empty fields) | Static JSON           |
| Known app values (menu items, error messages)    | Static JSON           |
| Login credentials                                | Factory with defaults |

---

## Selectors

The framework has a strict selector priority:

| Priority | Method               | When to Use                                                     |
| -------- | -------------------- | --------------------------------------------------------------- |
| 1st      | `getByRole()`        | Buttons, links, headings, inputs with labels — always try first |
| 2nd      | `getByLabel()`       | Form fields with associated labels                              |
| 3rd      | `getByPlaceholder()` | Inputs with placeholder text (when no label exists)             |
| 4th      | `getByText()`        | Static text content                                             |
| 5th      | `getByTestId()`      | Last resort — when no semantic selector works                   |

### Forbidden

- **No XPath** — ever
- **No CSS selectors** for user-facing elements (acceptable for layout scoping like `page.locator('form')`)
- **No `page.locator('#id')` or `page.locator('.class')`** for interactive elements

### Examples

```typescript
// Buttons and links
page.getByRole('button', { name: /submit/i });
page.getByRole('link', { name: /cart/i });

// Headings
page.getByRole('heading', { name: /menu/i });

// Form fields
page.getByLabel(/email/i);
page.getByPlaceholder('Search...');

// Scoping: find a button inside a specific section
page.locator('form').getByRole('button', { name: /login/i });
```

---

## Test Tags

Every test gets exactly **one** importance tag:

| Tag           | Purpose             | When to Use                          |
| ------------- | ------------------- | ------------------------------------ |
| `@smoke`      | Critical path       | Core flows that must always work     |
| `@sanity`     | Basic checks        | Quick verification after deployments |
| `@regression` | Full coverage       | Detailed feature testing             |
| `@e2e`        | End-to-end journeys | Multi-page user flows                |
| `@api`        | API tests           | Backend validation                   |
| `@a11y`       | Accessibility tests | WCAG 2.1 AA compliance checks        |
| `@visual`     | Visual regression   | Screenshot baseline comparison       |

### Rules

- **One tag per test** — `{ tag: '@smoke' }`
- **Never on `test.describe()`** — tags go on individual tests only
- **`@destructive` and `@flaky`** are the only tags that can be added alongside an importance tag
- **`@functional` is forbidden** — use `@smoke`, `@sanity`, or `@regression` instead

```typescript
// Correct
test('should login', { tag: '@smoke' }, async ({ loginPage }) => { ... });

// Correct — accessibility test
test('login page meets WCAG 2.1 AA', { tag: '@a11y' }, async ({ loginPage, a11yScan }) => { ... });

// Correct — visual regression test
test('menu page matches baseline', { tag: '@visual' }, async ({ menuPage }) => { ... });

// Correct — destructive test that modifies shared state
test('should delete order', { tag: ['@regression', '@destructive'] }, async ({ adminPage }) => {
  // ... test code
  // afterEach or afterAll MUST clean up the deleted order
});

// Correct — confirmed flaky test routed to the quarantine job
test('should sync cart', { tag: ['@regression', '@flaky'] }, async ({ cartPage }) => { ... });

// WRONG — multiple importance tags
test('should login', { tag: ['@smoke', '@e2e'] }, async ({ loginPage }) => { ... });
```

---

## API Testing

API tests use the `api` fixture (powered by [`pw-api-plugin`](https://github.com/sclavijosuero/pw-api-plugin)) and validate responses with Zod schemas.

The `api` fixture provides `get`, `post`, `put`, `patch`, `delete`, `head`, and `fetch` methods that return a raw Playwright `APIResponse`.

```typescript
import { test, expect } from '../../../fixtures/pom/test-options';
import { CoffeeListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';
import { config } from '../../../config/coffee-cart';
import { COFFEE_CART_API_ENDPOINTS } from '../../../enums/coffee-cart/coffee-cart';

test('should return coffee menu', { tag: '@api' }, async ({ api }) => {
  await test.step('WHEN fetching the coffee menu', async () => {
    const response = await api.get(`${config.apiUrl}${COFFEE_CART_API_ENDPOINTS.COFFEES}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    CoffeeListResponseSchema.parse(body); // Throws if response doesn't match schema
  });
});
```

### POST / DELETE examples

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// POST with body
const response = await api.post(`${config.apiUrl}/api/cart`, {
  data: { name: CoffeeNames.ESPRESSO },
});
expect(response.status()).toBe(201);

// DELETE with URL parameter
const response = await api.delete(
  `${config.apiUrl}/api/cart/${encodeURIComponent(CoffeeNames.ESPRESSO)}`,
);
expect(response.status()).toBe(200);
```

### API Logging with `LOG_API_UI`

The `api` fixture integrates with `pw-api-plugin` for visual request/response logging in Playwright UI, Trace Viewer, and HTML reports. **Logging is off by default** — no browser is launched for API-only tests.

| `LOG_API_UI` value | Behavior                                                      | Performance                                |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------ |
| `false` (default)  | API calls work normally, no visual logging                    | Fast (~3-50ms/test)                        |
| `true`             | Rich request/response cards in Playwright UI and Trace Viewer | Slower (~150-200ms/test, browser required) |

**Toggle per-run:**

```powershell
# Normal run (fast, no logging)
npx playwright test tests/coffee-cart/api/ --project=chromium

# ── PowerShell (Windows) ──────────────────────────────────────────────
# Debug run with API logging in Trace Viewer
$env:LOG_API_UI="true"; npx playwright test tests/coffee-cart/api/ --project=chromium --trace on

# Debug a single failing API test with visual logging
$env:LOG_API_UI="true"; npx playwright test tests/coffee-cart/api/cart-api.spec.ts --project=chromium --debug

# Reset after debugging (so subsequent runs don't launch browsers)
$env:LOG_API_UI="false"

# ── Bash / macOS / Linux ──────────────────────────────────────────────
# LOG_API_UI=true npx playwright test tests/coffee-cart/api/ --project=chromium --trace on
```

The env var is set in `env/.env.dev` (defaults to `false`). Override it on the command line when you need to inspect API calls visually.

> **How it works:** The fixture conditionally passes `page` to `pwApi` based on the env var. When `LOG_API_UI=false`, the fixture only destructures `request` from Playwright — the browser → context → page fixture chain is never triggered, so no browser launches. When `LOG_API_UI=true`, `page` is included and `pwApi` renders HTML cards with syntax-highlighted request/response data.

### HTML report attachments and theme (`LOG_API_REPORT`, `COLOR_SCHEME`)

The upstream plugin also supports:

| Variable             | Purpose                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`LOG_API_REPORT`** | Set to **`true`** to attach API call details to the **HTML report** (see [pw-api-plugin README](https://github.com/sclavijosuero/pw-api-plugin)). Default is off — enable when you want report artifacts without opening Trace Viewer. |
| **`COLOR_SCHEME`**   | **`light`** (default), **`dark`**, or **`accessible`** — theme for plugin cards in UI, trace, and HTML report.                                                                                                                         |

These are read by **pw-api-plugin**; set them in `env/.env.<TEST_ENV>` or the shell for the run. They work together with **`LOG_API_UI`** as described in the [plugin documentation](https://github.com/sclavijosuero/pw-api-plugin).

---

## Zod Schemas

API response schemas use Zod `z.strictObject()` — never `z.object()`:

```typescript
import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

export const CoffeeSchema = z.strictObject({
  name: z.string(),
  price: z.number().positive(),
  recipe: z.array(RecipeItemSchema).min(1),
  discounted: z.boolean().optional(),
});

export type Coffee = zOutput<typeof CoffeeSchema>;
```

`z.strictObject()` rejects unknown keys at runtime, catching API contract changes that `z.object()` would silently ignore.

Schemas live in `fixtures/api/schemas/coffee-cart/`:

| Schema file         | What it validates                                           |
| ------------------- | ----------------------------------------------------------- |
| `coffeeSchema.ts`   | `GET /api/coffees` — menu items with recipe ingredients     |
| `cartSchema.ts`     | Cart responses — `[{name, quantity}]` arrays                |
| `checkoutSchema.ts` | `POST /api/checkout` — request payload and order response   |
| `orderSchema.ts`    | `GET /api/orders` — persisted orders with snake_case fields |

---

## Enums

Use enums for repeated string values instead of hardcoding:

```typescript
// enums/coffee-cart/coffee-cart.ts
export enum CoffeeCartRoutes {
  MENU = '/',
  CART = '/cart',
  LOGIN = '/login',
}
```

Enums live in `enums/coffee-cart/` for app-specific values and `enums/util/` for shared values like roles.

---

## Configuration

### Multi-environment support

The framework supports multiple environments via the `TEST_ENV` variable. Each environment has its own `.env` file:

| Environment     | File                  | Usage                                 |
| --------------- | --------------------- | ------------------------------------- |
| `dev` (default) | `env/.env.dev`        | Local development against `localhost` |
| `staging`       | `env/.env.staging`    | Deployed staging environment          |
| `production`    | `env/.env.production` | Production smoke tests only           |

```bash
# Run against staging
npm run test:env:staging

# Run smoke tests against production
npm run test:env:production

# Or set TEST_ENV directly in PowerShell
$env:TEST_ENV="staging"; npx playwright test --grep "@smoke"
```

App configuration reads from these env files:

```typescript
// config/coffee-cart.ts
export const config = {
  env: testEnv, // 'dev' | 'staging' | 'production'
  appUrl: process.env.APP_URL,
  apiUrl: process.env.API_URL,
};
```

### Playwright config highlights

| Setting        | Value                                        |
| -------------- | -------------------------------------------- |
| Test timeout   | 30 seconds                                   |
| Expect timeout | 5 seconds                                    |
| Parallel       | Fully parallel                               |
| Retries        | 0 local, 2 in CI                             |
| Traces         | On first retry                               |
| Screenshots    | On failure only                              |
| Video          | Retained on failure                          |
| Base URL       | `APP_URL` env var or `http://localhost:5273` |
| Browsers       | Chromium, Firefox, WebKit                    |

---

## Running Tests

```bash
# Run all Chromium tests
npm test

# Run smoke tests only
npm run test:smoke

# Run a specific file
npx playwright test tests/coffee-cart/functional/menu.spec.ts

# Run by tag
npx playwright test --grep "@regression"

# Run headed (see the browser)
npx playwright test --headed --project=chromium

# Run with trace enabled
npx playwright test --trace on

# Run with a single worker (sequential)
npx playwright test --workers=1
```

### Interactive Test Selection

Instead of typing file paths or grep patterns, use `playwright-cli-select` to browse and pick tests from a searchable list:

```bash
# Full interactive prompt (choose specs, titles, or tags)
npm run select

# Re-run only previously failed tests
npm run select:failed

# Pick tests, then open in Playwright UI / headed mode
npm run select:ui
npm run select:headed
```

**Keyboard controls:** Arrow keys to navigate, Tab to toggle selection, type to filter the list, Enter to run selected tests, Ctrl+C to cancel.

### Generating a test stub

Use `npm run generate:test` to scaffold a framework-compliant test file from a template instead of starting from scratch. The generator fills in the correct imports, describe block, `beforeEach`, and Given/When/Then steps — you fill in the TODOs.

```bash
# functional test (UI feature test)
npm run generate:test -- --type functional --area coffee-cart --name stores

# API test
npm run generate:test -- --type api --area coffee-cart --name promotions

# E2E journey test
npm run generate:test -- --type e2e --area coffee-cart --name guest-checkout

# See all options
npm run generate:test -- --help
```

Each command creates the file at the correct path (`tests/{area}/{type}/{name}.spec.ts`) and prints next steps pointing you to `playwright-cli` for exploration. Templates live in `scripts/templates/`.

For a full walkthrough with worked examples for all three types, see [docs/usage/test-generator-usage.md](docs/usage/test-generator-usage.md).

### Interactive onboarding

For new contributors, `npm run onboard` walks through the framework interactively — running smoke, a11y, and visual tests live, then demonstrating `playwright-cli` and the test generator.

```bash
# Assumes the Coffee Cart app is already running at http://localhost:5273
npm run onboard
```

### Plan-backed manual verification

When a UI feature is implemented and you want to confirm the branch still matches its intended behavior before merge, use the `trust-but-verify` skill.

- It is meant for frontend or user-visible changes, not backend-only or API-only work
- It reviews the branch diff, PR context, and expected behavior notes, then verifies the live app with `playwright-cli`
- It stays in verification mode: it should report findings, not silently fix code during the same pass
- It writes a structured verification report to `docs/verification/YYYY-MM-DD-<branch-slug>.md`
- Screenshot evidence can be stored under `docs/verification/screenshots/<branch-slug>/`

Use it when you want higher confidence that a completed feature branch, demo flow, or roadmap item matches the intended UX in the browser instead of only passing tests.

For trigger guidance and example prompts for this and the other repo skills, see the [Skills Usage Playbook](usage/skills-guide.md).
For report naming, screenshot layout, and commit guidance, see [docs/verification/README.md](verification/README.md).

---

## Reports

Every test run generates all report formats automatically:

| Reporter         | Output                                | View Command                    |
| ---------------- | ------------------------------------- | ------------------------------- |
| **List**         | Console                               | (automatic)                     |
| **HTML**         | `playwright-report/`                  | `npm run report:html`           |
| **JUnit**        | `test-results/junit.xml`              | Open file directly or use in CI |
| **JSON**         | `test-results/results.json`           | Open file directly              |
| **Smart Report** | `playwright-report/smart-report.html` | `npm run report:smart`          |

**Local dev** runs three reporters (List, HTML, Smart Reporter) for fast feedback. **CI** runs five (adds JUnit, JSON) for artifact publishing and dashboards.

To generate only one report format, use the single-reporter scripts:

```bash
npm run test:junit    # JUnit XML only
npm run test:json     # JSON only
npm run test:smart    # Smart Reporter only
```

### Smart Reporter

The [Smart Reporter](https://github.com/qa-gary-parker/playwright-smart-reporter) is vendored in `tools/playwright-smart-reporter/` and generates an interactive HTML dashboard with flakiness detection, stability scoring, trend charts, failure clustering, and AI-powered fix suggestions.

**First-time setup:**

```bash
npm run build:smart-reporter
```

**AI failure analysis** — the reporter can generate fix suggestions for failing tests using a local or cloud AI provider. Providers are checked in order:

1. **LM Studio** (local, no API key) — default `http://127.0.0.1:1234`
2. **Anthropic** — `ANTHROPIC_API_KEY`
3. **OpenAI** — `OPENAI_API_KEY`
4. **Gemini** — `GEMINI_API_KEY`

To use LM Studio, install [LM Studio](https://lmstudio.ai/), load a model (7–8B recommended for speed), and start the local server. No configuration needed if using the default port.

**Configuration** — copy the example settings file and customize:

```bash
cp playwright-report-settings.example.json playwright-report-settings.json
```

Key settings: `smartReporterMaxTokens` (default 512), `lmStudioModel`, `enableAIRecommendations`. Environment variables override the file — see [Smart Reporter — Manual Testing Guide](testing/smart-reporter-testing.md) and `playwright-report-settings.example.json` for the most relevant options.

**In-report Settings** — click the gear icon (&#9881;) in the report header to open the Settings page. Three tabs let you configure AI / LM Studio options, report display options, and advanced thresholds. Changes are saved to `localStorage` and persist across page reloads. Click "Download playwright-report-settings.json" to export a settings file — place it in your project root and `getSmartReporterOptions()` in `playwright.config.ts` will read it on the next test run.

**Trace viewer** — for inline trace viewing, use `npm run report:smart:serve` instead of opening the file directly (avoids `file://` restrictions).

---

## Accessibility Testing

Accessibility tests use `@axe-core/playwright` to validate WCAG 2.1 AA compliance. The `a11yScan` fixture is available in all tests and wraps axe-core with sensible defaults.

```typescript
import { test, expect } from '../../../fixtures/pom/test-options';

test('login page meets WCAG 2.1 AA', { tag: '@a11y' }, async ({ loginPage, a11yScan }) => {
  await test.step('GIVEN user is on the login page', async () => {
    await loginPage.goto();
    await expect(loginPage.submitButton).toBeVisible();
  });

  await test.step('THEN the page passes WCAG 2.1 AA', async () => {
    await a11yScan();
  });
});
```

### Scan options

```typescript
// Scope the scan to a specific element (e.g., a modal)
await a11yScan({ include: '[role="dialog"]' });

// Exclude a region
await a11yScan({ exclude: ['.cookie-banner'] });

// Disable a specific rule (use sparingly — document why)
// FIXME: #dc2626 on #fef2f2 = 4.41:1, below required 4.5:1 — app-level bug
await a11yScan({ disableRules: ['color-contrast'] });
```

### Demo: seeing a real violation

The Coffee Cart app supports `?a11ybreak=1` — a URL param that overrides `--primary` to near-white, creating two instant color-contrast failures on the login page.

```bash
# Run the DEMO test — it PASSES by asserting violations ARE detected
npx playwright test tests/coffee-cart/functional/accessibility.spec.ts \
  --project=chromium --grep "a11ybreak"

# Open Smart Reporter to see the full axe violation output format
npm run report:smart
```

See `tests/coffee-cart/functional/accessibility.spec.ts` for the full implementation.

### Smart Reporter Accessibility view

`a11y-fixture.ts` pushes two annotations per test:

- `axe-violations` — violation count (e.g., `"2 violations"`)
- `axe-violation-rules` — JSON array of `{ id, impact }` tuples (e.g., `[{"id":"color-contrast","impact":"serious"}]`)

The Smart Reporter reads these annotations at report generation time to populate the **♿ Accessibility** nav item. The view shows a summary bar, rule breakdown table, affected test list, and a cross-run trend chart.

### Per-test artifact for CI

`a11y-fixture.ts` teardown also writes `test-results/axe-results/{safe-test-name}.json` for every test that calls `a11yScan()`. Run `npm run report:axe` after a test run to merge these per-test files into a single `test-results/axe-results.json` suitable for CI tooling (PR comments, DataDog, Grafana). Per-test files prevent race conditions from parallel workers writing to the same file simultaneously.

---

## Visual Regression Testing

Screenshot comparison tests catch unintended UI changes. Baselines are generated on the first run and stored in a `*-snapshots/` directory next to the test file.

```typescript
await expect(page).toHaveScreenshot('menu-page.png', {
  maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
  animations: 'disabled', // Freeze CSS animations
});

// Mask dynamic content (e.g., form fields with random data)
await expect(page).toHaveScreenshot('checkout.png', {
  mask: [paymentDetails.nameInput, paymentDetails.emailInput],
});
```

### Updating baselines

When UI changes are intentional, update baselines:

```bash
npx playwright test --update-snapshots
```

Visual regression tests are in `tests/coffee-cart/functional/visual-regression.spec.ts`.

---

## Performance Testing

Performance tests assert that pages load within budget thresholds using browser Performance APIs.

```typescript
// Navigation timing
const timing = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  return { domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime };
});
expect(timing.domContentLoaded).toBeLessThan(2000);

// Resource size budgets
const resources = await page.evaluate(() => {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  return entries.reduce((sum, r) => sum + (r.transferSize || 0), 0);
});
expect(Math.round(resources / 1024)).toBeLessThan(1024); // Under 1 MB
```

Performance tests are in `tests/coffee-cart/functional/performance.spec.ts`.

---

## Network Mocking

The `networkMock` fixture provides helpers for simulating network errors, offline mode, and intercepted responses. Use it to test how the UI handles backend failures.

```typescript
test('should handle API errors', { tag: '@regression' }, async ({ networkMock, page }) => {
  // Simulate a 500 error on the coffees API
  await networkMock.simulateServerError('**/api/coffees');
  await page.reload();
  await expect(page).toHaveURL(/\/(?:menu|home|$)/);
});
```

### Available methods

| Method                                 | What It Does                                                 |
| -------------------------------------- | ------------------------------------------------------------ |
| `simulateServerError(url)`             | Returns HTTP 500 for matching requests                       |
| `simulateTimeout(url)`                 | Aborts matching requests (simulates timeout)                 |
| `goOffline()`                          | Blocks all network requests                                  |
| `goOnline()`                           | Removes all route overrides (restores network)               |
| `blockRequests(url)`                   | Aborts matching requests (e.g., images, third-party scripts) |
| `mockJsonResponse(url, json, status?)` | Returns custom JSON for matching requests                    |

### Rules

- **Only mock your own API for error simulation** — never for happy-path tests
- Mock third-party services freely (payment providers, analytics, CDNs)
- The fixture automatically cleans up all routes after each test

Network error tests are in `tests/coffee-cart/functional/network-error.spec.ts`.

---

## CI/CD

The framework includes ready-to-use pipeline configs for both GitHub Actions and CircleCI.

### GitHub Actions (`.github/workflows/playwright.yml`)

| Trigger            | What Runs                                                                      | Sharding |
| ------------------ | ------------------------------------------------------------------------------ | -------- |
| Pull request       | Lint + **Sauce Demo** smoke by default; see **optional full regression** below | No\*     |
| Push to main       | Lint + Sauce Demo smoke + **Coffee Cart** sharded regression + quarantine      | 4 shards |
| Nightly (2 AM UTC) | Same as push to `main` (lint, Sauce Demo smoke, Coffee Cart regression)        | 4 shards |

\* **Optional full regression on PRs** — job `detect-full-regression` sets `run_full` when the PR **changes** any of `tests/**`, `playwright.config.ts`, or `.github/workflows/playwright.yml` (vs base branch), **or** when the PR has label **`ci:full`** or **`run-regression`**. When `run_full` is true, the workflow also runs the Coffee Cart regression matrix, **`merge-reports`**, and **`quarantine`** (same as push). The workflow listens for `pull_request` types **`labeled`** and **`unlabeled`** so adding or removing those labels triggers a new run without pushing a commit.

On **push**, **schedule**, and **pull_request** runs where full regression executes, regression shards upload blob reports; the `merge-reports` job merges blobs into **HTML**, **JSON** (`test-results/results.json`), and **JUnit** (`test-results/junit.xml`, via `PLAYWRIGHT_JUNIT_OUTPUT_FILE` and `npx playwright merge-reports --reporter junit`), then runs `scripts/detect-flaky.js` to identify tests that failed on attempt 1 but passed on retry. Results are written to `test-results/flaky-tests.json` and uploaded as the `flaky-report` artifact. Regression jobs clone [coffee-cart](https://github.com/dwelsh1/coffee-cart), install native build tools for `better-sqlite3`, and start the API plus Vite (`node server/index.js` and `npm run dev`) because Coffee Cart’s `npm start` script is Windows-only.

The `quarantine` job runs tests tagged `@flaky` in isolation with `continue-on-error: true` at the job level — it never fails the build. Results are uploaded as `quarantine-report` (7-day retention).

### CircleCI (`.circleci/config.yml`)

| Workflow                    | What Runs                                  | Sharding              |
| --------------------------- | ------------------------------------------ | --------------------- |
| `pr-checks` (every push)    | Lint + smoke tests                         | No                    |
| `nightly-regression` (cron) | Lint + regression tests + quarantine tests | 4 parallel containers |

CircleCI uses `CIRCLE_NODE_INDEX`/`CIRCLE_NODE_TOTAL` for built-in sharding and `store_test_results` with JUnit for test insights. The regression job also runs `detect-flaky.js` after tests complete and stores `flaky-tests.json` as an artifact.

### Flaky test workflow

When a test is confirmed intermittent:

1. Add `@flaky` alongside its existing tag: `{ tag: ['@regression', '@flaky'] }`
2. Push — the quarantine job picks it up automatically and runs it non-blockingly with 3 retries
3. Monitor the `quarantine-report` artifact to track stability over time
4. Once stable, remove the `@flaky` tag to return it to the main suite

The `flaky-report` artifact (`test-results/flaky-tests.json`) is also generated on every regression run — even when no flaky tests are detected it writes `[]`, so the artifact is always present for diffing.

### Artifacts

Both pipelines upload:

- **HTML report** — interactive Playwright report
- **Test results** — traces, screenshots, videos (on failure)
- **JUnit XML** — for CI dashboards and test insights
- **flaky-report** — `flaky-tests.json` listing any tests that passed only on retry
- **quarantine-report** — HTML report for `@flaky`-tagged tests

### Docker image

All CI jobs use `mcr.microsoft.com/playwright:v1.59.1-noble` for consistent font rendering and browser behavior. **Update the image tag when upgrading `@playwright/test`.**

### Dev Container

The `.devcontainer/` directory provides a one-click containerized development environment via VS Code Dev Containers or GitHub Codespaces.

**What it includes:**

- Playwright Docker image with pre-installed browsers
- Node.js **22.22.2** (see **`.nvmrc`**)
- VS Code extensions: Playwright, ESLint, Prettier
- Named volumes for `node_modules` and CLI browser cache (avoids slow bind-mount I/O)
- Auto-forwarded ports for the app (5273) and API (3002)
- Post-create script runs `npm ci`, builds the Smart Reporter, and sets up env files

**To use:** Open the project in VS Code, then click "Reopen in Container" when prompted (or run `Dev Containers: Reopen in Container` from the command palette).

### VS Code Tasks and Snippets

The `.vscode/` directory ships two productivity files that work in any setup (local or Dev Container).

**Tasks** (`.vscode/tasks.json`) — run common commands without opening a terminal:

- **Where the files live**
  - `.vscode/tasks.json` defines the runnable task list
  - `.vscode/extensions.json` recommends the Playwright, ESLint, and Prettier extensions when the workspace opens in VS Code
- **How to run tasks**
  - Press `Ctrl+Shift+P` → **Tasks: Run Task** → choose a task label
  - Or open the terminal menu in VS Code and select **Run Task...**
  - Tasks open in the integrated terminal using the panel behavior defined in `.vscode/tasks.json`
- **Most useful task labels**
  - `Test: Run All` — runs `npm test`
  - `Test: Smoke (Chromium)` — fast critical-path verification
  - `Test: Current File (Chromium)` — runs the file currently focused in the editor
  - `Test: Update Visual Baselines` — refreshes Chromium visual snapshots
  - `Lint` — runs `npm run lint`
  - `Report: Open Smart Reporter` — opens the Smart Reporter after a run
  - `Report: Serve Smart Reporter (Coffee Cart)` — serves the report with trace-viewer support
  - `Kill: Playwright Processes` — cleans up orphaned test processes
- **How `Ctrl+Shift+B` behaves**
  - `Ctrl+Shift+B` runs the default **build** task in VS Code
  - In this repo, the default build task is `Lint`
  - Test tasks are available through **Tasks: Run Task** or **Tasks: Run Test Task**
- **How to customize or add your own tasks**
  - Open `.vscode/tasks.json`
  - Duplicate a nearby task object that matches the behavior you want
  - Change the `label` to the name you want to see in VS Code
  - Change the `command` to the npm script or shell command you want to run
  - Optionally adjust `group` and `presentation`:
    - use `group: "test"` for test-oriented tasks
    - use `group: { "kind": "build", "isDefault": true }` only for the one task you want on `Ctrl+Shift+B`
    - keep `panel: "shared"` for reusable terminals and `panel: "dedicated"` for long-lived browser tooling commands

**Snippets** (`.vscode/playwright.code-snippets`) — type a prefix and press `Tab`:

- All snippets use framework conventions — correct imports, constructor locators, `api` fixture, `networkMock` fixture
- Key prefixes: `pwtest` (full file), `pwt` (single test), `pom` (page object class), `ge` (constructor locator line), `req` (API test), `rou` (network mock), `pwschema` (Zod schema), `pwfactory` (Faker factory)
- Full prefix list in the [Framework Cheatsheet](framework-cheatsheet.md#vs-code-integration)

---

## Code Quality

```bash
npm run lint       # Check for lint issues
npm run lint:fix   # Auto-fix lint issues
npm run format     # Format with Prettier
```

The project uses ESLint with TypeScript and Playwright plugins, plus Prettier for formatting. Husky + lint-staged can be configured to run these checks automatically on commit.

---

## TypeScript Best Practices

These examples use real patterns from the Coffee Cart framework. Follow them to avoid lint errors and keep code consistent.

### Use `??` for null/undefined, `||` only for empty-string fallback

Playwright methods like `textContent()` return `string | null`. Use `??` so empty strings are preserved.

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// ✅ Correct — textContent() returns string | null
const text = (await menuPage.getCoffeeCard(CoffeeNames.ESPRESSO).textContent()) ?? '';

// ❌ Wrong — || treats empty string '' as falsy
const text = (await menuPage.getCoffeeCard(CoffeeNames.ESPRESSO).textContent()) || '';

// ✅ Correct — env vars: intentionally treat '' as falsy, suppress lint
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const baseUrl = process.env['APP_URL'] || 'http://localhost:5273';
```

### Use bracket notation for index signatures

`tsconfig.json` enables `noPropertyAccessFromIndexSignature`, which requires bracket notation for `process.env`, `Record<string, unknown>`, and other index-signature types.

```typescript
// ✅ Correct — bracket notation for process.env (index signature)
const apiUrl = process.env['API_URL'];

// ❌ Wrong — dot notation on index signature
const apiUrl = process.env.API_URL;

// ✅ Correct — bracket notation for Record<string, unknown>
const token = body['token'] as string;

// ❌ Wrong — dot notation on Record
const token = body.token as string;
```

### Handle `undefined` from array index access

`tsconfig.json` enables `noUncheckedIndexedAccess`, so array element access returns `T | undefined`. Use `!` non-null assertion for static data arrays you know are populated, or add a guard.

```typescript
// ✅ Correct — non-null assertion for static test data
const invalidCreds = invalidLoginData[0]!;

// ✅ Correct — fallback for unknown data
const firstItem = items[0] ?? defaultItem;
```

### Never use `any` — use Zod types or explicit interfaces

```typescript
// ✅ Correct — Zod schema gives you a typed response
import { CoffeeSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';
const coffee = CoffeeSchema.parse(body);
// coffee.name is string, coffee.price is number — fully typed

// ✅ Correct — explicit interface for page method returns
async getStatNumericValue(statName: string): Promise<number> {
  const text = await this.getStatValue(statName).textContent();
  return parseInt(text?.replace(/[^0-9]/g, '') ?? '0', 10);
}

// ❌ Wrong — any bypasses all type checking
const coffee: any = await response.json();
```

### Only use `async` when the function contains `await`

`test.step()` callbacks that only have synchronous `expect()` calls don't need `async`.

```typescript
// ✅ Correct — no await inside, so no async
await test.step('GIVEN valid credentials', () => {
  expect(email).toBeTruthy();
  expect(password).toBeTruthy();
});

// ✅ Correct — contains await, so async is needed
await test.step('WHEN user adds coffee to cart', async () => {
  await menuPage.addToCart(CoffeeNames.ESPRESSO);
});

// ❌ Wrong — async with no await triggers require-await
await test.step('GIVEN valid credentials', async () => {
  expect(email).toBeTruthy();
});
```

### Await route handlers in network mocks

Playwright `route.fulfill()` and `route.abort()` return promises. Always `await` them inside `async` handlers.

```typescript
// ✅ Correct — await the route method
await page.route('**/api/coffees', async (route) => {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Internal Server Error' }),
  });
});

// ❌ Wrong — returns a dangling promise (no-misused-promises)
await page.route('**/api/coffees', (route) => route.fulfill({ status: 500, body: '{}' }));
```

### Use `getCartCount()` directly — it already returns `number`

Don't wrap methods that return `number` in `parseInt()`.

```typescript
// ✅ Correct — getCartCount() returns Promise<number>
const count = await header.getCartCount();
expect(count).toBeGreaterThan(0);

// ❌ Wrong — parseInt expects string, getCartCount returns number
const count = parseInt(await header.getCartCount(), 10);
```

### Use factory overrides with `??`, not `||`

Factory functions accept optional overrides. Use `??` so callers can pass `0`, `false`, or `''` as valid values.

```typescript
// ✅ Correct — ?? preserves 0 and false as valid overrides
export const generateCheckoutData = (overrides?: {
  name?: string;
  email?: string;
  subscribe?: boolean;
}) => ({
  name: overrides?.name ?? faker.person.fullName(),
  email: overrides?.email ?? faker.internet.email(),
  subscribe: overrides?.subscribe ?? faker.datatype.boolean(),
});

// ❌ Wrong — || treats 0, false, '' as falsy
name: overrides?.name || faker.person.fullName(),
subscribe: overrides?.subscribe || true,  // can never pass false!
```

### Use `z.strictObject()` for API schemas, never `z.object()`

Strict schemas reject unexpected fields — catches API contract changes early.

```typescript
// ✅ Correct — rejects unknown keys
export const CoffeeSchema = z.strictObject({
  name: z.string(),
  price: z.number().positive(),
  recipe: z.array(RecipeItemSchema).min(1),
});

// ❌ Wrong — silently strips unknown keys
export const CoffeeSchema = z.object({
  name: z.string(),
  price: z.number(),
});
```

### Use web-first assertions, never manual waits

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// ✅ Correct — Playwright auto-waits and retries
await expect(menuPage.getCoffeeCard(CoffeeNames.ESPRESSO)).toBeVisible();
await expect(cartPage.totalDisplay).toHaveText(/\$\d+\.\d{2}/);

// ❌ Wrong — hard wait, flaky, wastes time
await page.waitForTimeout(2000);
expect(await menuPage.getCoffeeCard(CoffeeNames.ESPRESSO).isVisible()).toBe(true);
```

### Use fixtures, never manual instantiation

```typescript
// ✅ Correct — page objects injected via fixtures
test('should display coffees', async ({ menuPage, header }) => {
  await menuPage.goto();
  const count = await header.getCartCount();
  expect(count).toBe(0);
});

// ❌ Wrong — manual instantiation breaks dependency injection
test('should display coffees', async ({ page }) => {
  const menuPage = new MenuPage(page); // never do this
  const header = new HeaderComponent(page); // never do this
});
```

### Use existing methods, don't reinvent them

Before writing a helper, check if the page object already has the method.

```typescript
// ✅ Correct — AdminPage already has getStatNumericValue()
const orderCount = await adminPage.getStatNumericValue('Orders');

// ❌ Wrong — reinventing what the page object provides
const text = await page.locator('.stat-card:has-text("Orders") .value').textContent();
const orderCount = parseInt(text || '0', 10);
```

---

## Common Mistakes

These are the most frequent mistakes to avoid. The full list with examples is in [.claude/skills/common-tasks/SKILL.md](../.claude/skills/common-tasks/SKILL.md).

| Mistake                                          | Fix                                             |
| ------------------------------------------------ | ----------------------------------------------- |
| Import from `@playwright/test`                   | Import from `fixtures/pom/test-options`         |
| `new LoginPage(page)` in test                    | Use fixture: `async ({ loginPage }) => { ... }` |
| XPath selectors                                  | Use `getByRole()`, `getByLabel()`, etc.         |
| `await page.waitForTimeout(1000)`                | Use `await expect(locator).toBeVisible()`       |
| `const data: any = ...`                          | Use Zod types or explicit interfaces            |
| `z.object({ ... })`                              | Use `z.strictObject({ ... })`                   |
| Hardcoded credentials                            | Use `process.env.APP_PASSWORD`                  |
| Tag on `test.describe()`                         | Put tags on individual tests                    |
| `{ tag: '@functional' }`                         | Use `@smoke`, `@sanity`, or `@regression`       |
| JSDoc on locator properties                      | Only add JSDoc to action methods                |
| `expect(await locator.isVisible()).toBeTruthy()` | `await expect(locator).toBeVisible()`           |
| Hardcoded full URLs                              | Use relative paths with `baseURL`               |

---

## Multi-App Directory Contract

The framework is designed to host tests for multiple applications in the same repository. Each application gets its own subdirectory under every top-level layer.

### Directory layout per app

```
pages/{app-name}/                  Page objects specific to this app
pages/components/                  UI components specific to this app (not shared across apps)
tests/{app-name}/functional/       Functional (UI) tests
tests/{app-name}/api/              API tests
tests/{app-name}/e2e/              End-to-end journey tests
test-data/factories/{app-name}/    Faker-powered data factories
test-data/static/{app-name}/       Static JSON boundary/invalid data
fixtures/api/schemas/{app-name}/   Zod response schemas
enums/{app-name}/                  App-specific enums (routes, messages, names)
config/{app-name}.ts               App-specific URL / environment configuration
helpers/{app-name}/                App-specific helper functions
```

Shared infrastructure lives at:

```
fixtures/pom/test-options.ts       Single import point — all fixtures merged here
fixtures/pom/page-object-fixture.ts  Register all apps' page objects here
fixtures/helper/helper-fixture.ts  Setup/teardown fixtures (one file, all apps)
enums/util/                        Cross-app enums (roles, generic HTTP codes)
helpers/util/                      Cross-app utility functions
```

### Important rules

- **Coffee Cart is a demo app.** Its pages, components, and enums are coffee-cart-specific and are not shared with any future app. Do not import from `pages/coffee-cart/` or `enums/coffee-cart/` in another app's tests or fixtures.
- **`pages/components/` is per-app.** Each app's shared UI components (header, modals) live here. There is no cross-app component library.
- **Fixtures are merged, not duplicated.** When onboarding a new app, register its page objects in `fixtures/pom/page-object-fixture.ts` alongside existing ones. Tests from all apps draw from the same merged fixture set.
- **Credentials come from env vars.** Use `generateUserCredentials()` / `generateAdminCredentials()` from the app's factory, which reads `TEST_*` env vars with demo fallbacks. Never hardcode credentials.

### Onboarding a new app

1. Add `config/{app-name}.ts` following the pattern in [config/coffee-cart.ts](../config/coffee-cart.ts).
2. Create `pages/{app-name}/` with page objects and `pages/components/` entries for shared UI.
3. Register new page objects in [fixtures/pom/page-object-fixture.ts](../fixtures/pom/page-object-fixture.ts).
4. Add enums to `enums/{app-name}/` and factories to `test-data/factories/{app-name}/`.
5. Write tests in `tests/{app-name}/`.
6. Add app credentials to `.env.example` and CI secrets.
