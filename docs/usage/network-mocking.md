# Network Mocking

**Audience:** Jr QA Engineers — how to simulate error states, offline mode, and custom API responses in tests.

Network mocking lets you test how the app behaves when things go wrong — the server returns an error, the network is slow, or a third-party script is unavailable. This framework's `networkMock` fixture provides six ready-to-use methods for these scenarios. This guide explains when and how to use each one.

---

## Table of Contents

1. [When to mock vs when to use the real backend](#1-when-to-mock-vs-when-to-use-the-real-backend)
2. [How the `networkMock` fixture works](#2-how-the-networkmock-fixture-works)
3. [Simulating a server error (500)](#3-simulating-a-server-error-500)
4. [Simulating a timeout](#4-simulating-a-timeout)
5. [Simulating offline mode](#5-simulating-offline-mode)
6. [Blocking third-party requests](#6-blocking-third-party-requests)
7. [Returning a custom JSON response](#7-returning-a-custom-json-response)
8. [Restoring the network with `goOnline`](#8-restoring-the-network-with-goonline)
9. [Writing a complete network error test](#9-writing-a-complete-network-error-test)
10. [Common mistakes](#10-common-mistakes)

---

## 1. When to mock vs when to use the real backend

Network mocking is a tool for specific scenarios — it is not a replacement for hitting the real backend.

| Situation                                                                     | Use                                                                   |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Testing the happy path                                                        | **Real backend** — always test against real data                      |
| Testing what the UI shows when the API returns 500                            | **Mock** — hard to trigger reliably with a real server                |
| Testing what happens when the network drops mid-request                       | **Mock** — impossible to reproduce reliably otherwise                 |
| Testing that a third-party script does not break the page if it fails to load | **Mock** — you do not control the third-party server                  |
| Testing specific API response shapes                                          | **Mock** — useful when the real API does not produce the shape easily |

**Rule:** Only mock your own API for error simulation. For happy-path tests, always hit the real backend.

---

## 2. How the `networkMock` fixture works

The `networkMock` fixture is available in any test via `async ({ networkMock })`. It wraps Playwright's `page.route()` API with helper methods so you do not have to write route handlers yourself.

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test(
  'should show error message when menu fails to load',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    // Use networkMock methods here
  },
);
```

All routes added by `networkMock` are automatically cleaned up after the test ends — you do not need to call `goOnline()` in an `afterEach`. It is only needed when you want to restore the network **within** a test.

---

## 3. Simulating a server error (500)

`simulateServerError` intercepts requests matching a URL pattern and returns a 500 response:

```typescript
test(
  'should show error state when API returns 500',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    await test.step('GIVEN the coffee API is down', async () => {
      await networkMock.simulateServerError('**/api/coffees');
    });

    await test.step('WHEN user navigates to menu', async () => {
      await menuPage.goto();
    });

    await test.step('THEN error message is displayed', async () => {
      await expect(menuPage.page.getByText(/error|failed|unavailable/i)).toBeVisible();
    });
  },
);
```

The URL pattern uses glob syntax. `'**/api/coffees'` matches any URL ending in `/api/coffees` regardless of the host:

```typescript
// Matches any of these:
// http://localhost:3002/api/coffees
// https://staging-api.coffee-cart.app/api/coffees

await networkMock.simulateServerError('**/api/coffees');

// Matches using a regex (more precise):
await networkMock.simulateServerError(/\/api\/coffees/);
```

The fixture returns a `500` status with `{ "error": "Internal Server Error" }` as the body.

---

## 4. Simulating a timeout

`simulateTimeout` intercepts requests and aborts them with a timeout error — as if the server accepted the connection but never responded:

```typescript
test(
  'should show timeout message when checkout hangs',
  { tag: '@regression' },
  async ({ cartPage, networkMock }) => {
    await test.step('GIVEN the checkout API is unresponsive', async () => {
      await networkMock.simulateTimeout('**/api/checkout');
    });

    await test.step('WHEN user submits checkout', async () => {
      await cartPage.goto();
      await cartPage.checkout();
    });

    await test.step('THEN user sees a timeout or error message', async () => {
      await expect(cartPage.page.getByText(/timed out|failed|error/i)).toBeVisible();
    });
  },
);
```

**Note:** The test's action timeout applies here. If the app does not show an error message within the action timeout, the `toBeVisible()` assertion will fail with a timeout error, not the network abort. Make sure the app actually handles timeout errors before writing this test.

---

## 5. Simulating offline mode

`goOffline` aborts every network request — simulating a complete loss of connectivity:

```typescript
test(
  'should show offline message when network is lost',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    await test.step('GIVEN user is on the menu page', async () => {
      await menuPage.goto();
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
    });

    await test.step('WHEN network connection is lost', async () => {
      await networkMock.goOffline();
      await menuPage.page.reload();
    });

    await test.step('THEN user sees an offline or error state', async () => {
      // Check for the browser's offline page or the app's error handling
      const title = await menuPage.page.title();
      expect(title).toBeTruthy(); // Page still exists in some form
    });
  },
);
```

If you want to simulate reconnection within the same test — going offline and then back online — call `goOnline()` to restore the network:

```typescript
await networkMock.goOffline();
// ... interact with the offline state ...
await networkMock.goOnline();
// ... continue with normal requests ...
```

---

## 6. Blocking third-party requests

`blockRequests` aborts requests matching a URL pattern without returning an error response. This is useful for blocking analytics scripts, ad servers, or CDN resources that are not part of your test:

```typescript
test(
  'should load correctly without analytics',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    await test.step('GIVEN analytics scripts are blocked', async () => {
      await networkMock.blockRequests('**/google-analytics.com/**');
      await networkMock.blockRequests('**/hotjar.com/**');
    });

    await test.step('WHEN user visits the menu', async () => {
      await menuPage.goto();
    });

    await test.step('THEN the menu loads normally', async () => {
      await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      await expect(menuPage.coffeeMenu).toBeVisible();
    });
  },
);
```

You can call `blockRequests` multiple times to block multiple patterns. Each call adds an independent route that persists until the test ends or `goOnline()` is called.

---

## 7. Returning a custom JSON response

`mockJsonResponse` intercepts a URL and returns exactly the JSON you provide. This is useful for testing the UI with specific data shapes — an empty list, a specific number of items, or a known error format:

```typescript
test(
  'should show empty state when no coffees are available',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    await test.step('GIVEN the menu API returns an empty list', async () => {
      await networkMock.mockJsonResponse('**/api/coffees', [], 200);
    });

    await test.step('WHEN user navigates to menu', async () => {
      await menuPage.goto();
    });

    await test.step('THEN user sees the empty menu message', async () => {
      await expect(menuPage.page.getByText(/no coffees|empty|unavailable/i)).toBeVisible();
    });
  },
);
```

The third argument is the HTTP status code — it defaults to `200` if omitted:

```typescript
import { CoffeeNames } from '../../../enums/coffee-cart/coffee-cart';

// Return a 404 with a custom error body
await networkMock.mockJsonResponse('**/api/coffees/unknown', { error: 'Not found' }, 404);

// Return 200 with specific data
await networkMock.mockJsonResponse('**/api/coffees', [
  {
    name: CoffeeNames.ESPRESSO,
    price: 3.5,
    recipe: [{ name: CoffeeNames.ESPRESSO, quantity: 1 }],
  },
]);
```

---

## 8. Restoring the network with `goOnline`

`goOnline()` removes all active routes that the current test has added. This restores normal request handling:

```typescript
test(
  'should recover after server error',
  { tag: '@regression' },
  async ({ menuPage, networkMock }) => {
    await test.step('GIVEN menu API is failing', async () => {
      await networkMock.simulateServerError('**/api/coffees');
      await menuPage.goto();
      await expect(menuPage.page.getByText(/error/i)).toBeVisible();
    });

    await test.step('WHEN network is restored', async () => {
      await networkMock.goOnline();
      await menuPage.page.reload();
    });

    await test.step('THEN menu loads successfully', async () => {
      await expect(menuPage.coffeeMenu).toBeVisible();
    });
  },
);
```

**Note:** You do not need to call `goOnline()` at the end of a test — the fixture cleans up automatically. Only use it when you need to restore the network partway through a test.

---

## 9. Writing a complete network error test

Here is the full pattern for a network error test — navigate first, set up the mock, trigger the action that hits the network, then assert the error state:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Cart API — Error Handling', () => {
  test(
    'should show error message when adding to cart fails',
    { tag: '@regression' },
    async ({ menuPage, networkMock }) => {
      await test.step('GIVEN user is on the menu page', async () => {
        await menuPage.goto();
        await expect(menuPage.coffeeMenu).toBeVisible();
      });

      await test.step('AND cart API is returning server errors', async () => {
        await networkMock.simulateServerError('**/api/cart');
      });

      await test.step('WHEN user tries to add an item to the cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
      });

      await test.step('THEN user sees an error notification', async () => {
        await expect(menuPage.page.getByRole('alert')).toBeVisible();
      });
    },
  );

  test(
    'should show offline banner when connection is lost',
    { tag: '@regression' },
    async ({ menuPage, networkMock }) => {
      await test.step('GIVEN user has loaded the menu', async () => {
        await menuPage.goto();
        await expect(menuPage.coffeeMenu).toBeVisible();
      });

      await test.step('WHEN the network goes offline', async () => {
        await networkMock.goOffline();
      });

      await test.step('AND user attempts to add to cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
      });

      await test.step('THEN the app shows a network error', async () => {
        await expect(menuPage.page.getByText(/offline|network error|connection/i)).toBeVisible();
      });
    },
  );
});
```

---

## 10. Common mistakes

| Mistake                                                 | What to do instead                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mocking every request including the happy path          | Only mock for error simulation; hit the real backend for success scenarios                 |
| Setting up the mock after `goto()`                      | Set up mocks before navigation so the interception is active when the request fires        |
| Not waiting for the error state with an assertion       | Always follow a mock with an `expect(...).toBeVisible()` to confirm the app reacted        |
| Using `waitForTimeout` while waiting for error messages | Use `await expect(locator).toBeVisible()` — it retries until the element appears           |
| Calling `goOnline()` in `afterEach` when not needed     | The fixture cleans up automatically; only call `goOnline()` mid-test                       |
| Mocking entire API domains for a single test            | Narrow the pattern — `'**/api/cart'` not `'**/api/**'` — to avoid affecting other requests |
| Blocking your own API instead of third-party scripts    | Use `blockRequests` for external URLs only; use `simulateServerError` for your API         |

---

## See also

- [Understanding Fixtures](understanding-fixtures.md) — the `networkMock` fixture and how it is composed with other fixtures
- [Debugging Failing Tests](debugging-failing-tests.md) — reading network failures in the trace viewer
- [Developer Guide](../developer.md) — network mock architecture and adding custom route handlers
