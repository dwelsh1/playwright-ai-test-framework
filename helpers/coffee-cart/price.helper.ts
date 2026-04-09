/**
 * Formats a numeric price as a currency string matching the Coffee Cart UI format.
 * Use with CoffeePrices enum values for exact price assertions.
 *
 * @param {number} amount - Price in dollars (e.g. 16.5)
 * @returns {string} Formatted price string (e.g. "$16.50")
 *
 * @example
 * formatPrice(CoffeePrices.ESPRESSO)                          // "$5.00"
 * formatPrice(2 * CoffeePrices.ESPRESSO + CoffeePrices.CAPPUCCINO) // "$16.50"
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
