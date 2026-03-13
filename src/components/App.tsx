import React, { useState, useCallback, useEffect } from 'react';
import { MockRule, ProxyRule, RequestLog, Folder } from '../types';
import { Tab, ImportMode, ToastType, ConfirmDialogVariant, EditMode, MessageActionType } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import { isDevTools } from '../helpers/context';
import { withContextCheck } from '../contextHandler';
import {
  useStandaloneWindowStatus,
  useRulesManager,
  useProxyRulesManager,
  useFoldersManager,
  useRecording,
  useCrossContextSync,
  useDragDropHandlers,
} from '../hooks';
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
import Header from './Header';
import RulesTab from './RulesTab';
import ProxyTab from './ProxyTab';
import RequestsTab from './RequestsTab';
import FolderEditor from './FolderEditor';
import StandaloneWindowOverlay from './StandaloneWindowOverlay';
import { TabButton } from './ui/TabButton';
import { ImportDialog } from './ui/ImportDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast } from './ui/Toast';

/**
 * Main application component
 * Manages UI state and coordinates between different feature modules
 */
const App: React.FC = () => {
  const { t } = useI18n();

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Rules);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingProxyRuleId, setEditingProxyRuleId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | EditMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [importDialogData, setImportDialogData] = useState<{ rules: MockRule[]; folders: Folder[] } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  // Feature Hooks
  const standaloneWindowOpen = useStandaloneWindowStatus();
  const rulesManager = useRulesManager();
  const proxyRulesManager = useProxyRulesManager();
  const foldersManager = useFoldersManager();
  const recording = useRecording();

  // Drag-and-drop handlers
  useDragDropHandlers({
    rules: rulesManager.rules,
    folders: foldersManager.folders,
    onRulesChange: rulesManager.saveRules,
    onFoldersChange: foldersManager.saveFolders,
  });

  // Cross-context sync - ensures state stays synchronized across all contexts
  useCrossContextSync({
    onRulesUpdated: rulesManager.loadRules,
    onProxyRulesUpdated: proxyRulesManager.loadProxyRules,
    onSettingsUpdated: recording.loadSettings,
    onFoldersUpdated: foldersManager.loadFolders,
    onRequestLogUpdated: recording.loadRequestLog,
  });

  // Initial data load on mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        rulesManager.loadRules(),
        proxyRulesManager.loadProxyRules(),
        foldersManager.loadFolders(),
        recording.loadSettings(),
        recording.loadRequestLog(),
      ]);
    };

    loadAllData();
    // Empty deps - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch to Requests tab if recording is active on mount
  useEffect(() => {
    if (recording.settings.logRequests) {
      setActiveTab(Tab.Requests);
    }
  }, [recording.settings.logRequests]);

  // ===========================
  // Rule Handlers
  // ===========================

  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      try {
        await rulesManager.saveRule(rule, editingRuleId);
      } finally {
        setEditingRuleId(null);
      }
    },
    [rulesManager, editingRuleId]
  );

  const handleDeleteRule = useCallback(
    async (id: string) => {
      await rulesManager.deleteRule(id);
      if (editingRuleId === id) {
        setEditingRuleId(null);
      }
    },
    [rulesManager, editingRuleId]
  );

  const handleMockRequest = useCallback((request: RequestLog) => {
    setActiveTab(Tab.Rules);
    setEditingRuleId(EditMode.New);
    sessionStorage.setItem('mockRequest', JSON.stringify(request));
  }, []);

  // ===========================
  // Proxy Rule Handlers
  // ===========================

  const handleSaveProxyRule = useCallback(
    async (rule: ProxyRule) => {
      try {
        await proxyRulesManager.saveProxyRule(rule, editingProxyRuleId);
      } finally {
        setEditingProxyRuleId(null);
      }
    },
    [proxyRulesManager, editingProxyRuleId]
  );

  const handleDeleteProxyRule = useCallback(
    async (id: string) => {
      await proxyRulesManager.deleteProxyRule(id);
      if (editingProxyRuleId === id) {
        setEditingProxyRuleId(null);
      }
    },
    [proxyRulesManager, editingProxyRuleId]
  );

  const handleProxyRequest = useCallback((request: RequestLog) => {
    setActiveTab(Tab.Proxy);
    setEditingProxyRuleId(EditMode.New);
    sessionStorage.setItem('proxyRequest', JSON.stringify(request));
  }, []);

  // ===========================
  // Recording Handlers
  // ===========================

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      const result = await recording.handleRecordingToggle(logRequests);
      // Switch to Requests tab when starting recording
      if (logRequests) {
        setActiveTab(Tab.Requests);
        // Show info message if page was reloaded
        if (result?.reloaded) {
          setToast({
            type: ToastType.Info,
            message: t('recording.pageReloaded'),
          });
        }
      }
    },
    [recording, t]
  );

  // ===========================
  // Import/Export Handlers
  // ===========================

  const handleExportRules = useCallback(
    (selectedIds?: string[]) => {
      const dataStr = exportRulesToJSON(rulesManager.rules, selectedIds, foldersManager.folders);
      const filename = generateExportFilename();
      downloadFile(dataStr, filename, 'application/json');
    },
    [rulesManager.rules, foldersManager.folders]
  );

  const handleExportProxyRules = useCallback(() => {
    const dataStr = exportProxyRulesToJSON(proxyRulesManager.proxyRules);
    const filename = generateProxyExportFilename();
    downloadFile(dataStr, filename, 'application/json');
  }, [proxyRulesManager.proxyRules]);

  const handleImportProxyRules = useCallback(
    async (file: File) => {
      try {
        const importedRules = await parseImportProxyFile(file);
        const validation = validateImportedProxyRules(importedRules);
        if (!validation.valid) {
          setToast({ type: ToastType.Error, message: `${t('rules.importError')}: ${validation.error}` });
          return;
        }
        const doImport = () => {
          const merged = mergeProxyRules(proxyRulesManager.proxyRules, importedRules);
          const newCount = merged.length - proxyRulesManager.proxyRules.length;
          proxyRulesManager.setProxyRulesDirectly(merged);
          setToast({ type: ToastType.Success, message: t('rules.importSuccess').replace('{count}', String(newCount)) });
        };
        const hasHooks = importedRules.some((r) => r.responseHook && r.responseHook.trim().length > 0);
        if (hasHooks) {
          setConfirmDialog({
            title: t('import.securityWarning'),
            message: t('import.securityMessage'),
            variant: ConfirmDialogVariant.Danger,
            onConfirm: () => {
              setConfirmDialog(null);
              doImport();
            },
          });
          return;
        }
        doImport();
      } catch (error) {
        setToast({ type: ToastType.Error, message: `${t('rules.importError')}: ${(error as Error).message}` });
      }
    },
    [proxyRulesManager, t]
  );

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const rawData = await parseImportFile(file);
        const validation = validateImportedData(rawData);

        if (!validation.valid) {
          setToast({
            type: ToastType.Error,
            message: `${t('rules.importError')}: ${validation.error}`,
          });
          return;
        }

        const { rules: importedRules, folders: importedFolders } = validation.parsed;
        const hasHooks = importedRules.some((r) => r.responseHook && r.responseHook.trim().length > 0);
        if (hasHooks) {
          setConfirmDialog({
            title: t('import.securityWarning'),
            message: t('import.securityMessage'),
            variant: ConfirmDialogVariant.Danger,
            onConfirm: () => {
              setConfirmDialog(null);
              setImportDialogData({ rules: importedRules, folders: importedFolders });
            },
          });
          return;
        }

        setImportDialogData({ rules: importedRules, folders: importedFolders });
      } catch (error) {
        console.error('Import error:', error);
        setToast({
          type: ToastType.Error,
          message: `${t('rules.importError')}: ${(error as Error).message}`,
        });
      }
    },
    [t]
  );

  const handleConfirmImport = useCallback(
    async (mode: ImportMode) => {
      if (!importDialogData) return;

      try {
        const { rules: importedRules, folders: importedFolders } = importDialogData;
        const currentRules = rulesManager.rules;
        const updatedRules = mode === ImportMode.Merge ? mergeRules(currentRules, importedRules) : importedRules;
        const newRulesCount =
          mode === ImportMode.Merge ? updatedRules.length - currentRules.length : importedRules.length;

        // Update all rules at once through background script
        rulesManager.setRulesDirectly(updatedRules);
        await withContextCheck(() =>
          browser.runtime.sendMessage({ action: MessageActionType.UpdateRules, rules: updatedRules })
        ).catch(() => {});

        // Update folders: merge new ones in, or replace entirely
        const currentFolders = foldersManager.folders;
        const updatedFolders =
          mode === ImportMode.Merge ? mergeFolders(currentFolders, importedFolders) : importedFolders;
        if (updatedFolders !== currentFolders) {
          await foldersManager.saveFolders(updatedFolders);
        }

        setImportDialogData(null);
        setToast({
          type: ToastType.Success,
          message: t('rules.importSuccess').replace('{count}', newRulesCount.toString()),
        });
      } catch (error) {
        console.error('Import error:', error);
        setToast({
          type: ToastType.Error,
          message: `${t('rules.importError')}: ${(error as Error).message}`,
        });
      }
    },
    [importDialogData, rulesManager, foldersManager, t]
  );

  // ===========================
  // Folder Handlers
  // ===========================

  const handleCreateFolder = useCallback(() => {
    setEditingFolder(EditMode.New);
  }, []);

  const handleEditFolder = useCallback(
    (folderId: string) => {
      const folder = foldersManager.folders.find((f) => f.id === folderId);
      if (folder) {
        setEditingFolder(folder);
      }
    },
    [foldersManager.folders]
  );

  const handleSaveFolder = useCallback(
    async (name: string) => {
      const folderToEdit = editingFolder === EditMode.New ? null : (editingFolder as Folder | null);
      await foldersManager.saveFolder(name, folderToEdit);
      setEditingFolder(null);
    },
    [editingFolder, foldersManager]
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folder = foldersManager.folders.find((f) => f.id === folderId);
      if (!folder) return;

      setConfirmDialog({
        title: t('folders.deleteFolder'),
        message: t('folders.deleteConfirmMessage', { name: folder.name }),
        variant: ConfirmDialogVariant.Danger,
        onConfirm: async () => {
          const result = await foldersManager.deleteFolderAndUpdateRules(folderId, rulesManager.rules);
          rulesManager.setRulesDirectly(result.rules);
          setConfirmDialog(null);
        },
      });
    },
    [foldersManager, rulesManager, t]
  );
  const handleCloseToast = useCallback(() => {
    setToast(null);
  }, []);
  const handleEnableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = await foldersManager.enableFolderRules(rulesManager.rules, folderId);
      await rulesManager.saveRules(updatedRules);
    },
    [foldersManager, rulesManager]
  );

  const handleDisableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = await foldersManager.disableFolderRules(rulesManager.rules, folderId);
      await rulesManager.saveRules(updatedRules);
    },
    [foldersManager, rulesManager]
  );

  // ===========================
  // Render
  // ===========================

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-white'>
      <Header
        enabled={recording.settings.enabled}
        logRequests={recording.settings.logRequests}
        corsAutoFix={recording.settings.corsAutoFix}
        onToggleEnabled={recording.handleGlobalToggle}
        onToggleRecording={handleRecordingToggle}
        onToggleCors={recording.handleCorsToggle}
        activeTabTitle={recording.activeTabTitle}
      />

      <div className='flex bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800'>
        <TabButton active={activeTab === Tab.Rules} onClick={() => setActiveTab(Tab.Rules)}>
          {t('tabs.rules')} ({rulesManager.rules.length})
        </TabButton>
        <TabButton active={activeTab === Tab.Proxy} onClick={() => setActiveTab(Tab.Proxy)}>
          {t('tabs.proxy')} ({proxyRulesManager.proxyRules.length})
        </TabButton>
        <TabButton active={activeTab === Tab.Requests} onClick={() => setActiveTab(Tab.Requests)}>
          {t('tabs.requests')} ({recording.requestLog.length})
        </TabButton>
      </div>

      {activeTab === Tab.Rules && (
        <RulesTab
          rules={rulesManager.rules}
          folders={foldersManager.folders}
          ruleWarnings={rulesManager.ruleWarnings}
          searchTerm={searchTerm}
          settings={recording.settings}
          onSearchChange={setSearchTerm}
          editingRuleId={editingRuleId}
          onEditRule={setEditingRuleId}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={rulesManager.toggleRule}
          onDuplicateRule={rulesManager.duplicateRule}
          onResetRuleHits={rulesManager.resetRuleHits}
          onCancelEdit={() => setEditingRuleId(null)}
          onExportRules={handleExportRules}
          onImportRules={handleImportRules}
          onCreateFolder={handleCreateFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolderCollapse={foldersManager.toggleCollapse}
          onEnableFolderRules={handleEnableFolderRules}
          onDisableFolderRules={handleDisableFolderRules}
        />
      )}

      {activeTab === Tab.Proxy && (
        <ProxyTab
          proxyRules={proxyRulesManager.proxyRules}
          mockRules={rulesManager.rules}
          editingRuleId={editingProxyRuleId}
          onEditRule={setEditingProxyRuleId}
          onSaveRule={handleSaveProxyRule}
          onDeleteRule={handleDeleteProxyRule}
          onToggleRule={proxyRulesManager.toggleProxyRule}
          onDuplicateRule={proxyRulesManager.duplicateProxyRule}
          onResetRuleHits={proxyRulesManager.resetProxyRuleHits}
          onCancelEdit={() => setEditingProxyRuleId(null)}
          onExportRules={handleExportProxyRules}
          onImportRules={handleImportProxyRules}
        />
      )}

      {activeTab === Tab.Requests && (
        <RequestsTab
          requests={recording.requestLog}
          searchTerm={requestsSearchTerm}
          onSearchChange={setRequestsSearchTerm}
          onClearLog={recording.clearLog}
          onMockRequest={handleMockRequest}
          onProxyRequest={handleProxyRequest}
          logRequests={recording.settings.logRequests}
        />
      )}

      {standaloneWindowOpen && isDevTools() && <StandaloneWindowOverlay />}

      {importDialogData && (
        <ImportDialog
          importedRules={importDialogData.rules}
          existingRules={rulesManager.rules}
          onConfirm={handleConfirmImport}
          onCancel={() => setImportDialogData(null)}
        />
      )}

      {editingFolder && (
        <FolderEditor
          folder={editingFolder === EditMode.New ? null : editingFolder}
          existingFolders={foldersManager.folders}
          onSave={handleSaveFolder}
          onCancel={() => setEditingFolder(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={handleCloseToast} />}
    </div>
  );
};

export default App;
