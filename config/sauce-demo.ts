/**
 * Sauce Demo application configuration.
 * Contains URL configuration for the Sauce Demo frontend.
 *
 * For route paths, use enums from `enums/sauce-demo/sauce-demo.ts`.
 */

export const sauceDemoConfig = {
  /** Frontend application URL */
  appUrl: process.env['SAUCE_DEMO_URL'] ?? 'https://www.saucedemo.com',
};
