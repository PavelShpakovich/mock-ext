import { MatchType, MockRule } from '../types';
import { escapeRegExp } from './string';

/**
 * Matches a URL against a pattern using the specified match type
 * ⚠️ IMPORTANT: This logic is duplicated in src/interceptor.ts
 * If you modify this, also update interceptor.ts matchesPattern()
 */
export function matchURL(url: string, pattern: string, type: MatchType): boolean {
  switch (type) {
    case 'exact': {
      // For exact match, ignore query parameters
      const urlWithoutQuery = url.split('?')[0];
      const patternWithoutQuery = pattern.split('?')[0];
      return urlWithoutQuery === patternWithoutQuery;
    }
    case 'wildcard': {
      // For wildcard, ignore query parameters unless pattern includes them
      const urlToMatch = pattern.includes('?') ? url : url.split('?')[0];

      const regexPattern = pattern
        .split('*')
        .map((part) => escapeRegExp(part))
        .join('.*');
      try {
        return new RegExp('^' + regexPattern + '$').test(urlToMatch);
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
