---
name: clock-mocking
description: Clock and time mocking -- frozen time, fast-forward, timers, and date-dependent feature testing
---

# Clock & Time Mocking

Control time in tests using Playwright's `page.clock` API. Essential for testing countdowns, session timeouts, scheduled events, and date-dependent UI.

## Quick Reference

```typescript
// Freeze time at a specific date
await page.clock.install({ time: new Date('2025-12-25T10:00:00') });
await page.goto('/dashboard');
await expect(page.getByText('December 25, 2025')).toBeVisible();

// Fast-forward time
await page.clock.install({ time: new Date('2025-01-01T09:00:00') });
await page.goto('/session');
await page.clock.fastForward('30:00'); // 30 minutes
await expect(page.getByText('Session expired')).toBeVisible();

// Pause and resume auto-advancing
await page.clock.pauseAt(new Date('2025-06-15T12:00:00'));
await page.goto('/');
await page.clock.resume();
```

## Rules

### ALWAYS Install Clock BEFORE Navigation

The clock must be installed before `page.goto()` so the page loads with the mocked time:

```typescript
// GOOD -- clock installed before navigation
await page.clock.install({ time: new Date('2025-03-15T14:00:00') });
await page.goto('/events');

// BAD -- page already loaded with real time
await page.goto('/events');
await page.clock.install({ time: new Date('2025-03-15T14:00:00') }); // too late
```

### ALWAYS Use ISO 8601 Date Strings

Use unambiguous date formats to avoid timezone issues:

```typescript
// GOOD -- explicit, unambiguous
await page.clock.install({ time: new Date('2025-12-25T10:00:00Z') });

// BAD -- ambiguous timezone
await page.clock.install({ time: new Date('12/25/2025') });
```

### NEVER Use `page.waitForTimeout()` With Clock Mocking

Use `page.clock.fastForward()` instead of real waits:

```typescript
// GOOD -- instant, deterministic
await page.clock.fastForward('05:00'); // 5 minutes

// BAD -- waits real time
await page.waitForTimeout(300000); // 5 minutes of real waiting
```

## Common Patterns

### Frozen Time (Date-Dependent UI)

Test UI that displays different content based on the current date:

```typescript
test('shows holiday banner on Christmas', { tag: '@regression' }, async ({ page }) => {
  await page.clock.install({ time: new Date('2025-12-25T10:00:00') });
  await page.goto('/');
  await expect(page.getByRole('banner', { name: /holiday/i })).toBeVisible();
});

test('no holiday banner on regular day', { tag: '@regression' }, async ({ page }) => {
  await page.clock.install({ time: new Date('2025-03-15T10:00:00') });
  await page.goto('/');
  await expect(page.getByRole('banner', { name: /holiday/i })).not.toBeVisible();
});
```

### Countdown Timer

```typescript
test('countdown reaches zero', { tag: '@regression' }, async ({ page }) => {
  await page.clock.install({ time: new Date('2025-01-01T00:00:00') });
  await page.goto('/sale-countdown');

  await expect(page.getByText('Sale ends in')).toBeVisible();
  await page.clock.fastForward('24:00:00'); // 24 hours
  await expect(page.getByText('Sale has ended')).toBeVisible();
});
```

### Session Timeout

```typescript
test('session expires after inactivity', { tag: '@regression' }, async ({ page }) => {
  await page.clock.install({ time: new Date('2025-06-01T09:00:00') });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Fast-forward past session timeout (e.g., 30 minutes)
  await page.clock.fastForward('31:00');

  // Next interaction should trigger session expired
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/session expired/i)).toBeVisible();
});
```

### Scheduled Events

```typescript
test('notification appears at scheduled time', { tag: '@regression' }, async ({ page }) => {
  await page.clock.pauseAt(new Date('2025-01-15T09:55:00'));
  await page.goto('/calendar');

  // No notification yet
  await expect(page.getByRole('alert')).not.toBeVisible();

  // Advance to meeting time
  await page.clock.fastForward('05:00'); // 5 minutes
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Meeting starts now');
});
```

### `setInterval` and `setTimeout`

```typescript
test('auto-refresh updates data every 30 seconds', { tag: '@regression' }, async ({ page }) => {
  await page.clock.install({ time: new Date('2025-01-01T12:00:00') });
  await page.goto('/live-feed');

  const initialCount = await page.getByTestId('update-count').textContent();
  await page.clock.fastForward('00:30'); // 30 seconds
  const updatedCount = await page.getByTestId('update-count').textContent();
  expect(updatedCount).not.toBe(initialCount);
});
```

## Clock API Reference

| Method                           | Use When                                               |
| -------------------------------- | ------------------------------------------------------ |
| `clock.install({ time })`        | Freeze at a specific time, auto-advance with real time |
| `clock.pauseAt(time)`            | Freeze at a time, time does NOT advance automatically  |
| `clock.fastForward(ms\|'HH:MM')` | Jump forward by a duration                             |
| `clock.setFixedTime(time)`       | Lock to exact time (no advancement at all)             |
| `clock.resume()`                 | Resume auto-advancing after `pauseAt`                  |

## Anti-Patterns

| Don't                                   | Problem                            | Do Instead                       |
| --------------------------------------- | ---------------------------------- | -------------------------------- |
| Install clock after `page.goto()`       | Page loads with real time          | Install before navigation        |
| Use `waitForTimeout()` with clock tests | Defeats the purpose of mocking     | Use `clock.fastForward()`        |
| Forget timezone in Date constructor     | Timezone-dependent failures        | Use ISO 8601 with `Z` suffix     |
| Test time logic with real time          | Flaky -- depends on when test runs | Always mock the clock            |
| Skip cleanup between tests              | Clock state leaks                  | Each test installs its own clock |

## See Also

- **`flaky-tests`** skill -- Time-dependent tests as a flakiness category.
- **`test-standards`** skill -- Test step structure for clock-based tests.
