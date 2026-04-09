---
name: refactor-values
description: Safe refactoring workflow for enum values and static test data -- impact analysis, cascading updates, and verification
---

# Refactoring Enum Values and Static Test Data

## When to Read This Skill

Read this skill when:

- Changing an enum member's string value (e.g., updating `ApiEndpoints.LOGIN = '/api/auth/login'`)
- Renaming an enum key (e.g., renaming `Messages.LOGIN_ERROR` → `Messages.AUTH_FAILURE`)
- Changing a value inside a `test-data/static/` JSON file

These are **high-impact changes** because enum values and static data flow into tests, page objects, schemas, and assertions. A change without updating all consumers causes silent test failures or TypeScript errors.

---

## Mandatory Workflow

### Step 1 -- Find All Consumers Before Touching Anything

Search the **entire codebase** for every occurrence of both:

1. **The enum key** (import reference)
2. **The current string value** (raw string -- catches hardcoded usages that bypass the enum)

```bash
# Find all usages of the enum key
grep -r "Messages.LOGIN_ERROR" .

# Find all usages of the raw string value
grep -r "Invalid email or password" .

# For endpoint changes, search both
grep -r "ApiEndpoints.LOGIN" .
grep -r "'/api/users/login'" .
```

> Do this before making any edits. Understand the full blast radius first.

### Step 2 -- Categorize Impact

For **enum string value changes** (changing what the member resolves to):

| Consumer Type                                                             | What to Check          | Action Required                                    |
| ------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| Tests with `toHaveText()` / `toBeVisible()` using the old value           | Will fail if hardcoded | Update to use enum or new value                    |
| Page object locators using `getByText(Messages.X)`                        | Auto-updated via enum  | No change needed -- enum reference already correct |
| Zod schemas with `z.literal('old-value')` or `z.enum([..., 'old-value'])` | Will reject new value  | Update literal/enum to new value                   |
| API endpoint paths in `apiRequest` calls                                  | Will call wrong URL    | Update enum reference or hardcoded path            |
| Static data JSON using the old string as an expected value                | Test data mismatch     | Update JSON entries                                |
| Other enum members that derive from this value                            | Indirect breakage      | Audit and update                                   |

For **enum key renames** (e.g., `LOGIN_ERROR` → `AUTH_FAILURE`):

| Consumer Type                              | What to Check            | Action Required                    |
| ------------------------------------------ | ------------------------ | ---------------------------------- |
| Every file importing and using the old key | TypeScript compile error | Rename key reference in every file |
| Re-exports or barrel files                 | May silently pass        | Check `index.ts` files             |

For **static data value changes** (editing a JSON in `test-data/static/`):

| Consumer Type                                                   | What to Check                      | Action Required                             |
| --------------------------------------------------------------- | ---------------------------------- | ------------------------------------------- |
| Tests importing the file and looping over its values            | May use changed value in assertion | Verify test assertions still match new data |
| Tests asserting against a specific value from the file directly | Will fail                          | Update hardcoded expected value in the test |
| Enum members mirroring the static data string                   | Out of sync                        | Update the matching enum member             |

### Step 3 -- Make All Changes Atomically

Update the source (enum or JSON) and **all consumers in one pass**. Never leave an intermediate broken state where the value is changed but consumers still reference the old value.

Recommended order:

1. Change the enum value / rename the key / update the JSON
2. Update all consumers identified in Step 1
3. Run TypeScript compile check
4. Lint
5. Run affected tests

### Step 4 -- Verify No Breakage

```bash
# 1. TypeScript -- catches key renames and type mismatches
npx tsc --noEmit

# 2. Lint
npx eslint .

# 3. Run tests that use the changed value (adjust grep pattern)
npx playwright test --grep "login"
```

If any test fails, trace it to a missed consumer from Step 1 and update it.

---

## Common Scenarios

### Scenario A: API Endpoint URL Changed

The backend renamed `/api/users/login` → `/api/auth/login`.

```typescript
// enums/{area}/app.ts -- BEFORE
export enum ApiEndpoints {
  LOGIN = '/api/users/login',
}

// enums/{area}/app.ts -- AFTER
export enum ApiEndpoints {
  LOGIN = '/api/auth/login',
}
```

**Required follow-up:**

- Search for `'/api/users/login'` -- anyone who hardcoded it instead of using the enum must be updated
- Search for `ApiEndpoints.LOGIN` -- verify all usages are correct (no string concatenation that would silently use the old value)
- Check `fixtures/api/schemas/` for any schema using the old path as a `z.literal()`
- Check `helpers/` and setup files for hardcoded endpoint strings

---

### Scenario B: UI Error Message Wording Changed

The UI now shows different text and the enum needs updating.

```typescript
// enums/{area}/app.ts -- BEFORE
export enum Messages {
  LOGIN_ERROR = 'Invalid email or password',
}

// enums/{area}/app.ts -- AFTER
export enum Messages {
  LOGIN_ERROR = 'Incorrect credentials. Please try again.',
}
```

**Required follow-up:**

- Search for the old string `'Invalid email or password'` -- any test hardcoding it will now fail
- Tests using `getByText(Messages.LOGIN_ERROR)` or `toHaveText(Messages.LOGIN_ERROR)` update automatically
- Check `test-data/static/` JSON files for the old string as an expected value field

---

### Scenario C: Enum Key Renamed

```typescript
// enums/{area}/app.ts -- BEFORE
export enum Messages {
  LOGIN_ERROR = 'Invalid email or password',
}

// enums/{area}/app.ts -- AFTER
export enum Messages {
  AUTH_FAILURE = 'Invalid email or password',
}
```

**Required follow-up:**

- Every file that referenced `Messages.LOGIN_ERROR` is now a TypeScript error
- Run `npx tsc --noEmit` to surface all locations immediately
- Update every reference from `Messages.LOGIN_ERROR` to `Messages.AUTH_FAILURE`
- Search for the old key as a string in comments or documentation too

---

### Scenario D: Static Data Value Changed

```json
// test-data/static/{area}/invalidCredentials.json -- AFTER
{
  "invalidCredentials": [
    {
      "description": "valid email with wrong password",
      "email": "test.user@example.com",
      "password": "UpdatedWrongPassword!"
    }
  ]
}
```

**Required follow-up:**

- Find all test files that import this JSON (`grep -r "invalidCredentials.json" .`)
- For each test, check if it asserts against the old password value `"WrongPassword123!"` anywhere
- Verify the test behavior is still correct with the new data (it tests the right boundary condition)
- Check if any enum member mirrors this value and needs updating

---

## Anti-Patterns

```typescript
// ANTI-PATTERN 1 -- string value changed but test still hardcodes old value
export enum Messages {
  LOGIN_ERROR = 'Incorrect credentials. Please try again.', // updated
}

// This test now fails silently -- old string no longer matches the UI:
await expect(page.getByText('Invalid email or password')).toBeVisible(); // STALE
```

```typescript
// ANTI-PATTERN 2 -- enum key renamed but not all usages updated
// File A: updated ✅
Messages.AUTH_FAILURE;

// File B: still using old key -- TypeScript error (caught by tsc --noEmit)
Messages.LOGIN_ERROR; // ❌ Property 'LOGIN_ERROR' does not exist
```

```typescript
// ANTI-PATTERN 3 -- static data changed but assertion not updated
// test-data/static/app/credentials.json was updated with a new email
// but the test still asserts the old email is present in the response
expect(response.email).toBe('old.email@example.com'); // ❌ stale assertion
```

---

## See Also

- **`enums`** skill -- Enum conventions, organization, and when to create new enum files.
- **`data-strategy`** skill -- Static data structure, file locations, and usage in data-driven tests.
- **`test-standards`** skill -- How data-driven tests import and use static JSON.
- **`type-safety`** skill -- Zod schema patterns; `z.literal()` and `z.enum()` that may reference enum values.
