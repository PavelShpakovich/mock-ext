/**
 * Escapes special characters in a string for use in a regular expression
 * ⚠️ IMPORTANT: This function is duplicated in src/interceptor.ts
 * Must be kept in sync manually
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
