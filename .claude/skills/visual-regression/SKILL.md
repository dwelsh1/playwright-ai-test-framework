---
name: visual-regression
description: Screenshot comparison testing -- thresholds, masking, animations, baselines, and CI setup
---

# Visual Regression Testing

Visual tests catch unintended visual changes -- layout shifts, style regressions, broken responsive designs -- that functional assertions miss.

## Quick Reference

```typescript
// Full page screenshot comparison
await expect(page).toHaveScreenshot('homepage.png');

// Element screenshot -- scoped to a component
await expect(page.getByTestId('pricing-card')).toHaveScreenshot('pricing-card.png');

// With threshold -- allow minor pixel differences
await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });

// Mask dynamic content -- hide timestamps, avatars
await expect(page).toHaveScreenshot({
  mask: [page.getByTestId('timestamp'), page.getByRole('img', { name: 'Avatar' })],
});

// Disable animations -- prevent flaky diffs
await expect(page).toHaveScreenshot({ animations: 'disabled' });

// Update baselines
// npx playwright test --update-snapshots
```

## Rules

### ALWAYS Disable Animations

CSS animations and transitions are the #1 cause of flaky visual diffs. Set globally:

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
    },
  },
});
```

### ALWAYS Mask Dynamic Content

Any content that changes between runs MUST be masked: timestamps, avatars, counters, ads, relative dates.

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.getByTestId('current-time'),
    page.getByTestId('user-avatar'),
    page.getByTestId('live-count'),
  ],
  maskColor: '#FF00FF', // visible magenta -- makes masks obvious in reviews
});
```

### NEVER Update Snapshots Blindly

Always review the diff in the HTML report first. Understand _why_ the snapshot changed before updating:

```bash
# 1. Run tests and see failures
npx playwright test
npx playwright show-report

# 2. Review diffs -- only update if changes are intentional
npx playwright test --update-snapshots

# 3. Review updated files before committing
git diff --name-only
```

**Never run `--update-snapshots` in CI.**

## Thresholds

Three knobs control comparison sensitivity:

| Option              | Controls                             | Good Default                               |
| ------------------- | ------------------------------------ | ------------------------------------------ |
| `maxDiffPixels`     | Absolute pixel count that can differ | `100` for pages, `10` for components       |
| `maxDiffPixelRatio` | Fraction of total pixels (0-1)       | `0.01` (1%) for pages                      |
| `threshold`         | Per-pixel color tolerance (0-1)      | `0.2` for most UIs, `0` for design systems |

```typescript
// Content page -- allow minor anti-aliasing variance
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixelRatio: 0.01,
  threshold: 0.2,
});

// Design system component -- zero tolerance
await expect(component).toHaveScreenshot('button.png', {
  maxDiffPixels: 0,
  threshold: 0,
});

// Chart with curved shapes -- looser tolerance
await expect(chart).toHaveScreenshot('chart.png', {
  threshold: 0.3,
  maxDiffPixels: 200,
});
```

## Full Page vs Element Screenshots

| Approach                     | Use When                                     | Benefit                                       |
| ---------------------------- | -------------------------------------------- | --------------------------------------------- |
| Full page (`fullPage: true`) | Landing pages, layouts where spacing matters | Catches layout shifts between sections        |
| Element screenshot           | Individual components (cards, forms, modals) | Isolated, stable, immune to unrelated changes |

```typescript
// Full page -- catches layout shifts
await expect(page).toHaveScreenshot('homepage-full.png', { fullPage: true });

// Element -- isolates component
await expect(page.getByRole('table')).toHaveScreenshot('pricing-table.png');
```

## Responsive Visual Testing

Test layouts at different viewport sizes:

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`homepage at ${viewport.name}`, { tag: '@regression' }, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
      animations: 'disabled',
      fullPage: true,
    });
  });
}
```

## CI Setup

Visual tests require consistent rendering. Font hinting and anti-aliasing differ across operating systems. A snapshot taken on macOS will NOT match Linux.

**Solution:** Run visual tests in Docker using the official Playwright container:

```bash
# Generate baselines using the same container as CI
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  npx playwright test --update-snapshots --project=visual
```

**Ensure Playwright version in `package.json` matches the Docker image tag.**

### Platform-Agnostic Snapshots

Remove OS suffix from snapshot paths so baselines are shared:

```typescript
// playwright.config.ts
export default defineConfig({
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',
});
```

## Decision Guide

| Scenario                   | Approach                                   |
| -------------------------- | ------------------------------------------ |
| Key landing pages          | Full page, `fullPage: true`                |
| Individual components      | Element screenshot, strict threshold       |
| Pages with dynamic content | Full page + `mask` on volatile elements    |
| Responsive layouts         | Screenshot per viewport (loop or projects) |
| Design system library      | Element per variant, `threshold: 0`        |

### When Visual Tests Add Value

- Stable pages with predictable content
- Design systems and component libraries
- Post-refactor verification
- Marketing and landing pages

### When Visual Tests Are Noise

- Highly dynamic pages with real-time data
- A/B test pages with variant content
- Pages where functional assertions already cover key elements

## Anti-Patterns

| Don't                                  | Problem                             | Do Instead                                    |
| -------------------------------------- | ----------------------------------- | --------------------------------------------- |
| Visual test every page                 | Massive snapshot maintenance        | Pick 5-10 key pages and critical components   |
| Skip `animations: 'disabled'`          | CSS transitions create random diffs | Set globally in config                        |
| Run across macOS + Linux + Windows     | Font rendering differs per OS       | Standardize on Linux via Docker               |
| Update snapshots blindly               | Accepts unintended regressions      | Always review diffs in HTML report first      |
| Set threshold too high (0.1+)          | 10% pixel change still passes       | Start at `0.01`, adjust per-test              |
| Use visual tests instead of functional | Diffs don't tell you _what_ broke   | Visual tests complement, never replace        |
| Full page on infinite scroll           | Page height is nondeterministic     | Element screenshots on above-the-fold content |

## See Also

- **`test-standards`** skill -- Test structure and tagging for visual test files.
- **`debugging`** skill -- Trace viewer for investigating visual diff failures.
