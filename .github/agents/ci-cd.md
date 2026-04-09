---
name: ci-cd
description: "CI/CD patterns -- GitHub Actions, CircleCI, Docker, sharding, reporting, and artifact management for Playwright tests Framework skill ID: ci-cd. Canonical source: .cursor/skills/ci-cd/SKILL.md. Regenerate this agent: npm run sync:github-agents"
metadata:
  framework_skill_id: ci-cd
  source_path: .cursor/skills/ci-cd/SKILL.md
---

> **GitHub Copilot custom agent** — Synced from Agent Skills at `.cursor/skills/ci-cd/SKILL.md`. Regenerate: `npm run sync:github-agents`.

# CI/CD for Playwright Tests

Pipeline configuration for running Playwright tests in CI. Covers GitHub Actions, CircleCI, Docker, sharding, and reporting.

## Quick Reference (GitHub Actions)

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Rules

### ALWAYS Use the Official Playwright Docker Image

Font rendering and browser behavior differ across OS. Use the official container for consistent results:

```yaml
container:
  image: mcr.microsoft.com/playwright:v1.50.0-noble
```

**Match the image tag to your `@playwright/test` version in `package.json`.**

### ALWAYS Upload Reports and Traces as Artifacts

```yaml
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }} # Upload even on failure
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

### ALWAYS Use `if: ${{ !cancelled() }}` for Report Uploads

Without this, reports aren't uploaded when tests fail -- exactly when you need them most.

### NEVER Run `--update-snapshots` in CI

Visual regression baselines must be updated locally (or in Docker locally) and committed. CI should only compare.

## Sharding

Split tests across parallel runners for faster execution:

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    steps:
      - run: npx playwright test --shard=${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ strategy.job-index }}
          path: blob-report/
          retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Sharding Configuration

```typescript
// playwright.config.ts -- enable blob reporter for sharding
reporter: process.env.CI
  ? [['blob'], ['github']]
  : [['html', { open: 'never' }]],
```

## Test Suites by Tag

Run different test suites at different stages:

```yaml
jobs:
  smoke:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --grep @smoke

  regression:
    if: github.event_name == 'schedule' # nightly only
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.0-noble
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --grep @regression
```

### Recommended Pipeline Strategy

| Trigger          | Tests to Run                  | Timeout |
| ---------------- | ----------------------------- | ------- |
| Pull request     | `@smoke` + `@sanity`          | 10 min  |
| Push to main     | `@smoke` + `@sanity` + `@api` | 15 min  |
| Nightly schedule | All (`@regression` + `@e2e`)  | 30 min  |
| Post-deploy      | `@smoke` only                 | 5 min   |

## Retries in CI

Enable retries in CI to handle transient failures without hiding real bugs:

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

## Trace Collection

Configure traces for CI debugging:

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry', // collect trace only on retry
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

## Environment Variables in CI

```yaml
env:
  CI: true
  BASE_URL: ${{ vars.BASE_URL }}
  TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

**Never store secrets in code or config files.** Use GitHub Secrets or your CI provider's secret management.

## CircleCI

### Basic Configuration

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@6.1

jobs:
  playwright-tests:
    docker:
      - image: mcr.microsoft.com/playwright:v1.50.0-noble
    parallelism: 4
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run Playwright tests
          command: npx playwright test --shard=$((CIRCLE_NODE_INDEX + 1))/$CIRCLE_NODE_TOTAL
      - store_artifacts:
          path: playwright-report
          destination: playwright-report
      - store_artifacts:
          path: test-results
          destination: test-results
      - store_test_results:
          path: test-results

workflows:
  test:
    jobs:
      - playwright-tests
```

### Sharding with CircleCI Parallelism

CircleCI provides `CIRCLE_NODE_INDEX` and `CIRCLE_NODE_TOTAL` for built-in parallelism:

```yaml
parallelism: 4 # number of shards
steps:
  - run:
      command: npx playwright test --shard=$((CIRCLE_NODE_INDEX + 1))/$CIRCLE_NODE_TOTAL
```

### CircleCI with Tag-Based Suites

```yaml
jobs:
  smoke-tests:
    docker:
      - image: mcr.microsoft.com/playwright:v1.50.0-noble
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run smoke tests
          command: npx playwright test --grep @smoke
      - store_artifacts:
          path: playwright-report

  regression-tests:
    docker:
      - image: mcr.microsoft.com/playwright:v1.50.0-noble
    parallelism: 4
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run regression tests
          command: npx playwright test --grep @regression --shard=$((CIRCLE_NODE_INDEX + 1))/$CIRCLE_NODE_TOTAL
      - store_artifacts:
          path: playwright-report
      - store_test_results:
          path: test-results

workflows:
  pr-checks:
    jobs:
      - smoke-tests

  nightly:
    triggers:
      - schedule:
          cron: '0 2 * * *'
          filters:
            branches:
              only: main
    jobs:
      - regression-tests
```

### CircleCI Environment Variables

Store secrets in CircleCI Project Settings > Environment Variables, then reference them directly:

```yaml
steps:
  - run:
      name: Run tests
      environment:
        CI: 'true'
      command: npx playwright test
      # TEST_EMAIL, TEST_PASSWORD are set in CircleCI Project Settings
```

### CircleCI Reporter Configuration

```typescript
// playwright.config.ts -- enable JUnit reporter for CircleCI test insights
reporter: process.env.CI
  ? [['junit', { outputFile: 'test-results/results.xml' }], ['html', { open: 'never' }]]
  : [['html', { open: 'never' }]],
```

Use `store_test_results` with JUnit XML to get test insights in the CircleCI dashboard.

## Docker for Local CI Parity

Run tests locally in the same container as CI:

```bash
# Run all tests
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  npx playwright test

# Run with sharding
docker run --rm -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.50.0-noble \
  npx playwright test --shard=1/4
```

## Anti-Patterns

| Don't                                 | Problem                             | Do Instead                                         |
| ------------------------------------- | ----------------------------------- | -------------------------------------------------- |
| Run on `ubuntu-latest` without Docker | Browser rendering differs           | Use official Playwright container                  |
| Skip artifact upload on failure       | Can't debug CI failures             | Use `if: ${{ !cancelled() }}`                      |
| Run all tests on every PR             | Slow feedback loop                  | Run `@smoke` + `@sanity` on PR, full suite nightly |
| Set `fail-fast: true` with sharding   | Cancels shards, loses results       | Use `fail-fast: false`                             |
| Update snapshots in CI                | Accepts visual regressions silently | Update locally, commit baselines                   |
| Hardcode secrets in workflow files    | Security risk                       | Use GitHub Secrets                                 |

## See Also

- **`visual-regression`** skill -- Docker setup for consistent snapshot baselines.
- **`config`** skill -- Environment variable patterns.
- **`test-architecture`** skill -- Which tests to run at which pipeline stage.
