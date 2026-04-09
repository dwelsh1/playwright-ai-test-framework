/**
 * Coffee Cart application constants.
 * Contains all repeated string values for the coffee-cart test area.
 */

/** API endpoint paths (server-side only — no auth endpoints exist on the API) */
export enum ApiEndpoints {
  COFFEES = '/api/coffees',
  CART = '/api/cart',
  CHECKOUT = '/api/checkout',
  ORDERS = '/api/orders',
  STORES = '/api/stores',
  /** Read-only demo GraphQL (same menu data as {@link ApiEndpoints.COFFEES}) */
  GRAPHQL = '/api/graphql',
}

/** Alias for backwards compatibility */
export const COFFEE_CART_API_ENDPOINTS = ApiEndpoints;

/** Frontend route paths */
export enum Routes {
  LOGIN = '/login',
  MENU = '/',
  CART = '/cart',
  ORDERS = '/orders',
  ADMIN = '/admin',
  AD = '/ad',
  GITHUB = '/github',
}

/** Toast and validation messages */
export enum Messages {
  ORDER_SUCCESS = 'Order placed successfully. Check your email for payment details.',
  NAME_REQUIRED = 'name is required',
  EMAIL_REQUIRED = 'name and email are required',
  ITEMS_REQUIRED = 'items must be a non-empty array',
  NOT_IN_CART = 'not in cart',
  COFFEE_NOT_FOUND = 'not found',
  ORDER_NOT_FOUND = 'Order not found',
  SIMULATED_ERROR = 'Simulated server error',
}

/** Storage state file paths for authenticated sessions */
export enum StorageStatePaths {
  USER = '.auth/coffee-cart/userStorageState.json',
  ADMIN = '.auth/coffee-cart/adminStorageState.json',
}

/** Coffee names from the menu */
export enum CoffeeNames {
  ESPRESSO = 'Espresso',
  ESPRESSO_MACCHIATO = 'Espresso Macchiato',
  CAPPUCCINO = 'Cappuccino',
  MOCHA = 'Mocha',
  FLAT_WHITE = 'Flat White',
  AMERICANO = 'Americano',
  CAFE_LATTE = 'Cafe Latte',
  ESPRESSO_CON_PANNA = 'Espresso Con Panna',
  HOT_CHOCOLATE = 'Hot Chocolate',
  DISCOUNTED_MOCHA = '(Discounted) Mocha',
}

/** Coffee prices (in dollars) */
export enum CoffeePrices {
  ESPRESSO = 5,
  ESPRESSO_MACCHIATO = 5.5,
  CAPPUCCINO = 6.5,
  MOCHA = 7.5,
  FLAT_WHITE = 7,
  AMERICANO = 6,
  CAFE_LATTE = 6.5,
  ESPRESSO_CON_PANNA = 5,
  HOT_CHOCOLATE = 3.25,
  DISCOUNTED_MOCHA = 4,
}

/** Admin dashboard statistic labels */
export enum AdminDashboardStats {
  REVENUE = 'Revenue',
  ORDERS = 'Orders',
  ITEMS = 'Items',
  LAST_ORDER = 'Last Order',
}

/** URL test parameters for controlling app behavior */
export enum TestParams {
  SKIP_AUTH = 'skipauth',
  SKIP_AUTH_ADMIN = 'admin',
  PREFILL = 'prefill',
  RESET = 'reset',
  HIGH_CONTRAST = 'highcontrast',
  NO_ANIM = 'noanim',
  NO_PROMO = 'nopromo',
  CHECKOUT = 'checkout',
  SLOW_TOAST = 'slowtoast',
  ERROR = 'error',
  SLOW = 'slow',
  AD = 'ad',
  BREAKABLE = 'breakable',
  SEED_ORDERS = 'seedorders',
  A11Y_BREAK = 'a11ybreak',
  VISUAL_BREAK = 'visualbreak',
}

/** Credentials for test authentication */
export enum Credentials {
  ADMIN_EMAIL = 'admin@example.com',
  ADMIN_PASSWORD = 'admin',
  USER_EMAIL = 'user@example.com',
  USER_PASSWORD = 'password',
}
