import { MockRule, ProxyRule, Folder } from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImportStats {
  total: number;
  new: number;
  duplicates: number;
}

export interface ReplaceStats {
  total: number;
  removed: number;
}

export interface ImportPreview {
  merge: ImportStats;
  replace: ReplaceStats;
}

export interface ExportData {
  version: 2;
  rules: MockRule[];
  folders: Folder[];
}

export interface ParsedImportData {
  rules: MockRule[];
  folders: Folder[];
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRulesToJSON(rules: MockRule[], selectedIds?: string[], folders: Folder[] = []): string {
  const rulesToExport = selectedIds ? rules.filter((r) => selectedIds.includes(r.id)) : rules;

  // Collect folders referenced by exported rules, plus their full ancestor chain
  const referencedFolderIds = new Set<string>();
  for (const rule of rulesToExport) {
    if (rule.folderId) referencedFolderIds.add(rule.folderId);
  }

  // Walk up the parent chain so nested folder structure is preserved
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (
        referencedFolderIds.has(folder.id) &&
        folder.parentFolderId &&
        !referencedFolderIds.has(folder.parentFolderId)
      ) {
        referencedFolderIds.add(folder.parentFolderId);
        changed = true;
      }
    }
  }

  const foldersToExport = folders.filter((f) => referencedFolderIds.has(f.id));

  const data: ExportData = { version: 2, rules: rulesToExport, folders: foldersToExport };
  return JSON.stringify(data, null, 2);
}

export function generateExportFilename(): string {
  return `moq-rules-${new Date().toISOString().split('T')[0]}.json`;
}

export function validateImportedRules(data: unknown): ValidationResult {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Invalid format - expected array' };
  }

  const hasRequiredFields = data.every(
    (rule) => rule.id && rule.name && rule.urlPattern && rule.method && rule.statusCode !== undefined
  );

  if (!hasRequiredFields) {
    return { valid: false, error: 'Missing required fields' };
  }

  return { valid: true };
}

/**
 * Validates an imported file payload and returns parsed rules + folders.
 * Handles both legacy v1 format (plain MockRule[]) and v2 format ({ version, rules, folders }).
 * Legacy v1 imports have folderId stripped from rules to prevent orphaned/invisible rules.
 */
export function validateImportedData(
  data: unknown
): { valid: true; parsed: ParsedImportData } | { valid: false; error: string } {
  // Legacy v1: plain array of rules
  if (Array.isArray(data)) {
    const validation = validateImportedRules(data);
    if (!validation.valid) return { valid: false, error: validation.error! };
    // Strip folderId so rules with dangling folder references don't become invisible
    const rules = (data as MockRule[]).map(({ folderId: _f, ...rest }) => rest as MockRule);
    return { valid: true, parsed: { rules, folders: [] } };
  }

  // v2: wrapper object with { version, rules, folders }
  if (typeof data === 'object' && data !== null && 'rules' in data) {
    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.rules)) {
      return { valid: false, error: 'Invalid format - expected rules array' };
    }

    const rulesValidation = validateImportedRules(obj.rules);
    if (!rulesValidation.valid) return { valid: false, error: rulesValidation.error! };

    const folders: Folder[] = [];
    if (obj.folders !== undefined) {
      if (!Array.isArray(obj.folders)) {
        return { valid: false, error: 'Invalid format - expected folders array' };
      }
      const validFolders = (obj.folders as unknown[]).every(
        (f) => f && typeof f === 'object' && 'id' in (f as object) && 'name' in (f as object)
      );
      if (!validFolders) {
        return { valid: false, error: 'Invalid folder format - missing required fields (id, name)' };
      }
      folders.push(...(obj.folders as Folder[]));
    }

    return { valid: true, parsed: { rules: obj.rules as MockRule[], folders } };
  }

  return { valid: false, error: 'Invalid format - expected array or export object' };
}

export function mergeRules(existingRules: MockRule[], importedRules: MockRule[]): MockRule[] {
  const existingIds = new Set(existingRules.map((r) => r.id));
  const newRules = importedRules.filter((rule) => !existingIds.has(rule.id));
  return [...existingRules, ...newRules];
}

export function mergeFolders(existingFolders: Folder[], importedFolders: Folder[]): Folder[] {
  const existingIds = new Set(existingFolders.map((f) => f.id));
  const newFolders = importedFolders.filter((f) => !existingIds.has(f.id));
  return [...existingFolders, ...newFolders];
}

export function calculateImportStats(existingRules: MockRule[], importedRules: MockRule[]): ImportStats {
  const existingIds = new Set(existingRules.map((r) => r.id));
  const newRules = importedRules.filter((rule) => !existingIds.has(rule.id));
  const duplicateRules = importedRules.filter((rule) => existingIds.has(rule.id));

  return {
    total: existingRules.length + newRules.length,
    new: newRules.length,
    duplicates: duplicateRules.length,
  };
}

export function calculateReplaceStats(existingRules: MockRule[], importedRules: MockRule[]): ReplaceStats {
  return {
    total: importedRules.length,
    removed: existingRules.length,
  };
}

export async function parseImportFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text);
}

export function getNewAndDuplicateRules(
  existingRules: MockRule[],
  importedRules: MockRule[]
): { newRules: MockRule[]; duplicateRules: MockRule[] } {
  const existingIds = new Set(existingRules.map((r) => r.id));
  const newRules = importedRules.filter((rule) => !existingIds.has(rule.id));
  const duplicateRules = importedRules.filter((rule) => existingIds.has(rule.id));

  return { newRules, duplicateRules };
}

export function calculateAllImportStats(existingRules: MockRule[], importedRules: MockRule[]): ImportPreview {
  const mergeStats = calculateImportStats(existingRules, importedRules);
  const replaceStats = calculateReplaceStats(existingRules, importedRules);

  return { merge: mergeStats, replace: replaceStats };
}

// ============================================================================
// Proxy Rule Import/Export
// ============================================================================

export function exportProxyRulesToJSON(rules: ProxyRule[]): string {
  return JSON.stringify(rules, null, 2);
}

export function generateProxyExportFilename(): string {
  return `moq-proxy-rules-${new Date().toISOString().split('T')[0]}.json`;
}

export function validateImportedProxyRules(data: unknown): ValidationResult {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Invalid format - expected array' };
  }
  const hasRequiredFields = data.every((rule) => rule.id && rule.name && rule.urlPattern && rule.proxyTarget);
  if (!hasRequiredFields) {
    return { valid: false, error: 'Missing required fields (id, name, urlPattern, proxyTarget)' };
  }
  return { valid: true };
}

export function mergeProxyRules(existing: ProxyRule[], imported: ProxyRule[]): ProxyRule[] {
  const existingIds = new Set(existing.map((r) => r.id));
  return [...existing, ...imported.filter((r) => !existingIds.has(r.id))];
}

export async function parseImportProxyFile(file: File): Promise<ProxyRule[]> {
  const text = await file.text();
  return JSON.parse(text);
}
