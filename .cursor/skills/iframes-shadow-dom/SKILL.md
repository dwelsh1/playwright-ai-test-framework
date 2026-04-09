---
name: iframes-shadow-dom
description: iFrame and Shadow DOM interaction -- frameLocator, nested iframes, shadow DOM auto-piercing, and cross-frame assertions
---

# iFrames & Shadow DOM

Patterns for interacting with content inside iframes and Shadow DOM boundaries.

## Quick Reference

```typescript
// Interact with iframe content
const frame = page.frameLocator('#payment-iframe');
await frame.getByLabel('Card number').fill('4111111111111111');
await frame.getByRole('button', { name: 'Pay' }).click();

// Nested iframes
const outerFrame = page.frameLocator('#outer');
const innerFrame = outerFrame.frameLocator('#inner');
await innerFrame.getByRole('button', { name: 'Submit' }).click();

// Shadow DOM -- Playwright auto-pierces by default
await page.getByRole('button', { name: 'Settings' }).click(); // works inside shadow DOM
await page.locator('custom-element').getByText('Hello').click(); // also works
```

## iFrame Rules

### ALWAYS Use `frameLocator()` Over `frame()`

`frameLocator()` returns a locator-based API that auto-waits. The legacy `frame()` API does not:

```typescript
// GOOD -- locator-based, auto-waits
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: 'Submit' }).click();

// BAD -- legacy API, no auto-wait
const frame = page.frame({ name: 'my-iframe' });
await frame!.click('button'); // can fail if frame not loaded
```

### ALWAYS Wait for Frame Content Before Interacting

```typescript
const frame = page.frameLocator('#content-frame');

// GOOD -- verify content is loaded
await expect(frame.getByRole('heading', { name: 'Welcome' })).toBeVisible();
await frame.getByRole('button', { name: 'Continue' }).click();

// BAD -- interact immediately
await frame.getByRole('button', { name: 'Continue' }).click(); // frame may not be loaded
```

### Finding iFrames

```typescript
// By id or name attribute
const frame = page.frameLocator('#payment-frame');
const frame = page.frameLocator('[name="checkout"]');

// By title attribute
const frame = page.frameLocator('iframe[title="Payment form"]');

// By src URL pattern
const frame = page.frameLocator('iframe[src*="stripe.com"]');

// nth iframe when multiple exist
const frame = page.frameLocator('iframe').nth(0);
```

## Nested iFrames

Some applications embed iframes within iframes (e.g., payment providers inside checkout widgets):

```typescript
const outerFrame = page.frameLocator('#checkout-widget');
const paymentFrame = outerFrame.frameLocator('#stripe-iframe');

await paymentFrame.getByLabel('Card number').fill('4111111111111111');
await paymentFrame.getByLabel('Expiry').fill('12/26');
await paymentFrame.getByLabel('CVC').fill('123');
await paymentFrame.getByRole('button', { name: 'Pay' }).click();
```

## Cross-Frame Assertions

Assert content across frame boundaries:

```typescript
test('payment in iframe updates parent page', { tag: '@e2e' }, async ({ page }) => {
  await test.step('GIVEN user is on checkout page', async () => {
    await page.goto('/checkout');
  });

  await test.step('WHEN user completes payment in iframe', async () => {
    const paymentFrame = page.frameLocator('#payment-iframe');
    await paymentFrame.getByLabel('Card number').fill('4111111111111111');
    await paymentFrame.getByRole('button', { name: 'Pay' }).click();
  });

  await test.step('THEN parent page shows confirmation', async () => {
    // Assert on parent page, not inside iframe
    await expect(page.getByText('Payment successful')).toBeVisible();
  });
});
```

## Shadow DOM

### Auto-Piercing (Default Behavior)

Playwright automatically pierces open Shadow DOM boundaries. Standard locators work without special syntax:

```typescript
// This works even if the button is inside a shadow root
await page.getByRole('button', { name: 'Settings' }).click();

// getByText also pierces shadow DOM
await page.getByText('Welcome back').click();
```

### When Auto-Piercing Doesn't Work

For closed Shadow DOM (rare), or when you need to scope to a specific web component:

```typescript
// Scope to a specific custom element's shadow tree
const component = page.locator('my-component');
await component.getByRole('button', { name: 'Save' }).click();

// Closed shadow DOM -- must use evaluate
const result = await page.evaluate(() => {
  const host = document.querySelector('my-sealed-component');
  const shadowRoot = host?.shadowRoot; // null for closed shadow DOM
  return shadowRoot?.querySelector('button')?.textContent;
});
```

### CSS Selectors in Shadow DOM

CSS locators do NOT auto-pierce. Use `>>` combinator for explicit shadow DOM traversal:

```typescript
// GOOD -- pierces shadow DOM explicitly
await page.locator('my-component >> button.primary').click();

// BAD -- CSS doesn't pierce shadow DOM
await page.locator('my-component button.primary').click(); // won't find it
```

**Prefer `getByRole()` and `getByText()` which auto-pierce without special syntax.**

## Anti-Patterns

| Don't                                | Problem                                | Do Instead                                  |
| ------------------------------------ | -------------------------------------- | ------------------------------------------- |
| Use `page.frame()` API               | No auto-wait, stale references         | Use `page.frameLocator()`                   |
| Interact before frame loads          | Element not found errors               | Wait for visible content first              |
| Use CSS selectors for shadow DOM     | CSS doesn't auto-pierce                | Use role/text locators that auto-pierce     |
| Assume iframe content is same-origin | Cross-origin iframes have restrictions | Check iframe `src` origin                   |
| Use `evaluate()` inside iframes      | Complex, fragile                       | Use `frameLocator()` with standard locators |

## See Also

- **`selectors`** skill -- Locator priority applies inside frames and shadow DOM.
- **`error-index`** skill -- "frame was detached" error troubleshooting.
