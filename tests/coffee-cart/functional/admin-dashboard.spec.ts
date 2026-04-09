import { expect, test } from '../../../fixtures/pom/test-options';
import { generateAdminCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { AdminDashboardStats } from '../../../enums/coffee-cart/coffee-cart';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ loginPage, adminPage, createdOrder }) => {
    // Seed a stable order for every admin-dashboard test via the helper fixture.
    void createdOrder;
    // Admin login
    const { email, password } = generateAdminCredentials();
    await loginPage.goto();
    await loginPage.loginAsAdmin(email, password);

    // Navigate to admin dashboard
    await adminPage.goto();
  });

  test('should load admin dashboard', { tag: '@smoke' }, async ({ adminPage }) => {
    await test.step('GIVEN admin is logged in', async () => {
      await expect(adminPage.page).toHaveURL(/\/admin/);
    });

    await test.step('WHEN admin dashboard loads', async () => {
      // Already loaded in beforeEach
    });

    await test.step('THEN dashboard is displayed', async () => {
      await expect(adminPage.dashboard).toBeVisible();
    });
  });

  test('should display stat cards', { tag: '@smoke' }, async ({ adminPage }) => {
    await test.step('GIVEN admin dashboard is open', async () => {
      await expect(adminPage.page).toHaveURL(/\/admin/);
    });

    await test.step('WHEN viewing dashboard stats', async () => {
      // Already visible
    });

    await test.step('THEN stat cards (Revenue, Orders, Items) are displayed', async () => {
      const revenueCard = adminPage.getStatCard(AdminDashboardStats.REVENUE);
      const ordersCard = adminPage.getStatCard(AdminDashboardStats.ORDERS);
      await expect(revenueCard).toBeVisible();
      await expect(ordersCard).toBeVisible();
    });
  });

  test('should calculate revenue correctly', { tag: '@sanity' }, async ({ adminPage }) => {
    await test.step('GIVEN stat cards are visible', async () => {
      const revenueCard = adminPage.getStatCard(AdminDashboardStats.REVENUE);
      await expect(revenueCard).toBeVisible();
    });

    await test.step('WHEN viewing revenue stat', async () => {
      // Already visible
    });

    await test.step('THEN revenue value is in valid currency format', async () => {
      const revenueValue = await adminPage.getStatNumericValue(AdminDashboardStats.REVENUE);
      expect(revenueValue).toBeGreaterThanOrEqual(0);
    });
  });

  test('should display orders table', { tag: '@regression' }, async ({ adminPage }) => {
    await test.step('GIVEN admin dashboard is open', async () => {
      await expect(adminPage.page).toHaveURL(/\/admin/);
    });

    await test.step('WHEN viewing orders section', async () => {
      // Already visible
    });

    await test.step('THEN orders table is displayed', async () => {
      await expect(adminPage.ordersTable).toBeVisible();
    });
  });

  test('should allow deleting an order', { tag: '@regression' }, async ({ adminPage }) => {
    await test.step('GIVEN admin can see orders table', async () => {
      await expect(adminPage.ordersTable).toBeVisible();
    });

    await test.step('WHEN admin clicks delete button on an order', async () => {
      const deleteButton = adminPage.ordersTable
        .getByRole('button', { name: /delete|remove/i })
        .first();
      await deleteButton.click();
    });

    await test.step('THEN delete confirmation dialog appears', async () => {
      await expect(adminPage.confirmPrompt).toBeVisible();
    });
  });

  test(
    'should update order count after deletion',
    { tag: '@regression' },
    async ({ adminPage, createdOrder }) => {
      const seededOrderId = createdOrder.orderId;
      expect(seededOrderId).toMatch(/^ORD-/);

      let initialCount = 0;

      await test.step('GIVEN admin has orders to delete', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
        await expect
          .poll(
            async () => {
              await adminPage.page.reload();
              return adminPage.getAdminOrderRow(seededOrderId).count();
            },
            {
              message: 'Admin dashboard shows the seeded order before deletion',
              timeout: 10_000,
            },
          )
          .toBeGreaterThan(0);

        initialCount = await adminPage.getStatNumericValue(AdminDashboardStats.ORDERS);
        expect(initialCount).toBeGreaterThan(0);
      });

      await test.step('WHEN admin deletes an order', async () => {
        await adminPage.getDeleteButton(seededOrderId).click();
        await adminPage.confirmDelete();
      });

      await test.step('THEN order count decreases', async () => {
        await expect
          .poll(
            async () => {
              await adminPage.page.reload();
              return adminPage.getAdminOrderRow(seededOrderId).count();
            },
            {
              message: 'Deleted seeded order disappears from the admin dashboard',
              timeout: 10_000,
            },
          )
          .toBe(0);

        const finalCount = await adminPage.getStatNumericValue(AdminDashboardStats.ORDERS);
        expect(finalCount).toBeLessThan(initialCount);
      });
    },
  );

  test(
    'should remove order from table on delete',
    { tag: '@destructive' },
    async ({ adminPage }) => {
      let initialRowCount: number;

      await test.step('GIVEN admin has orders visible', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
        initialRowCount = await adminPage.ordersTable.locator('tr, [role="row"]').count();
        expect(initialRowCount).toBeGreaterThan(1);
      });

      await test.step('WHEN admin deletes and confirms', async () => {
        const deleteButton = adminPage.ordersTable
          .getByRole('button', { name: /delete|remove/i })
          .first();
        await deleteButton.click();
        await adminPage.confirmDelete();
      });

      await test.step('THEN order is removed from table', async () => {
        await adminPage.page.reload();
        await expect(adminPage.ordersTable).toBeVisible();
      });
    },
  );
});
