import React, { useState, useCallback, useEffect } from 'react';
import { RequestLog, Folder } from '../types';
import { Tab, ToastType, ConfirmDialogVariant, EditMode } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import { isDevTools } from '../helpers/context';
import {
  useStandaloneWindowStatus,
  useRulesManager,
  useProxyRulesManager,
  useFoldersManager,
  useRecording,
  useImportExport,
  useAppActions,
  useCrossContextSync,
  useDragDropHandlers,
} from '../hooks';
import { ImportDialogData } from '../hooks/useImportExport';
import AppWorkspace from './AppWorkspace';
import FolderEditor from './FolderEditor';
import StandaloneWindowOverlay from './StandaloneWindowOverlay';
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
  const [pendingMockRequest, setPendingMockRequest] = useState<RequestLog | null>(null);
  const [pendingProxyRequest, setPendingProxyRequest] = useState<RequestLog | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | EditMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [importDialogData, setImportDialogData] = useState<ImportDialogData | null>(null);
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

  const actions = useAppActions({
    rulesManager,
    proxyRulesManager,
    foldersManager,
    recording,
    editingRuleId,
    editingProxyRuleId,
    editingFolder,
    setActiveTab,
    setEditingRuleId,
    setEditingProxyRuleId,
    setPendingMockRequest,
    setPendingProxyRequest,
    setEditingFolder,
    setConfirmDialog,
    setToast,
    t,
  });
  const {
    handleSaveRule,
    handleDeleteRule,
    handleMockRequest,
    handleEditRule,
    handleSaveProxyRule,
    handleDeleteProxyRule,
    handleProxyRequest,
    handleEditProxyRule,
    handleRecordingToggle,
    handleCreateFolder,
    handleEditFolder,
    handleSaveFolder,
    handleDeleteFolder,
    handleEnableFolderRules,
    handleDisableFolderRules,
    handleCloseToast,
  } = actions;

  const showToast = useCallback((type: ToastType, message: string) => setToast({ type, message }), []);
  const showHookSecurityWarning = useCallback(
    (confirm: () => void | Promise<void>) => {
      setConfirmDialog({
        title: t('import.securityWarning'),
        message: t('import.securityMessage'),
        variant: ConfirmDialogVariant.Danger,
        onConfirm: async () => {
          setConfirmDialog(null);
          await confirm();
        },
      });
    },
    [t]
  );

  const { handleExportRules, handleExportProxyRules, handleImportRules, handleImportProxyRules, handleConfirmImport } =
    useImportExport({
      rules: rulesManager.rules,
      folders: foldersManager.folders,
      proxyRules: proxyRulesManager.proxyRules,
      importDialogData,
      saveRules: rulesManager.saveRules,
      saveFolders: foldersManager.saveFolders,
      saveProxyRules: proxyRulesManager.saveProxyRules,
      setImportDialogData,
      t,
      showToast,
      showSecurityWarning: showHookSecurityWarning,
    });

  useDragDropHandlers({
    rules: rulesManager.rules,
    folders: foldersManager.folders,
    onRulesChange: rulesManager.saveRules,
    onFoldersChange: foldersManager.saveFolders,
  });

  useCrossContextSync({ onRequestLogUpdated: recording.loadRequestLog });

  useEffect(() => {
    void Promise.all([
      rulesManager.loadRules(),
      proxyRulesManager.loadProxyRules(),
      foldersManager.loadFolders(),
      recording.loadSettings(),
      recording.loadRequestLog(),
    ]);
    // Initial data is loaded once; storage events keep it synchronized afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recording.settings.logRequests) setActiveTab(Tab.Requests);
  }, [recording.settings.logRequests]);

  // ===========================
  // Render
  // ===========================

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-black text-gray-800 dark:text-white'>
      <AppWorkspace
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rulesManager={rulesManager}
        proxyRulesManager={proxyRulesManager}
        foldersManager={foldersManager}
        recording={recording}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        requestsSearchTerm={requestsSearchTerm}
        setRequestsSearchTerm={setRequestsSearchTerm}
        editingRuleId={editingRuleId}
        editingProxyRuleId={editingProxyRuleId}
        onEditRule={handleEditRule}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
        onMockRequest={handleMockRequest}
        onEditProxyRule={handleEditProxyRule}
        onSaveProxyRule={handleSaveProxyRule}
        onDeleteProxyRule={handleDeleteProxyRule}
        onProxyRequest={handleProxyRequest}
        initialMockRequest={pendingMockRequest}
        initialProxyRequest={pendingProxyRequest}
        onExportRules={handleExportRules}
        onExportProxyRules={handleExportProxyRules}
        onImportRules={handleImportRules}
        onImportProxyRules={handleImportProxyRules}
        onCreateFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onEnableFolderRules={handleEnableFolderRules}
        onDisableFolderRules={handleDisableFolderRules}
        onCancelRuleEdit={() => {
          setEditingRuleId(null);
          setPendingMockRequest(null);
        }}
        onCancelProxyEdit={() => {
          setEditingProxyRuleId(null);
          setPendingProxyRequest(null);
        }}
        onRecordingToggle={handleRecordingToggle}
      />

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
