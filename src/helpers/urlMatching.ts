import { MatchType, MockRule } from '../types';
import { escapeRegExp } from './string';

const MAX_REGEX_CACHE_ENTRIES = 1000;
const regexCache = new Map<string, RegExp | null>();

function getCachedRegex(type: 'regex' | 'wildcard', pattern: string): RegExp | null {
  const key = `${type}:${pattern}`;
  if (regexCache.has(key)) return regexCache.get(key) ?? null;

  try {
    const regex =
      type === 'regex' ? new RegExp(pattern) : new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$');
    if (regexCache.size >= MAX_REGEX_CACHE_ENTRIES) regexCache.clear();
    regexCache.set(key, regex);
    return regex;
  } catch {
    if (regexCache.size >= MAX_REGEX_CACHE_ENTRIES) regexCache.clear();
    regexCache.set(key, null);
    console.error(`Invalid ${type} pattern:`, pattern);
    return null;
  }
}

export function clearURLMatchCache(): void {
  regexCache.clear();
}

export function filterRulesForUrlOrigin<T extends { urlPattern: string; matchType: MatchType }>(
  rules: T[],
  pageUrl: string
): T[] {
  let pageOrigin: string;
  try {
    const page = new URL(pageUrl);
    if (page.protocol !== 'http:' && page.protocol !== 'https:') return [];
    pageOrigin = page.origin;
  } catch {
    return [];
  }

  return rules.filter((rule) => {
    if (rule.matchType === 'regex') return true;

    try {
      const pattern = rule.matchType === 'exact' ? rule.urlPattern.split('?')[0] : rule.urlPattern;
      const schemeEnd = pattern.indexOf('://');
      if (schemeEnd < 0) return true;
      const authorityStart = schemeEnd + 3;
      const authorityEnd = pattern.slice(authorityStart).search(/[/?#*]/);
      if (authorityEnd < 0 && pattern.slice(authorityStart).includes('*')) return true;
      const authority = pattern.slice(authorityStart, authorityEnd < 0 ? undefined : authorityStart + authorityEnd);
      if (!authority || authority.includes('*')) return true;
      return new URL(`${pattern.slice(0, schemeEnd)}://${authority}`).origin === pageOrigin;
    } catch {
      return true;
    }
  });
}

/**
 * Matches a URL against a pattern using the specified match type
 */
export function matchURL(url: string, pattern: string, type: MatchType | 'exact' | 'wildcard' | 'regex'): boolean {
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

      return getCachedRegex('wildcard', pattern)?.test(urlToMatch) ?? false;
    }
    case 'regex':
      return getCachedRegex('regex', pattern)?.test(url) ?? false;
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
