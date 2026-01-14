import { MockRule } from '../types';
import { findMatchingRule, matchURL } from '../helpers/urlMatching';

describe('URL Matching Logic', () => {
  describe('matchURL', () => {
    describe('exact match', () => {
      it('should match exact URLs', () => {
        expect(matchURL('https://api.example.com/users', 'https://api.example.com/users', 'exact')).toBe(true);
      });

      it('should not match different URLs', () => {
        expect(matchURL('https://api.example.com/users/1', 'https://api.example.com/users', 'exact')).toBe(false);
        expect(matchURL('https://api.example.com/users', 'https://api.example.com/posts', 'exact')).toBe(false);
      });

      it('should be case-sensitive', () => {
        expect(matchURL('https://api.example.com/Users', 'https://api.example.com/users', 'exact')).toBe(false);
      });
    });

    describe('wildcard match', () => {
      it('should match URLs with single wildcard', () => {
        expect(matchURL('https://api.example.com/users/123', 'https://api.example.com/users/*', 'wildcard')).toBe(true);
        expect(matchURL('https://api.example.com/users/456', 'https://api.example.com/users/*', 'wildcard')).toBe(true);
      });

      it('should match URLs with multiple wildcards', () => {
        expect(
          matchURL('https://api.example.com/users/123/posts/456', 'https://api.example.com/*/posts/*', 'wildcard')
        ).toBe(true);
      });

      it('should match with wildcard at beginning', () => {
        expect(matchURL('https://api.example.com/users', '*/users', 'wildcard')).toBe(true);
        expect(matchURL('http://api.example.com/users', '*/users', 'wildcard')).toBe(true);
      });

      it('should match with wildcard at end', () => {
        expect(
          matchURL('https://api.example.com/users/123/details', 'https://api.example.com/users/*', 'wildcard')
        ).toBe(true);
      });

      it('should not match if pattern does not match', () => {
        expect(matchURL('https://api.example.com/posts/123', 'https://api.example.com/users/*', 'wildcard')).toBe(
          false
        );
      });

      it('should escape special regex characters in pattern', () => {
        expect(matchURL('https://api.example.com/users?id=123', 'https://api.example.com/users?id=*', 'wildcard')).toBe(
          true
        );
        expect(matchURL('https://api.example.com/users.json', 'https://api.example.com/users.json', 'wildcard')).toBe(
          true
        );
      });

      it('should handle empty wildcard sections', () => {
        expect(matchURL('https://api.example.com/users', 'https://api.example.com/users*', 'wildcard')).toBe(true);
      });
    });

    describe('regex match', () => {
      it('should match URLs with valid regex patterns', () => {
        expect(matchURL('https://api.example.com/users/123', 'https://api.example.com/users/\\d+', 'regex')).toBe(true);
        expect(matchURL('https://api.example.com/users/abc', 'https://api.example.com/users/[a-z]+', 'regex')).toBe(
          true
        );
      });

      it('should not match when regex does not match', () => {
        expect(matchURL('https://api.example.com/users/abc', 'https://api.example.com/users/\\d+', 'regex')).toBe(
          false
        );
      });

      it('should handle complex regex patterns', () => {
        expect(
          matchURL(
            'https://api.example.com/users/123/posts/456',
            'https://api.example.com/users/\\d+/posts/\\d+',
            'regex'
          )
        ).toBe(true);
      });

      it('should handle partial matches with regex', () => {
        expect(matchURL('https://api.example.com/users/123', '/users/\\d+', 'regex')).toBe(true);
      });

      it('should return false for invalid regex patterns', () => {
        expect(matchURL('https://api.example.com/users', 'https://api.example.com/users/[', 'regex')).toBe(false);
      });

      it('should handle anchored regex patterns', () => {
        expect(matchURL('https://api.example.com/users', '^https://api.example.com/users$', 'regex')).toBe(true);
        expect(matchURL('https://api.example.com/users/123', '^https://api.example.com/users$', 'regex')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle empty strings', () => {
        expect(matchURL('', '', 'exact')).toBe(true);
        expect(matchURL('', 'https://example.com', 'exact')).toBe(false);
      });

      it('should handle special characters in URLs', () => {
        expect(
          matchURL(
            'https://api.example.com/search?q=test&page=1',
            'https://api.example.com/search?q=test&page=1',
            'exact'
          )
        ).toBe(true);
        expect(matchURL('https://api.example.com/search?q=*', 'https://api.example.com/search?q=*', 'wildcard')).toBe(
          true
        );
      });
    });
  });

  describe('findMatchingRule', () => {
    const createRule = (overrides: Partial<MockRule> = {}): MockRule => ({
      id: '1',
      name: 'Test Rule',
      enabled: true,
      urlPattern: 'https://api.example.com/users',
      matchType: 'exact',
      method: 'GET',
      statusCode: 200,
      response: {},
      contentType: 'application/json',
      delay: 0,
      created: Date.now(),
      modified: Date.now(),
      ...overrides,
    });

    it('should find exact matching rule', () => {
      const rules = [createRule()];
      const result = findMatchingRule('https://api.example.com/users', 'GET', rules);

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should not match disabled rules', () => {
      const rules = [createRule({ enabled: false })];
      const result = findMatchingRule('https://api.example.com/users', 'GET', rules);

      expect(result).toBeUndefined();
    });

    it('should match rule with empty method (any method)', () => {
      const rules = [createRule({ method: '' })];

      expect(findMatchingRule('https://api.example.com/users', 'GET', rules)).toBeDefined();
      expect(findMatchingRule('https://api.example.com/users', 'POST', rules)).toBeDefined();
      expect(findMatchingRule('https://api.example.com/users', 'DELETE', rules)).toBeDefined();
    });

    it('should match specific HTTP method', () => {
      const rules = [createRule({ method: 'POST' })];

      expect(findMatchingRule('https://api.example.com/users', 'POST', rules)).toBeDefined();
      expect(findMatchingRule('https://api.example.com/users', 'GET', rules)).toBeUndefined();
    });

    it('should return first matching rule when multiple match', () => {
      const rules = [
        createRule({ id: '1', urlPattern: 'https://api.example.com/*', matchType: 'wildcard' }),
        createRule({ id: '2', urlPattern: 'https://api.example.com/users', matchType: 'exact' }),
      ];

      const result = findMatchingRule('https://api.example.com/users', 'GET', rules);

      expect(result?.id).toBe('1');
    });

    it('should skip disabled rules and find next matching', () => {
      const rules = [
        createRule({ id: '1', enabled: false }),
        createRule({ id: '2', urlPattern: 'https://api.example.com/*', matchType: 'wildcard' }),
      ];

      const result = findMatchingRule('https://api.example.com/users', 'GET', rules);

      expect(result?.id).toBe('2');
    });

    it('should handle wildcard URL patterns', () => {
      const rules = [createRule({ urlPattern: 'https://api.example.com/users/*', matchType: 'wildcard' })];

      expect(findMatchingRule('https://api.example.com/users/123', 'GET', rules)).toBeDefined();
      expect(findMatchingRule('https://api.example.com/posts/123', 'GET', rules)).toBeUndefined();
    });

    it('should handle regex URL patterns', () => {
      const rules = [createRule({ urlPattern: 'https://api.example.com/users/\\d+', matchType: 'regex' })];

      expect(findMatchingRule('https://api.example.com/users/123', 'GET', rules)).toBeDefined();
      expect(findMatchingRule('https://api.example.com/users/abc', 'GET', rules)).toBeUndefined();
    });

    it('should return undefined when no rules match', () => {
      const rules = [createRule()];
      const result = findMatchingRule('https://different.com/api', 'GET', rules);

      expect(result).toBeUndefined();
    });

    it('should handle empty rules array', () => {
      const result = findMatchingRule('https://api.example.com/users', 'GET', []);

      expect(result).toBeUndefined();
    });

    it('should match with different HTTP methods', () => {
      const rules = [
        createRule({ id: '1', method: 'GET' }),
        createRule({ id: '2', method: 'POST' }),
        createRule({ id: '3', method: 'PUT' }),
      ];

      expect(findMatchingRule('https://api.example.com/users', 'GET', rules)?.id).toBe('1');
      expect(findMatchingRule('https://api.example.com/users', 'POST', rules)?.id).toBe('2');
      expect(findMatchingRule('https://api.example.com/users', 'PUT', rules)?.id).toBe('3');
      expect(findMatchingRule('https://api.example.com/users', 'DELETE', rules)).toBeUndefined();
    });
  });
});
