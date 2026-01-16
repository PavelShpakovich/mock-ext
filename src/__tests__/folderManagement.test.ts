import {
  createFolder,
  renameFolder,
  toggleFolderCollapse,
  getRulesGroupedByFolder,
  getFolderById,
  moveRuleToFolder,
  deleteFolderAndUngroup,
  toggleFolderRules,
  getFolderRuleCounts,
  validateFolderName,
} from '../helpers/folderManagement';
import { Folder, MockRule } from '../types';
import { MatchType, HttpMethod } from '../enums';

describe('folderManagement', () => {
  describe('createFolder', () => {
    it('should create a new folder with given name', () => {
      const folder = createFolder('Test Folder');

      expect(folder.name).toBe('Test Folder');
      expect(folder.collapsed).toBe(false);
      expect(folder.id).toBeTruthy();
      expect(typeof folder.created).toBe('number');
    });
  });

  describe('renameFolder', () => {
    it('should rename an existing folder', () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Old Name',
        collapsed: false,
        created: Date.now(),
      };

      const renamed = renameFolder(folder, 'New Name');

      expect(renamed.name).toBe('New Name');
      expect(renamed.id).toBe(folder.id);
    });
  });

  describe('toggleFolderCollapse', () => {
    it('should toggle folder collapsed state', () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Test',
        collapsed: false,
        created: Date.now(),
      };

      const toggled1 = toggleFolderCollapse(folder);
      expect(toggled1.collapsed).toBe(true);

      const toggled2 = toggleFolderCollapse(toggled1);
      expect(toggled2.collapsed).toBe(false);
    });
  });

  describe('getRulesGroupedByFolder', () => {
    const mockRule1: MockRule = {
      id: 'rule-1',
      name: 'Rule 1',
      enabled: true,
      urlPattern: 'https://api.example.com/*',
      matchType: MatchType.Wildcard,
      method: HttpMethod.GET,
      statusCode: 200,
      response: {},
      contentType: 'application/json',
      delay: 0,
      created: Date.now(),
      modified: Date.now(),
      folderId: 'folder-1',
    };

    const mockRule2: MockRule = {
      ...mockRule1,
      id: 'rule-2',
      name: 'Rule 2',
      folderId: 'folder-1',
    };

    const mockRule3: MockRule = {
      ...mockRule1,
      id: 'rule-3',
      name: 'Rule 3',
      folderId: undefined,
    };

    const folders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', collapsed: false, created: Date.now() },
      { id: 'folder-2', name: 'Folder 2', collapsed: false, created: Date.now() },
    ];

    it('should group rules by folder', () => {
      const grouped = getRulesGroupedByFolder([mockRule1, mockRule2, mockRule3], folders);

      expect(grouped.get('folder-1')).toHaveLength(2);
      expect(grouped.get('folder-2')).toHaveLength(0);
      expect(grouped.get(undefined)).toHaveLength(1);
    });

    it('should handle empty rules array', () => {
      const grouped = getRulesGroupedByFolder([], folders);

      expect(grouped.get('folder-1')).toHaveLength(0);
      expect(grouped.get('folder-2')).toHaveLength(0);
      expect(grouped.get(undefined)).toHaveLength(0);
    });
  });

  describe('getFolderById', () => {
    const folders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', collapsed: false, created: Date.now() },
      { id: 'folder-2', name: 'Folder 2', collapsed: false, created: Date.now() },
    ];

    it('should find folder by id', () => {
      const folder = getFolderById(folders, 'folder-1');
      expect(folder?.name).toBe('Folder 1');
    });

    it('should return undefined for non-existent id', () => {
      const folder = getFolderById(folders, 'non-existent');
      expect(folder).toBeUndefined();
    });
  });

  describe('moveRuleToFolder', () => {
    const mockRule: MockRule = {
      id: 'rule-1',
      name: 'Rule 1',
      enabled: true,
      urlPattern: 'https://api.example.com/*',
      matchType: MatchType.Wildcard,
      method: HttpMethod.GET,
      statusCode: 200,
      response: {},
      contentType: 'application/json',
      delay: 0,
      created: Date.now(),
      modified: Date.now(),
    };

    it('should assign folderId to rule', () => {
      const moved = moveRuleToFolder(mockRule, 'folder-1');
      expect(moved.folderId).toBe('folder-1');
    });

    it('should set folderId to undefined for ungrouping', () => {
      const ruleWithFolder = { ...mockRule, folderId: 'folder-1' };
      const moved = moveRuleToFolder(ruleWithFolder, undefined);
      expect(moved.folderId).toBeUndefined();
    });

    it('should update modified timestamp', () => {
      const originalModified = mockRule.modified;
      const moved = moveRuleToFolder(mockRule, 'folder-1');
      expect(moved.modified).toBeGreaterThanOrEqual(originalModified);
    });
  });

  describe('deleteFolderAndUngroup', () => {
    const folders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', collapsed: false, created: Date.now() },
      { id: 'folder-2', name: 'Folder 2', collapsed: false, created: Date.now() },
    ];

    const rules: MockRule[] = [
      {
        id: 'rule-1',
        name: 'Rule 1',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-1',
      },
      {
        id: 'rule-2',
        name: 'Rule 2',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-2',
      },
    ];

    it('should remove folder and ungroup its rules', () => {
      const result = deleteFolderAndUngroup(folders, rules, 'folder-1');

      expect(result.folders).toHaveLength(1);
      expect(result.folders[0].id).toBe('folder-2');
      expect(result.rules[0].folderId).toBeUndefined();
      expect(result.rules[1].folderId).toBe('folder-2');
    });
  });

  describe('toggleFolderRules', () => {
    const rules: MockRule[] = [
      {
        id: 'rule-1',
        name: 'Rule 1',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-1',
      },
      {
        id: 'rule-2',
        name: 'Rule 2',
        enabled: false,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-1',
      },
      {
        id: 'rule-3',
        name: 'Rule 3',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-2',
      },
    ];

    it('should enable all rules in folder', () => {
      const updated = toggleFolderRules(rules, 'folder-1', true);
      expect(updated[0].enabled).toBe(true);
      expect(updated[1].enabled).toBe(true);
      expect(updated[2].enabled).toBe(true); // unchanged
    });

    it('should disable all rules in folder', () => {
      const updated = toggleFolderRules(rules, 'folder-1', false);
      expect(updated[0].enabled).toBe(false);
      expect(updated[1].enabled).toBe(false);
      expect(updated[2].enabled).toBe(true); // unchanged
    });
  });

  describe('getFolderRuleCounts', () => {
    const folders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', collapsed: false, created: Date.now() },
      { id: 'folder-2', name: 'Folder 2', collapsed: false, created: Date.now() },
    ];

    const rules: MockRule[] = [
      {
        id: 'rule-1',
        name: 'Rule 1',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-1',
      },
      {
        id: 'rule-2',
        name: 'Rule 2',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: 'folder-1',
      },
      {
        id: 'rule-3',
        name: 'Rule 3',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: {},
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
        folderId: undefined,
      },
    ];

    it('should count rules per folder', () => {
      const counts = getFolderRuleCounts(rules, folders);

      expect(counts.get('folder-1')).toBe(2);
      expect(counts.get('folder-2')).toBe(0);
      expect(counts.get(undefined)).toBe(1);
    });
  });

  describe('validateFolderName', () => {
    const existingFolders: Folder[] = [
      { id: 'folder-1', name: 'Existing Folder', collapsed: false, created: Date.now() },
    ];

    it('should return null for valid name', () => {
      const error = validateFolderName('New Folder', existingFolders);
      expect(error).toBeNull();
    });

    it('should reject empty name', () => {
      const error = validateFolderName('  ', existingFolders);
      expect(error).toBe('validation.folderNameEmpty');
    });

    it('should reject too long name', () => {
      const longName = 'a'.repeat(51);
      const error = validateFolderName(longName, existingFolders);
      expect(error).toBe('validation.folderNameTooLong');
    });

    it('should reject duplicate name', () => {
      const error = validateFolderName('Existing Folder', existingFolders);
      expect(error).toBe('validation.folderNameDuplicate');
    });

    it('should allow same name when editing same folder', () => {
      const error = validateFolderName('Existing Folder', existingFolders, 'folder-1');
      expect(error).toBeNull();
    });

    it('should be case-insensitive for duplicates', () => {
      const error = validateFolderName('EXISTING FOLDER', existingFolders);
      expect(error).toBe('validation.folderNameDuplicate');
    });
  });
});
