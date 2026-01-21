import React, { useState, useCallback, useEffect } from 'react';
import { MockRule, RequestLog, Folder } from '../types';
import { Tab, ImportMode, ToastType, ConfirmDialogVariant, FolderEditMode } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import { isDevTools } from '../helpers/context';
import {
  useStandaloneWindowStatus,
  useRulesManager,
  useFoldersManager,
  useRecording,
  useCrossContextSync,
} from '../hooks';
import {
  downloadFile,
  exportRulesToJSON,
  generateExportFilename,
  validateImportedRules,
  mergeRules,
  parseImportFile,
} from '../helpers/importExport';
import Header from './Header';
import RulesTab from './RulesTab';
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
  const [editingFolder, setEditingFolder] = useState<Folder | null | FolderEditMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [importDialogData, setImportDialogData] = useState<{ rules: MockRule[] } | null>(null);
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
  const foldersManager = useFoldersManager();
  const recording = useRecording();

  // Cross-context sync - ensures state stays synchronized across all contexts
  useCrossContextSync({
    onRulesUpdated: rulesManager.loadRules,
    onSettingsUpdated: recording.loadSettings,
    onFoldersUpdated: foldersManager.loadFolders,
    onRequestLogUpdated: recording.loadRequestLog,
  });

  // Initial data load on mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        rulesManager.loadRules(),
        foldersManager.loadFolders(),
        recording.loadSettings(),
        recording.loadRequestLog(),
      ]);
    };

    loadAllData();
    // Empty deps - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================
  // Rule Handlers
  // ===========================

  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      await rulesManager.saveRule(rule, editingRuleId);
      setEditingRuleId(null);
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
    setEditingRuleId('new');
    sessionStorage.setItem('mockRequest', JSON.stringify(request));
  }, []);

  // ===========================
  // Recording Handlers
  // ===========================

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      await recording.handleRecordingToggle(logRequests);
      // Switch to Requests tab when starting recording
      if (logRequests) {
        setActiveTab(Tab.Requests);
      }
    },
    [recording]
  );

  // ===========================
  // Import/Export Handlers
  // ===========================

  const handleExportRules = useCallback(
    (selectedIds?: string[]) => {
      const dataStr = exportRulesToJSON(rulesManager.rules, selectedIds);
      const filename = generateExportFilename();
      downloadFile(dataStr, filename, 'application/json');
    },
    [rulesManager.rules]
  );

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const importedRules = await parseImportFile(file);
        const validation = validateImportedRules(importedRules);

        if (!validation.valid) {
          setToast({
            type: ToastType.Error,
            message: `${t('rules.importError')}: ${validation.error}`,
          });
          return;
        }

        setImportDialogData({ rules: importedRules });
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
        const importedRules = importDialogData.rules;
        const currentRules = rulesManager.rules;
        const updatedRules = mode === ImportMode.Merge ? mergeRules(currentRules, importedRules) : importedRules;
        const newRulesCount =
          mode === ImportMode.Merge ? updatedRules.length - currentRules.length : importedRules.length;

        // Update rules through the manager
        rulesManager.setRulesDirectly(updatedRules);
        await rulesManager.saveRule(updatedRules[0], null); // Trigger save

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
    [importDialogData, rulesManager, t]
  );

  // ===========================
  // Folder Handlers
  // ===========================

  const handleCreateFolder = useCallback(() => {
    setEditingFolder(FolderEditMode.New);
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
      const folderToEdit = editingFolder === FolderEditMode.New ? null : (editingFolder as Folder | null);
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

  const handleEnableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = await foldersManager.enableFolderRules(rulesManager.rules, folderId);
      rulesManager.setRulesDirectly(updatedRules);
    },
    [foldersManager, rulesManager]
  );

  const handleDisableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = await foldersManager.disableFolderRules(rulesManager.rules, folderId);
      rulesManager.setRulesDirectly(updatedRules);
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
        <TabButton active={activeTab === Tab.Requests} onClick={() => setActiveTab(Tab.Requests)}>
          {t('tabs.requests')} ({recording.requestLog.length})
        </TabButton>
      </div>

      {activeTab === Tab.Rules ? (
        <RulesTab
          rules={rulesManager.rules}
          folders={foldersManager.folders}
          ruleWarnings={rulesManager.ruleWarnings}
          searchTerm={searchTerm}
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
      ) : (
        <RequestsTab
          requests={recording.requestLog}
          searchTerm={requestsSearchTerm}
          onSearchChange={setRequestsSearchTerm}
          onClearLog={recording.clearLog}
          onMockRequest={handleMockRequest}
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
          folder={editingFolder === FolderEditMode.New ? null : editingFolder}
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

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
