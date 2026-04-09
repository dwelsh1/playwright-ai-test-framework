# Writing Full API Tests

**Audience:** Jr QA Engineers writing their first API test files in this framework.

API tests call the app's HTTP endpoints directly — no browser, no UI. They verify that the API returns the right status codes, the right response shape, and handles invalid input correctly. This guide walks from a generated stub to a complete, production-quality API spec.

---

## Table of Contents

1. [What API tests cover](#1-what-api-tests-cover)
2. [Generate the stub first](#2-generate-the-stub-first)
3. [The anatomy of an API test file](#3-the-anatomy-of-an-api-test-file)
4. [Building the URL correctly](#4-building-the-url-correctly)
5. [Making requests with the `api` fixture](#5-making-requests-with-the-api-fixture)
6. [Validating the response with Zod schemas](#6-validating-the-response-with-zod-schemas)
7. [Status code coverage — what to test](#7-status-code-coverage--what-to-test)
8. [Testing invalid inputs with static data](#8-testing-invalid-inputs-with-static-data)
9. [Stateful endpoints — serial mode and cleanup](#9-stateful-endpoints--serial-mode-and-cleanup)
10. [A complete worked example](#10-a-complete-worked-example)
11. [Common mistakes](#11-common-mistakes)

---

## 1. What API tests cover

API tests answer these questions:

- Does `GET /api/coffees` return `200` with a valid array of coffee objects?
- Does `POST /api/cart` return `201` when the item exists and `404` when it does not?
- Does `POST /api/checkout` return `400` when required fields are missing?
- Does the response body match the schema we expect?

API tests do not test the UI. They test the HTTP contract between the front end and the server. If an API test fails, it means the server's behaviour changed — not a UI selector problem.

---

## 2. Generate the stub first

Use the test generator to create the file in the right place with the right imports:

```bash
npm run generate:test -- --type api --area coffee-cart --name promotions
```

This creates `tests/coffee-cart/api/promotions.spec.ts` with the correct import line, a `test.describe` block, and placeholder `TODO` tokens to fill in.

See [Test Generator Usage](test-generator-usage.md) for a full walkthrough of the generator.

---

## 3. The anatomy of an API test file

A complete API spec has four sections at the top:

```typescript
// 1. ALWAYS import from here — never from @playwright/test
import { expect, test } from '../../../fixtures/pom/test-options';

// 2. Config for the base API URL
import { config } from '../../../config/coffee-cart';

// 3. Enums for endpoint paths (never hardcode '/api/coffees')
import { ApiEndpoints } from '../../../enums/coffee-cart/coffee-cart';

// 4. Zod schemas for response validation
import { CoffeeListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';
```

Then the tests:

```typescript
const COFFEES_URL = `${config.apiUrl}${ApiEndpoints.COFFEES}`;

test.describe('Menu API', () => {
  test('should fetch all coffees via GET /api/coffees', { tag: '@api' }, async ({ api }) => {
    await test.step('WHEN fetching the coffee menu', async () => {
      const response = await api.get(COFFEES_URL);

      expect(response.status()).toBe(200);
      const body = await response.json();
      CoffeeListResponseSchema.parse(body);
    });
  });
});
```

---

## 4. Building the URL correctly

Never hardcode the URL string directly:

```typescript
// WRONG — hardcoded URL breaks when config changes
const response = await api.get('http://localhost:3002/api/coffees');

// RIGHT — assembled from config and enum
import { config } from '../../../config/coffee-cart';
import { ApiEndpoints } from '../../../enums/coffee-cart/coffee-cart';

const response = await api.get(`${config.apiUrl}${ApiEndpoints.COFFEES}`);
```

`config.apiUrl` is the base URL read from environment variables (defaults to `http://localhost:3002` for local dev). `ApiEndpoints.COFFEES` is the path `/api/coffees`. Together they make the full URL.

Build the URL as a constant at the top of the describe block so it is not repeated in every test:

```typescript
const COFFEES_URL = `${config.apiUrl}${ApiEndpoints.COFFEES}`;
const CART_URL = `${config.apiUrl}${ApiEndpoints.CART}`;

test.describe('Cart API', () => {
  test('GET /api/cart', { tag: '@api' }, async ({ api }) => {
    const response = await api.get(CART_URL);
    // ...
  });
});
```

---

## 5. Making requests with the `api` fixture

The `api` fixture is available in any test via `async ({ api })`. It provides `get`, `post`, `put`, `patch`, `delete`, `head`, and `fetch` methods.

### GET request

```typescript
const response = await api.get(COFFEES_URL);
```

### POST with a JSON body

Use the `data` option to send a JSON body:

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

const response = await api.post(CART_URL, {
  data: { name: CoffeeNames.ESPRESSO },
});
```

### DELETE with a path parameter

Encode any special characters in the path (coffee names contain spaces):

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

const response = await api.delete(
  `${CART_URL}/${encodeURIComponent(CoffeeNames.ESPRESSO_MACCHIATO)}`,
);
```

### Reading the response

```typescript
const response = await api.get(COFFEES_URL);

// Check status code
expect(response.status()).toBe(200);

// Read the JSON body
const body = await response.json();

// Check a specific property without full schema validation
expect(body).toHaveProperty('error');
```

---

## 6. Validating the response with Zod schemas

Status code checks tell you the response was successful. Schema validation tells you the response body has the correct shape — all required fields present, all types correct, no unexpected extra fields.

Every API response should be validated with a Zod schema:

```typescript
import { CoffeeListResponseSchema } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';

const response = await api.get(COFFEES_URL);
expect(response.status()).toBe(200);
const body = await response.json();

// Parses and validates — throws with a clear message if shape is wrong
const coffees = CoffeeListResponseSchema.parse(body);

// Now `coffees` is fully typed — you can access fields safely
expect(coffees.length).toBeGreaterThan(0);
expect(coffees[0]!.price).toBeGreaterThan(0);
```

### What happens when schema validation fails

If the API response does not match the schema, `.parse()` throws a `ZodError` with a detailed message listing every field that failed:

```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "string",
    "path": ["0", "price"],
    "message": "Expected number, received string"
  }
]
```

This is the most useful error you can get from an API test — it tells you exactly which field changed and in what way.

### Existing schemas

| Schema file              | What it validates                                                        |
| ------------------------ | ------------------------------------------------------------------------ |
| `coffeeSchema.ts`        | `CoffeeSchema`, `CoffeeListResponseSchema`                               |
| `cartSchema.ts`          | `CartItemSchema`, `CartResponseSchema`                                   |
| `checkoutSchema.ts`      | `CheckoutRequestSchema`, `CheckoutResponseSchema`, `CheckoutOrderSchema` |
| `orderSchema.ts`         | `OrderSchema`, `OrdersListResponseSchema`                                |
| `errorResponseSchema.ts` | Standard `{ error: string }` error responses                             |

If you are testing an endpoint that does not have a schema yet, create one in `fixtures/api/schemas/coffee-cart/`. See the existing files above as templates.

---

## 7. Status code coverage — what to test

A complete API spec tests **every** response code the endpoint can return. Before writing tests, list them:

**`GET /api/coffees`:**

- `200` — success, returns coffee list

**`POST /api/cart`:**

- `201` — item added successfully
- `400` — missing or invalid `name` field
- `404` — coffee name not found in menu

**`DELETE /api/cart/:name`:**

- `200` — item decremented or removed
- `404` — item not in cart

Write at least one test per status code. Here is the pattern:

```typescript
test('should return 200 when fetching coffees', { tag: '@api' }, async ({ api }) => {
  await test.step('WHEN GET /api/coffees is called', async () => {
    const response = await api.get(COFFEES_URL);
    expect(response.status()).toBe(200);
    const body = await response.json();
    CoffeeListResponseSchema.parse(body);
  });
});

test('should return 404 when adding non-existent coffee', { tag: '@api' }, async ({ api }) => {
  await test.step('WHEN posting a coffee name that does not exist', async () => {
    const response = await api.post(CART_URL, {
      data: { name: 'Nonexistent Coffee' },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
```

If a status code is documented in the API spec but the endpoint does not behave as expected, do not skip the test — use `test.skip` with a comment:

```typescript
test.skip(true, '// FIXME: endpoint returns 200 instead of 404 for unknown coffee — app bug #42');
```

---

## 8. Testing invalid inputs with static data

For endpoints that accept a request body, test missing fields and invalid formats using the static JSON files in `test-data/static/coffee-cart/`.

The `invalidCheckout.json` file contains an array of bad payloads, each with a `description` field:

```typescript
import invalidCheckoutCases from '../../../test-data/static/coffee-cart/invalidCheckout.json';

test.describe('Checkout API — validation', () => {
  for (const testCase of invalidCheckoutCases) {
    test(`should return 400 for: ${testCase.description}`, { tag: '@api' }, async ({ api }) => {
      await test.step(`WHEN posting invalid payload: ${testCase.description}`, async () => {
        const response = await api.post(CHECKOUT_URL, { data: testCase });
        expect(response.status()).toBe(400);
      });
    });
  }
});
```

This creates one named test per entry. When a test fails you immediately know which invalid case caused it — the description is in the test name.

---

## 9. Stateful endpoints — serial mode and cleanup

The Cart API is stateful — it uses a shared server-side cart. If two tests run in parallel, one test's `POST /api/cart` can pollute another test's `GET /api/cart`. Fix this with two things:

**1. Configure serial mode** at the top of the describe block:

```typescript
test.describe('Cart API', () => {
  test.describe.configure({ mode: 'serial' });
  // ...
});
```

Serial mode makes tests in this describe block run one at a time instead of in parallel.

**2. Clear state in `beforeEach` and `afterEach`:**

```typescript
test.describe('Cart API', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ api }) => {
    await api.delete(CART_URL); // clear before each test starts
  });

  test.afterEach(async ({ api }) => {
    await api.delete(CART_URL); // clean up after each test ends
  });

  // ...tests...
});
```

`beforeEach` ensures each test starts from a known empty state. `afterEach` ensures failures in one test do not leave dirty state that breaks the next.

**Endpoints that need serial + cleanup:**

- `POST /api/cart` / `DELETE /api/cart` — shared cart state
- `POST /api/checkout` — creates orders that persist between tests

**Endpoints that do not need serial + cleanup:**

- `GET /api/coffees` — read-only, no state changes
- `GET /api/orders` — read-only (if not creating orders)

---

## 10. A complete worked example

Here is a full API spec for `GET /api/coffees` with schema validation and complete status code coverage. This is the pattern to follow for every new API spec.

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { config } from '../../../config/coffee-cart';
import { ApiEndpoints, CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';
import {
  CoffeeListResponseSchema,
  CoffeeSchema,
} from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';
import type { Coffee } from '../../../fixtures/api/schemas/coffee-cart/coffeeSchema';

const COFFEES_URL = `${config.apiUrl}${ApiEndpoints.COFFEES}`;

test.describe('Menu API', () => {
  test(
    'should return 200 and valid schema for GET /api/coffees',
    { tag: '@api' },
    async ({ api }) => {
      await test.step('WHEN fetching the coffee menu', async () => {
        const response = await api.get(COFFEES_URL);

        expect(response.status()).toBe(200);
        const body = await response.json();
        const coffees = CoffeeListResponseSchema.parse(body); // validates shape + types
        expect(coffees.length).toBeGreaterThan(0);
      });
    },
  );

  test('should return all required fields for each coffee', { tag: '@api' }, async ({ api }) => {
    let coffees: Coffee[];

    await test.step('WHEN fetching the coffee list', async () => {
      const response = await api.get(COFFEES_URL);
      const body = await response.json();
      coffees = CoffeeListResponseSchema.parse(body);
    });

    await test.step('THEN each coffee has name, price, and at least one recipe item', () => {
      for (const coffee of coffees!) {
        CoffeeSchema.parse(coffee);
        expect(coffee.name).toBeTruthy();
        expect(coffee.price).toBeGreaterThan(0);
        expect(coffee.recipe.length).toBeGreaterThan(0);
      }
    });
  });

  test('should include expected coffees in the menu', { tag: '@api' }, async ({ api }) => {
    let names: string[];

    await test.step('WHEN fetching coffees', async () => {
      const response = await api.get(COFFEES_URL);
      const body = await response.json();
      names = CoffeeListResponseSchema.parse(body).map((c) => c.name);
    });

    await test.step('THEN the menu contains expected coffees', () => {
      expect(names!).toContain(CoffeeNames.ESPRESSO);
      expect(names!).toContain(CoffeeNames.CAPPUCCINO);
    });
  });
});
```

---

## 11. Common mistakes

| Mistake                                                           | What to do instead                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `await api.get('http://localhost:3002/api/coffees')`              | Use `${config.apiUrl}${ApiEndpoints.COFFEES}`                            |
| No schema validation — only `expect(response.status()).toBe(200)` | Always call `Schema.parse(body)` after status check                      |
| Only testing the happy path                                       | Cover every status code the endpoint can return                          |
| Running cart tests in parallel                                    | Add `test.describe.configure({ mode: 'serial' })` for stateful endpoints |
| No `beforeEach`/`afterEach` cleanup for stateful tests            | Clear state before and after each test                                   |
| Importing from `@playwright/test`                                 | Import from `'../../../fixtures/pom/test-options'`                       |
| Hardcoding inline API payload values                              | Use `generateOrderPayload()` from the factory                            |
| Commenting out a failing assertion                                | Use `test.skip(true, '// FIXME: ...')` instead                           |

---

## See also

- [GraphQL API testing](graphql-api-testing.md) — `POST /api/graphql`, operation constants, Zod on `data` / `errors` (Coffee Cart demo)
- [Test Data Factories](test-data-factories.md) — how to use `generateOrderPayload` for request bodies
- [Understanding Fixtures](understanding-fixtures.md) — how the `api` and `createdOrder` fixtures work
- [Test Generator Usage](test-generator-usage.md) — generate the API stub with the correct template
- [Developer Guide](../developer.md) — Zod schemas, API fixture architecture, and creating new schemas
