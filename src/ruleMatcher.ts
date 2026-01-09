import { MockRule, MatchType } from './types';
import { escapeRegExp } from './utils';

export class RuleMatcher {
  matchURL(url: string, pattern: string, type: MatchType): boolean {
    switch (type) {
      case 'exact':
        return url === pattern;
      case 'wildcard':
        return this.wildcardMatch(url, pattern);
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

  private wildcardMatch(str: string, pattern: string): boolean {
    const regexPattern = pattern
      .split('*')
      .map((part) => escapeRegExp(part))
      .join('.*');

    try {
      return new RegExp('^' + regexPattern + '$').test(str);
    } catch {
      return false;
    }
  }

  findMatchingRule(url: string, method: string, rules: MockRule[]): MockRule | undefined {
    return rules.find(
      (rule) =>
        rule.enabled &&
        this.matchURL(url, rule.urlPattern, rule.matchType) &&
        (rule.method === '' || rule.method === method)
    );
  }

  findAllMatchingRules(url: string, method: string, rules: MockRule[]): MockRule[] {
    return rules.filter(
      (rule) =>
        rule.enabled &&
        this.matchURL(url, rule.urlPattern, rule.matchType) &&
        (rule.method === '' || rule.method === method)
    );
  }

  convertToURLFilter(pattern: string, matchType: MatchType): string {
    if (matchType === 'exact') {
      return pattern;
    }

    if (matchType === 'wildcard') {
      return pattern;
    }

    return pattern;
  }
}
