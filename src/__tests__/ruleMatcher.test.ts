import { RuleMatcher } from '../ruleMatcher';
import { MockRule } from '../types';

describe('RuleMatcher', () => {
  let matcher: RuleMatcher;

  beforeEach(() => {
    matcher = new RuleMatcher();
  });

  describe('matchURL', () => {
    describe('exact matching', () => {
      it('should match exact URLs', () => {
        expect(matcher.matchURL('https://api.example.com/users', 'https://api.example.com/users', 'exact')).toBe(true);
      });

      it('should not match different URLs', () => {
        expect(matcher.matchURL('https://api.example.com/users', 'https://api.example.com/posts', 'exact')).toBe(false);
      });

      it('should be case-sensitive', () => {
        expect(matcher.matchURL('https://api.example.com/Users', 'https://api.example.com/users', 'exact')).toBe(false);
      });
    });

    describe('wildcard matching', () => {
      it('should match URLs with wildcards', () => {
        expect(
          matcher.matchURL('https://api.example.com/users/123', 'https://api.example.com/users/*', 'wildcard')
        ).toBe(true);
        expect(matcher.matchURL('https://api.example.com/users', 'https://api.example.com/*', 'wildcard')).toBe(true);
        expect(matcher.matchURL('https://api.example.com/v1/users', 'https://*/users', 'wildcard')).toBe(true);
      });

      it('should match multiple wildcards', () => {
        expect(matcher.matchURL('https://api.example.com/v1/users/123', '*/v*/users/*', 'wildcard')).toBe(true);
      });

      it('should not match when pattern does not match', () => {
        expect(matcher.matchURL('https://api.example.com/posts', 'https://api.example.com/users/*', 'wildcard')).toBe(
          false
        );
      });
    });

    describe('regex matching', () => {
      it('should match URLs with regex patterns', () => {
        expect(
          matcher.matchURL('https://api.example.com/users/123', 'https://api\\.example\\.com/users/\\d+', 'regex')
        ).toBe(true);
        expect(matcher.matchURL('https://api.example.com/users', 'https://.*\\.example\\.com/.*', 'regex')).toBe(true);
      });

      it('should handle complex regex patterns', () => {
        expect(matcher.matchURL('https://api.example.com/v1/users', 'https://.*/(v\\d+)/users', 'regex')).toBe(true);
      });

      it('should not match when regex does not match', () => {
        expect(
          matcher.matchURL('https://api.example.com/users/abc', 'https://api\\.example\\.com/users/\\d+', 'regex')
        ).toBe(false);
      });

      it('should handle invalid regex gracefully', () => {
        expect(matcher.matchURL('https://api.example.com', '[invalid', 'regex')).toBe(false);
      });
    });
  });

  describe('findMatchingRule', () => {
    const rules: MockRule[] = [
      {
        id: '1',
        name: 'Test Rule 1',
        enabled: true,
        urlPattern: 'https://api.example.com/users/*',
        matchType: 'wildcard',
        method: 'GET',
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      },
      {
        id: '2',
        name: 'Test Rule 2',
        enabled: true,
        urlPattern: 'https://api.example.com/posts',
        matchType: 'exact',
        method: '',
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      },
      {
        id: '3',
        name: 'Disabled Rule',
        enabled: false,
        urlPattern: 'https://api.example.com/disabled',
        matchType: 'exact',
        method: '',
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      },
    ];

    it('should find matching rule with wildcard', () => {
      const result = matcher.findMatchingRule('https://api.example.com/users/123', 'GET', rules);
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should find matching rule with exact match', () => {
      const result = matcher.findMatchingRule('https://api.example.com/posts', 'POST', rules);
      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
    });

    it('should not match disabled rules', () => {
      const result = matcher.findMatchingRule('https://api.example.com/disabled', 'GET', rules);
      expect(result).toBeUndefined();
    });

    it('should match any method when rule method is empty', () => {
      const result = matcher.findMatchingRule('https://api.example.com/posts', 'DELETE', rules);
      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
    });

    it('should not match when method differs', () => {
      const result = matcher.findMatchingRule('https://api.example.com/users/123', 'POST', rules);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no rule matches', () => {
      const result = matcher.findMatchingRule('https://api.example.com/nomatch', 'GET', rules);
      expect(result).toBeUndefined();
    });
  });

  describe('findAllMatchingRules', () => {
    const rules: MockRule[] = [
      {
        id: '1',
        name: 'Rule 1',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: 'wildcard',
        method: '',
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      },
      {
        id: '2',
        name: 'Rule 2',
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
      },
    ];

    it('should find all matching rules', () => {
      const results = matcher.findAllMatchingRules('https://api.example.com/users', 'GET', rules);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toContain('1');
      expect(results.map((r) => r.id)).toContain('2');
    });

    it('should return empty array when no rules match', () => {
      const results = matcher.findAllMatchingRules('https://other.com', 'GET', rules);
      expect(results).toHaveLength(0);
    });
  });
});
