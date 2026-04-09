---
name: enums
description: "Enum conventions, naming, and usage rules Framework skill ID: enums. Canonical source: .cursor/skills/enums/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: enums
  source_path: .cursor/skills/enums/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/enums/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Enums

## File Locations

> **`{area}` is a placeholder.** Before creating or referencing any path below, run `ls enums/` to discover the real subdirectory names in this repo (e.g., `front-office`, `back-office`) and use those instead.

| Type                 | Directory       | Naming      |
| -------------------- | --------------- | ----------- |
| App-specific enums   | `enums/{area}/` | `[name].ts` |
| Shared/utility enums | `enums/util/`   | `[name].ts` |

## Rules

### Use Enums for Repeated Strings

Define enums for any string value used in more than one place: UI messages, API endpoint paths, storage state paths, roles, etc.

```typescript
// CORRECT -- enum for repeated strings
import { Messages } from '../../enums/app/app';
await expect(page.getByText(Messages.LOGIN_ERROR)).toBeVisible();

// FORBIDDEN -- hardcoded string used in multiple places
await expect(page.getByText('Invalid email or password')).toBeVisible();
```

### Naming Convention

- **Enum names**: PascalCase (e.g., `Messages`, `ApiEndpoints`, `Roles`)
- **Enum values**: SCREAMING_SNAKE_CASE (e.g., `LOGIN_SUCCESS`, `CURRENT_USER`)

```typescript
export enum ApiEndpoints {
  LOGIN = '/api/users/login',
  CURRENT_USER = '/api/users/me',
}
```

### Organization

- **`enums/app/`** -- App-specific constants: messages, API endpoints, storage state paths, route paths.
- **`enums/util/`** -- Shared constants reusable across apps: roles, permissions, HTTP status codes.

### When to Create a New Enum File

Create a new enum file when a group of related string constants doesn't fit an existing enum (e.g., `enums/app/checkout.ts` for checkout-related constants). Keep related constants together -- prefer adding to an existing enum file over creating a new one when the constants belong to the same domain.

### JSDoc Comments

Add JSDoc comments to enum declarations:

```typescript
/** Common UI messages displayed to the user */
export enum Messages {
  LOGIN_SUCCESS = 'Successfully logged in',
  LOGIN_ERROR = 'Invalid email or password',
}
```

## Verify Message Values Against the Real App

String enum values for UI messages and error text **must be verified against the live application** before being committed. Do not assume message text from the spec, copy it from another codebase, or invent it — verify the actual string the app displays.

### How to Verify

1. Use `playwright-cli` to trigger the action that produces the message:
   ```bash
   playwright-cli open https://your-app.example.com/login
   playwright-cli fill e1 "bad@email.com"
   playwright-cli fill e2 "wrongpass"
   playwright-cli click e3   # Submit button
   playwright-cli snapshot   # Inspect the actual error message text
   ```
2. Copy the **exact text** from the snapshot into the enum value — including capitalization, punctuation, and spacing.

Do not use IDE browser MCP, Cursor browser tools, or any substitute — this is covered by the **No Substitute UI Exploration** rule. If `playwright-cli` cannot run, note which values are unverified and flag them for confirmation after exploration.

### If the App Is Unavailable

If you cannot access the live app, add a `// FIXME` comment on the enum value and revisit when the app is available:

```typescript
export enum Messages {
  LOGIN_ERROR = 'Invalid email or password', // FIXME: verify against live app
}
```

**Never commit unverified message strings without a `// FIXME` comment.** Message mismatches cause locator failures that are hard to diagnose.

---

## Changing Enum Values

When you need to change an enum member's string value or rename an enum key, the change cascades through tests, page objects, and schemas. Always follow the impact-analysis workflow before editing.

**Read the `refactor-values` skill** (`.claude/skills/refactor-values/SKILL.md`) before making any change to an existing enum member or key.
