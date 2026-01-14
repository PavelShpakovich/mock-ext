/**
 * Checks if a status code matches any of the filter codes (by range)
 */
export function matchesStatusCodeFilter(statusCode: number | undefined, filterCodes: number[]): boolean {
  if (filterCodes.length === 0) return true;
  if (!statusCode) return false;
  return filterCodes.some((filterCode) => {
    const statusRange = Math.floor(statusCode / 100) * 100;
    return statusRange === filterCode;
  });
}
