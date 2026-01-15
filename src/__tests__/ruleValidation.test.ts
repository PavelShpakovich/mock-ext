import { MockRule } from '../types';
import {
  validateRegexPattern,
  validateJSON,
  isRuleUnused,
  findOverlappingRules,
  validateRule,
  validateAllRules,
} from '../helpers/ruleValidation';

describe('Rule Validation', () => {
  const createMockRule = (overrides?: Partial<MockRule>): MockRule => ({
    id: '1',
    name: 'Test Rule',
    urlPattern: 'https://api.example.com/*',
    matchType: 'wildcard',
    method: '',
    response: '{"success": true}',
    enabled: true,
    statusCode: 200,
    contentType: 'application/json',
    delay: 0,
    created: Date.now(),
    modified: Date.now(),
    matchCount: 0,
    ...overrides,
  });

  describe('validateRegexPattern', () => {
    it('should validate correct regex patterns', () => {
      expect(validateRegexPattern('https://api\\.example\\.com/users/\\d+')).toBe(true);
      expect(validateRegexPattern('.*')).toBe(true);
      expect(validateRegexPattern('[a-z]+')).toBe(true);
    });

    it('should reject invalid regex patterns', () => {
      expect(validateRegexPattern('[')).toBe(false);
      expect(validateRegexPattern('(?invalid')).toBe(false);
      expect(validateRegexPattern('*')).toBe(false);
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON', () => {
      expect(validateJSON('{"key": "value"}')).toBe(true);
      expect(validateJSON('[]')).toBe(true);
      expect(validateJSON('{"nested": {"key": 123}}')).toBe(true);
    });

    it('should accept empty strings', () => {
      expect(validateJSON('')).toBe(true);
      expect(validateJSON('   ')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(validateJSON('{"key": value}')).toBe(false);
      expect(validateJSON('{invalid}')).toBe(false);
      expect(validateJSON('undefined')).toBe(false);
    });
  });

  describe('isRuleUnused', () => {
    it('should detect unused rules by lastMatched', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000; // 40 days ago
      const rule = createMockRule({ lastMatched: oldDate });
      expect(isRuleUnused(rule, 30)).toBe(true);
    });

    it('should not flag recently matched rules', () => {
      const recentDate = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const rule = createMockRule({ lastMatched: recentDate });
      expect(isRuleUnused(rule, 30)).toBe(false);
    });

    it('should detect unused rules by creation date when never matched', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000; // 40 days ago
      const rule = createMockRule({ created: oldDate, lastMatched: undefined });
      expect(isRuleUnused(rule, 30)).toBe(true);
    });

    it('should not flag recently created rules that were never matched', () => {
      const recentDate = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const rule = createMockRule({ created: recentDate, lastMatched: undefined });
      expect(isRuleUnused(rule, 30)).toBe(false);
    });
  });

  describe('findOverlappingRules', () => {
    it('should detect overlapping wildcard rules', () => {
      const rule1 = createMockRule({ id: '1', urlPattern: 'https://api.example.com/*' });
      const rule2 = createMockRule({ id: '2', urlPattern: 'https://api.example.com/users/*' });
      const rule3 = createMockRule({ id: '3', urlPattern: 'https://other.com/*' });

      const overlapping = findOverlappingRules(rule1, [rule1, rule2, rule3]);
      expect(overlapping).toHaveLength(1);
      expect(overlapping[0].id).toBe('2');
    });

    it('should detect overlapping exact match rules', () => {
      const rule1 = createMockRule({
        id: '1',
        urlPattern: 'https://api.example.com/users',
        matchType: 'exact',
      });
      const rule2 = createMockRule({
        id: '2',
        urlPattern: 'https://api.example.com/users',
        matchType: 'exact',
      });

      const overlapping = findOverlappingRules(rule1, [rule1, rule2]);
      expect(overlapping).toHaveLength(1);
      expect(overlapping[0].id).toBe('2');
    });

    it('should not flag overlapping rules with different methods', () => {
      const rule1 = createMockRule({ id: '1', method: 'GET' });
      const rule2 = createMockRule({ id: '2', method: 'POST' });

      const overlapping = findOverlappingRules(rule1, [rule1, rule2]);
      expect(overlapping).toHaveLength(0);
    });

    it('should ignore disabled rules', () => {
      const rule1 = createMockRule({ id: '1', enabled: true });
      const rule2 = createMockRule({ id: '2', enabled: false });

      const overlapping = findOverlappingRules(rule1, [rule1, rule2]);
      expect(overlapping).toHaveLength(0);
    });
  });

  describe('validateRule', () => {
    it('should detect invalid regex pattern', () => {
      const rule = createMockRule({
        matchType: 'regex',
        urlPattern: '[invalid',
      });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('invalidRegex');
      expect(warnings[0].severity).toBe('error');
      expect(warnings[0].messageKey).toBe('warnings.invalidRegex');
    });

    it('should detect invalid JSON response', () => {
      const rule = createMockRule({
        contentType: 'application/json',
        response: '{invalid json}',
      });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('invalidJson');
      expect(warnings[0].severity).toBe('error');
      expect(warnings[0].messageKey).toBe('warnings.invalidJson');
    });

    it('should detect unused rules', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000;
      const rule = createMockRule({ lastMatched: oldDate });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('unused');
      expect(warnings[0].severity).toBe('info');
      expect(warnings[0].messageKey).toBe('warnings.unusedRule');
    });

    it('should detect overlapping rules', () => {
      const rule1 = createMockRule({ id: '1' });
      const rule2 = createMockRule({ id: '2' });

      const warnings = validateRule(rule1, [rule1, rule2]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('overlapping');
      expect(warnings[0].severity).toBe('warning');
      expect(warnings[0].messageKey).toBe('warnings.overlappingRules');
      expect(warnings[0].messageParams).toEqual({ count: 1 });
      expect(warnings[0].relatedRuleIds).toEqual(['2']);
    });

    it('should return multiple warnings for multiple issues', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000;
      const rule1 = createMockRule({
        id: '1',
        matchType: 'regex',
        urlPattern: '[invalid',
        lastMatched: oldDate,
      });
      const rule2 = createMockRule({ id: '2' });

      const warnings = validateRule(rule1, [rule1, rule2]);
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings.some((w) => w.type === 'invalidRegex')).toBe(true);
      expect(warnings.some((w) => w.type === 'unused')).toBe(true);
    });
  });

  describe('validateAllRules', () => {
    it('should validate all rules and return warnings map', () => {
      const rule1 = createMockRule({
        id: '1',
        matchType: 'regex',
        urlPattern: '[invalid',
      });
      const rule2 = createMockRule({
        id: '2',
        urlPattern: 'https://other.com/*',
        response: '{invalid}',
      });
      const rule3 = createMockRule({
        id: '3',
        urlPattern: 'https://another.com/*',
      }); // Valid rule with different URL

      const warningsMap = validateAllRules([rule1, rule2, rule3]);

      expect(warningsMap.size).toBe(2);
      expect(warningsMap.has('1')).toBe(true);
      expect(warningsMap.has('2')).toBe(true);
      expect(warningsMap.has('3')).toBe(false);
    });

    it('should return empty map for all valid rules', () => {
      const rule1 = createMockRule({ id: '1' });
      const rule2 = createMockRule({ id: '2', urlPattern: 'https://other.com/*' });

      const warningsMap = validateAllRules([rule1, rule2]);
      expect(warningsMap.size).toBe(0);
    });
  });
});
