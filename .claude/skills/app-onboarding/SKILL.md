---
name: app-onboarding
description: Onboarding a new app into the framework and removing demo apps — directory contract, prompt templates, checklists
---

# App Onboarding Skill

Read this skill when:

- Onboarding a new application into the framework
- Removing the Coffee Cart or Sauce Demo demo apps
- Adding, renaming, or removing products/routes/messages in an existing app's enums
- Generating the full set of files for a new app area (enums → config → factory → POMs → fixtures → project)

---

## Multi-App Directory Contract

Each app in this framework lives in its own subdirectory under every top-level folder. Files from different apps must never import from each other.

```
enums/{app-name}/              ← routes, product names, messages, prices
config/{app-name}.ts           ← app URL (reads from process.env)
test-data/factories/{app-name}/← credentials and dynamic test data factories
test-data/static/{app-name}/   ← fixed boundary/invalid data JSON
pages/{app-name}/              ← page objects
pages/components/              ← UI components shared within ONE app only
fixtures/api/schemas/{app-name}/← Zod schemas for API responses
tests/{app-name}/              ← test files (functional/, api/, e2e/)
helpers/{app-name}/            ← app-specific helper functions
```

Shared across ALL apps (do not put app-specific code here):

```
fixtures/pom/page-object-fixture.ts  ← all page objects registered here
fixtures/pom/test-options.ts         ← single import point for test and expect
helpers/util/                        ← utilities that span multiple apps
enums/util/                          ← enums shared across apps
playwright.config.ts                 ← one project block per app
```

### App type decision

Before onboarding, identify which type your app is:

| Type         | Description                                     | Example     | Config difference                                                                                     |
| ------------ | ----------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| **Local**    | Runs on localhost; must be started before tests | Coffee Cart | `baseURL: process.env['APP_URL'] ?? 'http://localhost:3000'`; may need a `storageState` setup project |
| **Internet** | Always-on hosted URL; no local startup needed   | Sauce Demo  | `baseURL: process.env['MY_APP_URL'] ?? 'https://www.myapp.com'`; no setup project needed              |

---

## Prompt Templates

### Onboard a complete new app

Use this prompt to generate all files for a new app in one pass. Fill in every placeholder before sending.

```
Onboard a new app called "{app-name}" into this Playwright framework.

App details:
- Type: [local running on localhost | internet-hosted at a fixed URL]
- Base URL: [http://localhost:XXXX or https://www.example.com]
- Login page path: [e.g. / or /login]
- Post-login landing path: [e.g. /dashboard or /products]
- Login fields: [e.g. username (placeholder) + password (placeholder)]
- Login button text: [exact text]
- Header brand text: [exact text shown in the app header]
- Products/items to include in enums: [list name + price for each]
- Env var prefix: [e.g. MY_APP → MY_APP_URL, MY_APP_USERNAME, MY_APP_PASSWORD]

Before writing any selectors, use playwright-cli to navigate to [BASE_URL] and
explore the login page and landing page to discover the exact accessible names,
roles, labels, and placeholders for each element.

Generate these files in order:
1. enums/{app-name}/{app-name}.ts  (Routes, AppText, ProductNames, ProductPrices)
2. config/{app-name}.ts
3. test-data/factories/{app-name}/auth.factory.ts
4. pages/{app-name}/login.page.ts
5. pages/{app-name}/[landing].page.ts  (product list or dashboard)
6. pages/{app-name}/[detail].page.ts   (product detail or item page)
7. Update fixtures/pom/page-object-fixture.ts — add imports, FrameworkFixtures types, and fixture implementations
8. Update playwright.config.ts — add project block with correct baseURL and testIdAttribute if needed
9. tests/{app-name}/e2e/[flow].spec.ts — single @e2e test: login → landing → detail → price/value assertion

After generating all files:
- Run npx eslint on all new files and fix any warnings
- Run npx playwright test tests/{app-name}/ --project={app-name} --retries=0
- Confirm all tests pass before finishing
```

---

### Remove a demo app

Use this prompt to cleanly remove Coffee Cart, Sauce Demo, or any other demo app.

```
Remove the "{app-name}" demo app from this framework completely.

Steps:
1. Delete these directories entirely:
   - tests/{app-name}/
   - pages/{app-name}/
   - enums/{app-name}/
   - test-data/factories/{app-name}/
   - test-data/static/{app-name}/   (if it exists)
   - fixtures/api/schemas/{app-name}/ (if it exists)
   - helpers/{app-name}/   (if it exists)
   - config/{app-name}.ts

2. Edit fixtures/pom/page-object-fixture.ts:
   - Remove all imports for {app-name} page objects
   - Remove all {app-name} fixture type entries from FrameworkFixtures
   - Remove all {app-name} fixture implementations from test.extend()

3. Edit playwright.config.ts:
   - Remove the {app-name} project block
   - Remove any setup project that only serves {app-name}
   - Remove any import that is only used by {app-name} (e.g. StorageStatePaths)

4. Edit fixtures/pom/test-options.ts:
   - Remove any fixture import that is now unused after the above deletions

5. Edit .env.example:
   - Remove all {app-name}-specific variables

6. Run npx tsc --noEmit and fix every remaining reference to {app-name} files.

7. Run npx eslint --max-warnings=0 to confirm no lint errors.

8. Run the remaining test suite to confirm nothing was broken:
   npx playwright test --project=[remaining-project-name] --retries=0
```

---

### Add a product to an existing app

```
Add a new product to the {app-name} app.

Product details:
- Name: [exact text as shown on the page]
- Price: [exact price string including currency symbol, e.g. $24.99]

Steps:
1. Add the product to enums/{app-name}/{app-name}.ts:
   - Add entry to ProductNames enum
   - Add entry to ProductPrices enum

2. Check whether any existing test uses generateRandomProduct() or loops
   over all products — if so, the new product will be included automatically.
   If not, no test changes are needed unless you are writing a test for this product.

Run npx tsc --noEmit to confirm no type errors after the change.
```

---

### Add a new page object to an existing app

```
Add a page object for the [PAGE NAME] page in the {app-name} app.

First, use playwright-cli to navigate to [URL] and explore the page to discover:
- Accessible names and roles for all interactive elements
- Labels for form inputs
- Placeholders where labels are absent
- data-testid or data-test attributes on price/title elements

Then create:
- File: pages/{app-name}/[name].page.ts
- Locators as readonly constructor-assigned properties
- Action methods with JSDoc (@param and @returns)
- NO JSDoc on locator properties
- Register in fixtures/pom/page-object-fixture.ts (add import, type, and implementation)

Run npx tsc --noEmit to confirm no type errors.
```

---

### Write a test for an existing app page

```
Write a [functional|e2e|api] test for {app-name}: [describe the flow].

Before writing, confirm these files already exist:
- pages/{app-name}/[page].page.ts  (if not, create it first)
- enums/{app-name}/{app-name}.ts   (product names, routes, etc.)
- test-data/factories/{app-name}/auth.factory.ts

Test requirements:
- File: tests/{app-name}/[functional|e2e|api]/[name].spec.ts
- Import test and expect from fixtures/pom/test-options.ts
- Use fixture-injected page objects (never new PageObject(page))
- All strings (product names, routes, messages) from enums — no hardcoded values
- Credentials from generateXxxCredentials() factory — never from process.env directly in tests
- Structure: test.describe → test with { tag: '@[e2e|smoke|regression|api]' } → test.step (Given/When/Then)
- One tag only per test

After writing:
- Run npx eslint tests/{app-name}/... --fix
- Run npx playwright test tests/{app-name}/... --project={app-name} --retries=0
- Confirm all pass before finishing
```

---

## Onboarding Verification Checklist

After onboarding a new app, confirm every item before marking complete:

### Files

- [ ] `enums/{app-name}/{app-name}.ts` — Routes, AppText, ProductNames, ProductPrices all populated
- [ ] `config/{app-name}.ts` — reads URL from `process.env['...'] ?? 'default'`
- [ ] `test-data/factories/{app-name}/auth.factory.ts` — reads credentials from env vars with fallbacks
- [ ] `pages/{app-name}/login.page.ts` — `goto()` and `login()` methods; no hardcoded URLs
- [ ] `pages/{app-name}/*.page.ts` — one file per page visited in tests
- [ ] `tests/{app-name}/e2e/*.spec.ts` — at least one passing test

### Framework integration

- [ ] All new page objects imported and registered in `fixtures/pom/page-object-fixture.ts`
- [ ] New Playwright project added to `playwright.config.ts` with `testDir: 'tests/{app-name}'`
- [ ] `testIdAttribute` set in the project if the app uses `data-test` instead of `data-testid`
- [ ] Env vars documented in `.env.example`

### Code quality

- [ ] No hardcoded strings in tests — all from enums
- [ ] No credentials in source code — all from `process.env` via factory
- [ ] No `new PageObject(page)` in test files — fixtures only
- [ ] `import { test, expect } from 'fixtures/pom/test-options'` — not from `@playwright/test`
- [ ] No `page.waitForTimeout()` anywhere
- [ ] Each test has exactly one tag: `@smoke`, `@regression`, `@e2e`, or `@api`
- [ ] `npx eslint tests/{app-name}/ pages/{app-name}/ --max-warnings=0` passes
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npx playwright test tests/{app-name}/ --project={app-name} --retries=0` passes

---

## Removal Verification Checklist

After removing a demo app:

- [ ] `npx tsc --noEmit` shows zero references to deleted files
- [ ] `npx eslint --max-warnings=0` passes
- [ ] Remaining test suite passes: `npx playwright test --project=[other-project]`
- [ ] `.env.example` no longer contains removed app's variables
- [ ] `fixtures/pom/page-object-fixture.ts` has no imports or registrations for removed app
- [ ] `playwright.config.ts` has no project blocks for removed app

---

## Common Mistakes

| Mistake                                                                             | Correct approach                                                                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Writing selectors directly in tests                                                 | All selectors in page objects only                                                                 |
| Generating page objects without exploring the app first                             | Always use `playwright-cli` to navigate to the page first                                          |
| Using `process.env['MY_APP_URL']` directly in a test                                | Put it in `config/{app-name}.ts`, import `myAppConfig`                                             |
| Registering a page object but forgetting the TypeScript type in `FrameworkFixtures` | Add both the type entry and the fixture implementation                                             |
| Setting `testIdAttribute` globally                                                  | Set it only on the specific project that needs it — don't change the global `use` block            |
| Importing coffee-cart enums in a new app's files                                    | Each app uses only its own enums                                                                   |
| Creating a new `test-options.ts` per app                                            | One `test-options.ts` covers all apps — just register new page objects in `page-object-fixture.ts` |
