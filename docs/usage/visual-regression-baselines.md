# Visual Regression — Managing Baselines

**Audience:** Jr QA Engineers working with visual regression tests.

Visual regression tests catch unintended UI changes by comparing a screenshot of the current page against a saved "baseline" image. If the screenshots differ beyond a small threshold, the test fails. This guide explains how baselines work, how to create them, and what to do when a test fails.

---

## Table of Contents

1. [How visual tests work](#1-how-visual-tests-work)
2. [Running visual tests](#2-running-visual-tests)
3. [Creating a baseline for the first time](#3-creating-a-baseline-for-the-first-time)
4. [What a visual failure looks like](#4-what-a-visual-failure-looks-like)
5. [Updating a baseline after an intentional change](#5-updating-a-baseline-after-an-intentional-change)
6. [Masking dynamic content](#6-masking-dynamic-content)
7. [Where baseline images are stored](#7-where-baseline-images-are-stored)
8. [CI and visual tests](#8-ci-and-visual-tests)
9. [Common mistakes](#9-common-mistakes)

---

## 1. How visual tests work

A visual regression test calls `toHaveScreenshot()` instead of a regular assertion:

```typescript
await expect(menuPage.page).toHaveScreenshot('menu-page.png', {
  maxDiffPixelRatio: 0.01,
  animations: 'disabled',
});
```

The first time this runs, Playwright **creates** the baseline image and saves it. Every subsequent run **compares** the new screenshot to that saved baseline. If more than 1% of pixels differ, the test fails.

`toHaveScreenshot()` options used in this framework:

| Option              | Value             | What it does                                                    |
| ------------------- | ----------------- | --------------------------------------------------------------- |
| `maxDiffPixelRatio` | `0.01`            | Allows up to 1% pixel difference (covers sub-pixel rendering)   |
| `animations`        | `'disabled'`      | Freezes CSS animations so they do not cause false failures      |
| `mask`              | Array of locators | Covers dynamic content (timestamps, user names) with a grey box |

---

## 2. Running visual tests

Visual tests are tagged `@visual`. Run them with:

```bash
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium
```

Or run all visual tests across the project:

```bash
npx playwright test --project=chromium --grep "@visual"
```

> **Important:** Always run visual tests with `--project=chromium` (or the same browser used to create the baselines). Screenshots from different browsers look different and will fail even when the UI is correct.

---

## 3. Creating a baseline for the first time

When you run a visual test for the first time — or after deleting a baseline — Playwright writes the screenshot as the new baseline and **fails the test with a message like:**

```
Error: A snapshot doesn't exist at:
  tests/coffee-cart/functional/visual-regression.spec.ts-snapshots/menu-page-chromium-win32.png
  Writing actual results to the snapshot file.
```

This is expected. Run the test **again** to confirm the baseline was saved correctly and the test now passes:

```bash
# First run — writes baseline, test fails (expected)
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium

# Second run — compares against the baseline, should pass
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium
```

If the second run also passes, the baseline is good. Commit the new baseline file.

### Shortcut: write the baseline in one step

Use `--update-snapshots` to write all missing baselines and immediately accept the current screenshots as correct:

```bash
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium --update-snapshots
```

> Only use `--update-snapshots` when you are **intentionally creating or replacing** baselines. Never use it to "fix" a failing test without first understanding why it failed — you might silently accept a broken UI.

---

## 4. What a visual failure looks like

When a visual test fails, Playwright shows:

```
Error: Screenshot comparison failed:
  2341 pixels (1.23%) are different.
  Expected: tests/coffee-cart/functional/visual-regression.spec.ts-snapshots/menu-page-chromium-win32.png
  Received: test-results/.../menu-page-actual.png
  Diff: test-results/.../menu-page-diff.png
```

Three images are written to `test-results/`:

| Image            | What it shows                                   |
| ---------------- | ----------------------------------------------- |
| `*-expected.png` | The saved baseline                              |
| `*-actual.png`   | What the page looks like now                    |
| `*-diff.png`     | Pixels that differ, highlighted in pink/magenta |

Open the diff image to understand what changed. You can also view these in the trace viewer or Smart Reporter.

### Is the failure real or a false positive?

**Real failure** — the diff shows visible UI changes (a button moved, text is different, a colour changed). Investigate whether this was an intentional change or a bug.

**False positive** — the diff shows noise across many pixels but the page looks identical. This usually means:

- The test ran on a different OS or browser than when the baseline was created (Windows renders fonts differently from Linux)
- An animation was not fully disabled
- A dynamic value (timestamp, username, random ID) appeared in the screenshot

---

## 5. Updating a baseline after an intentional change

When the UI has been deliberately changed (a designer updated a component, a button was renamed), the old baseline is now wrong. You need to update it.

**Step 1 — Confirm the change is intentional**

Look at the diff image. Confirm the change matches what was deployed or designed. Do not update baselines for bugs.

**Step 2 — Update the baseline**

```bash
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium --update-snapshots
```

**Step 3 — Verify**

Run the test one more time without `--update-snapshots` to confirm the new baseline is accepted:

```bash
npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium
```

**Step 4 — Commit the updated baseline**

Baseline images are committed to the repository. Stage and commit them alongside the code change:

```bash
git add tests/coffee-cart/functional/visual-regression.spec.ts-snapshots/
git commit -m "chore: update visual baselines for redesigned header"
```

> Always commit baseline updates in the **same PR** as the UI change that caused them. Reviewers can then compare the before/after images in the PR diff.

---

## 6. Masking dynamic content

Some parts of a page change every test run — timestamps, user-generated content, random IDs, avatars loaded from external URLs. These cause visual tests to fail consistently even when the UI is correct.

Use the `mask` option to cover these areas with a grey box before taking the screenshot:

```typescript
await expect(cartPage.page).toHaveScreenshot('checkout-modal.png', {
  maxDiffPixelRatio: 0.01,
  animations: 'disabled',
  mask: [paymentDetails.nameInput, paymentDetails.emailInput],
});
```

Pass an array of locators. Each matched element is covered with a solid grey rectangle in both the baseline and the comparison screenshot, so changes inside the masked area are ignored.

### When to use masking

- Form inputs that show user-entered values (name, email, address)
- Timestamps or "last updated" fields
- Avatar images loaded from external services
- Progress bars or loading spinners that may not be fully settled

### When NOT to use masking

Do not mask elements just because they are hard to control. Masking hides real visual changes. If you mask the entire page header to avoid a flaky logo, you will also miss it if the logo disappears entirely.

---

## 7. Where baseline images are stored

Playwright saves baselines next to the test file, in a folder called `<test-file>-snapshots/`.

For the visual regression spec:

```
tests/coffee-cart/functional/
├── visual-regression.spec.ts
└── visual-regression.spec.ts-snapshots/
    ├── menu-page-chromium-win32.png
    ├── cart-empty-chromium-win32.png
    ├── cart-with-items-chromium-win32.png
    ├── login-page-chromium-win32.png
    └── checkout-modal-chromium-win32.png
```

The filename format is: `{snapshot-name}-{browser}-{platform}.png`

Because filenames include the platform, baselines created on Windows will not be used when the test runs on Linux in CI. See [CI and visual tests](#8-ci-and-visual-tests) for how to handle this.

---

## 8. CI and visual tests

Visual tests in CI run on Linux (GitHub Actions uses Ubuntu). If your baselines were created on Windows, they will fail in CI because the platform suffix is different (`win32` vs `linux`).

### Creating Linux baselines

The safest approach is to create baselines inside the Dev Container, which runs Linux:

1. Open the project in VS Code and click **Reopen in Container**
2. Run the visual tests to create baselines:
   ```bash
   npx playwright test tests/coffee-cart/functional/visual-regression.spec.ts --project=chromium --update-snapshots
   ```
3. Commit the Linux baseline images

Both sets of baselines (`-win32.png` and `-linux.png`) can coexist in the repository. Playwright automatically uses the one matching the current platform.

### Visual test failures in CI

If visual tests pass locally but fail in CI:

1. Download the trace artifact from the GitHub Actions run
2. Open the trace with `npx playwright show-trace path/to/trace.zip`
3. Check the diff image in the Actions tab to see what changed
4. If it is a rendering difference (font hinting, sub-pixel antialiasing), increase `maxDiffPixelRatio` slightly or create Linux baselines as described above

---

## 9. Common mistakes

| Mistake                                                                        | What to do instead                                                            |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Running `--update-snapshots` to fix a failing test without looking at the diff | Always open the diff image first — you may be accepting a bug                 |
| Running visual tests across different browsers                                 | Always use `--project=chromium` (or whichever browser created the baseline)   |
| Not committing the baseline image                                              | Baselines are part of the test — commit them with the code they test          |
| Masking the entire page to avoid flakiness                                     | Only mask specific dynamic elements; broad masking hides real regressions     |
| Creating baselines on Windows for a Linux CI environment                       | Use the Dev Container to create baselines that match CI                       |
| Committing baseline updates in a separate PR from the UI change                | Keep baseline and code changes together so reviewers can see the before/after |
| Missing `animations: 'disabled'`                                               | Always include this option — animations cause random pixel differences        |

---

## See also

- [Debugging Failing Tests](debugging-failing-tests.md) — steps to diagnose any test failure including visual
- [Developer Guide](../developer.md) — visual regression patterns and configuration
- [Framework Onboarding](../framework-onboarding.md) — Section 5 for the visual regression demo walkthrough
