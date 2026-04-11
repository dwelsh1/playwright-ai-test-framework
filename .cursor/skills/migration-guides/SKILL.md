---
name: migration-guides
description: Migration patterns from Cypress and Selenium to Playwright -- command mapping, architecture changes, and common pitfalls
---

# Migration Guides

Patterns for migrating existing test suites from Cypress or Selenium to Playwright, adapted to our framework conventions.

## Cypress → Playwright

### Command Mapping

| Cypress                                    | Playwright (Our Framework)                                |
| ------------------------------------------ | --------------------------------------------------------- |
| `cy.visit('/page')`                        | `await page.goto('/page')`                                |
| `cy.get('.class')`                         | `page.getByRole(...)` (prefer role selectors)             |
| `cy.contains('text')`                      | `page.getByText('text')`                                  |
| `cy.get('input').type('text')`             | `await page.getByLabel('...').fill('text')`               |
| `cy.get('button').click()`                 | `await page.getByRole('button', { name: '...' }).click()` |
| `cy.get('.item').should('be.visible')`     | `await expect(page.getByRole(...)).toBeVisible()`         |
| `cy.get('.item').should('have.text', 'x')` | `await expect(locator).toHaveText('x')`                   |
| `cy.intercept('GET', '/api/*')`            | `await page.route('**/api/*', handler)`                   |
| `cy.wait('@alias')`                        | `await page.waitForResponse(url)`                         |
| `cy.fixture('data.json')`                  | Import from `test-data/static/`                           |
| `cy.wrap(value)`                           | No equivalent needed -- use native `await`                |
| `beforeEach(() => { cy.login() })`         | Use storage state from setup file                         |

### Key Architecture Differences

| Aspect           | Cypress                           | Our Framework                                |
| ---------------- | --------------------------------- | -------------------------------------------- |
| **Execution**    | Runs in browser (same event loop) | Runs in Node.js (controls browser remotely)  |
| **Async**        | Auto-chains, no `await`           | Explicit `await` on every action             |
| **Selectors**    | `cy.get()` with CSS/jQuery        | `getByRole()` priority (accessibility-first) |
| **Page Objects** | Optional, often avoided           | Mandatory Lean POM with fixture injection    |
| **Imports**      | Global `cy` object                | Import from `fixtures/pom/test-options.ts`   |
| **Retries**      | Built into commands               | Web-first assertions auto-retry              |
| **Network**      | `cy.intercept()`                  | `page.route()`                               |

### Migration Steps

1. **Don't translate line-by-line.** Rewrite tests using our framework's patterns
2. **Replace `cy.get()` selectors** with `getByRole()`, `getByLabel()`, etc.
3. **Add `await`** to every Playwright action and assertion
4. **Create page objects** for each page (Cypress tests often inline selectors)
5. **Move test data** to `test-data/factories/` (Faker) or `test-data/static/` (JSON)
6. **Replace `cy.intercept()`** with `page.route()` -- only for external services
7. **Replace `cy.login()` custom commands** with storage state setup files
8. **Import from `fixtures/pom/test-options.ts`**, never from `@playwright/test`

### Common Cypress Patterns → Playwright

```typescript
// Cypress: custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('button[type="submit"]').click();
});

// Playwright: storage state setup (runs once, reused by all tests)
// tests/{area}/auth.setup.ts
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

## Selenium → Playwright

### Command Mapping

| Selenium (WebDriver)                   | Playwright (Our Framework)                               |
| -------------------------------------- | -------------------------------------------------------- |
| `driver.get(url)`                      | `await page.goto(url)`                                   |
| `driver.findElement(By.id('x'))`       | `page.getByRole(...)` (prefer role selectors)            |
| `driver.findElement(By.xpath('...'))`  | **Forbidden** -- use `getByRole()`, `getByLabel()`, etc. |
| `driver.findElement(By.css('.x'))`     | `page.locator('.x')` (last resort)                       |
| `element.sendKeys('text')`             | `await locator.fill('text')`                             |
| `element.click()`                      | `await locator.click()`                                  |
| `element.getText()`                    | `await locator.textContent()`                            |
| `element.isDisplayed()`                | `await expect(locator).toBeVisible()`                    |
| `WebDriverWait` / `ExpectedConditions` | Built-in auto-wait (no explicit waits needed)            |
| `driver.switchTo().frame(frame)`       | `page.frameLocator('#frame')`                            |
| `driver.manage().window().setSize()`   | `page.setViewportSize({ width, height })`                |
| `Thread.sleep(5000)`                   | **Forbidden** -- use web-first assertions                |

### Key Architecture Differences

| Aspect           | Selenium                         | Our Framework                          |
| ---------------- | -------------------------------- | -------------------------------------- |
| **Protocol**     | WebDriver (HTTP)                 | CDP / WebSocket (faster)               |
| **Waits**        | Explicit WebDriverWait           | Auto-wait built into every action      |
| **Selectors**    | XPath, CSS, ID                   | `getByRole()` priority                 |
| **Page Objects** | Manual instantiation             | Fixture injection (never `new Page()`) |
| **Assertions**   | External library (TestNG, JUnit) | Built-in `expect()` with auto-retry    |
| **Parallel**     | Grid / Selenium Hub              | Built-in worker processes              |

### Migration Steps

1. **Remove all explicit waits** -- Playwright auto-waits
2. **Replace XPath selectors** with `getByRole()`, `getByLabel()`, `getByText()`
3. **Remove `Thread.sleep()` / `driver.manage().timeouts()`** -- forbidden
4. **Replace Page Object constructors** with fixture injection
5. **Replace `findElement()` chains** with locator chains
6. **Remove try/catch for StaleElementException** -- locators auto-re-query
7. **Replace `driver.switchTo().frame()`** with `page.frameLocator()`

### Common Selenium Patterns → Playwright

```typescript
// Selenium: explicit wait for element
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement button = wait.until(
  ExpectedConditions.elementToBeClickable(By.id("submit"))
);
button.click();

// Playwright: auto-wait (no explicit wait needed)
await page.getByRole('button', { name: 'Submit' }).click();
// Playwright automatically waits for the element to be visible and enabled
```

```typescript
// Selenium: stale element handling
try {
  element.click();
} catch (StaleElementReferenceException e) {
  element = driver.findElement(By.id("submit"));
  element.click();
}

// Playwright: locators never go stale
const button = page.getByRole('button', { name: 'Submit' });
await button.click(); // always re-queries the DOM
```

## General Migration Checklist

- [ ] Replace all selectors with accessibility-first locators (`getByRole()`)
- [ ] Add `await` to every action and assertion
- [ ] Create page objects in `pages/{area}/` with getter locators
- [ ] Register page objects in `fixtures/pom/page-object-fixture.ts`
- [ ] Import `test` and `expect` from `fixtures/pom/test-options.ts`
- [ ] Move test data to factories (`test-data/factories/`) or static files (`test-data/static/`)
- [ ] Replace login commands/helpers with storage state setup files
- [ ] Remove all explicit waits, `sleep()`, and timeout hacks
- [ ] Remove all XPath selectors
- [ ] Add proper tags (`@smoke`, `@regression`, etc.) to each test
- [ ] Add `test.step()` with Given/When/Then structure
- [ ] Run migrated tests and confirm all pass

## Anti-Patterns

| Don't                         | Problem                             | Do Instead                           |
| ----------------------------- | ----------------------------------- | ------------------------------------ |
| Translate line-by-line        | Carries over bad patterns           | Rewrite using our framework patterns |
| Keep XPath selectors          | Fragile, forbidden in our framework | Convert to `getByRole()`             |
| Keep explicit waits           | Redundant, slows tests              | Trust Playwright's auto-wait         |
| Keep Page Object constructors | Bypasses fixture injection          | Register in `page-object-fixture.ts` |
| Migrate all tests at once     | High risk, hard to debug            | Migrate one test file at a time      |

## See Also

- **`selectors`** skill -- Selector priority and conversion guide.
- **`page-objects`** skill -- Lean POM with fixture injection.
- **`authentication`** skill -- Storage state to replace login helpers.
- **`fixtures`** skill -- Fixture registration for page objects.
