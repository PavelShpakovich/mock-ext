import { MockRule } from '../types';
import { MatchType, HttpMethod, ValidationWarningType, ValidationSeverity } from '../enums';
import {
  validateRegexPattern,
  validateJSON,
  validateJSONDetailed,
  validateRuleForm,
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
    matchType: MatchType.Wildcard,
    method: HttpMethod.Any,
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
        matchType: MatchType.Exact,
      });
      const rule2 = createMockRule({
        id: '2',
        urlPattern: 'https://api.example.com/users',
        matchType: MatchType.Exact,
      });

      const overlapping = findOverlappingRules(rule1, [rule1, rule2]);
      expect(overlapping).toHaveLength(1);
      expect(overlapping[0].id).toBe('2');
    });

    it('should not flag overlapping rules with different methods', () => {
      const rule1 = createMockRule({ id: '1', method: HttpMethod.GET });
      const rule2 = createMockRule({ id: '2', method: HttpMethod.POST });

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
        matchType: MatchType.Regex,
        urlPattern: '[invalid',
      });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe(ValidationWarningType.InvalidRegex);
      expect(warnings[0].severity).toBe(ValidationSeverity.Error);
      expect(warnings[0].messageKey).toBe('warnings.invalidRegex');
    });

    it('should detect invalid JSON response', () => {
      const rule = createMockRule({
        contentType: 'application/json',
        response: '{invalid json}',
      });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe(ValidationWarningType.InvalidJson);
      expect(warnings[0].severity).toBe(ValidationSeverity.Error);
      expect(warnings[0].messageKey).toBe('warnings.invalidJson');
    });

    it('should detect unused rules', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000;
      const rule = createMockRule({ lastMatched: oldDate });

      const warnings = validateRule(rule, [rule]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe(ValidationWarningType.Unused);
      expect(warnings[0].severity).toBe(ValidationSeverity.Info);
      expect(warnings[0].messageKey).toBe('warnings.unusedRule');
    });

    it('should detect overlapping rules', () => {
      const rule1 = createMockRule({ id: '1' });
      const rule2 = createMockRule({ id: '2' });

      const warnings = validateRule(rule1, [rule1, rule2]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe(ValidationWarningType.Overlapping);
      expect(warnings[0].severity).toBe(ValidationSeverity.Warning);
      expect(warnings[0].messageKey).toBe('warnings.overlappingRules');
      expect(warnings[0].messageParams).toEqual({ count: 1 });
      expect(warnings[0].relatedRuleIds).toEqual(['2']);
    });

    it('should return multiple warnings for multiple issues', () => {
      const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000;
      const rule1 = createMockRule({
        id: '1',
        matchType: MatchType.Regex,
        urlPattern: '[invalid',
        lastMatched: oldDate,
      });
      const rule2 = createMockRule({ id: '2' });

      const warnings = validateRule(rule1, [rule1, rule2]);
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings.some((w) => w.type === ValidationWarningType.InvalidRegex)).toBe(true);
      expect(warnings.some((w) => w.type === ValidationWarningType.Unused)).toBe(true);
    });
  });

  describe('validateAllRules', () => {
    it('should validate all rules and return warnings map', () => {
      const rule1 = createMockRule({
        id: '1',
        matchType: MatchType.Regex,
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

  describe('validateJSONDetailed', () => {
    it('should validate correct JSON with success message', () => {
      const result = validateJSONDetailed('{"name": "test", "value": 123}');

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Valid JSON');
    });

    it('should accept empty string', () => {
      const result = validateJSONDetailed('');

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Empty JSON');
    });

    it('should accept whitespace-only string', () => {
      const result = validateJSONDetailed('   ');

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Empty JSON');
    });

    it('should reject invalid JSON with error message', () => {
      const result = validateJSONDetailed('{"name": "test"');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });

    it('should reject JSON with trailing comma', () => {
      const result = validateJSONDetailed('{"name": "test",}');

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });

    it('should accept JSON array', () => {
      const result = validateJSONDetailed('[1, 2, 3]');

      expect(result.isValid).toBe(true);
    });

    it('should accept JSON with nested objects', () => {
      const result = validateJSONDetailed('{"user": {"name": "test", "age": 30}}');

      expect(result.isValid).toBe(true);
    });

    it('should accept primitive JSON values', () => {
      expect(validateJSONDetailed('true').isValid).toBe(true);
      expect(validateJSONDetailed('false').isValid).toBe(true);
      expect(validateJSONDetailed('null').isValid).toBe(true);
      expect(validateJSONDetailed('123').isValid).toBe(true);
      expect(validateJSONDetailed('"string"').isValid).toBe(true);
    });
  });

  describe('validateRuleForm', () => {
    const createValidFormData = () => ({
      name: 'Test Rule',
      urlPattern: 'https://api.example.com/*',
      matchType: 'wildcard',
      method: 'GET',
      statusCode: 200,
      contentType: 'application/json',
      responseBody: '{"message": "success"}',
      delay: 0,
      headers: [{ key: 'X-Custom', value: 'value' }],
    });

    const mockT = (key: string, params?: Record<string, string>) => {
      if (params) {
        return `${key}: ${params.error || ''}`;
      }
      return key;
    };

    it('should validate correct form data', () => {
      const formData = createValidFormData();
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = validateRuleForm(formData, jsonValidation, mockT);

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should require rule name', async () => {
      const formData = createValidFormData();
      formData.name = '';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.name).toBeDefined();
      expect(errors.name).toBe('validation.nameRequired');
    });

    it('should require non-whitespace rule name', async () => {
      const formData = createValidFormData();
      formData.name = '   ';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.name).toBeDefined();
    });

    it('should require URL pattern', async () => {
      const formData = createValidFormData();
      formData.urlPattern = '';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.urlPattern).toBeDefined();
      expect(errors.urlPattern).toBe('validation.urlPatternRequired');
    });

    it('should require non-whitespace URL pattern', async () => {
      const formData = createValidFormData();
      formData.urlPattern = '   ';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.urlPattern).toBeDefined();
    });

    it('should validate regex URL patterns', async () => {
      const formData = createValidFormData();
      formData.matchType = 'regex';
      formData.urlPattern = '[invalid(regex';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.urlPattern).toBeDefined();
      expect(errors.urlPattern).toBe('validation.invalidRegexPattern');
    });

    it('should accept valid regex patterns', async () => {
      const formData = createValidFormData();
      formData.matchType = 'regex';
      formData.urlPattern = 'https://api\\.example\\.com/.*';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.urlPattern).toBeUndefined();
    });

    it('should validate JSON response body', async () => {
      const formData = createValidFormData();
      formData.contentType = 'application/json';
      formData.responseBody = '{"invalid": json}';
      const jsonValidation = { isValid: false, message: 'Invalid JSON' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(Object.keys(errors)).toHaveLength(0); // Early return on invalid JSON
    });

    it('should accept empty response body', async () => {
      const formData = createValidFormData();
      formData.responseBody = '';
      const jsonValidation = null;

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.responseBody).toBeUndefined();
    });

    it('should skip JSON validation for non-JSON content types', async () => {
      const formData = createValidFormData();
      formData.contentType = 'text/plain';
      formData.responseBody = 'not json at all';
      const jsonValidation = null;

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.responseBody).toBeUndefined();
    });

    it('should return multiple errors', async () => {
      const formData = createValidFormData();
      formData.name = '';
      formData.urlPattern = '';
      const jsonValidation = { isValid: true, message: 'Valid' };

      const errors = await validateRuleForm(formData, jsonValidation, mockT);

      expect(errors.name).toBeDefined();
      expect(errors.urlPattern).toBeDefined();
    });
  });
});
