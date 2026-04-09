---
name: test-architecture
description: "Test strategy -- testing trophy, test type decision matrix, and when to use E2E vs API vs unit tests Framework skill ID: test-architecture. Canonical source: .cursor/skills/test-architecture/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: test-architecture
  source_path: .cursor/skills/test-architecture/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/test-architecture/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Test Architecture

Strategic guidance on what to test at which level. Use the testing trophy to maximize confidence with minimum maintenance cost.

## Testing Trophy

The testing trophy (Kent C. Dodds) prioritizes integration tests over unit tests for UI applications:

```
        ╱╲
       ╱E2E╲           Few -- critical user journeys only
      ╱──────╲
     ╱Integration╲     Most -- API + UI functional tests
    ╱──────────────╲
   ╱   Unit Tests    ╲  Some -- pure logic, utilities
  ╱────────────────────╲
 ╱    Static Analysis    ╲  Always -- TypeScript, ESLint
╱──────────────────────────╲
```

## Rules

### ALWAYS Choose the Lowest Sufficient Test Level

Test at the lowest level that gives you confidence. Don't write an E2E test for something an API test covers:

| What You're Testing                 | Test Level                      | Why                            |
| ----------------------------------- | ------------------------------- | ------------------------------ |
| API response shape, status codes    | API test (`@api`)               | No UI needed, fast, reliable   |
| Form validation, page interactions  | Functional test (`@regression`) | Tests UI behavior in isolation |
| Multi-page user journey             | E2E test (`@e2e`)               | Tests full flow across pages   |
| Business logic in helper functions  | Unit test                       | No browser needed              |
| Login → Browse → Checkout → Confirm | E2E test (`@e2e`)               | Critical revenue path          |

### Decision Matrix

| Signal                   | → API Test | → Functional Test | → E2E Test |
| ------------------------ | ---------- | ----------------- | ---------- |
| No UI involved           | Yes        |                   |            |
| Single page interaction  |            | Yes               |            |
| Crosses multiple pages   |            |                   | Yes        |
| Validates data contracts | Yes        |                   |            |
| Tests visual behavior    |            | Yes               |            |
| Critical business flow   |            |                   | Yes        |
| Needs to run fast        | Yes        |                   |            |
| Tests error handling UI  |            | Yes               |            |

### NEVER Duplicate Coverage Across Levels

If an API test validates that creating a user returns the correct response, don't also test the API response in an E2E test. The E2E test should only verify the UI shows the right result:

```typescript
// API test -- validates the API contract
test('POST /api/users creates user', { tag: '@api' }, async ({ apiRequest }) => {
  const response = await apiRequest.post('/api/users', { data: userData });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(userSchema.safeParse(body).success).toBe(true);
});

// E2E test -- validates the user journey, NOT the API contract
test('user can register and see dashboard', { tag: '@e2e' }, async ({ page }) => {
  // ... fill registration form ...
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  // Don't re-validate API response shape here
});
```

## Test Type Guidelines

### API Tests (`@api`)

- Validate response schemas with Zod
- Test all status codes (200, 400, 401, 404, 500)
- Test edge cases (empty body, invalid types, missing fields)
- Fast, stable, run on every PR

### Functional Tests (`@regression` / `@sanity` / `@smoke`)

- One page or feature per test file
- Test user interactions: clicks, fills, selects
- Validate UI feedback: errors, success messages, state changes
- Use page objects for reusable interactions

### E2E Tests (`@e2e`)

- Multi-page user journeys only
- Limit to 5-10 critical flows (registration, checkout, onboarding)
- Longer runtime is acceptable
- Must include setup and teardown for test data

### Tag Selection Guide

| Tag           | When to Use                              | Expected Count |
| ------------- | ---------------------------------------- | -------------- |
| `@smoke`      | Core functionality, run on every deploy  | 5-15 tests     |
| `@sanity`     | Key features, run on every PR            | 20-50 tests    |
| `@regression` | Full feature coverage, run nightly       | 100+ tests     |
| `@e2e`        | Multi-page journeys, run nightly         | 5-10 tests     |
| `@api`        | API contract validation, run on every PR | Many           |

## When to Add a New Test

Ask these questions in order:

1. **Is this already covered?** Search existing tests before writing new ones
2. **What's the lowest level that catches this bug?** Start there
3. **Does this need a browser?** If no → API test or unit test
4. **Does this cross pages?** If no → functional test. If yes → E2E test
5. **Is this a critical user journey?** Tag as `@e2e` or `@smoke`

## Anti-Patterns

| Don't                                  | Problem                        | Do Instead                                                |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| Write E2E tests for everything         | Slow, flaky, expensive         | Use testing trophy -- most tests should be API/functional |
| Skip API tests because "E2E covers it" | E2E tests are slow and flaky   | Validate contracts at the API level                       |
| Write unit tests for simple getters    | Low value, high maintenance    | Trust TypeScript types for trivial code                   |
| Duplicate assertions across levels     | Wastes time, unclear ownership | Each level tests different things                         |
| No smoke test suite                    | Can't quickly verify deploys   | Tag 5-15 critical tests as `@smoke`                       |

## See Also

- **`test-standards`** skill -- Test file structure, tagging rules, and step patterns.
- **`api-testing`** skill -- API test patterns and schema validation.
- **`data-strategy`** skill -- Test data approach per test level.
