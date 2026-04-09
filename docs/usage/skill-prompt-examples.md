# Skill Prompt Examples

Copy-paste prompt examples for the framework skills. Use this as the quick examples companion to the fuller [Skills Usage Playbook](skills-guide.md), which now covers trigger guidance, when not to use a skill, and per-skill usage notes.

Prompts are grouped by category. Within each skill, examples go from simple to more specific.

---

## UI Exploration

### `playwright-cli`

> Explore live pages before writing selectors, page objects, or tests.

```
Open the login page at http://localhost:5273/login and show me what elements are on it.
```

```
Navigate to the checkout page and explore the form. I need to know all the field labels,
button names, and any error messages that appear when validation fails.
```

```
Use playwright-cli to go through the full registration flow at http://localhost:5273/register
and capture what happens after a successful signup.
```

---

## Page Objects & Selectors

### `selectors`

> Choose the right locator for any element.

```
What's the best selector for a button that says "Add to Cart"?
```

```
I have a form with three text inputs but none of them have labels. What selector strategy
should I use?
```

```
My locator is matching two elements on the page. How do I narrow it down to just the one
inside the billing section?
```

---

### `page-objects`

> Create and maintain page object model files.

```
Create a page object for the login page at http://localhost:5273/login.
```

```
Add a submitOrder() action method to the CheckoutPage. It should click the Place Order
button and wait for the confirmation message to appear.
```

```
I need to add locators for the error messages that appear under each form field when
validation fails. Add them to the existing RegistrationPage.
```

```
Create a NavigationComponent that can be composed into multiple page objects. It needs
locators for the logo, nav links, and the user dropdown menu.
```

---

### `fixtures`

> Register page objects so tests can inject them automatically.

```
I just created CheckoutPage — register it as a fixture so I can use it in tests.
```

```
Create a helper fixture called createdOrder that creates an order via the API before the
test and deletes it after.
```

```
How do I add a new page object to the fixture system so all tests can access it without
calling new CheckoutPage(page)?
```

---

## Writing Tests

### `test-standards`

> Structure tests correctly with the right imports, tags, and step patterns.

```
Create a functional test for the login feature. Happy path plus invalid credentials.
```

```
What tag should I use for a test that verifies the full checkout flow from adding items
to order confirmation?
```

```
My test has three API calls in it. How should I structure it with test.step()?
```

```
I wrote this test — can you check if it follows our framework's tagging and import rules?
[paste test code]
```

---

### `common-tasks`

> Get the right prompt template for any code generation task.

```
Give me the prompt template for creating a new API test.
```

```
What's the correct prompt to use when asking Claude to create a new page object with
exploration?
```

```
I want to add a data factory. What do I need to include in my prompt to make sure the
output follows our conventions?
```

---

### `data-strategy`

> Decide when to use Faker factories vs. static JSON test data.

```
Should I use a factory or a static JSON file for invalid login credentials?
```

```
Create a user factory that generates a name, email, and role using Faker.
```

```
I have hardcoded test strings like "John Smith" scattered through my tests. What's the
right way to replace them?
```

---

### `test-architecture`

> Decide whether to write a functional test, E2E test, or API test.

```
Should I write a functional test or an E2E test for verifying that a user can add items
to their cart and check out?
```

```
When should I use @smoke vs @regression vs @sanity? What's the difference?
```

```
We have 500 tests and they take 20 minutes to run. How should we structure them to get
faster feedback?
```

---

## API Testing

### `api-testing`

> Write tests that call the API directly using the `api` fixture.

```
Create an API test for POST /api/users. It should test the happy path, 400 for missing
fields, and 401 for no auth token.
```

```
I need to test every field validation on the POST /api/orders endpoint. Show me how to
loop over required fields to test each one being missing.
```

```
The API returns 500 instead of 404 when I request a user that doesn't exist. How should
I handle this in my test?
```

```
Create a coverage plan for GET /api/products/:id before I start writing tests.
```

---

### `type-safety`

> Write Zod schemas and enforce TypeScript types.

```
Create a Zod schema for this API response:
{ "id": "uuid", "name": "string", "price": 9.99, "inStock": true }
```

```
Should I use z.object() or z.strictObject() for my API schema? What's the difference?
```

```
I'm getting a TypeScript error because a variable is typed as any. How do I fix it
properly without just casting it?
```

---

### `enums`

> Create and use enums for routes, messages, and repeated strings.

```
Create an enum for the API endpoints in the front-office area.
```

```
I have the string "Invalid email or password" hardcoded in three test files. How do I
turn it into an enum?
```

```
How do I verify that the error message string I'm putting in an enum is actually what
the app displays?
```

---

## Debugging

### `debugging`

> Diagnose why a test is failing.

```
My test keeps failing with "waiting for locator to be visible" but the element is on the
page. How do I debug this?
```

```
A test passes locally but fails in CI. What should I check first?
```

```
How do I capture a trace for just one specific scenario inside a longer test?
```

```
I'm seeing "strict mode violation" — what does that mean and how do I fix it?
```

---

### `error-index`

> Look up what a specific Playwright error means.

```
What does "Target closed" mean in Playwright?
```

```
I'm getting "frame was detached" — what causes this and how do I fix it?
```

```
My test throws "Node is not an Element". What went wrong?
```

---

### `flaky-tests`

> Deal with tests that pass sometimes and fail other times.

```
One of my tests fails about 1 in 5 runs with a timeout. How do I figure out why it's flaky?
```

```
How do I quarantine a flaky test so it doesn't block CI while I investigate?
```

```
Two tests seem to interfere with each other when run together but pass individually.
What's likely causing that?
```

---

## Auth & Data Setup

### `authentication`

> Set up and reuse login state so tests don't log in repeatedly.

```
How do I set up storage state so my tests don't have to log in every single time?
```

```
Create an auth setup file for the front-office area that logs in and saves the session.
```

```
I have a test that needs to be logged in as two different users at the same time. How do I do that?
```

---

### `helpers`

> Write helper functions for shared logic.

```
I have the same 10-line API call repeated in 5 test files. Should I make it a helper
function or a fixture?
```

```
Create a helper that generates a valid JWT token for testing purposes.
```

```
What's the difference between a helper in helpers/ and a fixture in fixtures/helper/?
When should I use each?
```

---

### `config`

> Set up environment variables and configuration files.

```
How do I add a new app URL to the config so tests can use it without hardcoding?
```

```
Create a config file for the back-office area with the base URL and default timeouts.
```

```
I want to read a new environment variable in my tests. What's the right way to set that up?
```

---

## Advanced Testing Techniques

### `forms`

> Interact with complex form elements.

```
How do I test a multi-step wizard form where each step is on a separate page?
```

```
I need to upload a file in a test. How do I do that with Playwright?
```

```
My test needs to select an option from a dropdown. What's the right Playwright method?
```

```
What's the difference between fill() and pressSequentially() for text inputs?
```

---

### `network-mocking`

> Intercept and mock API calls in UI tests.

```
How do I mock the GET /api/products response so I can test the UI without a real backend?
```

```
I want to simulate a 500 server error to test how the UI handles it. How do I do that?
```

```
How do I block third-party analytics scripts from firing during tests?
```

---

### `visual-regression`

> Catch unintended visual changes with screenshot comparisons.

```
How do I add a visual regression test for the dashboard page?
```

```
My visual test is failing because of a loading spinner that appears at different times.
How do I mask it out?
```

```
How do I update the baseline screenshots after an intentional UI change?
```

---

### `accessibility`

> Test that pages meet WCAG accessibility standards.

```
Run an accessibility scan on the login page and show me any violations.
```

```
How do I test that the checkout form is navigable using only the keyboard?
```

```
I want to check that all images on the product page have alt text. How do I do that?
```

---

### `security-testing`

> Validate security-related behavior in tests.

```
How do I test that the app sets HttpOnly and Secure flags on the session cookie?
```

```
I want to verify the app returns the right security headers (CSP, X-Frame-Options, etc.).
How do I check those in a Playwright test?
```

```
How do I test that a user without the admin role can't access /admin routes?
```

---

### `performance-testing`

> Assert on page load times and Core Web Vitals.

```
How do I add an assertion that the homepage loads in under 3 seconds?
```

```
I want to verify the Largest Contentful Paint is under 2.5 seconds. How do I do that?
```

```
How do I simulate a slow 3G connection in a test to check performance on mobile?
```

---

### `clock-mocking`

> Test features that depend on the current date or time.

```
How do I test a "session expired" message that only appears after 30 minutes of inactivity?
```

```
I have a countdown timer feature. How do I test it without actually waiting for the timer?
```

```
My test needs today's date to be December 31st to test year-end behavior. How do I fake that?
```

---

### `advanced-assertions`

> Write smarter assertions for complex scenarios.

```
I want to check 5 fields on a profile page but I don't want the test to stop at the
first failure. How do I do that?
```

```
My test needs to wait for a backend job to finish before asserting. The status endpoint
doesn't have webhooks. How do I poll it?
```

```
How do I write a custom matcher that checks whether a locator contains valid JSON?
```

---

### `iframes-shadow-dom`

> Interact with content inside iframes or Shadow DOM.

```
The payment widget on our checkout page is inside an iframe. How do I interact with it?
```

```
I need to click a button inside a Shadow DOM component. How does Playwright handle that?
```

```
How do I handle a nested iframe — an iframe inside another iframe?
```

---

### `multi-context`

> Handle multiple browser tabs, popup windows, or multi-user scenarios.

```
My app opens a new tab when the user clicks "Open in new window". How do I interact
with that new tab in my test?
```

```
I need a test where two users are logged in at the same time and can see each other's
actions. How do I set that up?
```

```
How do I handle an OAuth popup window that appears during the login flow?
```

---

## CI/CD & Configuration

### `ci-cd`

> Set up and maintain the CI pipeline for Playwright tests.

```
How do I set up GitHub Actions to run our Playwright tests on every pull request?
```

```
Our test suite takes 15 minutes. How do I shard it across multiple CI machines?
```

```
How do I make CI upload the Playwright trace files as artifacts when tests fail?
```

---

## Code Quality & Maintenance

### `refactor-values`

> Safely rename enum values or change static test data strings.

```
I need to rename the LOGIN_ERROR enum value to INVALID_CREDENTIALS. What's the safest
way to do that without breaking anything?
```

```
The app changed the wording of an error message from "Invalid email" to "Email not found".
How do I update everything in the framework?
```

```
Walk me through how to change a route path in the ApiEndpoints enum.
```

---

## Reviews

### `pw-review`

> Get a full code review of Playwright tests, page objects, or config.

```
Review my login spec file for any issues.
[paste file path or code]
```

```
Can you review the entire tests/front-office/api/ directory for framework compliance?
```

```
I just added three new tests to checkout.spec.ts. Review the diff for flakiness risks
and any rule violations.
```

```
Review our playwright.config.ts — I want to make sure the CI settings make sense.
```

---

### `trust-but-verify`

> Verify that a finished UI branch still matches its intended behavior in the live app.

```
Verify that this frontend branch still matches the intended behavior. Review the diff,
click through the changed flow with playwright-cli, and write a verification report.
```

```
Before I merge this UI feature branch, compare it to the expected behavior and tell me what
still looks off in the browser.
```

```
I want a demo-readiness pass on the admin dashboard changes. Use the PR description and expected behavior,
verify the live behavior with playwright-cli, and save the results under docs/verification.
```

---

### `k6-review`

> Review k6 load testing scripts for correctness and signal quality.

```
Review this k6 script — I want to make sure the load scenario is realistic.
[paste script]
```

```
Are my k6 thresholds set correctly for a checkout flow that should handle 100 VUs?
```

```
This k6 script is returning pass on all thresholds but the response times look wrong.
Can you take a look?
```

---

## Onboarding & Migration

### `app-onboarding`

> Add a new application to the framework or remove a demo app.

```
I need to add a new app called "back-office" to the framework. Walk me through the
full onboarding process.
```

```
How do I remove the sauce-demo app from the framework without breaking anything?
```

```
What directories and files do I need to create when onboarding a new app?
```

---

### `migration-guides`

> Migrate tests from Cypress or Selenium into this Playwright framework.

```
I have a Cypress test that uses cy.get('.submit-btn').click(). What's the Playwright
equivalent following our framework conventions?
```

```
How do I convert a Cypress custom command for login into our storage state auth pattern?
```

```
We're migrating 50 Selenium tests to Playwright. What's the recommended approach?
```

---

## Meta

### `skill-creator`

> Create, test, and improve AI skills.

```
I want to create a new skill for reviewing database migrations.
```

```
The api-testing skill isn't catching cases where tests use z.object() instead of
z.strictObject(). Can we improve it?
```

```
Turn the workflow we just went through into a skill so we can reuse it.
```

```
The selectors skill is triggering when people ask about CSS in general, not just
Playwright selectors. Can we optimize the description?
```
