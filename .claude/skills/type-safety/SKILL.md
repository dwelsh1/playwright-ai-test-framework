---
name: type-safety
description: TypeScript type safety and Zod schema rules
---

# Type Safety

## No `any` Type (Mandatory)

**NEVER** use the `any` type. Use explicit types, Zod-inferred types, or `unknown` when the type is truly indeterminate.

```typescript
// FORBIDDEN
const data: any = await response.json();
function process(input: any): any { ... }

// CORRECT
const data: UserResponse = UserResponseSchema.parse(await response.json());
function process(input: unknown): ProcessedResult { ... }
```

## Zod Schemas for API Types

All API request/response types MUST be defined using Zod schemas in `fixtures/api/schemas/`.

### Schema Location

```
fixtures/api/schemas/
├── app/           ← App-specific schemas (user, product, etc.)
│   └── userSchema.ts
└── util/          ← Shared/common schemas (error responses)
    └── errorResponseSchema.ts
```

### Schema Pattern

**ALWAYS** use `z.strictObject()` for API schemas. This rejects unknown keys at runtime instead of silently stripping them, catching API contract drift early.

```typescript
import { z } from 'zod/v4';
import type { output as zOutput, input as zInput } from 'zod/v4';

// 1. Define the schema with strict validation (rejects unknown keys)
export const UserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  token: z.string(),
});

// 2. Always export the inferred TypeScript type using zOutput<>
export type UserResponse = zOutput<typeof UserResponseSchema>;
// Use zInput<> when the type before transforms differs (e.g. optional+default fields)
// export type UserFormData = zInput<typeof UserFormDataSchema>;
```

```typescript
// FORBIDDEN -- z.object() silently strips unknown keys
export const Schema = z.object({ ... });

// CORRECT -- z.strictObject() rejects unknown keys
export const Schema = z.strictObject({ ... });
```

### Using Schemas for Validation

```typescript
import { UserResponse, UserResponseSchema } from '../../../fixtures/api/schemas/app/userSchema';

// Validate API response at runtime
const { body } = await apiRequest<UserResponse>({ ... });
const validatedData = UserResponseSchema.parse(body); // throws if invalid
```

### Zod Validators Reference

Use the most specific Zod validator for each field. Zod 4 promotes string format validators to top-level APIs:

| Data Type         | Validator           | Example                                               |
| ----------------- | ------------------- | ----------------------------------------------------- |
| UUID              | `z.uuid()`          | `id: z.uuid()`                                        |
| GUID (permissive) | `z.guid()`          | `id: z.guid()`                                        |
| Email             | `z.email()`         | `email: z.email()`                                    |
| URL               | `z.url()`           | `website: z.url()`                                    |
| Non-empty         | `z.string().min(1)` | `name: z.string().min(1)`                             |
| Integer           | `z.int()`           | `count: z.int()`                                      |
| Enum              | `z.enum([...])`     | `role: z.enum(['admin', 'user'])`                     |
| Native Enum       | `z.enum(MyEnum)`    | `role: z.enum(Roles)`                                 |
| Literal           | `z.literal(...)`    | `statusCode: z.literal(200)`                          |
| Optional          | `.optional()`       | `avatar: z.url().optional()`                          |
| Array             | `z.array(...)`      | `items: z.array(ItemSchema)`                          |
| Union             | `z.union([...])`    | `message: z.union([z.string(), z.array(z.string())])` |
| ISO Date          | `z.iso.date()`      | `date: z.iso.date()`                                  |
| ISO DateTime      | `z.iso.datetime()`  | `createdAt: z.iso.datetime()`                         |
| IPv4              | `z.ipv4()`          | `ip: z.ipv4()`                                        |
| Base64            | `z.base64()`        | `data: z.base64()`                                    |

**Zod 4 deprecations** (still work but prefer top-level forms):

- `z.string().email()` → `z.email()`
- `z.string().uuid()` → `z.uuid()`
- `z.string().url()` → `z.url()`
- `z.nativeEnum(E)` → `z.enum(E)`
- `z.object()` → `z.strictObject()` (mandatory for this project -- rejects unknown keys)
- `z.object().merge()` → **removed**; use `.extend()` on `z.strictObject()` or spread `{ ...A.shape, ...B.shape }`
- `z.object().passthrough()` → `z.looseObject()` (only when explicitly needed)
- `z.infer<typeof Schema>` → `zOutput<typeof Schema>` (use `zInput<>` for pre-transform types)

## TypeScript Strict Mode

The project uses `"strict": true` in `tsconfig.json`. This means:

- All parameters must have explicit types
- Return types should be specified on public methods
- No implicit `any` is allowed
- Null checks are enforced

## Function Signatures

Always specify return types for public/exported functions:

```typescript
// CORRECT
async submit(): Promise<void> { ... }
async getData(): Promise<UserResponse> { ... }
get submitButton(): Locator { ... }

// AVOID -- missing return type
async submit() { ... }
```

## Environment Variables

Use non-null assertion (`!`) or provide defaults when accessing `process.env`:

```typescript
// Acceptable -- non-null assertion when env is guaranteed
const url = process.env.APP_URL!;

// Also acceptable -- with fallback
const url = process.env.APP_URL ?? 'http://localhost:3000';
```

**NEVER** hardcode secrets or credentials:

```typescript
// FORBIDDEN
const password = 'secret123';

// CORRECT
const password = process.env.APP_PASSWORD!;
```

## See Also

- **`api-testing`** skill -- Practical schema usage in API tests, response validation patterns, and schema location conventions.
