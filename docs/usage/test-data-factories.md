# Test Data Factories

**Audience:** Jr QA Engineers — how to use factory functions and static data files in tests.

Tests need data to run — names, emails, coffee orders, credentials. This framework has two sources for that data: **factories** (functions that generate fresh, realistic data using Faker) and **static JSON files** (fixed boundary and invalid cases). This guide explains both, shows you how to use them, and tells you when to choose one over the other.

---

## Table of Contents

1. [Why not just hardcode values?](#1-why-not-just-hardcode-values)
2. [Factories — dynamic data with Faker](#2-factories--dynamic-data-with-faker)
3. [Using a factory in a test](#3-using-a-factory-in-a-test)
4. [Overriding specific fields](#4-overriding-specific-fields)
5. [The checkout factory — a complete example](#5-the-checkout-factory--a-complete-example)
6. [Static JSON files — boundary and invalid data](#6-static-json-files--boundary-and-invalid-data)
7. [Using static data in a test](#7-using-static-data-in-a-test)
8. [Choosing between factory and static data](#8-choosing-between-factory-and-static-data)
9. [Common mistakes](#9-common-mistakes)

---

## 1. Why not just hardcode values?

Hardcoded test data looks simple but causes real problems:

```typescript
// WRONG — hardcoded values
await loginPage.login('<fixed-login-email>', '<fixed-login-password>');
await paymentDetails.fillCheckout('<fixed-checkout-name>', '<fixed-checkout-email>');
```

Problems with this approach:

- If the app rejects duplicate names or emails (which some do), tests start failing randomly as the database fills up
- If the credentials change, you have to find and update every test that uses them
- Fixed inline values are meaningless — they do not tell you what boundary the test is checking

The factory approach solves all three problems:

```typescript
// RIGHT — generated data, unique every run
const { name, email } = generateCheckoutData();
await paymentDetails.fillCheckout(name, email);
```

---

## 2. Factories — dynamic data with Faker

Factories live in `test-data/factories/{area}/`. Each factory is a TypeScript file that exports one or more functions. The functions use **Faker** to generate realistic random values — proper names, real-looking email addresses, valid numbers.

The factories for Coffee Cart are in `test-data/factories/coffee-cart/`:

| File                  | What it generates                                                                   |
| --------------------- | ----------------------------------------------------------------------------------- |
| `checkout.factory.ts` | Checkout form data, user credentials, admin credentials, random coffees, cart items |
| `order.factory.ts`    | Full order API payloads with items and prices, validated against the Zod schema     |

---

## 3. Using a factory in a test

Import the function you need at the top of your test file and call it inside the test:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

test(
  'should complete checkout',
  { tag: '@smoke' },
  async ({ menuPage, cartPage, paymentDetails }) => {
    const { name, email } = generateCheckoutData();

    await test.step('GIVEN user has an item in cart', async () => {
      await menuPage.goto();
      await menuPage.addToCart(CoffeeNames.ESPRESSO);
      await menuPage.header.goToCart();
    });

    await test.step('WHEN user fills checkout form', async () => {
      await cartPage.checkout();
      await paymentDetails.fillCheckout(name, email);
      await paymentDetails.submit();
    });

    await test.step('THEN order confirmation is shown', async () => {
      await expect(snackbar.message).toBeVisible();
    });
  },
);
```

Call the factory **inside the test body**, not at the module level. If you call it at module level, all tests in the file share the same data for the entire test run — this defeats the purpose of generating fresh data per test.

```typescript
// WRONG — called at module level, shared across all tests
const { name, email } = generateCheckoutData();

test.describe('Checkout', () => {
  test('test one', async () => {
    /* uses shared name/email */
  });
  test('test two', async () => {
    /* same shared name/email */
  });
});

// RIGHT — called inside each test, fresh data per run
test.describe('Checkout', () => {
  test('test one', async () => {
    const { name, email } = generateCheckoutData();
    // ...
  });
});
```

---

## 4. Overriding specific fields

Every factory function accepts an optional `overrides` object. This lets you pin one field to a specific value while keeping all other fields randomly generated:

```typescript
// Pin the email to a specific value, generate everything else
const { name, email } = generateCheckoutData({ email: 'specific@example.com' });

// Pin both fields for a test that needs known credentials
const { email, password } = generateUserCredentials({
  email: process.env['TEST_USER_EMAIL'],
  password: process.env['TEST_USER_PASSWORD'],
});
```

The override pattern is useful when:

- Your test needs to assert on a specific value (e.g. "the order confirmation shows the email the user entered")
- The test needs to reproduce a bug that only happens with a particular input
- You need credentials from environment variables

Any field you do not override is still randomly generated by Faker.

---

## 5. The checkout factory — a complete example

Here are all the functions in `checkout.factory.ts` and when to use each:

### `generateCheckoutData(overrides?)`

Generates a name, email, and subscribe preference for filling out the checkout form.

```typescript
import { generateCheckoutData } from '../../../test-data/factories/coffee-cart/checkout.factory';

const { name, email, subscribe } = generateCheckoutData();
// name:      "Maria Gonzalez"   (random full name)
// email:     "maria.g83@example.net"  (random email)
// subscribe: true   (random boolean)
```

Use this for any test that fills in the payment details form.

### `generateUserCredentials(overrides?)`

Returns `{ email, password }` for a regular user. Reads from `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` environment variables if set, otherwise falls back to the demo app defaults.

```typescript
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';

const { email, password } = generateUserCredentials();
await loginPage.login(email, password);
```

Use this everywhere you need to log in as a regular user. The `beforeEach` in `auth.user.setup.ts` uses this to create the stored auth state.

### `generateAdminCredentials(overrides?)`

Same pattern as `generateUserCredentials`, but reads from `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`.

```typescript
const { email, password } = generateAdminCredentials();
await loginPage.loginAsAdmin(email, password);
```

### `generateRandomCoffee()`

Returns a random coffee name from the menu (as a `CoffeeNames` enum value):

```typescript
import { generateRandomCoffee } from '../../../test-data/factories/coffee-cart/checkout.factory';

const coffeeName = generateRandomCoffee();
// CoffeeNames.CAPPUCCINO, CoffeeNames.ESPRESSO, CoffeeNames.MOCHA, etc.
await menuPage.addToCart(coffeeName);
```

Use this when your test needs a coffee but does not care which one.

### `generateCartItems(itemCount?)`

Returns an array of `{ name, quantity }` objects:

```typescript
const items = generateCartItems(3); // generate exactly 3 items
// [
//   { name: CoffeeNames.ESPRESSO, quantity: 2 },
//   { name: CoffeeNames.FLAT_WHITE, quantity: 1 },
//   { name: CoffeeNames.MOCHA, quantity: 3 },
// ]
```

### `generateOrderPayload(overrides?)` (from `order.factory.ts`)

Generates a complete, Zod-validated API request body for `POST /api/checkout`:

```typescript
import { generateOrderPayload } from '../../../test-data/factories/coffee-cart/order.factory';

const payload = generateOrderPayload();
// {
//   name: "Generated Test User",
//   email: "generated.user@example.test",
//   subscribe: false,
//   items: [
//     { name: CoffeeNames.CAPPUCCINO, quantity: 2, unitPrice: 6.5 },
//     { name: CoffeeNames.ESPRESSO, quantity: 1, unitPrice: 5 },
//   ]
// }

const response = await api.post(`${config.apiUrl}/api/checkout`, { data: payload });
```

This factory is specifically for API tests that call the checkout endpoint directly. It validates the generated payload against the Zod schema before returning it — so if the schema changes, the factory will throw immediately rather than sending invalid data to the API.

---

## 6. Static JSON files — boundary and invalid data

Static data lives in `test-data/static/{area}/`. These are plain JSON files containing fixed inputs used for boundary testing — cases like empty strings, invalid formats, fields that are missing or have the wrong type.

The Coffee Cart static files:

| File                   | Contents                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `invalidCheckout.json` | Invalid checkout payloads (missing name, invalid email format, empty string, XSS attempt) |
| `invalidLogin.json`    | Invalid login payloads (wrong password, unknown email, empty fields)                      |
| `coffeeMenu.json`      | A static snapshot of the coffee menu — used when tests need a known menu state            |

Here is a sample from `invalidCheckout.json`:

```json
[
  {
    "description": "missing name field",
    "email": "sample.user@example.test",
    "subscribe": false
  },
  {
    "description": "invalid email format",
    "name": "Sample Test User",
    "email": "invalid-email",
    "subscribe": false
  },
  {
    "description": "empty name string",
    "name": "",
    "email": "sample.user@example.test",
    "subscribe": false
  }
]
```

Each entry has a `description` field that explains what makes it invalid. When the test fails, the description appears in the error message so you know exactly which case broke.

---

## 7. Using static data in a test

Import the JSON file directly. TypeScript handles the type automatically:

```typescript
import invalidCheckoutCases from '../../../test-data/static/coffee-cart/invalidCheckout.json';

test.describe('Checkout API — invalid payloads', () => {
  for (const testCase of invalidCheckoutCases) {
    test(`should reject checkout: ${testCase.description}`, { tag: '@api' }, async ({ api }) => {
      await test.step(`WHEN posting invalid payload: ${testCase.description}`, async () => {
        const response = await api.post(`${config.apiUrl}/api/checkout`, { data: testCase });
        expect(response.status()).toBe(400);
      });
    });
  }
});
```

This `for...of` loop creates one test per entry in the JSON file. Each test gets a clear name from the `description` field. If you add a new invalid case to the JSON file, a new test is created automatically — you do not need to change the test code.

---

## 8. Choosing between factory and static data

| Situation                                                        | Use                                   |
| ---------------------------------------------------------------- | ------------------------------------- |
| Happy-path test that needs a name, email, credentials            | Factory                               |
| Test that needs a random coffee or cart item                     | Factory                               |
| API test that needs a valid request body                         | Factory (`generateOrderPayload`)      |
| Test for a missing required field                                | Static JSON                           |
| Test for an invalid format (bad email, XSS string, empty string) | Static JSON                           |
| Test for a boundary value (extremely long name, max quantity)    | Static JSON                           |
| Test that needs the same value on every run for comparison       | Static JSON or `overrides` on factory |

**Rule of thumb:** If the test cares what the value _is_, use static data. If the test only needs the value to be valid (or random), use a factory.

---

## 9. Common mistakes

| Mistake                                                             | What to do instead                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `const data = generateCheckoutData()` at module level               | Call the factory inside the test body — fresh data per test      |
| `{ name: '<fixed-name>', email: '<fixed-email>' }` hardcoded inline | Import and call `generateCheckoutData()`                         |
| Using a factory for invalid-input tests                             | Use `test-data/static/` JSON files for boundary and error cases  |
| Using static data for happy-path tests                              | Use factories — static data is for fixed boundary/invalid cases  |
| Calling `faker.person.fullName()` directly in a test                | Use the factory function — it keeps Faker usage in one place     |
| `generateOrderPayload` for UI form tests                            | That factory is for API tests; use `generateCheckoutData` for UI |

---

## See also

- [Writing Full API Tests](writing-api-tests.md) — how to use `generateOrderPayload` in a full API spec
- [Test Generator Usage](test-generator-usage.md) — generate the test stub before writing data calls
- [Developer Guide](../developer.md) — test data strategy and factory patterns in depth
