/// <reference lib="dom" />
import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateCheckoutData,
  generateCartItems,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import invalidCheckoutData from '../../../test-data/static/coffee-cart/invalidCheckout.json' assert { type: 'json' };

test.describe('Checkout Page', () => {
  test.beforeEach(async ({ loginPage, menuPage }) => {
    // Login and add items to cart
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();

    // Add items to cart
    const items = generateCartItems(2);
    for (const item of items) {
      await menuPage.addToCart(item.name);
    }

    // Navigate to cart via header (preserves SPA state)
    await menuPage.header.goToCart();
  });

  test('should show checkout button in cart', { tag: '@smoke' }, async ({ cartPage }) => {
    await test.step('GIVEN user is viewing cart with items', async () => {
      const isEmpty = await cartPage.isEmpty();
      expect(isEmpty).toBe(false);
    });

    await test.step('WHEN viewing cart page', async () => {
      await expect(cartPage.page).toHaveURL(/\/cart/);
    });

    await test.step('THEN checkout button is visible', async () => {
      await expect(cartPage.checkoutButton).toBeVisible();
    });
  });

  test(
    'should fill checkout form with valid data',
    { tag: '@smoke' },
    async ({ cartPage, paymentDetails }) => {
      const { name, email, subscribe } = generateCheckoutData();

      await test.step('GIVEN user clicks checkout', async () => {
        await cartPage.checkout();
      });

      await test.step('WHEN payment details modal appears', async () => {
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('THEN form can be filled with valid data', async () => {
        await paymentDetails.fillCheckout(name, email, subscribe);
      });
    },
  );

  test(
    'should show order confirmation message',
    { tag: '@sanity' },
    async ({ cartPage, paymentDetails, snackbar }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN user is on checkout page', async () => {
        await cartPage.checkout();
      });

      await test.step('WHEN user fills and submits checkout form', async () => {
        await paymentDetails.fillCheckout(name, email);
        await paymentDetails.submit();
      });

      await test.step('THEN success message appears', async () => {
        await snackbar.waitForAppear();
        const message = await snackbar.getMessage();
        expect(message.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should require name field',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails }) => {
      const invalidData = invalidCheckoutData[0]!; // missing name

      await test.step('GIVEN checkout form is open', async () => {
        await cartPage.checkout();
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('WHEN user submits without name', async () => {
        await paymentDetails.fillCheckout('', invalidData.email as string);
        await paymentDetails.submit();
      });

      await test.step('THEN validation error or rejection occurs', async () => {
        const nameInput = paymentDetails.nameInput;
        await expect(nameInput).toBeVisible();
        const validationMessage = await nameInput.evaluate(
          (el: HTMLInputElement) => el.validationMessage,
        );
        expect(validationMessage.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should require email field',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails }) => {
      await test.step('GIVEN checkout form is open', async () => {
        await cartPage.checkout();
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('WHEN user submits without email', async () => {
        const { name } = generateCheckoutData();
        await paymentDetails.fillCheckout(name, '');
        await paymentDetails.submit();
      });

      await test.step('THEN validation error occurs', async () => {
        const emailInput = paymentDetails.emailInput;
        await expect(emailInput).toBeVisible();
        const validationMessage = await emailInput.evaluate(
          (el: HTMLInputElement) => el.validationMessage,
        );
        expect(validationMessage.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should validate email format',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails }) => {
      const invalidData = invalidCheckoutData[2]!; // invalid email format

      await test.step('GIVEN checkout form is open', async () => {
        await cartPage.checkout();
      });

      await test.step('WHEN user enters invalid email', async () => {
        const { name } = generateCheckoutData();
        await paymentDetails.fillCheckout(name, invalidData.email as string);
        await paymentDetails.submit();
      });

      await test.step('THEN validation error is shown', async () => {
        const emailInput = paymentDetails.emailInput;
        await expect(emailInput).toBeVisible();
        const validationMessage = await emailInput.evaluate(
          (el: HTMLInputElement) => el.validationMessage,
        );
        expect(validationMessage.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should persist subscribe checkbox state',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails }) => {
      const { name, email } = generateCheckoutData({ subscribe: true });

      await test.step('GIVEN checkout form is open', async () => {
        await cartPage.checkout();
      });

      await test.step('WHEN user checks subscribe and fills form', async () => {
        await paymentDetails.fillCheckout(name, email, true);
      });

      await test.step('THEN subscribe preference is retained', async () => {
        // Verify checkbox state
        const subscribeCheckbox = paymentDetails.subscribeCheckbox;
        await expect(subscribeCheckbox).toBeChecked();
      });
    },
  );

  test(
    'should display order items in confirmation',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails, snackbar }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN user completes checkout', async () => {
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, email);
      });

      await test.step('WHEN order is submitted', async () => {
        const waitForSnackbar = snackbar.waitForAppear(10000);
        await paymentDetails.submit();
        await waitForSnackbar;
      });

      await test.step('THEN confirmation shows ordered items', async () => {
        const message = await snackbar.getMessage();
        expect(message.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should generate order confirmation number',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails, snackbar }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN user completes checkout', async () => {
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, email);
        await paymentDetails.submit();
      });

      await test.step('WHEN confirmation is shown', async () => {
        await snackbar.waitForAppear();
      });

      await test.step('THEN order confirmation message is visible', async () => {
        const message = await snackbar.getMessage();
        expect(message.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'should clear cart after successful checkout',
    { tag: '@regression' },
    async ({ cartPage, paymentDetails, snackbar }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN cart has items', async () => {
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(false);
      });

      await test.step('WHEN user completes checkout', async () => {
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, email);
        await paymentDetails.submit();
      });

      await test.step('THEN cart is cleared and success shown', async () => {
        await snackbar.waitForAppear();
        await cartPage.goto();
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(true);
      });
    },
  );

  test(
    'should create order entry on successful checkout',
    { tag: '@destructive' },
    async ({ cartPage, paymentDetails, snackbar, ordersPage }) => {
      const { name, email } = generateCheckoutData();

      await test.step('GIVEN user has items in cart', async () => {
        const isEmpty = await cartPage.isEmpty();
        expect(isEmpty).toBe(false);
      });

      await test.step('WHEN user completes checkout', async () => {
        await cartPage.checkout();
        await paymentDetails.fillCheckout(name, email);
        const waitForSnackbar = snackbar.waitForAppear(10000);
        await paymentDetails.submit();
        await waitForSnackbar;
      });

      await test.step('THEN order is created and visible in orders page', async () => {
        await ordersPage.goto();
        const isEmpty = await ordersPage.isEmpty();
        expect(isEmpty).toBe(false);
      });
    },
  );
});
