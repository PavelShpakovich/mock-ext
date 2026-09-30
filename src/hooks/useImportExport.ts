import { useCallback } from 'react';
import { Folder, MockRule, ProxyRule } from '../types';
import { ImportMode, ToastType } from '../enums';
import {
  downloadFile,
  exportRulesToJSON,
  generateExportFilename,
  validateImportedData,
  mergeRules,
  mergeFolders,
  parseImportFile,
  exportProxyRulesToJSON,
  generateProxyExportFilename,
  validateImportedProxyRules,
  mergeProxyRules,
  parseImportProxyFile,
} from '../helpers/importExport';

export interface ImportDialogData {
  rules: MockRule[];
  folders: Folder[];
}

interface UseImportExportOptions {
  rules: MockRule[];
  folders: Folder[];
  proxyRules: ProxyRule[];
  importDialogData: ImportDialogData | null;
  saveRules: (rules: MockRule[]) => Promise<void>;
  saveFolders: (folders: Folder[]) => Promise<void>;
  saveProxyRules: (rules: ProxyRule[]) => Promise<void>;
  setImportDialogData: (data: ImportDialogData | null) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  showToast: (type: ToastType, message: string) => void;
  showSecurityWarning: (confirm: () => void | Promise<void>) => void;
}

const containsResponseHooks = (rules: Array<{ responseHook?: string }>): boolean =>
  rules.some((rule) => rule.responseHook?.trim());

export function useImportExport({
  rules,
  folders,
  proxyRules,
  importDialogData,
  saveRules,
  saveFolders,
  saveProxyRules,
  setImportDialogData,
  t,
  showToast,
  showSecurityWarning,
}: UseImportExportOptions) {
  const handleExportRules = useCallback(
    (selectedIds?: string[]) => {
      downloadFile(exportRulesToJSON(rules, selectedIds, folders), generateExportFilename(), 'application/json');
    },
    [rules, folders]
  );

  const handleExportProxyRules = useCallback(() => {
    downloadFile(exportProxyRulesToJSON(proxyRules), generateProxyExportFilename(), 'application/json');
  }, [proxyRules]);

  const handleImportProxyRules = useCallback(
    async (file: File) => {
      try {
        const importedRules = await parseImportProxyFile(file);
        const validation = validateImportedProxyRules(importedRules);
        if (!validation.valid) {
          showToast(ToastType.Error, `${t('rules.importError')}: ${validation.error}`);
          return;
        }

        const importValidatedRules = async () => {
          const merged = mergeProxyRules(proxyRules, importedRules);
          const newCount = merged.length - proxyRules.length;
          await saveProxyRules(merged);
          showToast(ToastType.Success, t('rules.importSuccess', { count: newCount }));
        };

        if (containsResponseHooks(importedRules)) showSecurityWarning(importValidatedRules);
        else await importValidatedRules();
      } catch (error) {
        showToast(ToastType.Error, `${t('rules.importError')}: ${(error as Error).message}`);
      }
    },
    [proxyRules, saveProxyRules, showSecurityWarning, showToast, t]
  );

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const validation = validateImportedData(await parseImportFile(file));
        if (!validation.valid) {
          showToast(ToastType.Error, `${t('rules.importError')}: ${validation.error}`);
          return;
        }

        const { rules: importedRules, folders: importedFolders } = validation.parsed;
        const openImportDialog = () => setImportDialogData({ rules: importedRules, folders: importedFolders });
        if (containsResponseHooks(importedRules)) showSecurityWarning(openImportDialog);
        else openImportDialog();
      } catch (error) {
        showToast(ToastType.Error, `${t('rules.importError')}: ${(error as Error).message}`);
      }
    },
    [setImportDialogData, showSecurityWarning, showToast, t]
  );

  const handleConfirmImport = useCallback(
    async (mode: ImportMode) => {
      if (!importDialogData) return;

      try {
        const { rules: importedRules, folders: importedFolders } = importDialogData;
        const updatedRules = mode === ImportMode.Merge ? mergeRules(rules, importedRules) : importedRules;
        const newRulesCount = mode === ImportMode.Merge ? updatedRules.length - rules.length : importedRules.length;
        await saveRules(updatedRules);

        const updatedFolders = mode === ImportMode.Merge ? mergeFolders(folders, importedFolders) : importedFolders;
        if (updatedFolders !== folders) await saveFolders(updatedFolders);

        setImportDialogData(null);
        showToast(ToastType.Success, t('rules.importSuccess', { count: newRulesCount }));
      } catch (error) {
        showToast(ToastType.Error, `${t('rules.importError')}: ${(error as Error).message}`);
      }
    },
    [importDialogData, rules, folders, saveRules, saveFolders, setImportDialogData, showToast, t]
  );

  return { handleExportRules, handleExportProxyRules, handleImportRules, handleImportProxyRules, handleConfirmImport };
}
