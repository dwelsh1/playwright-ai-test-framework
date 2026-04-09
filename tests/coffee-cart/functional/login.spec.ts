import { expect, test } from '../../../fixtures/pom/test-options';
import {
  generateUserCredentials,
  generateAdminCredentials,
} from '../../../test-data/factories/coffee-cart/checkout.factory';
import invalidLoginData from '../../../test-data/static/coffee-cart/invalidLogin.json' assert { type: 'json' };

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'should login successfully as user and redirect to menu',
    { tag: '@smoke' },
    async ({ loginPage, menuPage }) => {
      const { email, password } = generateUserCredentials();

      await test.step('GIVEN user is on login page', async () => {
        await expect(loginPage.emailInput).toBeVisible();
      });

      await test.step('WHEN user enters valid credentials', async () => {
        await loginPage.login(email, password);
      });

      await test.step('THEN user is redirected to menu', async () => {
        await expect(menuPage.page).toHaveURL(/\/(?:menu|home|$)/);
      });
    },
  );

  test(
    'should show error message on invalid credentials',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      const invalidCreds = invalidLoginData[0]!; // valid email, wrong password

      await test.step('GIVEN user is on login page', async () => {
        await expect(loginPage.form).toBeVisible();
      });

      await test.step('WHEN user enters invalid credentials and submits', async () => {
        await loginPage.login(invalidCreds.email, invalidCreds.password);
      });

      await test.step('THEN error message is displayed', async () => {
        await expect(loginPage.errorMessage).toBeVisible();
      });
    },
  );

  test('should validate email field is required', { tag: '@regression' }, async ({ loginPage }) => {
    const { password } = generateUserCredentials();

    await test.step('GIVEN password is filled but email is empty', async () => {
      await loginPage.passwordInput.fill(password);
    });

    await test.step('WHEN user submits the form', async () => {
      await loginPage.submitButton.click();
    });

    await test.step('THEN form shows validation error or prevents submission', async () => {
      await expect(loginPage.page).toHaveURL(/\/login/);
    });
  });

  test(
    'should validate password field is required',
    { tag: '@regression' },
    async ({ loginPage }) => {
      const { email } = generateUserCredentials();

      await test.step('GIVEN email is filled but password is empty', async () => {
        await loginPage.emailInput.fill(email);
      });

      await test.step('WHEN user submits the form', async () => {
        await loginPage.submitButton.click();
      });

      await test.step('THEN form shows validation error or prevents submission', async () => {
        await expect(loginPage.page).toHaveURL(/\/login/);
      });
    },
  );

  test('should not submit empty login form', { tag: '@regression' }, async ({ loginPage }) => {
    await test.step('GIVEN login form is empty', async () => {
      await expect(loginPage.emailInput).toHaveValue('');
    });

    await test.step('WHEN user clicks submit without filling fields', async () => {
      await loginPage.submitButton.click();
    });

    await test.step('THEN user stays on login page', async () => {
      await expect(loginPage.page).toHaveURL(/\/login/);
    });
  });

  test(
    'should stay on login page after invalid login attempt',
    { tag: '@regression' },
    async ({ loginPage }) => {
      const invalidCreds = invalidLoginData[2]!; // non-existent email

      await test.step('GIVEN user is on login page', async () => {
        await expect(loginPage.form).toBeVisible();
      });

      await test.step('WHEN user enters invalid credentials', async () => {
        await loginPage.login(invalidCreds.email, invalidCreds.password);
      });

      await test.step('THEN user remains on login page', async () => {
        await expect(loginPage.page).toHaveURL(/\/login/);
      });
    },
  );

  test(
    'should login as admin with valid admin credentials',
    { tag: '@regression' },
    async ({ loginPage }) => {
      const { email, password } = generateAdminCredentials();

      await test.step('GIVEN user is on login page', async () => {
        await expect(loginPage.form).toBeVisible();
      });

      await test.step('WHEN admin enters valid credentials', async () => {
        await loginPage.loginAsAdmin(email, password);
      });

      await test.step('THEN admin is redirected to dashboard', async () => {
        await expect(loginPage.page).toHaveURL(/\/admin/);
      });
    },
  );
});
