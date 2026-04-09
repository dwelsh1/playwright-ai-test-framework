---
name: network-mocking
description: "Route interception, HAR replay, error simulation, and blocking third-party scripts Framework skill ID: network-mocking. Canonical source: .cursor/skills/network-mocking/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: network-mocking
  source_path: .cursor/skills/network-mocking/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/network-mocking/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Network Mocking

Intercept, modify, or simulate network requests to isolate UI tests from backend instability and test error states.

## Quick Reference

```typescript
// Intercept and return mock data
await page.route('**/api/users', (route) =>
  route.fulfill({ json: [{ id: 1, name: 'Test User' }] }),
);

// Simulate server error
await page.route('**/api/users', (route) =>
  route.fulfill({ status: 500, json: { error: 'Internal Server Error' } }),
);

// Block third-party scripts
await page.route('**/*.{png,jpg,jpeg}', (route) => route.abort());

// Record HAR file
await page.routeFromHAR('tests/fixtures/api.har', { update: true });

// Replay HAR file
await page.routeFromHAR('tests/fixtures/api.har');
```

## Rules

### ONLY Mock External Services

Mock third-party APIs, CDNs, and services you don't control. Never mock your own application's API in functional tests -- that defeats the purpose of end-to-end testing.

```typescript
// GOOD -- mock third-party payment provider
await page.route('**/api.stripe.com/**', (route) =>
  route.fulfill({ json: { status: 'succeeded', id: 'pi_mock123' } }),
);

// BAD -- mocking your own app's API
await page.route('**/api/users', (route) => route.fulfill({ json: mockUsers })); // hides real backend bugs
```

**Exception:** Mock your own API only for error simulation (testing how UI handles 500s, timeouts, etc.).

### ALWAYS Use `route.fulfill()` With Proper Content-Type

```typescript
// GOOD -- explicit content type
await page.route('**/api/config', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ feature: true }),
  }),
);

// GOOD -- shorthand for JSON
await page.route('**/api/config', (route) => route.fulfill({ json: { feature: true } }));
```

### ALWAYS Clean Up Routes

Routes persist for the page's lifetime. Remove them when no longer needed to avoid interference:

```typescript
await page.route('**/api/users', handler);
// ... test steps ...
await page.unroute('**/api/users', handler);
```

Or scope routes to specific test steps using `page.route` inside `test.step()`.

## Error Simulation

Test how the UI handles failures:

```typescript
test('shows error message on API failure', { tag: '@regression' }, async ({ page }) => {
  await test.step('GIVEN the API returns a 500 error', async () => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({ status: 500, json: { error: 'Database unavailable' } }),
    );
  });

  await test.step('WHEN user navigates to orders page', async () => {
    await page.goto('/orders');
  });

  await test.step('THEN error message is displayed', async () => {
    await expect(page.getByRole('alert')).toContainText('Something went wrong');
  });
});
```

### Common Error Scenarios

| Scenario        | How to Simulate                                                   |
| --------------- | ----------------------------------------------------------------- |
| Server error    | `route.fulfill({ status: 500 })`                                  |
| Not found       | `route.fulfill({ status: 404 })`                                  |
| Unauthorized    | `route.fulfill({ status: 401 })`                                  |
| Network failure | `route.abort('connectionrefused')`                                |
| Timeout         | `route.abort('timedout')`                                         |
| Slow response   | `await new Promise(r => setTimeout(r, 5000)); route.fulfill(...)` |

## HAR Replay

Record and replay network traffic for deterministic tests:

```typescript
// Step 1: Record HAR (run once)
await page.routeFromHAR('tests/fixtures/checkout.har', {
  url: '**/api/**',
  update: true, // enables recording mode
});
// ... perform the flow manually or via test ...

// Step 2: Replay HAR (in tests)
await page.routeFromHAR('tests/fixtures/checkout.har', {
  url: '**/api/**',
});
```

### HAR Rules

- Store HAR files in `tests/fixtures/` or `test-data/har/`
- Re-record when API contracts change
- Never commit HAR files containing real credentials or PII
- Use `url` filter to limit which requests are replayed

## Blocking Third-Party Resources

Speed up tests by blocking analytics, ads, and tracking:

```typescript
// Block by URL pattern
await page.route('**/*google-analytics*', (route) => route.abort());
await page.route('**/*hotjar*', (route) => route.abort());

// Block by resource type
await page.route('**/*', (route) => {
  if (['image', 'font', 'stylesheet'].includes(route.request().resourceType())) {
    return route.abort();
  }
  return route.continue();
});
```

## Modifying Requests

```typescript
// Add auth header to requests
await page.route('**/api/**', (route) =>
  route.continue({
    headers: {
      ...route.request().headers(),
      Authorization: 'Bearer test-token',
    },
  }),
);

// Modify response body
await page.route('**/api/features', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.newFeature = true; // Enable feature flag
  await route.fulfill({ response, json });
});
```

## Anti-Patterns

| Don't                                | Problem                       | Do Instead                                          |
| ------------------------------------ | ----------------------------- | --------------------------------------------------- |
| Mock your own API for happy paths    | Hides real bugs               | Only mock for error simulation                      |
| Leave routes active across tests     | Routes leak between tests     | Use `page.unroute()` or scope to steps              |
| Record HAR with real credentials     | Security risk                 | Sanitize HAR files before committing                |
| Block all images in functional tests | Hides broken image references | Only block third-party resources                    |
| Use `route.abort()` without reason   | Hard to debug failures        | Pass abort reason: `route.abort('blockedbyclient')` |

## See Also

- **`api-testing`** skill -- Testing your own API endpoints directly.
- **`flaky-tests`** skill -- Network instability as a flakiness category.
- **`error-index`** skill -- `net::ERR_CONNECTION_REFUSED` and related errors.
