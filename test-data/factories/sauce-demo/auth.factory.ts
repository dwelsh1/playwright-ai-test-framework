/**
 * Generates valid Sauce Demo credentials.
 * Reads from SAUCE_DEMO_USERNAME / SAUCE_DEMO_PASSWORD env vars.
 * Falls back to the publicly documented demo defaults shown on the login page.
 * @param {object} overrides - Optional field overrides
 * @returns {object} Sauce Demo credentials
 */
export const generateSauceDemoCredentials = (overrides?: {
  username?: string;
  password?: string;
}) => {
  return {
    username: overrides?.username ?? process.env['SAUCE_DEMO_USERNAME'] ?? 'standard_user',
    password: overrides?.password ?? process.env['SAUCE_DEMO_PASSWORD'] ?? 'secret_sauce',
  };
};
