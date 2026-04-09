---
name: security-testing
description: "Security testing patterns -- XSS, CSRF, headers, cookies, and authentication bypass validation Framework skill ID: security-testing. Canonical source: .cursor/skills/security-testing/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: security-testing
  source_path: .cursor/skills/security-testing/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/security-testing/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Security Testing

Automated security checks that run alongside functional tests. These catch common vulnerabilities before they reach production.

## Quick Reference

```typescript
// Check security headers
const response = await page.goto('/');
expect(response!.headers()['x-frame-options']).toBeTruthy();
expect(response!.headers()['x-content-type-options']).toBe('nosniff');

// Check cookie flags
const cookies = await context.cookies();
const session = cookies.find((c) => c.name === 'session');
expect(session?.httpOnly).toBe(true);
expect(session?.secure).toBe(true);
expect(session?.sameSite).toBe('Strict');

// XSS payload test
await page.getByLabel('Search').fill('<script>alert("xss")</script>');
await page.getByRole('button', { name: 'Search' }).click();
await expect(page.locator('script')).toHaveCount(0);
```

## Rules

### ALWAYS Validate Security Headers

Every page response should include security headers. Create a reusable check:

```typescript
async function assertSecurityHeaders(response: Response): Promise<void> {
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  expect(headers['strict-transport-security']).toBeTruthy();
  expect(headers['content-security-policy']).toBeTruthy();
  expect(headers['referrer-policy']).toBeTruthy();
}
```

### Required Security Headers

| Header                      | Expected Value                                | Purpose                      |
| --------------------------- | --------------------------------------------- | ---------------------------- |
| `X-Content-Type-Options`    | `nosniff`                                     | Prevents MIME-type sniffing  |
| `X-Frame-Options`           | `DENY` or `SAMEORIGIN`                        | Prevents clickjacking        |
| `Strict-Transport-Security` | Present with `max-age`                        | Enforces HTTPS               |
| `Content-Security-Policy`   | Present                                       | Prevents XSS, data injection |
| `Referrer-Policy`           | `strict-origin-when-cross-origin` or stricter | Controls referrer leakage    |

### ALWAYS Validate Cookie Security Flags

```typescript
test('session cookie has security flags', { tag: '@regression' }, async ({ context, page }) => {
  await test.step('GIVEN user is authenticated', async () => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
  });

  await test.step('THEN session cookie has proper security flags', async () => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name.includes('session'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.secure).toBe(true);
    expect(sessionCookie!.sameSite).toMatch(/Strict|Lax/);
  });
});
```

## XSS Testing

Test that user inputs are properly sanitized:

```typescript
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '"><svg onload=alert("xss")>',
  "javascript:alert('xss')",
  '<iframe src="javascript:alert(1)">',
];

for (const payload of xssPayloads) {
  test(`rejects XSS payload: ${payload.slice(0, 30)}`, { tag: '@regression' }, async ({ page }) => {
    await page.goto('/search');
    await page.getByLabel('Search').fill(payload);
    await page.getByRole('button', { name: 'Search' }).click();

    // Payload should be escaped, not executed
    const content = await page.content();
    expect(content).not.toContain(payload);

    // No injected scripts should exist
    const injectedScripts = page.locator('script:not([src])');
    await expect(injectedScripts).toHaveCount(0);
  });
}
```

## CSRF Validation

Verify forms include CSRF tokens and API rejects requests without them:

```typescript
test('form includes CSRF token', { tag: '@regression' }, async ({ page }) => {
  await page.goto('/settings');
  const csrfInput = page.locator('input[name="_csrf"], input[name="csrf_token"]');
  await expect(csrfInput).toBeAttached();
  const token = await csrfInput.getAttribute('value');
  expect(token).toBeTruthy();
  expect(token!.length).toBeGreaterThan(10);
});
```

## Authentication Bypass Testing

Verify protected routes redirect unauthenticated users:

```typescript
const protectedRoutes = ['/dashboard', '/settings', '/admin', '/api/users'];

for (const route of protectedRoutes) {
  test(`${route} requires authentication`, { tag: '@regression' }, async ({ page }) => {
    const response = await page.goto(route);
    // Should redirect to login or return 401/403
    const isRedirected = page.url().includes('/login');
    const isBlocked = [401, 403].includes(response!.status());
    expect(isRedirected || isBlocked).toBe(true);
  });
}
```

## Authorization Testing

Verify role-based access control:

```typescript
test('regular user cannot access admin panel', { tag: '@regression' }, async ({ page }) => {
  // Login as regular user (via auth helper or storage state)
  await page.goto('/admin');
  // Should be denied
  await expect(page.getByText(/access denied|forbidden|not authorized/i)).toBeVisible();
});
```

## Anti-Patterns

| Don't                                             | Problem                           | Do Instead                              |
| ------------------------------------------------- | --------------------------------- | --------------------------------------- |
| Skip security tests "because QA does it manually" | Manual testing misses regressions | Automate repeatable security checks     |
| Test only happy-path auth                         | Misses bypass vulnerabilities     | Test protected routes without auth      |
| Hardcode credentials in tests                     | Security risk                     | Use `process.env` variables             |
| Test XSS only with `<script>` tags                | Many XSS vectors exist            | Use diverse payload list                |
| Ignore cookie flags                               | Session hijacking risk            | Assert `httpOnly`, `secure`, `sameSite` |

## See Also

- **`authentication`** skill -- Patterns for managing auth state in tests.
- **`api-testing`** skill -- Validating API security responses with schema validation.
- **`config`** skill -- Environment variable management for credentials.
