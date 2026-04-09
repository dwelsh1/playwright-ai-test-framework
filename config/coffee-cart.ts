/**
 * Coffee Cart application configuration.
 * Contains URL configuration for the coffee-cart frontend and API.
 *
 * Environment is selected via `TEST_ENV` (dev | staging | production).
 * Defaults to `dev` when not set.
 *
 * For route paths and API endpoints, use enums from `enums/coffee-cart/coffee-cart.ts`.
 */

/** Current test environment name */
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
export const testEnv = (process.env['TEST_ENV'] || 'dev') as 'dev' | 'staging' | 'production';

export const config = {
  /** Current environment */
  env: testEnv,
  /** Frontend application URL */
  appUrl: process.env['APP_URL'],
  /** Backend API URL */
  apiUrl: process.env['API_URL'],
  /** Path to coffee-cart project directory (local dev only) */
  projectPath: process.env['COFFEE_CART_PATH'],
};
