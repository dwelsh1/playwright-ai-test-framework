---
name: forms
description: Form interaction patterns -- fill vs type, checkboxes, selects, date inputs, file uploads, and multi-step wizards
---

# Forms & Validation Testing

Patterns for interacting with form elements correctly. Covers input methods, validation states, and multi-step form flows.

## Quick Reference

```typescript
// Text input -- use fill() (clears then types instantly)
await page.getByLabel('Email').fill('user@example.com');

// Typing with key events -- use pressSequentially() when app listens to keystrokes
await page.getByLabel('Search').pressSequentially('playwright', { delay: 50 });

// Checkbox
await page.getByLabel('Accept terms').check();
await page.getByLabel('Newsletter').uncheck();

// Radio button
await page.getByLabel('Express shipping').check();

// Select dropdown
await page.getByLabel('Country').selectOption('US');
await page.getByLabel('Country').selectOption({ label: 'United States' });

// File upload
await page.getByLabel('Upload resume').setInputFiles('test-data/static/files/resume.pdf');
```

## Rules

### ALWAYS Use `fill()` Over `type()`

`fill()` clears the field and sets the value instantly. `type()` is deprecated -- use `pressSequentially()` only when the app needs keystroke events (e.g., autocomplete, search-as-you-type):

```typescript
// GOOD -- standard input
await page.getByLabel('Name').fill('John Doe');

// GOOD -- autocomplete that needs keystroke events
await page.getByLabel('City').pressSequentially('New Y');
await page.getByRole('option', { name: 'New York' }).click();

// BAD -- type() is deprecated
await page.getByLabel('Name').type('John Doe');
```

### ALWAYS Use `check()` / `uncheck()` Over `click()` for Checkboxes

`check()` is idempotent -- it only checks if unchecked. `click()` toggles, which can uncheck an already-checked box:

```typescript
// GOOD -- idempotent
await page.getByLabel('Accept terms').check();
await expect(page.getByLabel('Accept terms')).toBeChecked();

// BAD -- might uncheck if already checked
await page.getByLabel('Accept terms').click();
```

### ALWAYS Use `getByLabel()` for Form Fields

Form fields should be found by their label, not by CSS selectors:

```typescript
// GOOD -- accessible, matches how users find fields
await page.getByLabel('Email address').fill('user@test.com');
await page.getByLabel('Password').fill('secure123');

// BAD -- brittle CSS selector
await page.locator('#email-input').fill('user@test.com');
```

### ALWAYS Clear Fields Before Filling in Edit Forms

When editing existing values, `fill()` auto-clears. But verify the field is ready:

```typescript
await page.getByLabel('Name').clear();
await page.getByLabel('Name').fill('Updated Name');
```

## Validation Testing

### Inline Validation

```typescript
test('shows validation errors for invalid inputs', { tag: '@regression' }, async ({ page }) => {
  await test.step('WHEN user submits empty form', async () => {
    await page.getByRole('button', { name: 'Submit' }).click();
  });

  await test.step('THEN validation errors are shown', async () => {
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
```

### HTML5 Validation

```typescript
// Check HTML5 validity state
const emailInput = page.getByLabel('Email');
await emailInput.fill('not-an-email');
const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
expect(isValid).toBe(false);
```

## Date Inputs

```typescript
// Native date input
await page.getByLabel('Start date').fill('2025-03-15');

// Date picker component -- interact like a user
await page.getByLabel('Start date').click();
await page.getByRole('button', { name: 'Next month' }).click();
await page.getByRole('gridcell', { name: '15' }).click();
```

## File Uploads

```typescript
// Single file
await page.getByLabel('Upload').setInputFiles('test-data/static/files/document.pdf');

// Multiple files
await page
  .getByLabel('Upload')
  .setInputFiles(['test-data/static/files/photo1.jpg', 'test-data/static/files/photo2.jpg']);

// Clear file selection
await page.getByLabel('Upload').setInputFiles([]);

// Drag and drop upload (when no input element exists)
const buffer = await fs.promises.readFile('test-data/static/files/document.pdf');
const dataTransfer = await page.evaluateHandle(
  (data) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(data)], 'document.pdf', { type: 'application/pdf' });
    dt.items.add(file);
    return dt;
  },
  [...buffer],
);

await page.getByTestId('drop-zone').dispatchEvent('drop', { dataTransfer });
```

## Multi-Step Wizards

```typescript
test('complete checkout wizard', { tag: '@e2e' }, async ({ page }) => {
  await test.step('GIVEN user is on step 1 (shipping)', async () => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Shipping' })).toBeVisible();
  });

  await test.step('WHEN user fills shipping details and continues', async () => {
    await page.getByLabel('Address').fill('123 Main St');
    await page.getByLabel('City').fill('New York');
    await page.getByLabel('Zip').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  await test.step('THEN step 2 (payment) is shown', async () => {
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
  });

  await test.step('WHEN user fills payment details and submits', async () => {
    await page.getByLabel('Card number').fill('4111111111111111');
    await page.getByLabel('Expiry').fill('12/26');
    await page.getByLabel('CVV').fill('123');
    await page.getByRole('button', { name: 'Place order' }).click();
  });

  await test.step('THEN confirmation is shown', async () => {
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
  });
});
```

## Select and Combobox Patterns

```typescript
// Native <select>
await page.getByLabel('Country').selectOption('US');
await page.getByLabel('Country').selectOption({ label: 'United States' });
await page.getByLabel('Languages').selectOption(['en', 'fr', 'de']); // multi-select

// Custom combobox / listbox
await page.getByRole('combobox', { name: 'Category' }).click();
await page.getByRole('option', { name: 'Electronics' }).click();
```

## Anti-Patterns

| Don't                                         | Problem                    | Do Instead                            |
| --------------------------------------------- | -------------------------- | ------------------------------------- |
| Use `type()`                                  | Deprecated API             | Use `fill()` or `pressSequentially()` |
| Use `click()` for checkboxes                  | Toggles, not idempotent    | Use `check()` / `uncheck()`           |
| Find inputs by CSS id/class                   | Brittle, not accessible    | Use `getByLabel()`                    |
| Skip validation error assertions              | Misses broken validation   | Assert specific error messages        |
| Hardcode dates as strings                     | Breaks with locale changes | Use native date format `YYYY-MM-DD`   |
| Use `page.waitForTimeout()` after form submit | Hard wait                  | Wait for navigation or response       |

## See Also

- **`selectors`** skill -- Selector priority for finding form elements.
- **`page-objects`** skill -- Encapsulating form interactions in page objects.
- **`data-strategy`** skill -- Generating form data with Faker factories.
