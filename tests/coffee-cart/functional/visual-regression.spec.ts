import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { CoffeeNames, Routes, TestParams } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ loginPage, menuPage }) => {
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();
    await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
  });

  test('menu page matches baseline screenshot', { tag: '@visual' }, async ({ menuPage }) => {
    await test.step('GIVEN the menu page is fully loaded', async () => {
      const firstCard = menuPage.getCoffeeCard(CoffeeNames.ESPRESSO);
      await expect(firstCard).toBeVisible();
    });

    await test.step('THEN the page matches the baseline screenshot', async () => {
      await expect(menuPage.page).toHaveScreenshot('menu-page.png', {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    });
  });

  test('cart page empty state matches baseline', { tag: '@visual' }, async ({ cartPage }) => {
    await test.step('GIVEN user navigates to empty cart', async () => {
      await cartPage.goto();
      await expect(cartPage.page).toHaveURL(/\/cart/);
    });

    await test.step('THEN the empty cart matches the baseline screenshot', async () => {
      await expect(cartPage.page).toHaveScreenshot('cart-empty.png', {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    });
  });

  test(
    'cart page with items matches baseline',
    { tag: '@visual' },
    async ({ menuPage, cartPage, header }) => {
      await test.step('GIVEN user adds an item to cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        const count = await header.getCartCount();
        expect(count).toBeGreaterThan(0);
      });

      await test.step('AND navigates to cart', async () => {
        await header.goToCart();
        await expect(cartPage.page).toHaveURL(/\/cart/);
        await expect(cartPage.cartList).toBeVisible();
      });

      await test.step('THEN the cart with items matches the baseline', async () => {
        await expect(cartPage.page).toHaveScreenshot('cart-with-items.png', {
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
        });
      });
    },
  );

  test('login page matches baseline screenshot', { tag: '@visual' }, async ({ page }) => {
    await test.step('GIVEN user navigates to login page', async () => {
      await page.goto(Routes.LOGIN);
      await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
    });

    await test.step('THEN the login page matches the baseline', async () => {
      await expect(page).toHaveScreenshot('login-page.png', {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    });
  });

  test(
    '[DEMO] visualbreak param produces a detectable visual difference',
    { tag: '@visual' },
    async ({ page }) => {
      test.fixme(
        true,
        'Demo-only visual regression scenario; exclude from normal verification runs.',
      );

      // ONBOARDING DEMO: shows what a visual regression failure looks like.
      // ?visualbreak=1 hides the Coffee Cart logo — the most prominent element on the page.
      //
      // This test has its own baseline (login-page-visual-break.png — logo absent).
      // Compare it to login-page.png (logo present) to see the kind of diff that
      // visual regression catches. To simulate a real failure:
      //   1. Delete login-page-visual-break.png from the snapshots folder
      //   2. Re-run this test — it will fail and render the diff in Smart Reporter
      await test.step('GIVEN login page is loaded with the logo hidden', async () => {
        await page.goto(`${Routes.LOGIN}?${TestParams.VISUAL_BREAK}=1`);
        await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
      });

      await test.step('THEN the page matches the visual-break baseline', async () => {
        await expect(page).toHaveScreenshot('login-page-visual-break.png', {
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
        });
      });
    },
  );

  test(
    'checkout modal matches baseline screenshot',
    { tag: '@visual' },
    async ({ menuPage, cartPage, paymentDetails, header }) => {
      await test.step('GIVEN user has items in cart', async () => {
        await menuPage.addToCart(CoffeeNames.ESPRESSO);
        await header.goToCart();
        await expect(cartPage.cartList).toBeVisible();
      });

      await test.step('AND opens the checkout modal', async () => {
        await cartPage.checkout();
        await expect(paymentDetails.submitButton).toBeVisible();
      });

      await test.step('THEN the checkout modal matches the baseline', async () => {
        await expect(cartPage.page).toHaveScreenshot('checkout-modal.png', {
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
          mask: [paymentDetails.nameInput, paymentDetails.emailInput],
        });
      });
    },
  );
});
