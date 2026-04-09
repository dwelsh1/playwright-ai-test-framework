import { test as base, Page, Route } from '@playwright/test';

/**
 * Network mock helpers for simulating error states, offline mode,
 * and third-party service responses.
 *
 * RULE: Only mock your own API for error simulation.
 * For happy-path tests, always hit the real backend.
 */

export type NetworkMockFn = {
  /** Simulate a server error (500) for a URL pattern */
  simulateServerError: (urlPattern: string | RegExp) => Promise<void>;
  /** Simulate a timeout (request hangs, then aborts) for a URL pattern */
  simulateTimeout: (urlPattern: string | RegExp) => Promise<void>;
  /** Simulate offline mode (all requests fail with network error) */
  goOffline: () => Promise<void>;
  /** Restore network (remove all route overrides) */
  goOnline: () => Promise<void>;
  /** Block requests matching a URL pattern (e.g., third-party scripts, images) */
  blockRequests: (urlPattern: string | RegExp) => Promise<void>;
  /** Intercept a URL and return a custom JSON response */
  mockJsonResponse: (urlPattern: string | RegExp, json: unknown, status?: number) => Promise<void>;
};

export type NetworkMockFixtures = {
  networkMock: NetworkMockFn;
};

function createNetworkMock(page: Page): NetworkMockFn {
  const activeRoutes: Array<{
    pattern: string | RegExp;
    handler: (route: Route) => Promise<void>;
  }> = [];

  const addRoute = async (pattern: string | RegExp, handler: (route: Route) => Promise<void>) => {
    activeRoutes.push({ pattern, handler });
    await page.route(pattern, handler);
  };

  return {
    simulateServerError: async (urlPattern) => {
      await addRoute(urlPattern, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });
    },

    simulateTimeout: async (urlPattern) => {
      await addRoute(urlPattern, async (route) => {
        await route.abort('timedout');
      });
    },

    goOffline: async () => {
      await addRoute('**/*', async (route) => {
        await route.abort('connectionrefused');
      });
    },

    goOnline: async () => {
      for (const { pattern, handler } of activeRoutes) {
        await page.unroute(pattern, handler);
      }
      activeRoutes.length = 0;
    },

    blockRequests: async (urlPattern) => {
      await addRoute(urlPattern, async (route) => {
        await route.abort();
      });
    },

    mockJsonResponse: async (urlPattern, json, status = 200) => {
      await addRoute(urlPattern, async (route) => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(json),
        });
      });
    },
  };
}

export const test = base.extend<NetworkMockFixtures>({
  networkMock: async ({ page }, use) => {
    const mock = createNetworkMock(page);
    await use(mock);
    // Cleanup: remove all routes after the test
    await mock.goOnline();
  },
});
