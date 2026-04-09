---
name: performance-testing
description: "Performance testing -- Core Web Vitals, network throttling, load time assertions, and performance budgets Framework skill ID: performance-testing. Canonical source: .cursor/skills/performance-testing/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: performance-testing
  source_path: .cursor/skills/performance-testing/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/performance-testing/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# Performance Testing

Catch performance regressions with automated assertions on load times, Core Web Vitals, and resource sizes.

## Quick Reference

```typescript
// Assert page loads within budget
const startTime = Date.now();
await page.goto('/dashboard');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
expect(Date.now() - startTime).toBeLessThan(3000);

// Measure Core Web Vitals via Performance API
const lcp = await page.evaluate(
  () =>
    new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }),
);
expect(lcp).toBeLessThan(2500);

// Network throttling
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8, // 750 Kbps
  latency: 40, // 40ms RTT
});
```

## Rules

### ALWAYS Use Performance Budgets, Not Absolute Thresholds

Define budgets in a central location and reference them in tests:

```typescript
// config/performance-budgets.ts
export const PERFORMANCE_BUDGETS = {
  pageLoad: 3000, // ms
  lcp: 2500, // ms -- Good per Google
  fid: 100, // ms -- Good per Google
  cls: 0.1, // score -- Good per Google
  apiResponse: 1000, // ms
  bundleSize: 500 * 1024, // 500KB
} as const;
```

### Core Web Vitals Thresholds

| Metric                              | Good    | Needs Improvement | Poor    |
| ----------------------------------- | ------- | ----------------- | ------- |
| **LCP** (Largest Contentful Paint)  | ≤ 2.5s  | ≤ 4.0s            | > 4.0s  |
| **FID** (First Input Delay)         | ≤ 100ms | ≤ 300ms           | > 300ms |
| **CLS** (Cumulative Layout Shift)   | ≤ 0.1   | ≤ 0.25            | > 0.25  |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms           | > 500ms |
| **TTFB** (Time to First Byte)       | ≤ 800ms | ≤ 1.8s            | > 1.8s  |

### NEVER Use Performance Tests as Load Tests

Playwright runs a single browser. It measures **user-perceived performance**, not server capacity. Use dedicated load testing tools (k6, Artillery) for load/stress testing.

## Network Throttling

Simulate slow connections to test under realistic conditions:

```typescript
// Predefined network profiles
const NETWORK_PROFILES = {
  '3G': {
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 40,
  },
  '4G': {
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
  },
  'Slow 3G': {
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
    latency: 200,
  },
} as const;

test('dashboard loads on 3G within budget', { tag: '@regression' }, async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    ...NETWORK_PROFILES['3G'],
  });

  const start = Date.now();
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  expect(Date.now() - start).toBeLessThan(5000); // Relaxed budget for 3G
});
```

**Note:** CDP sessions only work with Chromium. Network throttling tests should use the `chromium` project.

## CPU Throttling

Simulate slower devices:

```typescript
const client = await page.context().newCDPSession(page);
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x slower
```

## Resource Size Assertions

```typescript
test('page resources are within budget', { tag: '@regression' }, async ({ page }) => {
  const resources: { url: string; size: number }[] = [];

  page.on('response', async (response) => {
    const size = (await response.body().catch(() => Buffer.alloc(0))).length;
    resources.push({ url: response.url(), size });
  });

  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();

  // Total page weight
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB budget

  // Individual JS bundles
  const jsBundles = resources.filter((r) => r.url.endsWith('.js'));
  for (const bundle of jsBundles) {
    expect(bundle.size, `${bundle.url} exceeds 500KB`).toBeLessThan(500 * 1024);
  }
});
```

## Navigation Timing

```typescript
test('TTFB is within budget', { tag: '@regression' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      ttfb: nav.responseStart - nav.requestStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
    };
  });

  expect(timing.ttfb).toBeLessThan(800);
  expect(timing.domContentLoaded).toBeLessThan(2000);
  expect(timing.load).toBeLessThan(3000);
});
```

## Anti-Patterns

| Don't                                              | Problem                                          | Do Instead                                           |
| -------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Use Playwright for load testing                    | Single browser, not a load generator             | Use k6, Artillery, or Locust                         |
| Hardcode thresholds in each test                   | Inconsistent budgets                             | Centralize in `config/performance-budgets.ts`        |
| Test performance on CI without consistent hardware | Noisy results                                    | Use dedicated performance CI runners or track trends |
| Skip network throttling                            | Tests pass on fast networks, fail for real users | Test on simulated 3G/4G                              |
| Measure only page load time                        | Misses interaction performance                   | Include CWV metrics (LCP, CLS, INP)                  |

## See Also

- **`config`** skill -- Centralized configuration for performance budgets.
- **`debugging`** skill -- Trace viewer for investigating slow page loads.
- **`network-mocking`** skill -- Network throttling profiles.
