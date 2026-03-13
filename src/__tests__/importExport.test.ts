import {
  exportRulesToJSON,
  generateExportFilename,
  validateImportedRules,
  validateImportedData,
  mergeRules,
  mergeFolders,
  calculateImportStats,
  calculateReplaceStats,
  calculateAllImportStats,
  getNewAndDuplicateRules,
} from '../helpers/importExport';
import { MockRule, Folder } from '../types';
import { MatchType, HttpMethod } from '../enums';

describe('Import/Export Helpers', () => {
  const createMockRule = (id: string, name: string, folderId?: string): MockRule => ({
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
    ...(folderId ? { folderId } : {}),
  });

  const createFolder = (id: string, name: string, parentFolderId?: string): Folder => ({
    id,
    name,
    collapsed: false,
    created: Date.now(),
    ...(parentFolderId ? { parentFolderId } : {}),
  });

  describe('exportRulesToJSON', () => {
    it('should export all rules in v2 wrapper format', () => {
      const rules: MockRule[] = [createMockRule('1', 'rule1'), createMockRule('2', 'rule2')];

      const result = exportRulesToJSON(rules);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe(2);
      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0].id).toBe('1');
      expect(parsed.rules[1].id).toBe('2');
      expect(parsed.folders).toEqual([]);
    });

    it('should export only selected rules', () => {
      const rules: MockRule[] = [
        createMockRule('1', 'rule1'),
        createMockRule('2', 'rule2'),
        createMockRule('3', 'rule3'),
      ];

      const result = exportRulesToJSON(rules, ['1', '3']);
      const parsed = JSON.parse(result);

      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0].id).toBe('1');
      expect(parsed.rules[1].id).toBe('3');
    });

    it('should include referenced folders in export', () => {
      const folder = createFolder('f1', 'Folder 1');
      const rules: MockRule[] = [createMockRule('1', 'rule1', 'f1'), createMockRule('2', 'rule2')];

      const result = exportRulesToJSON(rules, undefined, [folder]);
      const parsed = JSON.parse(result);

      expect(parsed.folders).toHaveLength(1);
      expect(parsed.folders[0].id).toBe('f1');
    });

    it('should include ancestor folders for nested folders', () => {
      const parent = createFolder('parent', 'Parent');
      const child = createFolder('child', 'Child', 'parent');
      const rules: MockRule[] = [createMockRule('1', 'rule1', 'child')];

      const result = exportRulesToJSON(rules, undefined, [parent, child]);
      const parsed = JSON.parse(result);

      expect(parsed.folders).toHaveLength(2);
      const ids = parsed.folders.map((f: Folder) => f.id);
      expect(ids).toContain('parent');
      expect(ids).toContain('child');
    });

    it('should not include unreferenced folders', () => {
      const folder = createFolder('f1', 'Folder 1');
      const unrelated = createFolder('f2', 'Folder 2');
      const rules: MockRule[] = [createMockRule('1', 'rule1', 'f1')];

      const result = exportRulesToJSON(rules, undefined, [folder, unrelated]);
      const parsed = JSON.parse(result);

      expect(parsed.folders).toHaveLength(1);
      expect(parsed.folders[0].id).toBe('f1');
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

  describe('validateImportedData', () => {
    it('should accept legacy v1 format (plain array) and strip folderId', () => {
      const data = [createMockRule('1', 'rule1', 'folder-xyz')];

      const result = validateImportedData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.parsed.rules).toHaveLength(1);
        expect(result.parsed.rules[0].folderId).toBeUndefined();
        expect(result.parsed.folders).toEqual([]);
      }
    });

    it('should accept v1 rules without folderId unchanged', () => {
      const data = [createMockRule('1', 'rule1')];

      const result = validateImportedData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.parsed.rules[0].id).toBe('1');
        expect(result.parsed.folders).toEqual([]);
      }
    });

    it('should accept v2 format with rules and folders', () => {
      const folder = createFolder('f1', 'My Folder');
      const data = {
        version: 2,
        rules: [createMockRule('1', 'rule1', 'f1')],
        folders: [folder],
      };

      const result = validateImportedData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.parsed.rules).toHaveLength(1);
        expect(result.parsed.rules[0].folderId).toBe('f1');
        expect(result.parsed.folders).toHaveLength(1);
        expect(result.parsed.folders[0].id).toBe('f1');
      }
    });

    it('should accept v2 format with empty folders array', () => {
      const data = { version: 2, rules: [createMockRule('1', 'rule1')], folders: [] };

      const result = validateImportedData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.parsed.folders).toEqual([]);
      }
    });

    it('should accept v2 format without folders key', () => {
      const data = { version: 2, rules: [createMockRule('1', 'rule1')] };

      const result = validateImportedData(data);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.parsed.folders).toEqual([]);
      }
    });

    it('should reject non-array non-object data', () => {
      const result = validateImportedData('not valid');

      expect(result.valid).toBe(false);
    });

    it('should reject v1 array with missing required rule fields', () => {
      const data = [{ id: '1', name: 'rule1' }]; // missing urlPattern, method, statusCode

      const result = validateImportedData(data);

      expect(result.valid).toBe(false);
    });

    it('should reject v2 with non-array rules', () => {
      const data = { version: 2, rules: 'not-an-array' };

      const result = validateImportedData(data);

      expect(result.valid).toBe(false);
    });

    it('should reject v2 with malformed folders', () => {
      const data = {
        version: 2,
        rules: [createMockRule('1', 'rule1')],
        folders: [{ missingId: true }],
      };

      const result = validateImportedData(data);

      expect(result.valid).toBe(false);
    });
  });

  describe('mergeFolders', () => {
    it('should add new folders to existing ones', () => {
      const existing: Folder[] = [createFolder('f1', 'Folder 1')];
      const imported: Folder[] = [createFolder('f2', 'Folder 2')];

      const result = mergeFolders(existing, imported);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f1');
      expect(result[1].id).toBe('f2');
    });

    it('should skip folders with duplicate IDs', () => {
      const existing: Folder[] = [createFolder('f1', 'Folder 1')];
      const imported: Folder[] = [createFolder('f1', 'Folder 1 Updated'), createFolder('f2', 'Folder 2')];

      const result = mergeFolders(existing, imported);

      expect(result).toHaveLength(2);
      expect(result.find((f) => f.id === 'f1')?.name).toBe('Folder 1');
    });

    it('should return existing folders unchanged when nothing new is imported', () => {
      const existing: Folder[] = [createFolder('f1', 'Folder 1')];
      const imported: Folder[] = [createFolder('f1', 'Folder 1')];

      const result = mergeFolders(existing, imported);

      expect(result).toHaveLength(1);
    });

    it('should preserve nested folder structure', () => {
      const existing: Folder[] = [];
      const parent = createFolder('parent', 'Parent');
      const child = createFolder('child', 'Child', 'parent');

      const result = mergeFolders(existing, [parent, child]);

      expect(result).toHaveLength(2);
      expect(result.find((f) => f.id === 'child')?.parentFolderId).toBe('parent');
    });
  });
});
