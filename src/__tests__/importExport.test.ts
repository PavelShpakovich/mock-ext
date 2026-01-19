import {
  exportRulesToJSON,
  generateExportFilename,
  validateImportedRules,
  mergeRules,
  calculateImportStats,
  calculateReplaceStats,
  calculateAllImportStats,
  getNewAndDuplicateRules,
} from '../helpers/importExport';
import { MockRule } from '../types';
import { MatchType, HttpMethod } from '../enums';

describe('Import/Export Helpers', () => {
  const createMockRule = (id: string, name: string): MockRule => ({
    id,
    name,
    enabled: true,
    urlPattern: `https://api.example.com/${name}`,
    matchType: MatchType.Wildcard,
    method: HttpMethod.GET,
    statusCode: 200,
    response: { message: 'test' },
    contentType: 'application/json',
    delay: 0,
    created: Date.now(),
    modified: Date.now(),
  });

  describe('exportRulesToJSON', () => {
    it('should export all rules when no selection provided', () => {
      const rules: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];

      const result = exportRulesToJSON(rules);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('1');
      expect(parsed[1].id).toBe('2');
    });

    it('should export only selected rules', () => {
      const rules: MockRule[] = [
        createMockRule('1', 'rule1'),
        createMockRule('2', 'rule2'),
        createMockRule('3', 'rule3'),
      ];

      const result = exportRulesToJSON(rules, ['1', '3']);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('1');
      expect(parsed[1].id).toBe('3');
    });

    it('should return pretty-printed JSON', () => {
      const rules: MockRule[] = [createMockRule('1', 'rule1')];

      const result = exportRulesToJSON(rules);

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  describe('generateExportFilename', () => {
    it('should generate filename with current date', () => {
      const filename = generateExportFilename();

      expect(filename).toMatch(/^moq-rules-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should include .json extension', () => {
      const filename = generateExportFilename();

      expect(filename.endsWith('.json')).toBe(true);
    });
  });

  describe('validateImportedRules', () => {
    it('should validate correct rule structure', () => {
      const data = [createMockRule('1', 'rule1')];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-array data', () => {
      const data = { id: '1', name: 'rule1' };

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid format - expected array');
    });

    it('should reject rules missing id', () => {
      const data = [
        {
          name: 'rule1',
          urlPattern: 'https://api.example.com',
          method: 'GET',
          statusCode: 200,
        },
      ];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject rules missing name', () => {
      const data = [
        {
          id: '1',
          urlPattern: 'https://api.example.com',
          method: 'GET',
          statusCode: 200,
        },
      ];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject rules missing urlPattern', () => {
      const data = [
        {
          id: '1',
          name: 'rule1',
          method: 'GET',
          statusCode: 200,
        },
      ];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject rules missing method', () => {
      const data = [
        {
          id: '1',
          name: 'rule1',
          urlPattern: 'https://api.example.com',
          statusCode: 200,
        },
      ];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject rules missing statusCode', () => {
      const data = [
        {
          id: '1',
          name: 'rule1',
          urlPattern: 'https://api.example.com',
          method: 'GET',
        },
      ];

      const result = validateImportedRules(data);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });
  });

  describe('mergeRules', () => {
    it('should add new rules to existing ones', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('3', 'rule3')];

      const result = mergeRules(existing, imported);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should skip rules with duplicate IDs', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('2', 'updated-rule2'), createMockRule('3', 'rule3')];

      const result = mergeRules(existing, imported);

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.id === '2')?.name).toBe('rule2');
    });

    it('should preserve original order', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1')];
      const imported: MockRule[] = [createMockRule('2', 'rule2')];

      const result = mergeRules(existing, imported);

      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('getNewAndDuplicateRules', () => {
    it('should identify new and duplicate rules', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [
        createMockRule('2', 'updated-rule2'),
        createMockRule('3', 'rule3'),
        createMockRule('4', 'rule4'),
      ];

      const result = getNewAndDuplicateRules(existing, imported);

      expect(result.newRules).toHaveLength(2);
      expect(result.newRules[0].id).toBe('3');
      expect(result.newRules[1].id).toBe('4');
      expect(result.duplicateRules).toHaveLength(1);
      expect(result.duplicateRules[0].id).toBe('2');
    });

    it('should handle all new rules', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1')];
      const imported: MockRule[] = [createMockRule('2', 'rule2'), createMockRule('3', 'rule3')];

      const result = getNewAndDuplicateRules(existing, imported);

      expect(result.newRules).toHaveLength(2);
      expect(result.duplicateRules).toHaveLength(0);
    });

    it('should handle all duplicate rules', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('1', 'updated1'), createMockRule('2', 'updated2')];

      const result = getNewAndDuplicateRules(existing, imported);

      expect(result.newRules).toHaveLength(0);
      expect(result.duplicateRules).toHaveLength(2);
    });
  });

  describe('calculateImportStats', () => {
    it('should calculate merge statistics correctly', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('2', 'updated2'), createMockRule('3', 'rule3')];

      const result = calculateImportStats(existing, imported);

      expect(result.total).toBe(3);
      expect(result.new).toBe(1);
      expect(result.duplicates).toBe(1);
    });

    it('should handle no duplicates', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1')];
      const imported: MockRule[] = [createMockRule('2', 'rule2')];

      const result = calculateImportStats(existing, imported);

      expect(result.total).toBe(2);
      expect(result.new).toBe(1);
      expect(result.duplicates).toBe(0);
    });
  });

  describe('calculateReplaceStats', () => {
    it('should calculate replace statistics correctly', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('3', 'rule3'), createMockRule('4', 'rule4')];

      const result = calculateReplaceStats(existing, imported);

      expect(result.total).toBe(2);
      expect(result.removed).toBe(2);
    });

    it('should handle empty existing rules', () => {
      const existing: MockRule[] = [];
      const imported: MockRule[] = [createMockRule('1', 'rule1')];

      const result = calculateReplaceStats(existing, imported);

      expect(result.total).toBe(1);
      expect(result.removed).toBe(0);
    });
  });

  describe('calculateAllImportStats', () => {
    it('should calculate both merge and replace statistics', () => {
      const existing: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];
      const imported: MockRule[] = [createMockRule('2', 'updated2'), createMockRule('3', 'rule3')];

      const result = calculateAllImportStats(existing, imported);

      expect(result.merge.total).toBe(3);
      expect(result.merge.new).toBe(1);
      expect(result.merge.duplicates).toBe(1);
      expect(result.replace.total).toBe(2);
      expect(result.replace.removed).toBe(2);
    });
  });
});
