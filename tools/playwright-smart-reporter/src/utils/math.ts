/**
 * Compute a percentile from a pre-sorted array of numbers using the nearest rank method.
 * @param sortedValues - Values sorted ascending (caller is responsible for sorting)
 * @param p - Percentile to compute (0–100)
 * @returns The value at the given percentile, or NaN if the array is empty
 */
export function computePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return NaN;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}
