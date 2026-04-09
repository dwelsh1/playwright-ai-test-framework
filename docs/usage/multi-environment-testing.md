# Multi-Environment Testing

**Audience:** Jr QA Engineers — how to run tests against different environments (local, staging, production).

The framework supports three environments out of the box: **dev** (your local machine), **staging** (shared pre-production server), and **production** (live app). Each environment has its own URL, credentials, and test scope. This guide explains how environment switching works and how to run tests against each one.

---

## Table of Contents

1. [The three environments](#1-the-three-environments)
2. [How environments are configured](#2-how-environments-are-configured)
3. [Running tests against staging](#3-running-tests-against-staging)
4. [Running smoke tests against production](#4-running-smoke-tests-against-production)
5. [The `config` object — how tests read the environment](#5-the-config-object--how-tests-read-the-environment)
6. [Environment-specific credentials](#6-environment-specific-credentials)
7. [What tests run in each environment](#7-what-tests-run-in-each-environment)
8. [CI pipeline and environments](#8-ci-pipeline-and-environments)
9. [Adding a new environment variable](#9-adding-a-new-environment-variable)
10. [Common mistakes](#10-common-mistakes)

---

## 1. The three environments

| Environment  | Purpose                                  | What runs there     |
| ------------ | ---------------------------------------- | ------------------- |
| `dev`        | Local development on your machine        | All tests           |
| `staging`    | Pre-production server shared by the team | All tests           |
| `production` | Live app — real users are here           | `@smoke` tests only |

**Production is treated with care.** Only smoke tests run against production because:

- The app has real users and real data
- Destructive tests (that create or delete data) must never run on production
- Smoke tests verify the app is alive and basic flows work — they do not create lasting state

---

## 2. How environments are configured

Each environment has an `.env` file in `env/`:

```
env/
├── .env.dev         ← local development (default)
├── .env.staging     ← staging server
├── .env.production  ← production (smoke only)
└── .env.example     ← template for new environments
```

Each file sets the same variables with environment-specific values:

**`env/.env.dev`** (local):

```bash
APP_URL=http://localhost:5273
API_URL=http://localhost:3002
APP_EMAIL=admin@example.com
APP_PASSWORD=admin
USER_EMAIL=user@example.com
USER_PASSWORD=password
```

**`env/.env.staging`** (staging server):

```bash
APP_URL=https://staging.coffee-cart.app
API_URL=https://staging-api.coffee-cart.app
APP_EMAIL=admin@example.com
APP_PASSWORD=admin
USER_EMAIL=user@example.com
USER_PASSWORD=password
```

**`env/.env.production`** (live app):

```bash
APP_URL=https://coffee-cart.app
API_URL=https://api.coffee-cart.app
APP_EMAIL=admin@example.com
APP_PASSWORD=admin
USER_EMAIL=user@example.com
USER_PASSWORD=password
```

The `playwright.config.ts` loads the correct file based on the `TEST_ENV` environment variable. When `TEST_ENV` is not set, it defaults to `dev`.

---

## 3. Running tests against staging

Use the pre-configured npm scripts to run against staging:

```bash
# Run all tests against staging
npm run test:env:staging

# Run only smoke tests against staging
npm run test:env:staging:smoke
```

Or set `TEST_ENV` directly when using `npx playwright test`:

```powershell
# PowerShell: run smoke tests against staging
$env:TEST_ENV="staging"; npx playwright test --project=chromium --grep "@smoke"

# PowerShell: run the full suite against staging
$env:TEST_ENV="staging"; npx playwright test --project=chromium
```

**Before running against staging:**

- Confirm that the staging server is running and accessible
- Confirm that staging credentials in `env/.env.staging` are correct
- Delete stale `.auth/` files if credentials have changed:
  ```bash
  rm .auth/coffee-cart/userStorageState.json
  rm .auth/coffee-cart/adminStorageState.json
  ```
  The auth setup projects will recreate them for the staging environment.

---

## 4. Running smoke tests against production

Production runs are restricted to `@smoke` tests only:

```bash
# Run smoke tests against production
npm run test:env:production
```

This is equivalent to:

```powershell
$env:TEST_ENV="production"; npx playwright test --project=chromium --grep "@smoke"
```

**Important rules for production runs:**

- Never run `@regression`, `@e2e`, `@destructive`, or `@api` tests against production
- Smoke tests should be read-only: they navigate pages and assert visible content without creating or deleting data
- If a smoke test creates state (e.g., adds to cart), tag it `@destructive` and exclude it from production runs

---

## 5. The `config` object — how tests read the environment

Tests read the current environment through the `config` object in `config/coffee-cart.ts`:

```typescript
import { config } from '../../../config/coffee-cart';

// config.appUrl  → APP_URL from the active .env file
// config.apiUrl  → API_URL from the active .env file
// config.env     → 'dev' | 'staging' | 'production'
```

**Building URLs in tests:**

```typescript
// Always use config.apiUrl — never hardcode a host
const COFFEES_URL = `${config.apiUrl}${ApiEndpoints.COFFEES}`;

// This resolves to different values per environment:
// dev:        http://localhost:3002/api/coffees
// staging:    https://staging-api.coffee-cart.app/api/coffees
// production: https://api.coffee-cart.app/api/coffees
```

**Skipping a test in a specific environment:**

Sometimes a feature is not yet deployed to staging, or a test should only run locally. Use `test.skip` with a condition:

```typescript
test(
  'should test a feature only available in dev',
  { tag: '@regression' },
  async ({ menuPage }) => {
    test.skip(config.env !== 'dev', 'Feature not yet deployed to staging');
    // ...
  },
);
```

---

## 6. Environment-specific credentials

Credentials are stored in the `.env` files and read via `process.env`. The auth setup files use them to log in and save storage state:

```typescript
// In auth.user.setup.ts — reads from the active .env file
await page.getByRole('textbox', { name: 'Email' }).fill(Credentials.USER_EMAIL);
```

The `Credentials` enum reads from `process.env`:

```typescript
export enum Credentials {
  USER_EMAIL = process.env['USER_EMAIL'] ?? '',
  USER_PASSWORD = process.env['USER_PASSWORD'] ?? '',
  ADMIN_EMAIL = process.env['APP_EMAIL'] ?? '',
  ADMIN_PASSWORD = process.env['APP_PASSWORD'] ?? '',
}
```

**If staging or production uses different credentials than dev**, update `env/.env.staging` or `env/.env.production` with the correct values. Never commit real credentials to the repo — if an environment uses secrets management (like GitHub Secrets or AWS Secrets Manager in CI), keep the `.env` files in `env/` for local reference and load the real values from the secrets store in CI.

---

## 7. What tests run in each environment

| Tag            | Dev | Staging | Production |
| -------------- | --- | ------- | ---------- |
| `@smoke`       | Yes | Yes     | Yes        |
| `@sanity`      | Yes | Yes     | No         |
| `@regression`  | Yes | Yes     | No         |
| `@e2e`         | Yes | Yes     | No         |
| `@api`         | Yes | Yes     | No         |
| `@a11y`        | Yes | Yes     | No         |
| `@visual`      | Yes | No\*    | No         |
| `@destructive` | Yes | Yes     | **Never**  |

\* Visual regression tests compare screenshots against stored baselines. Staging screenshots often differ from dev baselines due to different fonts, rendering, or data. Run visual tests locally or generate separate staging baselines.

---

## 8. CI pipeline and environments

The GitHub Actions and CircleCI pipelines run tests in different environments automatically:

**On every push/PR:**

- `npm test` runs against `dev` (using the local server via `webServer`)

**On nightly schedule:**

- `npm run test:env:staging` runs the full suite against staging

**On release:**

- `npm run test:env:production` runs smoke tests against production

The CI pipelines inject environment variables (`APP_URL`, `API_URL`, credentials) from the CI secrets store — they do not rely on the `.env` files. The `.env` files are for local development only.

To override which environment a CI run targets, set `TEST_ENV` in the workflow file:

```yaml
- name: Run smoke tests against staging
  run: npx playwright test --project=chromium --grep "@smoke"
  env:
    TEST_ENV: staging
    APP_URL: ${{ secrets.STAGING_APP_URL }}
    API_URL: ${{ secrets.STAGING_API_URL }}
    USER_EMAIL: ${{ secrets.STAGING_USER_EMAIL }}
    USER_PASSWORD: ${{ secrets.STAGING_USER_PASSWORD }}
```

---

## 9. Adding a new environment variable

If you need to add a variable that changes per environment (a feature flag URL, a third-party API key, etc.):

**Step 1 — Add the variable to all three `.env` files:**

```bash
# env/.env.dev
NEW_FEATURE_URL=http://localhost:9000

# env/.env.staging
NEW_FEATURE_URL=https://staging-feature.example.com

# env/.env.production
NEW_FEATURE_URL=https://feature.example.com
```

**Step 2 — Add it to `env/.env.example`** so new contributors know it is required:

```bash
# Feature service URL
NEW_FEATURE_URL=http://localhost:9000
```

**Step 3 — Read it in `config/coffee-cart.ts`:**

```typescript
export const config = {
  env: testEnv,
  appUrl: process.env['APP_URL'],
  apiUrl: process.env['API_URL'],
  projectPath: process.env['COFFEE_CART_PATH'],
  newFeatureUrl: process.env['NEW_FEATURE_URL'], // ← add here
};
```

**Step 4 — Use `config.newFeatureUrl` in tests** — never `process.env['NEW_FEATURE_URL']` directly.

---

## 10. Common mistakes

| Mistake                                                                      | What to do instead                                                                                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hardcoding `http://localhost:3002` in a test                                 | Use `config.apiUrl` — it changes per environment automatically                                                                       |
| Running `@regression` or `@e2e` against production                           | Production is smoke-only; destructive tests must never run there                                                                     |
| Committing real credentials in `.env.staging` or `.env.production`           | Use CI secrets for real credentials; `.env` files are local development templates                                                    |
| Forgetting to delete stale `.auth/` files after changing staging credentials | Stale storage state files will cause auth failures; delete and re-run the setup                                                      |
| Running visual regression tests against staging without separate baselines   | Staging renders differently; maintain separate baselines or skip visual tests on staging                                             |
| Not running the auth setup when switching environments                       | The setup projects run automatically with `npm test`; if running `npx playwright test` directly, ensure the setup project runs first |

---

## See also

- [Authentication & Storage State](authentication-storage-state.md) — how storage state is created per environment
- [Writing Full API Tests](writing-api-tests.md) — how `config.apiUrl` is used to build environment-agnostic URLs
- [Developer Guide](../developer.md) — environment configuration architecture and CI pipeline details
