# GraphQL API testing (Playwright)

**Audience:** Engineers calling a **GraphQL over HTTP** endpoint (JSON `POST` with `{ query, variables?, operationName? }`) from Playwright’s **`APIRequestContext`**.

Coffee Cart exposes a **read-only demo** endpoint: **`POST /api/graphql`** — same menu data as **`GET /api/coffees`**. Use it to practice **operation constants**, **`request.post`**, and **Zod** on the `{ data, errors }` envelope.

---

## Prerequisites

1. Coffee Cart API running with **`API_URL`** pointing at it (e.g. `http://localhost:3002` in `env/.env.dev`).
2. Run API specs with **`--project=chromium-api`** (or your project that includes `tests/coffee-cart/api/`).

---

## Pattern

1. **Store operations** in a dedicated module (e.g. `fixtures/api/graphql/coffee-cart-operations.ts`) as exported template strings — not scattered inline strings.
2. **POST** JSON:

   ```ts
   await api.post(url, {
     data: {
       query: COFFEES_QUERY,
       variables: {
         /* optional */
       },
       operationName: 'Coffees', // optional; helps with multi-operation documents
     },
     headers: { 'Content-Type': 'application/json' },
   });
   ```

3. **Assert HTTP** — many servers return **200** even when `errors` is non-empty; still check `response.ok()` and your team’s contract for 4xx.
4. **Parse the envelope with Zod** — at minimum `data` + `errors` arrays; then parse `data` with the same strict shapes as REST where payloads match.

---

## Zod: envelope + `data`

See `fixtures/api/schemas/coffee-cart/graphqlEnvelopeSchema.ts`:

- **`GraphQLErrorItemSchema`** — `message` (+ optional `extensions`).
- **`CoffeesGraphQLResponseSchema`** — wraps `data.coffees` with **`CoffeeListResponseSchema`** (shared with REST).

---

## Example specs in this repo

| File                                             | Purpose                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `tests/coffee-cart/api/graphql-menu.spec.ts`     | Happy path + invalid field → `errors`                                    |
| `tests/coffee-cart/api/template-graphql.spec.ts` | **Ignored** (`**/template-*.spec.ts`) — copy/rename to start a new suite |

---

## Variable query example (Coffee Cart)

```graphql
query One($name: String!) {
  coffee(name: $name) {
    name
    price
  }
}
```

Body:

```json
{
  "query": "...",
  "variables": { "name": "Espresso" }
}
```

---

## CI and drift

- GraphQL resolvers should **reuse** the same sources as REST so menu tests do not drift.
- Coffee Cart Vitest coverage: `server/__tests__/api.spec.js` → **`POST /api/graphql`**.

---

## See also

- **REST API guide:** [Writing API tests](writing-api-tests.md)
- **Enums:** `ApiEndpoints.GRAPHQL` in `enums/coffee-cart/coffee-cart.ts`
