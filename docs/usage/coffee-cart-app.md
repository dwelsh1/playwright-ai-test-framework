# Coffee Cart App — Test Guide

**Audience:** Jr QA Engineers — what the Coffee Cart app is, how to start it, and how tests are organized against it.

Coffee Cart is the primary demo app used to demonstrate the framework's full testing capabilities. It is a small coffee ordering web application that runs entirely on your local machine. This guide explains the app's structure, how to get it running, and how the framework's tests are organized against it.

---

## Table of Contents

1. [What is Coffee Cart?](#1-what-is-coffee-cart)
2. [Getting the app running](#2-getting-the-app-running)
3. [App structure — pages and API](#3-app-structure--pages-and-api)
4. [How tests connect to the app](#4-how-tests-connect-to-the-app)
5. [Test types covered](#5-test-types-covered)
6. [Running Coffee Cart tests](#6-running-coffee-cart-tests)
7. [Auth and the login page](#7-auth-and-the-login-page)
8. [The demo break parameters](#8-the-demo-break-parameters)
9. [Common mistakes](#9-common-mistakes)

---

## 1. What is Coffee Cart?

Coffee Cart is an open-source Vue.js application built specifically as a testing practice target. It has:

- A **menu page** listing available coffees with prices and recipe details
- A **cart** that persists items added from the menu
- A **checkout modal** for entering name and email before placing an order
- An **orders page** showing placed orders
- An **admin panel** for viewing and deleting orders
- A **login page** with separate user and admin roles
- A **REST API** running on a separate port

The app is self-contained. The API server uses a local SQLite database for orders and stores. The cart state, however, lives entirely in the Vue.js Vuex store (client-side in-memory) — it is never fetched from the server on page load, so cart contents are lost on a full page reload.

---

## 2. Getting the app running

Coffee Cart lives in its own repository alongside this framework:

```
d:/gitrepos/coffee-cart/               ← the app (separate repo)
d:/gitrepos/playwright-ai-test-framework/  ← this framework
```

Start the app from the `coffee-cart/` directory (not from the framework):

```bash
# From the coffee-cart/ directory:
npm start       # starts both the frontend (port 5273) and API server (port 3002)
```

Or start them separately:

```bash
npm run dev     # frontend only (port 5273)
npm run server  # API server only (port 3002)
```

Once running:

- **Frontend:** `http://localhost:5273`
- **API:** `http://localhost:3002`

The tests will fail immediately if the app is not running — you will see a "connection refused" error on the first navigation.

**Tip:** The framework's `playwright.config.ts` includes a `webServer` configuration that can start Coffee Cart automatically when tests run. Check your `env/.env.dev` file — the `COFFEE_CART_PATH` variable points to the app directory.

---

## 3. App structure — pages and API

### UI pages

| Page   | URL       | What it does                                       |
| ------ | --------- | -------------------------------------------------- |
| Menu   | `/`       | Lists all available coffees; clicking adds to cart |
| Cart   | `/cart`   | Shows items in cart with quantities and total      |
| Orders | `/orders` | Shows placed orders for the logged-in user         |
| Login  | `/login`  | User and admin login with email + password         |
| Admin  | `/admin`  | Admin-only dashboard with order management         |

### REST API endpoints

| Method   | Endpoint                  | Description                                                                                    |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET`    | `/api/coffees`            | Returns the full coffee menu                                                                   |
| `GET`    | `/api/cart`               | Returns current cart contents                                                                  |
| `POST`   | `/api/cart`               | Adds an item to the cart (`{ name: "Espresso" }`)                                              |
| `DELETE` | `/api/cart`               | Clears the entire cart                                                                         |
| `DELETE` | `/api/cart/:name`         | Decrements quantity by 1; removes item when quantity reaches 0                                 |
| `DELETE` | `/api/cart/:name/all`     | Removes all units of an item (always 200, no-op if item not in cart)                           |
| `POST`   | `/api/checkout`           | Places an order (`{ name, email, items }`)                                                     |
| `GET`    | `/api/orders`             | Returns all orders                                                                             |
| `GET`    | `/api/orders/:id`         | Returns a single order by ID                                                                   |
| `DELETE` | `/api/orders/:id`         | Deletes a specific order (admin)                                                               |
| `GET`    | `/api/stores`             | Returns all active pickup store locations                                                      |
| `GET`    | `/api/stores/:id`         | Returns a single store by numeric ID (400 for non-numeric, 404 for not found)                  |
| `POST`   | `/api/stores/nearest`     | Finds the nearest store to given `{ latitude, longitude }`                                     |
| `POST`   | `/api/stores/eligibility` | Checks if coordinates are within a store's pickup radius (`{ latitude, longitude, store_id }`) |
| `POST`   | `/api/stores/seed`        | Seeds deterministic Arizona store data (no-op if already present)                              |

> Full request/response shapes with examples: [`docs/api/coffee-cart-openapi.yaml`](../api/coffee-cart-openapi.yaml)

---

## 4. How tests connect to the app

Tests use the `config` object from `config/coffee-cart.ts` to build URLs — never hardcoded addresses:

```typescript
import { config } from '../../../config/coffee-cart';

// Builds the correct URL for the active environment
const COFFEES_URL = `${config.apiUrl}${ApiEndpoints.COFFEES}`;
// → http://localhost:3002/api/coffees (dev)
// → https://staging-api.coffee-cart.app/api/coffees (staging)
```

The config reads from the active `.env` file (`env/.env.dev` by default). Playwright's `baseURL` in `playwright.config.ts` is set to `config.appUrl`, so `page.goto('/')` resolves to `http://localhost:5273/`.

---

## 5. Test types covered

Coffee Cart is used to demonstrate every test type the framework supports:

| Test type         | Tag                     | Location                                                 | What it tests                                             |
| ----------------- | ----------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Functional        | `@smoke`, `@regression` | `tests/coffee-cart/functional/`                          | Individual pages: login, menu, cart, checkout, orders     |
| API               | `@api`                  | `tests/coffee-cart/api/`                                 | REST endpoints: coffees, cart, checkout, orders, stores   |
| E2E journey       | `@e2e`                  | `tests/coffee-cart/e2e/`                                 | Full flows: login → add → checkout → confirm → admin view |
| Accessibility     | `@a11y`                 | `tests/coffee-cart/functional/accessibility.spec.ts`     | WCAG 2.1 AA scanning on each page                         |
| Visual regression | `@visual`               | `tests/coffee-cart/functional/visual-regression.spec.ts` | Screenshot baselines for key pages                        |

### Page objects

The following page objects exist for Coffee Cart:

| Page object      | File                                            | What it covers                                  |
| ---------------- | ----------------------------------------------- | ----------------------------------------------- |
| `loginPage`      | `pages/coffee-cart/login.page.ts`               | Login form, submit, error messages              |
| `menuPage`       | `pages/coffee-cart/menu.page.ts`                | Coffee cards, add to cart, recipe view          |
| `cartPage`       | `pages/coffee-cart/cart.page.ts`                | Cart items, quantities, totals, checkout button |
| `ordersPage`     | `pages/coffee-cart/orders.page.ts`              | Orders list, empty state                        |
| `adminPage`      | `pages/coffee-cart/admin.page.ts`               | Admin dashboard, orders table, delete           |
| `header`         | `pages/components/header.component.ts`          | Navigation, cart count, logout                  |
| `paymentDetails` | `pages/components/payment-details.component.ts` | Checkout modal form and submit                  |
| `snackbar`       | `pages/components/snackbar.component.ts`        | Toast notification after checkout               |

Request them in tests via fixtures:

```typescript
async ({ loginPage, menuPage, cartPage, header, snackbar }) => {
```

---

## 6. Running Coffee Cart tests

```bash
# All tests (Coffee Cart + Sauce Demo)
npm test

# Coffee Cart only
npx playwright test tests/coffee-cart/ --project=chromium

# By type
npx playwright test tests/coffee-cart/functional/ --project=chromium
npx playwright test tests/coffee-cart/api/ --project=chromium
npx playwright test tests/coffee-cart/e2e/ --project=chromium

# By tag
npx playwright test --project=chromium --grep "@smoke"
npx playwright test --project=chromium --grep "@api"
npx playwright test --project=chromium --grep "@a11y"
```

---

## 7. Auth and the login page

Most Coffee Cart tests start as a logged-in user. The framework uses **storage state** to avoid logging in via the UI for every test.

Two auth setup files run automatically before tests:

- `tests/coffee-cart/auth.user.setup.ts` — logs in as a standard user, saves session to `.auth/coffee-cart/userStorageState.json`
- `tests/coffee-cart/auth.admin.setup.ts` — logs in as an admin, saves session to `.auth/coffee-cart/adminStorageState.json`

**Default credentials** (from `env/.env.dev`):

| Role          | Email               | Password   |
| ------------- | ------------------- | ---------- |
| Standard user | `user@example.com`  | `password` |
| Admin         | `admin@example.com` | `admin`    |

For a detailed explanation of how storage state works, see [Authentication & Storage State](authentication-storage-state.md).

---

## 8. The demo break parameters

Coffee Cart has two URL parameters baked into the app that instantly break it in predictable ways — useful for demonstrating failures in the Smart Reporter:

**`?a11ybreak=1`** — triggers two color-contrast violations:

```
http://localhost:5273/?a11ybreak=1
```

The primary button color drops to `#d4d4d4` (contrast ratio ~1.1:1), causing critical WCAG failures. The `[DEMO]` accessibility test uses this to show axe-core catching real violations.

**`?visualbreak=1`** — removes the Coffee Cart logo from the header:

```
http://localhost:5273/?visualbreak=1
```

The `[DEMO]` visual regression test captures a baseline with the logo present, then screenshots with `?visualbreak=1` to demonstrate a diff failure.

Both are permanent — no setup script needed. Any team member can trigger them by appending the parameter.

---

## 9. Common mistakes

| Mistake                                             | What to do instead                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Running tests without starting the app first        | Run `npm start` from the `coffee-cart/` directory before running tests        |
| Hardcoding `http://localhost:3002` in API tests     | Use `config.apiUrl` — it switches automatically per environment               |
| Hardcoding `http://localhost:5273` in UI tests      | Use `baseURL` (set automatically) or `config.appUrl`                          |
| Forgetting cleanup after E2E tests that add to cart | Add `test.afterEach` to empty the cart — the next test expects an empty state |
| Confusion about which port is the frontend vs API   | Frontend: `5273`, API: `3002` — check `env/.env.dev`                          |
| Auth setup not running (stale `.auth/` files)       | Delete `.auth/coffee-cart/*.json` and rerun — setup recreates them            |

---

## See also

- [Authentication & Storage State](authentication-storage-state.md) — storage state setup files and how to fix broken auth
- [Writing Full API Tests](writing-api-tests.md) — testing the Coffee Cart REST API
- [Writing E2E Journey Tests](writing-e2e-tests.md) — multi-page flows against Coffee Cart
- [Multi-Environment Testing](multi-environment-testing.md) — running against staging/production Coffee Cart
- [Developer Guide](../developer.md) — full Coffee Cart architecture and onboarding details
