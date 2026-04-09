import { test as base } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import { pwApi } from 'pw-api-plugin';

/**
 * Whether API call logging is enabled in Playwright UI / Trace Viewer.
 * Reads `LOG_API_UI` env var at module load time.
 * - `"true"` — passes `page` to pwApi, enabling visual request/response cards
 *   in Playwright UI, Trace Viewer, and HTML reports. Requires a browser context.
 * - Any other value (default) — passes only `request` to pwApi, skipping browser
 *   launch entirely. API calls still work; you just don't get visual logging.
 *
 * Toggle per-run:
 * ```powershell
 * # PowerShell (Windows)
 * $env:LOG_API_UI="true"; npx playwright test tests/coffee-cart/api/ --project=chromium
 *
 * # Bash / macOS / Linux
 * LOG_API_UI=true npx playwright test tests/coffee-cart/api/ --project=chromium
 * ```
 */
const isApiLoggingEnabled = process.env['LOG_API_UI'] === 'true';

// ──────────────────────────────────────────────────────────────────────────────
// Fixture types
// ──────────────────────────────────────────────────────────────────────────────

/**
 * The `api` fixture — a thin wrapper around `pwApi` that conditionally
 * includes `page` based on the `LOG_API_UI` environment variable.
 *
 * Methods mirror Playwright's `APIRequestContext` (`get`, `post`, `put`,
 * `patch`, `delete`, `head`, `fetch`) and return a raw `APIResponse`.
 *
 * @example
 * ```ts
 * // Basic usage (no logging — fast)
 * test('fetch menu', { tag: '@api' }, async ({ api }) => {
 *   const response = await api.get(`${config.apiUrl}/api/coffees`);
 *   expect(response.status()).toBe(200);
 *   const body = await response.json();
 *   CoffeeListResponseSchema.parse(body);
 * });
 *
 * // With logging (run with LOG_API_UI=true to see cards in Trace Viewer)
 * // LOG_API_UI=true npx playwright test --project=chromium --trace on
 * ```
 */
export type PwApiFixtures = {
  api: {
    get: (url: string, options?: object) => Promise<APIResponse>;
    post: (url: string, options?: object) => Promise<APIResponse>;
    put: (url: string, options?: object) => Promise<APIResponse>;
    patch: (url: string, options?: object) => Promise<APIResponse>;
    delete: (url: string, options?: object) => Promise<APIResponse>;
    head: (url: string, options?: object) => Promise<APIResponse>;
    fetch: (url: string, options?: object) => Promise<APIResponse>;
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Fixture definition
//
// Two separate fixture implementations:
// - With logging: destructures both `request` and `page` → browser launches
// - Without logging: destructures only `request` → no browser overhead
//
// This matters because Playwright's fixture system is dependency-based:
// merely naming `page` in the destructure triggers the browser → context →
// page chain, even if you never use the value.
// ──────────────────────────────────────────────────────────────────────────────

export const test = isApiLoggingEnabled
  ? base.extend<PwApiFixtures>({
      api: async ({ request, page }, use) => {
        const ctx = { request, page };
        await use({
          get: (url: string, options?: object) => pwApi.get(ctx, url, options),
          post: (url: string, options?: object) => pwApi.post(ctx, url, options),
          put: (url: string, options?: object) => pwApi.put(ctx, url, options),
          patch: (url: string, options?: object) => pwApi.patch(ctx, url, options),
          delete: (url: string, options?: object) => pwApi.delete(ctx, url, options),
          head: (url: string, options?: object) => pwApi.head(ctx, url, options),
          fetch: (url: string, options?: object) => pwApi.fetch(ctx, url, options),
        });
      },
    })
  : base.extend<PwApiFixtures>({
      api: async ({ request }, use) => {
        const ctx = { request };
        await use({
          get: (url: string, options?: object) => pwApi.get(ctx, url, options),
          post: (url: string, options?: object) => pwApi.post(ctx, url, options),
          put: (url: string, options?: object) => pwApi.put(ctx, url, options),
          patch: (url: string, options?: object) => pwApi.patch(ctx, url, options),
          delete: (url: string, options?: object) => pwApi.delete(ctx, url, options),
          head: (url: string, options?: object) => pwApi.head(ctx, url, options),
          fetch: (url: string, options?: object) => pwApi.fetch(ctx, url, options),
        });
      },
    });
