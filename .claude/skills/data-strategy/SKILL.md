---
name: data-strategy
description: Test data strategy -- factories, static data, and Faker usage
---

# Data Strategy

This framework uses a **bifurcated data strategy**: static data for deterministic edge cases and dynamic factories for test isolation.

## File Locations

> **`{area}` is a placeholder.** Before creating or referencing any path below, run `ls test-data/static/` and `ls test-data/factories/` to discover the real subdirectory names in this repo (e.g., `front-office`, `back-office`) and use those instead.

| Type        | Directory                     | Purpose                                   |
| ----------- | ----------------------------- | ----------------------------------------- |
| Static data | `test-data/static/{area}/`    | Immutable JSON for boundary/invalid cases |
| Factories   | `test-data/factories/{area}/` | Dynamic Faker-generated data              |

## Static Data (`test-data/static/`)

Immutable JSON files for **boundary testing, invalid inputs, and edge cases**. This data never changes, ensuring reproducible tests.

### Structure

```json
{
  "invalidCredentials": [
    {
      "description": "valid email with wrong password",
      "email": "test.user@example.com",
      "password": "WrongPassword123!"
    }
  ]
}
```

### Usage in Tests

```typescript
import testData from '../../../test-data/static/app/invalidCredentials.json';

const { invalidCredentials } = testData;

for (const { description, email, password } of invalidCredentials) {
  test(`should show error for ${description}`, { tag: '@regression' }, async ({ appPage }) => {
    await appPage.login(email, password);
    await expect(appPage.errorMessage).toBeVisible();
  });
}
```

## Dynamic Factories (`test-data/factories/`)

TypeScript factory functions using **Faker + Zod** for unique, valid data per test run. This prevents data collision in parallel execution.

### Factory Pattern

```typescript
import { faker } from '@faker-js/faker';
import { UserResponse, UserResponseSchema } from '../../../fixtures/api/schemas/app/userSchema';

/**
 * Generates a valid user object with randomized data.
 * @param {Partial<UserResponse>} overrides - Optional overrides for specific fields.
 * @returns {UserResponse} A valid user object matching the schema.
 */
export const generateUser = (overrides?: Partial<UserResponse>): UserResponse => {
  const defaults: UserResponse = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    token: faker.string.alphanumeric(64),
  };

  return UserResponseSchema.parse({ ...defaults, ...overrides });
};
```

> **Note:** Zod 4 uses top-level validators (`z.uuid()`, `z.email()`, etc.) in schemas, but the `.parse()` API and `z.infer<>` type inference work identically to v3. Factories require no code changes beyond updating their imported schemas.

### Key Requirements

1. **Import Faker**: `import { faker } from '@faker-js/faker';`
2. **Import the Zod schema**: Use the corresponding schema from `fixtures/api/schemas/`.
3. **Accept overrides**: Parameter `overrides?: Partial<SchemaType>` for customization.
4. **Validate with schema**: Always call `Schema.parse(...)` on the merged output.
5. **Export typed return**: Return type must match the Zod-inferred type.

### Usage in Tests

```typescript
import {
  generateUser,
  generateLoginCredentials,
} from '../../../test-data/factories/app/user.factory';

// Generate unique data for this test run
const user = generateUser();
const creds = generateLoginCredentials();

// Override specific fields
const adminUser = generateUser({ email: 'admin@company.com' });
const customCreds = generateLoginCredentials({ password: 'SpecificPassword123!' });
```

## When to Use Which

| Scenario                                                      | Use                |
| ------------------------------------------------------------- | ------------------ |
| Invalid email formats, SQL injection strings                  | Static data        |
| Boundary values (min/max lengths, empty strings)              | Static data        |
| Error messages or labels that the app already defines         | Enum (`enums/`)    |
| Fixed expected values tested inline (not data-driven loops)   | Inline in the test |
| Happy-path user data (names, emails, passwords, text content) | Factory            |
| Registration data that must be unique per run                 | Factory            |
| Any UI content value (todo text, product names, descriptions) | Factory            |
| Test isolation in parallel execution                          | Factory            |

**Default to factories.** Static data files are only for parametrised invalid/boundary input loops. App-defined strings (error messages, labels) belong in `enums/` so they stay in sync with the codebase. Values used in a single assertion belong inline in the test, not in a JSON file. Never hardcode test content strings — always generate them with Faker.

## No Magic Numbers

Define timeouts, limits, and constants in `config/` or `enums/` -- never hardcode numbers directly in tests or factories:

```typescript
// FORBIDDEN
await page.waitForTimeout(5000);
const maxRetries = 3;

// CORRECT -- use config/enums
import { Timeouts } from '../../config/app';
```

## Changing Static Data Values

When you need to update a value in `test-data/static/`, the change can break existing test assertions and expectations that rely on the old value. Always search for all consumers before editing.

**Read the `refactor-values` skill** (`.claude/skills/refactor-values/SKILL.md`) before modifying any existing static data file.

## See Also

- **`type-safety`** skill -- Zod 4 validators reference table and `z.strictObject()` patterns used in factory validation.
- **`refactor-values`** skill -- Impact analysis and cascading update workflow for enum values and static data changes.
