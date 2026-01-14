import { MatchType, MockRule } from '../types';
import { escapeRegExp } from './string';

/**
 * Matches a URL against a pattern using the specified match type
 */
export function matchURL(url: string, pattern: string, type: MatchType): boolean {
  switch (type) {
    case 'exact':
      return url === pattern;
    case 'wildcard': {
      const regexPattern = pattern
        .split('*')
        .map((part) => escapeRegExp(part))
        .join('.*');
      try {
        return new RegExp('^' + regexPattern + '$').test(url);
      } catch {
        return false;
      }
    }
    case 'regex':
      try {
        return new RegExp(pattern).test(url);
      } catch {
        console.error('Invalid regex pattern:', pattern);
        return false;
      }
    default:
      return false;
  }
}

/**
 * Finds the first matching rule for a given URL and method
 */
export function findMatchingRule(url: string, method: string, rules: MockRule[]): MockRule | undefined {
  return rules.find(
    (rule) =>
      rule.enabled && matchURL(url, rule.urlPattern, rule.matchType) && (rule.method === '' || rule.method === method)
  );
}
