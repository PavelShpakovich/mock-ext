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
  // New functions
  getFolderDepth,
  getFoldersInParentByOrder,
  getRulesInFolderByOrder,
  getFolderDescendantIds,
  isDescendantOfFolder,
  wouldCreateCircularNesting,
  buildFolderTree,
  assignOrder,
  reorderItems,
  moveRuleToFolderWithOrder,
  moveFolderToParent,
  deleteFolderRecursively,
  validateRuleDropTarget,
  validateFolderDropTarget,
  migrateFoldersAndRules,
} from '../helpers/folderManagement';
import { MAX_FOLDER_DEPTH } from '../constants';
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

    it('should move deleted folder rules to parent folder when parent exists', () => {
      const nestedFolders: Folder[] = [
        { id: 'parent', name: 'Parent', parentFolderId: undefined, collapsed: false, created: Date.now() },
        { id: 'child', name: 'Child', parentFolderId: 'parent', collapsed: false, created: Date.now() },
      ];

      const nestedRules: MockRule[] = [
        {
          id: 'rule-in-child',
          name: 'Rule in child',
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
          folderId: 'child',
        },
      ];

      const result = deleteFolderAndUngroup(nestedFolders, nestedRules, 'child');

      expect(result.folders).toHaveLength(1);
      expect(result.folders[0].id).toBe('parent');
      expect(result.rules[0].folderId).toBe('parent');
    });

    it('should reparent direct child folders to deleted folder parent', () => {
      const nestedFolders: Folder[] = [
        { id: 'root', name: 'Root', parentFolderId: undefined, collapsed: false, created: Date.now() },
        { id: 'to-delete', name: 'To Delete', parentFolderId: 'root', collapsed: false, created: Date.now() },
        { id: 'child-a', name: 'Child A', parentFolderId: 'to-delete', collapsed: false, created: Date.now() },
      ];

      const result = deleteFolderAndUngroup(nestedFolders, [], 'to-delete');

      expect(result.folders.find((f) => f.id === 'to-delete')).toBeUndefined();
      expect(result.folders.find((f) => f.id === 'child-a')?.parentFolderId).toBe('root');
    });

    it('should move child folders to root when deleting a root folder', () => {
      const nestedFolders: Folder[] = [
        { id: 'root-to-delete', name: 'Root Delete', parentFolderId: undefined, collapsed: false, created: Date.now() },
        {
          id: 'child-of-root',
          name: 'Child Of Root',
          parentFolderId: 'root-to-delete',
          collapsed: false,
          created: Date.now(),
        },
      ];

      const result = deleteFolderAndUngroup(nestedFolders, [], 'root-to-delete');

      expect(result.folders.find((f) => f.id === 'child-of-root')?.parentFolderId).toBeUndefined();
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
      { id: 'folder-1', name: 'Existing Folder', parentFolderId: undefined, collapsed: false, created: Date.now() },
      { id: 'folder-2', name: 'Another Folder', parentFolderId: 'parent-1', collapsed: false, created: Date.now() },
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

    it('should reject duplicate name even when folder is in a different parent', () => {
      const withDifferentParent: Folder[] = [
        { id: 'root-a', name: 'Same Name', parentFolderId: undefined, collapsed: false, created: Date.now() },
        { id: 'child-b', name: 'Other', parentFolderId: 'parent-1', collapsed: false, created: Date.now() },
      ];
      const error = validateFolderName('Same Name', withDifferentParent, 'child-b');
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

// ============================================================================
// New Functions Tests
// ============================================================================

// Shared fixtures
const makeFolder = (id: string, name: string, parentFolderId?: string, order?: number): import('../types').Folder => ({
  id,
  name,
  parentFolderId,
  collapsed: false,
  created: 1000,
  order,
});

const makeRule = (id: string, folderId?: string, order?: number): import('../types').MockRule => ({
  id,
  name: id,
  enabled: true,
  urlPattern: 'https://example.com/*',
  matchType: MatchType.Wildcard,
  method: HttpMethod.GET,
  statusCode: 200,
  response: {},
  contentType: 'application/json',
  delay: 0,
  created: 1000,
  modified: 1000,
  folderId,
  order,
});

describe('folderManagement — new functions', () => {
  // ─── createFolder (extended) ──────────────────────────────────────────────
  describe('createFolder', () => {
    it('creates a root-level folder when no parent is given', () => {
      const f = createFolder('Root');
      expect(f.parentFolderId).toBeUndefined();
      expect(f.order).toBeUndefined();
    });

    it('stores parentFolderId and order when provided', () => {
      const f = createFolder('Child', 'parent-1', 2000);
      expect(f.parentFolderId).toBe('parent-1');
      expect(f.order).toBe(2000);
    });
  });

  // ─── getFolderDepth ──────────────────────────────────────────────────────
  describe('getFolderDepth', () => {
    const folders = [
      makeFolder('root', 'Root'),
      makeFolder('child', 'Child', 'root'),
      makeFolder('grandchild', 'Grandchild', 'child'),
    ];

    it('returns 0 for root-level folder', () => {
      expect(getFolderDepth(folders, 'root')).toBe(0);
    });
    it('returns 1 for a direct child', () => {
      expect(getFolderDepth(folders, 'child')).toBe(1);
    });
    it('returns 2 for a grandchild', () => {
      expect(getFolderDepth(folders, 'grandchild')).toBe(2);
    });
  });

  // ─── getFoldersInParentByOrder ────────────────────────────────────────────
  describe('getFoldersInParentByOrder', () => {
    const folders = [
      makeFolder('a', 'A', undefined, 2000),
      makeFolder('b', 'B', undefined, 1000),
      makeFolder('c', 'C', 'a', 0),
    ];

    it('returns root-level folders sorted by order', () => {
      const result = getFoldersInParentByOrder(folders, undefined);
      expect(result.map((f) => f.id)).toEqual(['b', 'a']);
    });

    it('returns children of a specific folder', () => {
      const result = getFoldersInParentByOrder(folders, 'a');
      expect(result.map((f) => f.id)).toEqual(['c']);
    });

    it('returns empty array when folder has no children', () => {
      expect(getFoldersInParentByOrder(folders, 'b')).toHaveLength(0);
    });
  });

  // ─── getRulesInFolderByOrder ──────────────────────────────────────────────
  describe('getRulesInFolderByOrder', () => {
    const rules = [makeRule('r1', 'f1', 2000), makeRule('r2', 'f1', 1000), makeRule('r3', undefined, 0)];

    it('returns folder rules sorted by order', () => {
      const result = getRulesInFolderByOrder(rules, 'f1');
      expect(result.map((r) => r.id)).toEqual(['r2', 'r1']);
    });

    it('returns ungrouped rules when folderId is undefined', () => {
      const result = getRulesInFolderByOrder(rules, undefined);
      expect(result.map((r) => r.id)).toEqual(['r3']);
    });
  });

  // ─── getFolderDescendantIds ───────────────────────────────────────────────
  describe('getFolderDescendantIds', () => {
    const folders = [
      makeFolder('root', 'Root'),
      makeFolder('child1', 'Child1', 'root'),
      makeFolder('child2', 'Child2', 'root'),
      makeFolder('grandchild', 'Grandchild', 'child1'),
    ];

    it('returns all descendant IDs recursively', () => {
      const ids = getFolderDescendantIds(folders, 'root');
      expect(ids).toContain('child1');
      expect(ids).toContain('child2');
      expect(ids).toContain('grandchild');
      expect(ids).not.toContain('root');
    });

    it('returns empty array for leaf folder', () => {
      expect(getFolderDescendantIds(folders, 'grandchild')).toHaveLength(0);
    });
  });

  // ─── isDescendantOfFolder ─────────────────────────────────────────────────
  describe('isDescendantOfFolder', () => {
    const folders = [makeFolder('a', 'A'), makeFolder('b', 'B', 'a'), makeFolder('c', 'C', 'b')];

    it('returns true when child is a direct child', () => {
      expect(isDescendantOfFolder(folders, 'b', 'a')).toBe(true);
    });
    it('returns true when child is a deep descendant', () => {
      expect(isDescendantOfFolder(folders, 'c', 'a')).toBe(true);
    });
    it('returns false when folder is not a descendant', () => {
      expect(isDescendantOfFolder(folders, 'a', 'c')).toBe(false);
    });
  });

  // ─── wouldCreateCircularNesting ───────────────────────────────────────────
  describe('wouldCreateCircularNesting', () => {
    const folders = [makeFolder('a', 'A'), makeFolder('b', 'B', 'a'), makeFolder('c', 'C', 'b')];

    it('returns false when moving to root (undefined)', () => {
      expect(wouldCreateCircularNesting(folders, 'a', undefined)).toBe(false);
    });
    it('returns true when moving folder into itself', () => {
      expect(wouldCreateCircularNesting(folders, 'a', 'a')).toBe(true);
    });
    it('returns true when moving folder into its own descendant', () => {
      expect(wouldCreateCircularNesting(folders, 'a', 'c')).toBe(true);
    });
    it('returns false when moving to a valid unrelated parent', () => {
      expect(wouldCreateCircularNesting(folders, 'c', 'a')).toBe(false);
    });
  });

  // ─── buildFolderTree ──────────────────────────────────────────────────────
  describe('buildFolderTree', () => {
    const folders = [
      makeFolder('root1', 'Root1', undefined, 0),
      makeFolder('root2', 'Root2', undefined, 1000),
      makeFolder('child1', 'Child1', 'root1', 0),
      makeFolder('grandchild1', 'GrandChild1', 'child1', 0),
    ];
    const rules = [makeRule('rA', 'root1', 0), makeRule('rB', 'child1', 0)];

    it('builds a two-level tree correctly', () => {
      const tree = buildFolderTree(folders, rules, undefined);
      expect(tree).toHaveLength(2);
      expect(tree[0].folder.id).toBe('root1');
      expect(tree[0].childFolders).toHaveLength(1);
      expect(tree[0].childFolders[0].folder.id).toBe('child1');
      expect(tree[0].childFolders[0].childFolders[0].folder.id).toBe('grandchild1');
    });

    it('places rules in the correct folder node', () => {
      const tree = buildFolderTree(folders, rules, undefined);
      expect(tree[0].rules.map((r) => r.id)).toEqual(['rA']);
      expect(tree[0].childFolders[0].rules.map((r) => r.id)).toEqual(['rB']);
    });

    it('returns empty array for a leaf folder', () => {
      const tree = buildFolderTree(folders, rules, 'grandchild1');
      expect(tree).toHaveLength(0);
    });
  });

  // ─── assignOrder ─────────────────────────────────────────────────────────
  describe('assignOrder', () => {
    it('assigns sequential order in steps of 1000', () => {
      const items: Array<{ id: string; order?: number }> = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = assignOrder(items);
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1000);
      expect(result[2].order).toBe(2000);
    });

    it('does not mutate the original array', () => {
      const items: Array<{ id: string; order?: number }> = [{ id: 'x', order: 99 }];
      assignOrder(items);
      expect(items[0].order).toBe(99);
    });
  });

  // ─── reorderItems ─────────────────────────────────────────────────────────
  describe('reorderItems', () => {
    const items = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1000 },
      { id: 'c', order: 2000 },
    ];

    it('moves item forward in the list', () => {
      const result = reorderItems(items, 'a', 2);
      expect(result.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    });

    it('moves item backward in the list', () => {
      const result = reorderItems(items, 'c', 0);
      expect(result.map((i) => i.id)).toEqual(['c', 'a', 'b']);
    });

    it('clamps out-of-bounds index', () => {
      const result = reorderItems(items, 'a', 100);
      expect(result[result.length - 1].id).toBe('a');
    });

    it('returns original array if itemId not found', () => {
      const result = reorderItems(items, 'z', 0);
      expect(result).toEqual(items);
    });

    it('re-assigns sequential order values', () => {
      const result = reorderItems(items, 'c', 0);
      result.forEach((item, idx) => {
        expect(item.order).toBe(idx * 1000);
      });
    });
  });

  // ─── moveRuleToFolderWithOrder ────────────────────────────────────────────
  describe('moveRuleToFolderWithOrder', () => {
    const rule = makeRule('r1', 'old-folder', 0);

    it('updates folderId and order', () => {
      const updated = moveRuleToFolderWithOrder(rule, 'new-folder', 5000);
      expect(updated.folderId).toBe('new-folder');
      expect(updated.order).toBe(5000);
    });

    it('can ungroup a rule by passing undefined folderId', () => {
      const updated = moveRuleToFolderWithOrder(rule, undefined);
      expect(updated.folderId).toBeUndefined();
    });

    it('updates the modified timestamp', () => {
      const updated = moveRuleToFolderWithOrder(rule, 'f2');
      expect(updated.modified).toBeGreaterThanOrEqual(rule.modified);
    });
  });

  // ─── moveFolderToParent ───────────────────────────────────────────────────
  describe('moveFolderToParent', () => {
    const folder = makeFolder('f1', 'Folder', 'old-parent', 0);

    it('updates parentFolderId and order', () => {
      const updated = moveFolderToParent(folder, 'new-parent', 3000);
      expect(updated.parentFolderId).toBe('new-parent');
      expect(updated.order).toBe(3000);
    });

    it('can move to root by passing undefined', () => {
      const updated = moveFolderToParent(folder, undefined);
      expect(updated.parentFolderId).toBeUndefined();
    });
  });

  // ─── deleteFolderRecursively ──────────────────────────────────────────────
  describe('deleteFolderRecursively', () => {
    const folders = [
      makeFolder('root', 'Root'),
      makeFolder('child', 'Child', 'root'),
      makeFolder('grandchild', 'Grandchild', 'child'),
      makeFolder('unrelated', 'Unrelated'),
    ];
    const rules = [
      makeRule('r1', 'root'),
      makeRule('r2', 'child'),
      makeRule('r3', 'grandchild'),
      makeRule('r4', 'unrelated'),
      makeRule('r5', undefined),
    ];

    it('removes folder and all descendants', () => {
      const result = deleteFolderRecursively(folders, rules, 'root');
      const remainingIds = result.folders.map((f) => f.id);
      expect(remainingIds).toEqual(['unrelated']);
    });

    it('ungroups rules from all removed folders', () => {
      const result = deleteFolderRecursively(folders, rules, 'root');
      const r1 = result.rules.find((r) => r.id === 'r1');
      const r2 = result.rules.find((r) => r.id === 'r2');
      const r3 = result.rules.find((r) => r.id === 'r3');
      expect(r1?.folderId).toBeUndefined();
      expect(r2?.folderId).toBeUndefined();
      expect(r3?.folderId).toBeUndefined();
    });

    it('does not affect rules in unrelated folders', () => {
      const result = deleteFolderRecursively(folders, rules, 'root');
      const r4 = result.rules.find((r) => r.id === 'r4');
      const r5 = result.rules.find((r) => r.id === 'r5');
      expect(r4?.folderId).toBe('unrelated');
      expect(r5?.folderId).toBeUndefined();
    });
  });

  // ─── validateRuleDropTarget ───────────────────────────────────────────────
  describe('validateRuleDropTarget', () => {
    const folders = [makeFolder('f1', 'F1')];
    const rule = makeRule('r1', 'f1');

    it('is valid when target folder exists', () => {
      const result = validateRuleDropTarget(rule, 'f1', folders);
      expect(result.isValid).toBe(true);
    });

    it('is valid when dropping at root (undefined)', () => {
      const result = validateRuleDropTarget(rule, undefined, folders);
      expect(result.isValid).toBe(true);
    });

    it('is invalid when target folder does not exist', () => {
      const result = validateRuleDropTarget(rule, 'non-existent', folders);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ─── validateFolderDropTarget ─────────────────────────────────────────────
  describe('validateFolderDropTarget', () => {
    const folders = [makeFolder('a', 'A'), makeFolder('b', 'B', 'a'), makeFolder('c', 'C', 'b')];
    const folderA = folders[0];

    it('is valid when moving to a sibling parent', () => {
      const folderC = folders[2];
      const result = validateFolderDropTarget(folderC, 'a', folders);
      expect(result.isValid).toBe(true);
    });

    it('is invalid when creating circular nesting', () => {
      const result = validateFolderDropTarget(folderA, 'c', folders);
      expect(result.isValid).toBe(false);
    });

    it('is invalid when moving folder into itself', () => {
      const result = validateFolderDropTarget(folderA, 'a', folders);
      expect(result.isValid).toBe(false);
    });

    it('is valid when moving to root', () => {
      const folderC = folders[2];
      const result = validateFolderDropTarget(folderC, undefined, folders);
      expect(result.isValid).toBe(true);
    });

    it(`is invalid when exceeding MAX_FOLDER_DEPTH (${MAX_FOLDER_DEPTH})`, () => {
      // Build a chain of depth MAX_FOLDER_DEPTH - 1
      const deepFolders: import('../types').Folder[] = [];
      let parentId: string | undefined = undefined;
      for (let i = 0; i < MAX_FOLDER_DEPTH; i++) {
        const id = `deep-${i}`;
        deepFolders.push(makeFolder(id, `Deep${i}`, parentId, i * 1000));
        parentId = id;
      }
      // `parentId` is now the deepest folder id; adding one more level must fail
      const newFolder = makeFolder('new-folder', 'New');
      const result = validateFolderDropTarget(newFolder, parentId, deepFolders);
      expect(result.isValid).toBe(false);
    });
  });

  // ─── migrateFoldersAndRules ───────────────────────────────────────────────
  describe('migrateFoldersAndRules', () => {
    it('adds order to folders that lack it', () => {
      const folders = [makeFolder('f1', 'F1'), makeFolder('f2', 'F2')];
      const { folders: migrated } = migrateFoldersAndRules(folders, []);
      expect(migrated[0].order).toBe(0);
      expect(migrated[1].order).toBe(1000);
    });

    it('preserves existing order values', () => {
      const folders = [makeFolder('f1', 'F1', undefined, 5000)];
      const { folders: migrated } = migrateFoldersAndRules(folders, []);
      expect(migrated[0].order).toBe(5000);
    });

    it('adds order to rules that lack it', () => {
      const rules = [makeRule('r1', undefined), makeRule('r2', undefined)];
      const { rules: migrated } = migrateFoldersAndRules([], rules);
      expect(migrated[0].order).toBe(0);
      expect(migrated[1].order).toBe(1000);
    });

    it('preserves existing rule order values', () => {
      const rules = [makeRule('r1', undefined)];
      rules[0].order = 7000;
      const { rules: migrated } = migrateFoldersAndRules([], rules);
      expect(migrated[0].order).toBe(7000);
    });
  });
});
