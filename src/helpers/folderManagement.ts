import { Folder, MockRule } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new folder
 */
export function createFolder(name: string): Folder {
  return {
    id: uuidv4(),
    name,
    collapsed: false,
    created: Date.now(),
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
  const newFolders = folders.filter((f) => f.id !== folderId);
  const newRules = rules.map((rule) => (rule.folderId === folderId ? { ...rule, folderId: undefined } : rule));

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

  if (trimmedName.length > 50) {
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
