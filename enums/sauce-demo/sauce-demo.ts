/**
 * Sauce Demo application constants.
 * Contains all repeated string values for the sauce-demo test area.
 */

/** Frontend route paths */
export enum Routes {
  LOGIN = '/',
  INVENTORY = '/inventory.html',
  ITEM = '/inventory-item.html',
  CART = '/cart.html',
  CHECKOUT_STEP_ONE = '/checkout-step-one.html',
}

/** Application text constants */
export enum AppText {
  HEADER_TITLE = 'Swag Labs',
}

/** Product names from the inventory */
export enum ProductNames {
  SAUCE_LABS_BACKPACK = 'Sauce Labs Backpack',
  SAUCE_LABS_BIKE_LIGHT = 'Sauce Labs Bike Light',
  SAUCE_LABS_BOLT_T_SHIRT = 'Sauce Labs Bolt T-Shirt',
  SAUCE_LABS_FLEECE_JACKET = 'Sauce Labs Fleece Jacket',
  SAUCE_LABS_ONESIE = 'Sauce Labs Onesie',
  TEST_ALL_THE_THINGS_T_SHIRT = 'Test.allTheThings() T-Shirt (Red)',
}

/** Product prices as displayed in the UI */
export enum ProductPrices {
  SAUCE_LABS_BACKPACK = '$29.99',
  SAUCE_LABS_BIKE_LIGHT = '$9.99',
  SAUCE_LABS_BOLT_T_SHIRT = '$15.99',
  SAUCE_LABS_FLEECE_JACKET = '$49.99',
  SAUCE_LABS_ONESIE = '$7.99',
  TEST_ALL_THE_THINGS_T_SHIRT = '$15.99',
}
