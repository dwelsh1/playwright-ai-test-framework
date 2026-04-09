---
name: multi-context
description: "Multi-tab, popup, and multi-user browser context patterns Framework skill ID: multi-context. Canonical source: .cursor/skills/multi-context/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: multi-context
  source_path: .cursor/skills/multi-context/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/multi-context/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Multi-Tab, Popups & Multi-User Contexts

Patterns for handling new tabs, popups, OAuth windows, and testing multi-user scenarios with isolated browser contexts.

## Quick Reference

```typescript
// Handle new tab
const pagePromise = context.waitForEvent('page');
await page.getByRole('link', { name: 'Open in new tab' }).click();
const newPage = await pagePromise;
await newPage.waitForLoadState();

// Handle popup
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Sign in with Google' }).click();
const popup = await popupPromise;

// Multi-user scenario
const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
const userContext = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
const adminPage = await adminContext.newPage();
const userPage = await userContext.newPage();
```

## Rules

### ALWAYS Set Up the Promise BEFORE the Action

The event listener must be registered before the click that triggers the new tab/popup:

```typescript
// GOOD -- promise registered before click
const pagePromise = context.waitForEvent('page');
await page.getByRole('link', { name: 'Report' }).click();
const newPage = await pagePromise;

// BAD -- click first, then listen (race condition)
await page.getByRole('link', { name: 'Report' }).click();
const newPage = await context.waitForEvent('page'); // may miss the event
```

### ALWAYS Wait for Load State on New Pages

```typescript
const pagePromise = context.waitForEvent('page');
await page.getByRole('link', { name: 'Terms' }).click();
const newPage = await pagePromise;
await newPage.waitForLoadState(); // wait for DOM content loaded
await expect(newPage.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
```

### ALWAYS Close Extra Pages/Contexts When Done

Prevent resource leaks and test interference:

```typescript
const newPage = await pagePromise;
// ... assertions ...
await newPage.close();

// For contexts
const adminContext = await browser.newContext();
// ... test ...
await adminContext.close();
```

## New Tab Handling

```typescript
test('download link opens in new tab', { tag: '@regression' }, async ({ page, context }) => {
  await test.step('GIVEN user is on the reports page', async () => {
    await page.goto('/reports');
  });

  await test.step('WHEN user clicks the PDF report link', async () => {
    const pagePromise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'Download PDF' }).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    await test.step('THEN the PDF viewer opens in the new tab', async () => {
      await expect(newPage).toHaveURL(/.*\.pdf/);
    });

    await newPage.close();
  });
});
```

## Popup Handling

Popups are new windows triggered by `window.open()`, OAuth flows, or payment providers:

```typescript
test('OAuth login via popup', { tag: '@e2e' }, async ({ page }) => {
  await page.goto('/login');

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with GitHub' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();

  // Interact with popup
  await popup.getByLabel('Username').fill(process.env.GITHUB_USER!);
  await popup.getByLabel('Password').fill(process.env.GITHUB_PASS!);
  await popup.getByRole('button', { name: 'Sign in' }).click();

  // Popup closes after auth
  await popup.waitForEvent('close');

  // Original page is now authenticated
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

## Multi-User Scenarios

Test real-time collaboration, chat, or role-based interactions with separate browser contexts:

```typescript
test('admin sees user activity in real time', { tag: '@e2e' }, async ({ browser }) => {
  // Create isolated contexts with different auth states
  const adminContext = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  });
  const userContext = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });

  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();

  await test.step('GIVEN admin is on the activity dashboard', async () => {
    await adminPage.goto('/admin/activity');
  });

  await test.step('WHEN user creates a new post', async () => {
    await userPage.goto('/posts/new');
    await userPage.getByLabel('Title').fill('Test Post');
    await userPage.getByRole('button', { name: 'Publish' }).click();
    await expect(userPage.getByText('Published')).toBeVisible();
  });

  await test.step('THEN admin sees the new activity', async () => {
    await expect(adminPage.getByText('Test Post')).toBeVisible();
  });

  // Cleanup
  await adminContext.close();
  await userContext.close();
});
```

## Multiple Tabs in Same Context

When testing tab synchronization (e.g., shopping cart updates across tabs):

```typescript
test('cart syncs across tabs', { tag: '@regression' }, async ({ context, page }) => {
  await page.goto('/shop');

  // Open second tab in same context (shares cookies)
  const secondTab = await context.newPage();
  await secondTab.goto('/cart');

  // Add item in first tab
  await page.getByRole('button', { name: 'Add to cart' }).click();

  // Verify cart updates in second tab
  await secondTab.reload();
  await expect(secondTab.getByText('1 item')).toBeVisible();

  await secondTab.close();
});
```

## Anti-Patterns

| Don't                                   | Problem                         | Do Instead                               |
| --------------------------------------- | ------------------------------- | ---------------------------------------- |
| Click before registering event listener | Miss the popup/tab event        | Register `waitForEvent` before the click |
| Skip `waitForLoadState()`               | Interact with unloaded page     | Always wait for load state               |
| Leave contexts/pages open               | Memory leaks, test interference | Close in cleanup or `afterEach`          |
| Use same context for multi-user         | Shares cookies and state        | Create separate `browser.newContext()`   |
| Assume popup URL is predictable         | OAuth redirects vary            | Wait for popup content, not URL          |

## See Also

- **`authentication`** skill -- OAuth popup handling and storage state management.
- **`test-standards`** skill -- Test structure for multi-step multi-user scenarios.
