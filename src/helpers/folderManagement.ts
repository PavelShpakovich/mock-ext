import { Folder, MockRule, FolderTreeNode, DropValidation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MAX_FOLDER_NAME_LENGTH, MAX_FOLDER_DEPTH } from '../constants';

/**
 * Create a new folder, optionally nested inside a parent
 */
export function createFolder(name: string, parentFolderId?: string, order?: number): Folder {
  return {
    id: uuidv4(),
    name,
    parentFolderId,
    collapsed: false,
    created: Date.now(),
    order,
  };
}

/**
 * Rename a folder
 */
export function renameFolder(folder: Folder, newName: string): Folder {
  return {
    ...folder,
    name: newName,
  };
}

/**
 * Toggle folder collapsed state
 */
export function toggleFolderCollapse(folder: Folder): Folder {
  return {
    ...folder,
    collapsed: !folder.collapsed,
  };
}

/**
 * Get rules grouped by folder
 */
export function getRulesGroupedByFolder(rules: MockRule[], folders: Folder[]): Map<string | undefined, MockRule[]> {
  const grouped = new Map<string | undefined, MockRule[]>();

  // Initialize all folders
  folders.forEach((folder) => {
    grouped.set(folder.id, []);
  });

  // Add ungrouped rules
  grouped.set(undefined, []);

  // Group rules
  rules.forEach((rule) => {
    const folderId = rule.folderId;
    if (!grouped.has(folderId)) {
      grouped.set(folderId, []);
    }
    grouped.get(folderId)!.push(rule);
  });

  return grouped;
}

/**
 * Get folder by ID
 */
export function getFolderById(folders: Folder[], id: string): Folder | undefined {
  return folders.find((folder) => folder.id === id);
}

/**
 * Move rule to folder
 */
export function moveRuleToFolder(rule: MockRule, folderId: string | undefined): MockRule {
  return {
    ...rule,
    folderId,
    modified: Date.now(),
  };
}

/**
 * Delete folder and ungroup its rules
 */
export function deleteFolderAndUngroup(
  folders: Folder[],
  rules: MockRule[],
  folderId: string
): { folders: Folder[]; rules: MockRule[] } {
  const folderToDelete = folders.find((f) => f.id === folderId);
  if (!folderToDelete) {
    return { folders, rules };
  }

  const targetParentId = folderToDelete.parentFolderId;

  const newFolders = folders
    .filter((f) => f.id !== folderId)
    .map((folder) => (folder.parentFolderId === folderId ? { ...folder, parentFolderId: targetParentId } : folder));

  const newRules = rules.map((rule) =>
    rule.folderId === folderId ? { ...rule, folderId: targetParentId, modified: Date.now() } : rule
  );

  return { folders: newFolders, rules: newRules };
}

/**
 * Bulk enable/disable all rules in a folder
 */
export function toggleFolderRules(rules: MockRule[], folderId: string, enabled: boolean): MockRule[] {
  return rules.map((rule) => (rule.folderId === folderId ? { ...rule, enabled } : rule));
}

/**
 * Get rule count per folder
 */
export function getFolderRuleCounts(rules: MockRule[], folders: Folder[]): Map<string | undefined, number> {
  const counts = new Map<string | undefined, number>();

  // Initialize all folders with 0
  folders.forEach((folder) => {
    counts.set(folder.id, 0);
  });
  counts.set(undefined, 0);

  // Count rules
  rules.forEach((rule) => {
    const count = counts.get(rule.folderId) || 0;
    counts.set(rule.folderId, count + 1);
  });

  return counts;
}

/**
 * Validate folder name
 * Returns a translation key if validation fails, null if valid
 */
export function validateFolderName(name: string, existingFolders: Folder[], excludeId?: string): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'validation.folderNameEmpty';
  }

  if (trimmedName.length > MAX_FOLDER_NAME_LENGTH) {
    return 'validation.folderNameTooLong';
  }

  const isDuplicate = existingFolders.some(
    (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase() && folder.id !== excludeId
  );

  if (isDuplicate) {
    return 'validation.folderNameDuplicate';
  }

  return null;
}

// ============================================================================
// Nested Folder Tree Structure
// ============================================================================

/**
 * Get depth of a folder in the hierarchy (root folders have depth 0)
 */
export function getFolderDepth(folders: Folder[], folderId: string, _visited = new Set<string>()): number {
  if (_visited.has(folderId)) return 0; // Guard against circular refs
  const folder = folders.find((f) => f.id === folderId);
  if (!folder || !folder.parentFolderId) return 0;
  _visited.add(folderId);
  return 1 + getFolderDepth(folders, folder.parentFolderId, _visited);
}

/**
 * Get all direct children of a folder (or root-level folders when parentId is undefined)
 * Returns folders sorted by their `order` field
 */
export function getFoldersInParentByOrder(folders: Folder[], parentId?: string): Folder[] {
  return folders
    .filter((f) => f.parentFolderId === parentId)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

/**
 * Get rules belonging to a folder, sorted by their `order` field
 */
export function getRulesInFolderByOrder(rules: MockRule[], folderId?: string): MockRule[] {
  return rules.filter((r) => r.folderId === folderId).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

/**
 * Get all descendant folder IDs of a given folder (recursive)
 */
export function getFolderDescendantIds(folders: Folder[], parentId: string): string[] {
  const directChildren = folders.filter((f) => f.parentFolderId === parentId);
  return directChildren.flatMap((child) => [child.id, ...getFolderDescendantIds(folders, child.id)]);
}

/**
 * Check whether `candidateChildId` is a descendant of `potentialAncestorId`
 */
export function isDescendantOfFolder(
  folders: Folder[],
  candidateChildId: string,
  potentialAncestorId: string
): boolean {
  return getFolderDescendantIds(folders, potentialAncestorId).includes(candidateChildId);
}

/**
 * Check if moving a folder into `targetParentId` would create a circular dependency
 */
export function wouldCreateCircularNesting(
  folders: Folder[],
  movingFolderId: string,
  targetParentId?: string
): boolean {
  if (!targetParentId) return false; // Moving to root is always valid
  if (movingFolderId === targetParentId) return true; // Can't move into itself
  return isDescendantOfFolder(folders, targetParentId, movingFolderId);
}

/**
 * Build a recursive folder tree starting from `parentId` (undefined = root)
 */
export function buildFolderTree(folders: Folder[], rules: MockRule[], parentId?: string): FolderTreeNode[] {
  return getFoldersInParentByOrder(folders, parentId).map((folder) => ({
    folder,
    childFolders: buildFolderTree(folders, rules, folder.id),
    rules: getRulesInFolderByOrder(rules, folder.id),
  }));
}

// ============================================================================
// Ordering / Reordering
// ============================================================================

/**
 * Assign sequential `order` values to an array of items (in-place on copies)
 * Returns a new array where each item's `order` equals its index * 1000
 * (using 1000-step gaps makes future insertions easy without full re-numbering)
 */
export function assignOrder<T extends { order?: number }>(items: T[]): T[] {
  return items.map((item, idx) => ({ ...item, order: idx * 1000 }));
}

/**
 * Move an item from `fromIndex` to `toIndex` within an array and re-assign
 * sequential order values. Returns a new array.
 */
export function reorderItems<T extends { id: string; order?: number }>(
  items: T[],
  itemId: string,
  toIndex: number
): T[] {
  const sorted = [...items].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const fromIndex = sorted.findIndex((i) => i.id === itemId);
  if (fromIndex === -1) return items;

  const clamped = Math.max(0, Math.min(toIndex, sorted.length - 1));
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(clamped, 0, moved);
  return assignOrder(sorted);
}

// ============================================================================
// Move Operations
// ============================================================================

/**
 * Move a rule to a different folder (or root) and optionally set its order
 */
export function moveRuleToFolderWithOrder(
  rule: MockRule,
  newFolderId: string | undefined,
  newOrder?: number
): MockRule {
  return {
    ...rule,
    folderId: newFolderId,
    order: newOrder,
    modified: Date.now(),
  };
}

/**
 * Move a folder to a different parent (or root), updating parentFolderId and order.
 * Does NOT check for circular nesting — callers must validate first.
 */
export function moveFolderToParent(folder: Folder, newParentId?: string, newOrder?: number): Folder {
  return {
    ...folder,
    parentFolderId: newParentId,
    order: newOrder,
  };
}

// ============================================================================
// Deletion (recursive)
// ============================================================================

/**
 * Delete a folder and ALL its descendants. Rules belonging to any deleted folder
 * are ungrouped (folderId set to undefined).
 */
export function deleteFolderRecursively(
  folders: Folder[],
  rules: MockRule[],
  folderId: string
): { folders: Folder[]; rules: MockRule[] } {
  const descendantIds = getFolderDescendantIds(folders, folderId);
  const idsToRemove = new Set([folderId, ...descendantIds]);

  const newFolders = folders.filter((f) => !idsToRemove.has(f.id));
  const newRules = rules.map((rule) =>
    rule.folderId && idsToRemove.has(rule.folderId) ? { ...rule, folderId: undefined } : rule
  );

  return { folders: newFolders, rules: newRules };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate whether a rule can be dropped at a given position
 */
export function validateRuleDropTarget(
  _rule: MockRule,
  targetFolderId: string | undefined,
  folders: Folder[]
): DropValidation {
  // Verify target folder exists (if specified)
  if (targetFolderId && !folders.find((f) => f.id === targetFolderId)) {
    return { isValid: false, reason: 'Target folder does not exist' };
  }

  // Already in this folder – still valid (allows reordering within the same folder)
  return { isValid: true };
}

/**
 * Validate whether a folder can be dropped into a target parent folder
 */
export function validateFolderDropTarget(
  folder: Folder,
  targetParentId: string | undefined,
  folders: Folder[]
): DropValidation {
  // Check circular nesting
  if (wouldCreateCircularNesting(folders, folder.id, targetParentId)) {
    return { isValid: false, reason: 'Cannot move a folder into itself or its descendants' };
  }

  // Check depth limit
  if (targetParentId) {
    const targetDepth = getFolderDepth(folders, targetParentId);
    if (targetDepth + 1 >= MAX_FOLDER_DEPTH) {
      return { isValid: false, reason: `Maximum folder nesting depth (${MAX_FOLDER_DEPTH}) reached` };
    }
  }

  // Verify target parent exists (if specified)
  if (targetParentId && !folders.find((f) => f.id === targetParentId)) {
    return { isValid: false, reason: 'Target parent folder does not exist' };
  }

  return { isValid: true };
}

// ============================================================================
// Storage Migration Helpers
// ============================================================================

/**
 * Migrate flat folder/rule arrays to include `order` and `parentFolderId` fields.
 * Safe to call multiple times – already-migrated items are left unchanged.
 */
export function migrateFoldersAndRules(folders: Folder[], rules: MockRule[]): { folders: Folder[]; rules: MockRule[] } {
  const migratedFolders = folders.map((f, idx) => ({
    ...f,
    parentFolderId: f.parentFolderId, // preserve existing value (undefined for migrated flat folders)
    order: f.order ?? idx * 1000,
  }));

  const migratedRules = rules.map((r, idx) => ({
    ...r,
    order: r.order ?? idx * 1000,
  }));

  return { folders: migratedFolders, rules: migratedRules };
}
