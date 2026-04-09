# Playwright Review Checklist

## 1. Test value

- Does each test validate meaningful user behavior?
- Are assertions specific enough to catch regressions?
- Are there tests that are redundant or too shallow?

## 2. Locators

- Selector priority followed: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`
- No XPath selectors (forbidden in this framework)
- No brittle CSS chains, nth-child, or positional selectors
- No selectors written directly in test files — locators belong in page objects
- Locator strategy is consistent across the suite
- `getByTestId()` only used as last resort; `testIdAttribute` set correctly in `playwright.config.ts` if app uses `data-test` instead of `data-testid`

## 3. Waiting and timing

- No `waitForTimeout()` or manual sleeps (forbidden)
- Assertions rely on Playwright's built-in auto-waiting
- No navigation race conditions
- No magic timeout numbers inline — timeouts defined in `config/` or `enums/`

## 4. Isolation and determinism

- Tests are independent and can run in any order
- Shared state is avoided or safely controlled
- Suite can run in parallel without data collisions
- Data setup/reset is deterministic
- Dynamic test data generated via Faker factories (`test-data/factories/`) — no hardcoded content strings
- Static boundary/invalid data in `test-data/static/` as JSON files

## 5. Auth

- Authentication not repeated unnecessarily in every test
- Storage state reuse considered where login is expensive
- Auth helpers are secure — no hardcoded credentials; `process.env` used
- `@destructive` tests have `afterEach`/`afterAll` cleanup hooks

## 6. Abstractions

- Page objects in `pages/{area}/` with constructor-assigned readonly locators
- Action methods have JSDoc (`@param`, `@returns`) — locator properties do not
- No `new PageObject(page)` in test files — fixtures only
- All page objects registered in `fixtures/pom/page-object-fixture.ts`
- Business intent is clearer because of the abstraction
- Page objects not overloaded with assertions (assertions belong in tests)
- Helpers in `helpers/{area}/` are focused; not doing too much

## 7. Config and CI

- `playwright.config.ts` has `testDir` scoped per project (`tests/{area}/`)
- `testIdAttribute` set on the correct project when app uses `data-test`
- `workers`, `retries`, `forbidOnly`, `trace`, and reporters are sensible
- `fullyParallel` and `retries` align with test stability goals
- Local vs CI behavior makes sense (trace on retry, screenshots on failure)
- Debug artifacts (trace, video, screenshots) are sufficient to troubleshoot failures
- CI pipeline has a SUT health-check step before tests run (see `.github/workflows/` / `.circleci/`)

## 8. Test data and environment

- No hardcoded credential strings — `process.env` only
- App URLs read from `process.env` via `config/{area}.ts`
- Enums used for all repeated strings: routes, product names, messages, prices
- No magic numbers inline
- Network mocking/seeding used appropriately for external dependencies

## 9. Maintainability

- Test names are descriptive and follow the describe/test naming convention
- `test.describe()` wraps related tests; tags are on individual `test()` calls only
- `test.step()` used with Given/When/Then structure for readability
- When 2+ API calls exist in one test, each is wrapped in its own `test.step()`
- Suite structure is easy to scale with new apps following the directory contract
- Utilities are reused sensibly; no duplication
- A new engineer can understand and run the suite without tribal knowledge

## 10. Performance of the test suite

- Slow setup steps not repeated unnecessarily — use `beforeAll` or storage state
- Heavy UI flows replaced by API setup where feasible
- Suite is segmented sensibly into smoke vs regression vs e2e

## 11. Framework compliance

- `test` and `expect` imported from `fixtures/pom/test-options.ts` — never from `@playwright/test`
- Each test has **exactly one** primary tag: `@smoke`, `@sanity`, `@regression`, `@e2e`, or `@api`
- `@functional` tag is never used
- `@destructive` is the only tag that may appear alongside a primary tag
- Tags are on individual `test()` calls — never on `test.describe()`
- API schemas use `z.strictObject()` — `z.object()` is forbidden
- No `any` type in TypeScript
- Enums cover all routes (`Routes`), messages, product names, and prices used in tests
- Factories provide all dynamic test data; no hardcoded test content strings in spec files
- `config/{area}.ts` provides the app URL — no `process.env['...']` inline in tests
