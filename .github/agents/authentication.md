---
name: authentication
description: "Authentication patterns -- storage state reuse, API-based login, OAuth popups, MFA handling, and session management Framework skill ID: authentication. Canonical source: .cursor/skills/authentication/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: authentication
  source_path: .cursor/skills/authentication/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/authentication/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Authentication Patterns

Efficient auth strategies that avoid logging in through the UI for every test. Covers storage state reuse, API-based login, and special flows (OAuth, MFA).

## Quick Reference

```typescript
// Save storage state after login (setup file)
await page.goto('/login');
await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('/dashboard');
await page.context().storageState({ path: 'playwright/.auth/user.json' });

// Reuse storage state in tests (playwright.config.ts)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

## Rules

### ALWAYS Use Storage State for Authenticated Tests

Login through the UI once in a setup file, save the state, and reuse it across all tests:

```typescript
// tests/{area}/auth.setup.ts
import { test as setup, expect } from '../../fixtures/pom/test-options';

setup('authenticate as standard user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### ALWAYS Git-Ignore Auth State Files

```gitignore
# .gitignore
playwright/.auth/
```

Auth state files contain session tokens. Never commit them.

### PREFER API-Based Login Over UI Login

API login is faster and more stable than clicking through the login form:

```typescript
// tests/{area}/auth.setup.ts -- API-based login
import { test as setup } from '../../fixtures/pom/test-options';

setup('authenticate via API', async ({ request, page }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      email: process.env.TEST_EMAIL!,
      password: process.env.TEST_PASSWORD!,
    },
  });
  expect(response.ok()).toBe(true);

  // Navigate to set cookies in browser context
  await page.goto('/');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### NEVER Hardcode Credentials

```typescript
// BAD
await page.getByLabel('Email').fill('admin@example.com');

// GOOD
await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
```

## Multiple Roles

When tests need different user roles (admin, user, viewer):

```typescript
// playwright.config.ts
projects: [
  { name: 'admin-setup', testMatch: /admin\.setup\.ts/ },
  { name: 'user-setup', testMatch: /user\.setup\.ts/ },
  {
    name: 'admin-tests',
    use: { storageState: 'playwright/.auth/admin.json' },
    dependencies: ['admin-setup'],
  },
  {
    name: 'user-tests',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['user-setup'],
  },
],
```

```typescript
// tests/{area}/admin.setup.ts
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/admin');
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
```

## OAuth Popup Handling

```typescript
test('login with Google OAuth', { tag: '@e2e' }, async ({ page }) => {
  // Click OAuth button and wait for popup
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  const popup = await popupPromise;

  // Interact with OAuth provider in popup
  await popup.waitForLoadState();
  await popup.getByLabel('Email').fill(process.env.OAUTH_EMAIL!);
  await popup.getByRole('button', { name: 'Next' }).click();
  await popup.getByLabel('Password').fill(process.env.OAUTH_PASSWORD!);
  await popup.getByRole('button', { name: 'Next' }).click();

  // Popup closes automatically after consent
  await popup.waitForEvent('close');

  // Original page should be authenticated
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**Note:** Most OAuth providers block automated testing. Prefer API-based login or test environment SSO bypasses.

## MFA / 2FA Handling

For apps with multi-factor authentication:

```typescript
// Option 1: Use TOTP library for time-based OTP
import { authenticator } from 'otplib';

setup('authenticate with MFA', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Generate TOTP code
  const token = authenticator.generate(process.env.MFA_SECRET!);
  await page.getByLabel('Verification code').fill(token);
  await page.getByRole('button', { name: 'Verify' }).click();

  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// Option 2: Disable MFA in test environment (preferred)
// Configure test accounts without MFA enabled
```

## Session Expiry Testing

```typescript
test('handles expired session gracefully', { tag: '@regression' }, async ({ page, context }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Clear cookies to simulate session expiry
  await context.clearCookies();

  // Next action should redirect to login
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/.*login/);
});
```

## Anti-Patterns

| Don't                              | Problem                                              | Do Instead                              |
| ---------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| Login via UI in every test         | Slow, 2-5s per test                                  | Use storage state from setup file       |
| Commit auth state files            | Leaks session tokens                                 | Add `playwright/.auth/` to `.gitignore` |
| Hardcode credentials               | Security risk, breaks across envs                    | Use `process.env`                       |
| Share one auth state for all roles | Role-specific tests use wrong permissions            | Separate state file per role            |
| Skip `waitForURL` after login      | Race condition -- state saved before login completes | Always wait for post-login URL          |
| Test OAuth against real providers  | Flaky, rate-limited, blocks automation               | Use test environment SSO bypass         |

## See Also

- **`config`** skill -- Environment variable patterns for credentials.
- **`helpers`** skill -- Auth helper fixtures for login/logout.
- **`security-testing`** skill -- Testing auth bypass and session security.
- **`multi-context`** skill -- Multi-user scenarios with separate browser contexts.
