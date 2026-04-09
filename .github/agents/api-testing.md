---
name: api-testing
description: "API testing patterns -- apiRequest fixture, schema validation, and helper fixtures for setup/teardown Framework skill ID: api-testing. Canonical source: .cursor/skills/api-testing/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: api-testing
  source_path: .cursor/skills/api-testing/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/api-testing/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# API Testing

## The `apiRequest` Fixture

Use the `apiRequest` fixture for all API calls in tests. It provides type-safe requests with automatic response parsing via Playwright's dependency injection:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { UserResponse, UserResponseSchema } from '../../../fixtures/api/schemas/app/userSchema';

test('should return user data', { tag: '@api' }, async ({ apiRequest }) => {
  const { status, body } = await apiRequest<UserResponse>({
    method: 'GET',
    url: '/api/users/me',
    baseUrl: process.env.API_URL,
    headers: process.env.ACCESS_TOKEN,
  });

  expect(status).toBe(200);
  expect(UserResponseSchema.parse(body)).toBeTruthy();
});
```

Use the `apiRequest` fixture **directly** for all API work in tests -- assertions, setup calls in `beforeEach`, teardown calls in `afterEach`, and one-off requests. Do **not** create a separate helper fixture for every endpoint.

## Request Parameters

| Option     | Type                                              | Required | Description                         |
| ---------- | ------------------------------------------------- | -------- | ----------------------------------- |
| `method`   | `'GET' \| 'POST' \| 'PUT' \| 'DELETE' \| 'PATCH'` | Yes      | HTTP method                         |
| `url`      | `string`                                          | Yes      | Endpoint path                       |
| `baseUrl`  | `string`                                          | No       | Base URL to prepend                 |
| `body`     | `Record<string, unknown>`                         | No       | Request payload                     |
| `headers`  | `string`                                          | No       | Auth token for Authorization header |
| `authType` | `'Bearer' \| 'Token' \| 'Basic'`                  | No       | Auth scheme (default: `'Bearer'`)   |

## Response Validation

**ALWAYS** validate API responses with Zod schemas:

```typescript
const { status, body } = await apiRequest<UserResponse>({ ... });

// Validates structure and types at runtime -- throws if invalid
const validatedUser = UserResponseSchema.parse(body);
```

The generic `<UserResponse>` gives you compile-time type safety on `body`, while `schema.parse()` gives you runtime validation. Always use both.

## GraphQL over HTTP

For **`POST /api/graphql`** (or similar), send JSON `{ query, variables?, operationName? }` with `apiRequest` or `request.post`, keep **operation strings** in a dedicated module (e.g. `fixtures/api/graphql/`), and validate the **`{ data, errors }`** envelope with Zod — often a shared envelope schema plus a `data` shape that reuses REST list/item schemas when payloads align. Coffee Cart: see **`docs/usage/graphql-api-testing.md`**, `graphql-menu.spec.ts`, and ignored **`template-graphql.spec.ts`** for copy/paste onboarding.

## Test Steps for Multiple API Calls

**MANDATORY:** When a test contains more than one API call, each call **MUST** be wrapped in a dedicated `test.step()` with:

1. A descriptive name indicating the API operation
2. Proper validation based on the context (status code, schema, specific fields)

This improves:

- **Readability** -- Clear flow of API operations
- **Reporting** -- Detailed step-by-step execution traces
- **Debugging** -- Pinpoint which API call failed

### Correct Pattern

```typescript
test('should create and verify user workflow', { tag: '@api' }, async ({ apiRequest }) => {
  let userId: string;

  await test.step('Create user via POST /api/users', async () => {
    const { status, body } = await apiRequest<UserResponse>({
      method: 'POST',
      url: '/api/users',
      baseUrl: process.env.API_URL,
      headers: process.env.ACCESS_TOKEN,
      body: generateUser(),
    });

    expect(status).toBe(201);
    const createdUser = UserResponseSchema.parse(body);
    expect(createdUser).toBeTruthy();
    userId = createdUser.id;
  });

  await test.step('Retrieve user via GET /api/users/:id', async () => {
    const { status, body } = await apiRequest<UserResponse>({
      method: 'GET',
      url: `/api/users/${userId}`,
      baseUrl: process.env.API_URL,
      headers: process.env.ACCESS_TOKEN,
    });

    expect(status).toBe(200);
    expect(UserResponseSchema.parse(body)).toBeTruthy();
    expect(body.id).toBe(userId);
  });

  await test.step('Delete user via DELETE /api/users/:id', async () => {
    const { status, body } = await apiRequest<null>({
      method: 'DELETE',
      url: `/api/users/${userId}`,
      baseUrl: process.env.API_URL,
      headers: process.env.ACCESS_TOKEN,
    });

    expect(status).toBe(204);
    expect(body).toBeNull();
  });
});
```

### Forbidden Pattern

```typescript
// FORBIDDEN: Multiple API calls without test.step
test('should create and verify user workflow', { tag: '@api' }, async ({ apiRequest }) => {
  // Create user
  const { status: createStatus, body: createBody } = await apiRequest<UserResponse>({
    method: 'POST',
    url: '/api/users',
    baseUrl: process.env.API_URL,
    headers: process.env.ACCESS_TOKEN,
    body: generateUser(),
  });
  expect(createStatus).toBe(201);
  expect(UserResponseSchema.parse(createBody)).toBeTruthy();
  const userId = createBody.id;

  // Retrieve user
  const { status: getStatus, body: getBody } = await apiRequest<UserResponse>({
    method: 'GET',
    url: `/api/users/${userId}`,
    baseUrl: process.env.API_URL,
    headers: process.env.ACCESS_TOKEN,
  });
  expect(getStatus).toBe(200);
  expect(UserResponseSchema.parse(getBody)).toBeTruthy();
  expect(getBody.id).toBe(userId);
  expect(getBody.email).toBe('john@example.com');
});
```

### Single API Call Exception

If a test contains **only one** API call, `test.step` is optional but recommended for consistency:

```typescript
test('should return user data', { tag: '@api' }, async ({ apiRequest }) => {
  // Single API call -- test.step is optional
  const { status, body } = await apiRequest<UserResponse>({
    method: 'GET',
    url: '/api/users/me',
    baseUrl: process.env.API_URL,
    headers: process.env.ACCESS_TOKEN,
  });

  expect(status).toBe(200);
  expect(UserResponseSchema.parse(body)).toBeTruthy();
});
```

## Comprehensive Testing Flow

For every endpoint × HTTP method combination, tests **MUST** cover all relevant status code scenarios. This is the standard coverage matrix:

| Scenario                                         | Status  | What to assert                                                                                   |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| Happy path (valid auth + valid body)             | 200/201 | Schema parse passes + key fields match sent data                                                 |
| Successful delete / no-content action            | 204     | `status === 204`, `expect(body).toBeNull()`                                                      |
| Missing required fields                          | 400     | `BadRequestResponseSchema.parse(body)`, `body.errors` has expected field key                     |
| Unprocessable entity / field validation          | 422     | `UnprocessableEntityResponseSchema.parse(body)`, error details reference the failing field       |
| Missing Authorization header                     | 401     | `status === 401`, `expect(body).toBeNull()`                                                      |
| Insufficient permissions (zero-permission token) | 403     | `status === 403`, `expect(body).toBeNull()`                                                      |
| Non-existent resource ID                         | 404     | `status === 404` (use `test.skip` with `// FIXME` comment if backend bug exists)                 |
| Method not allowed                               | 405     | `status === 405` for at least one unsupported HTTP method per endpoint                           |
| Conflict / duplicate resource                    | 409     | `status === 409`, error body references the conflicting field or resource                        |
| Invalid path parameter                           | 400/404 | Loop over malformed values (non-numeric ID, special chars, SQL injection); assert error response |

**Structure:** One `test.describe` per HTTP method + path. Use `beforeAll`/`afterAll` (not `beforeEach`/`afterEach`) to create/delete shared resources needed by multiple tests in the same describe block.

### Key conventions from real tests

- Auth tokens: `process.env.ACCESS_TOKEN` (full permissions), `process.env.ACCESS_TOKEN_ZERO` (zero permissions)
- Config: `process.env.API_URL` + `/api/X` — never bare `process.env.API_URL`
- Cleanup: `afterAll` in POST describes (holds `resourceId` from the happy-path test); `afterAll` in GET/PUT/DELETE describes (resource created in `beforeAll`)
- When a `test.skip` is needed due to a backend bug: add `// FIXME: <ticket-url>` comment + `/* eslint-disable playwright/no-skipped-test */` above it
- Tag: `@api` for API tests (check real tag in existing spec files for other areas)

## Negative / Validation Testing

For every required field in the request body, test both omission and invalid type separately using a `for...of` loop. Do **not** collapse all validations into a single "empty body" test.

### Per-Field Omission Pattern

```typescript
import { generateUser } from '../../../test-data/factories/app/user.factory';

const requiredFields = ['name', 'email', 'role'] as const;

for (const field of requiredFields) {
  test(`should return 400 when ${field} is omitted`, { tag: '@api' }, async ({ apiRequest }) => {
    const { [field]: _omitted, ...payloadWithout } = generateUser();

    const { status, body } = await apiRequest<BadRequestResponse>({
      method: 'POST',
      url: '/api/users',
      baseUrl: process.env.API_URL,
      headers: process.env.ACCESS_TOKEN,
      body: payloadWithout,
    });

    expect(status).toBe(400);
    expect(BadRequestResponseSchema.parse(body)).toBeTruthy();
    expect(body.errors).toHaveProperty(field);
  });
}
```

### Per-Field Invalid Type Pattern

```typescript
for (const field of requiredFields) {
  test(
    `should return 400 when ${field} has invalid type`,
    { tag: '@api' },
    async ({ apiRequest }) => {
      const { status, body } = await apiRequest<BadRequestResponse>({
        method: 'POST',
        url: '/api/users',
        baseUrl: process.env.API_URL,
        headers: process.env.ACCESS_TOKEN,
        body: { ...generateUser(), [field]: 12345 }, // spread-and-override with wrong type
      });

      expect(status).toBe(400);
      expect(BadRequestResponseSchema.parse(body)).toBeTruthy();
    },
  );
}
```

### Type-to-Invalid-Value Reference

| Field type | Invalid values to test               |
| ---------- | ------------------------------------ |
| `string`   | `123`, `true`, `null`, `[]`, `{}`    |
| `number`   | `'not-a-number'`, `true`, `[]`       |
| `boolean`  | `'true'`, `0`, `'yes'`               |
| `enum`     | `'INVALID'`, `''`, `'__UNKNOWN__'`   |
| `uuid`     | `'not-a-uuid'`, `'123'`, `''`        |
| `date`     | `'not-a-date'`, `'32/13/2020'`, `99` |

---

## Path Parameter Validation

Test that the API rejects malformed path parameters rather than silently mishandling them:

```typescript
const invalidIds = [
  'not-a-number', // String where numeric/UUID is expected
  'true', // Boolean-like string
  '../../etc/passwd', // Path traversal attempt
  "'; DROP TABLE users; --", // SQL injection candidate
  '%00', // Null byte
  'a'.repeat(300), // Oversized input
];

for (const invalidId of invalidIds) {
  test(`should reject invalid id: "${invalidId}"`, { tag: '@api' }, async ({ apiRequest }) => {
    const { status } = await apiRequest({
      method: 'GET',
      url: `/api/users/${encodeURIComponent(invalidId)}`,
      baseUrl: process.env.API_URL,
      headers: process.env.ACCESS_TOKEN,
    });

    expect([400, 404]).toContain(status);
  });
}
```

---

## Behavior Mismatch Protocol

When the observed API behavior differs from the OpenAPI spec, follow these rules:

1. **Test the actual behavior, not the spec.** Write the assertion against what the API actually returns. This makes the test suite green and documents reality.
2. **Always add a `// FIXME` comment** referencing the discrepancy: `// FIXME: spec says 422 but API returns 400 — see ticket #123`
3. **Never omit a test** because the API behaves unexpectedly. Use `test.skip` with `// FIXME` instead:
   ```typescript
   // eslint-disable-next-line playwright/no-skipped-test
   test.skip('should return 404 for unknown resource', // FIXME: API returns 500 instead — ticket #456
   ```
4. **Document "cannot trigger" scenarios explicitly:** If a status code (e.g., 409 conflict) cannot be reliably triggered, mark it with `test.skip` and explain why.
5. **Every OpenAPI status code must have a test** — even if that test is a skip with a FIXME. Silent coverage drops are forbidden.

---

## Coverage Checklist for Endpoints with a Body

Before marking an endpoint done, verify:

- [ ] Every required field has its own omission test (→ 400)
- [ ] Every required field has at least one invalid-type test (→ 400/422)
- [ ] At least one unsupported HTTP method is tested (→ 405)
- [ ] No test covers **only** an empty body — empty-body is not a substitute for per-field coverage

---

## Helper Fixtures for Important Setup/Teardown

For **critical, recurring setup/teardown operations** that multiple tests depend on (e.g., creating a user account that several test files need as a precondition, or seeding complex data that must be cleaned up), use helper fixtures in `fixtures/helper/helper-fixture.ts`.

Helper fixtures wrap the `apiRequest` plain function with Playwright's fixture lifecycle:

1. **Setup** -- Code before `use()` runs before the test
2. **Yield** -- `use(data)` passes created data to the test
3. **Teardown** -- Code after `use()` runs after the test (even if it fails)

```typescript
// In helper-fixture.ts
createdResource: async ({ request }, use) => {
    // 1. SETUP: Create precondition via API
    const { body } = await apiRequest({
        request,
        method: 'POST',
        url: '/api/resources',
        baseUrl: process.env.API_URL,
        headers: process.env.ACCESS_TOKEN,
        body: { name: 'test-resource' },
    });

    // 2. YIELD: Pass to the test
    await use(body);

    // 3. TEARDOWN: Clean up (runs automatically after test)
    await apiRequest({
        request,
        method: 'DELETE',
        url: `/api/resources/${(body as { id: string }).id}`,
        baseUrl: process.env.API_URL,
        headers: process.env.ACCESS_TOKEN,
    });
},
```

Usage in tests:

```typescript
test('should edit resource', { tag: '@regression' }, async ({ createdResource, appPage }) => {
  // createdResource is already created and will be deleted after the test
  await appPage.navigateToResource(createdResource.id);
  await appPage.editResource('New Name');
  await expect(appPage.resourceName).toHaveText('New Name');
});
```

### When to Use `apiRequest` Fixture vs. Helper Fixture

| Approach                                | Use Case                                                                        | Example                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`apiRequest` fixture** (primary)      | All API calls in tests -- assertions, `beforeEach`/`afterEach`, one-off calls   | Validate status codes, response schemas, teardown in hooks |
| **Helper fixture** (important ops only) | Critical setup/teardown reused across many test files with guaranteed lifecycle | Seed a user account that 10+ test files depend on          |
| **Factory function**                    | Generate dynamic test data (no API call)                                        | `generateUser()` from `test-data/factories/`               |

**Rule of thumb:** Use `apiRequest` directly unless you find yourself copy-pasting the same multi-step setup/teardown into 3+ test files.

## Schema Location

> **`{area}` is a placeholder.** Run `ls fixtures/api/schemas/` to discover the real subdirectory names in this repo (e.g., `front-office`, `back-office`) and use those instead.

```
fixtures/api/schemas/
├── {area}/         ← App-specific response/request schemas
│   └── userSchema.ts
└── util/           ← Shared error response schemas
    └── errorResponseSchema.ts
```

### Creating a New Schema

```typescript
// fixtures/api/schemas/back/productSchema.ts
import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';
import { createApiResponseSchema } from '../util/common';

export const ProductSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
  inStock: z.boolean(),
});

// Use createApiResponseSchema factory -- do NOT repeat the success/message/data/errors envelope manually
export const CreateProductResponseSchema = createApiResponseSchema(
  ProductSchema,
  z.unknown().nullable(),
);

export type Product = zOutput<typeof ProductSchema>;
export type CreateProductResponse = zOutput<typeof CreateProductResponseSchema>;
```

### Error Response Schemas

Common error schemas are in `fixtures/api/schemas/util/errorResponseSchema.ts`:

```typescript
import {
  UnauthorizedResponse,
  UnauthorizedResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';

const { status, body } = await apiRequest<UnauthorizedResponse>({
  method: 'POST',
  url: '/api/login',
  baseUrl: process.env.API_URL,
  body: { email: 'bad@email.com', password: 'wrong' },
});

expect(status).toBe(401);
expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
```

Available error schemas: `BadRequestResponseSchema` (400), `UnauthorizedResponseSchema` (401), `ForbiddenResponseSchema` (403), `NotFoundResponseSchema` (404).

For **401** and **403** responses that return a null body, assert `expect(body).toBeNull()` directly — no schema needed.

## API Architecture

```
fixtures/
├── api/
│   ├── api-request-fixture.ts    ← Playwright fixture providing apiRequest (used in tests via DI)
│   ├── plain-function.ts         ← Core HTTP function (internal implementation, used by fixture and helpers)
│   ├── api-types.ts              ← TypeScript types (ApiRequestParams, ApiRequestResponse, etc.)
│   └── schemas/                  ← Zod schemas for validation
│       ├── app/                  ← App-specific schemas
│       └── util/                 ← Shared error response schemas
└── helper/
    └── helper-fixture.ts         ← Setup/teardown fixtures for important recurring operations
```

- `api-request-fixture.ts` -- Playwright fixture wrapping the plain function. Provides `apiRequest` via DI with generics for type-safe responses. **Primary tool for API calls in tests.**
- `plain-function.ts` -- Core HTTP function. Handles method routing, auth headers, response parsing. Used internally by the fixture and by helper fixtures.
- `api-types.ts` -- Shared types: `ApiRequestParams`, `ApiRequestResponse<T>`, `ApiRequestFn`.
- `helper-fixture.ts` -- Setup/teardown fixtures for important, recurring preconditions. Uses `plain-function.ts` internally.

## Exploration Before Schema Creation

When creating schemas for a real API, **make a request to the endpoint first** to discover:

- Actual response structure and field names
- Data types for each field
- Optional vs required fields
- Nested objects or arrays
- Error response formats

This ensures schemas match the real API instead of being assumptions.

## Credentials and URLs

**NEVER** hardcode API URLs or credentials:

```typescript
// CORRECT
baseUrl: process.env.API_URL,
headers: process.env.ACCESS_TOKEN,
body: { email: process.env.APP_EMAIL, password: process.env.APP_PASSWORD },

// FORBIDDEN
baseUrl: 'https://api.example.com',
headers: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
```

Use enums for endpoint paths:

```typescript
import { ApiEndpoints } from '../../../enums/app/app';

url: ApiEndpoints.LOGIN,
```
