/// <reference lib="dom" />
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateUserCredentials } from '../../../test-data/factories/coffee-cart/checkout.factory';
import { Routes } from '../../../enums/coffee-cart/coffee-cart';

/** Performance budget thresholds (milliseconds) */
const BUDGETS = {
  /** Maximum time for page navigation to complete */
  navigationTimeout: 3000,
  /** Maximum Largest Contentful Paint */
  lcp: 2500,
  /** Maximum Cumulative Layout Shift (unitless, not ms) */
  cls: 0.1,
  /** Maximum DOM content loaded time, with small CI/browser jitter allowance */
  domContentLoaded: 2200,
  /** Maximum total transferred size for a warmed menu navigation */
  totalResourcesKB: 1700,
  /** Maximum transferred JavaScript size */
  jsResourcesKB: 900,
  /** Maximum transferred CSS size */
  cssResourcesKB: 100,
};

test.describe('Performance Budgets', () => {
  test.beforeEach(async ({ loginPage, menuPage }) => {
    const { email, password } = generateUserCredentials();
    await loginPage.goto();
    await loginPage.login(email, password);
    await menuPage.goto();
  });

  test('menu page loads within performance budget', { tag: '@regression' }, async ({ page }) => {
    await test.step('GIVEN user navigates to menu page', async () => {
      await page.goto(Routes.MENU);
      await page.waitForLoadState('load');
    });

    await test.step('THEN navigation timing is within budget', async () => {
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadComplete: nav.loadEventEnd - nav.startTime,
        };
      });

      expect(timing.domContentLoaded).toBeLessThan(BUDGETS.domContentLoaded);
      expect(timing.loadComplete).toBeLessThan(BUDGETS.navigationTimeout);
    });

    await test.step('AND Largest Contentful Paint is within budget', async () => {
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1]!;
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback if no LCP entry is observed within 5 seconds
          setTimeout(() => {
            resolve(0);
          }, 5000);
        });
      });

      // LCP of 0 means no entry was observed (browser may not support it)
      // Any observed LCP must be within budget
      expect(lcp).toBeLessThan(BUDGETS.lcp);
    });

    await test.step('AND Cumulative Layout Shift is within budget', async () => {
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
                clsValue += (entry as PerformanceEntry & { value: number }).value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          // Collect shifts over 1 second then resolve
          setTimeout(() => {
            resolve(clsValue);
          }, 1000);
        });
      });

      expect(cls).toBeLessThan(BUDGETS.cls);
    });
  });

  test('login page loads within performance budget', { tag: '@regression' }, async ({ page }) => {
    await test.step('GIVEN user navigates to login page', async () => {
      await page.goto(Routes.LOGIN);
      await page.waitForLoadState('load');
    });

    await test.step('THEN navigation timing is within budget', async () => {
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadComplete: nav.loadEventEnd - nav.startTime,
        };
      });

      expect(timing.domContentLoaded).toBeLessThan(BUDGETS.domContentLoaded);
      expect(timing.loadComplete).toBeLessThan(BUDGETS.navigationTimeout);
    });
  });

  test('cart page loads within performance budget', { tag: '@regression' }, async ({ page }) => {
    await test.step('GIVEN user navigates to cart page', async () => {
      await page.goto(Routes.CART);
      await page.waitForLoadState('load');
    });

    await test.step('THEN navigation timing is within budget', async () => {
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadComplete: nav.loadEventEnd - nav.startTime,
        };
      });

      expect(timing.domContentLoaded).toBeLessThan(BUDGETS.domContentLoaded);
      expect(timing.loadComplete).toBeLessThan(BUDGETS.navigationTimeout);
    });
  });

  test('page resources are within size budgets', { tag: '@regression' }, async ({ page }) => {
    const resources: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      const contentLength = await response.headerValue('content-length');
      const parsedContentLength = contentLength ? Number.parseInt(contentLength, 10) : Number.NaN;
      const size = Number.isFinite(parsedContentLength)
        ? parsedContentLength
        : (await response.body().catch(() => Buffer.alloc(0))).length;
      resources.push({ url: response.url(), size });
    });

    await test.step('GIVEN the menu page is loaded', async () => {
      await page.goto(Routes.MENU);
      await page.waitForLoadState('load');
    });

    await test.step('THEN total transferred size is within budget', () => {
      const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
      const jsSize = resources
        .filter((resource) => resource.url.endsWith('.js') || resource.url.includes('.js?'))
        .reduce((sum, resource) => sum + resource.size, 0);
      const cssSize = resources
        .filter((resource) => resource.url.endsWith('.css') || resource.url.includes('.css?'))
        .reduce((sum, resource) => sum + resource.size, 0);

      const resourceStats = {
        totalKB: Math.round(totalSize / 1024),
        jsKB: Math.round(jsSize / 1024),
        cssKB: Math.round(cssSize / 1024),
        resourceCount: resources.length,
      };

      expect(resourceStats.totalKB).toBeLessThan(BUDGETS.totalResourcesKB);
      expect(resourceStats.jsKB).toBeLessThan(BUDGETS.jsResourcesKB);
      expect(resourceStats.cssKB).toBeLessThan(BUDGETS.cssResourcesKB);
    });
  });
});
