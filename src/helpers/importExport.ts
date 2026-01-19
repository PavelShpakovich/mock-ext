import { MockRule } from '../types';

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

export function exportRulesToJSON(rules: MockRule[], selectedIds?: string[]): string {
  const rulesToExport = selectedIds ? rules.filter((r) => selectedIds.includes(r.id)) : rules;
  return JSON.stringify(rulesToExport, null, 2);
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

export function mergeRules(existingRules: MockRule[], importedRules: MockRule[]): MockRule[] {
  const existingIds = new Set(existingRules.map((r) => r.id));
  const newRules = importedRules.filter((rule) => !existingIds.has(rule.id));
  return [...existingRules, ...newRules];
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

export async function parseImportFile(file: File): Promise<MockRule[]> {
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
