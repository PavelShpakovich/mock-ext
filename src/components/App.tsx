import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';
import { MockRule, Settings, RequestLog, Folder } from '../types';
import { Tab, ImportMode, ToastType, ConfirmDialogVariant, FolderEditMode } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import { withContextCheck } from '../contextHandler';
import {
  validateAllRules,
  ValidationWarning,
  createFolder,
  renameFolder,
  toggleFolderCollapse,
  deleteFolderAndUngroup,
  toggleFolderRules,
} from '../helpers';
import {
  findValidWebTab,
  sendStartRecordingMessage,
  sendStopRecordingMessage,
  getRecordingStatus,
  createDisabledSettings,
} from '../helpers/recording';
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
import { TabButton } from './ui/TabButton';
import { ImportDialog } from './ui/ImportDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast } from './ui/Toast';

const App: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Rules);
  const [rules, setRules] = useState<MockRule[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    logRequests: false,
    showNotifications: true,
    corsAutoFix: false,
  });
  const [requestLog, setRequestLog] = useState<RequestLog[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | FolderEditMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');
  const [ruleWarnings, setRuleWarnings] = useState<Map<string, ValidationWarning[]>>(new Map());
  const [importDialogData, setImportDialogData] = useState<{ rules: MockRule[] } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const loadRequestLog = useCallback(async () => {
    const loadedRequestLog = await withContextCheck(() => Storage.getRequestLog(), []);
    setRequestLog(loadedRequestLog);
  }, []);

  const startRecording = useCallback(
    async (tab: chrome.tabs.Tab): Promise<boolean> => {
      const response = await withContextCheck(() => sendStartRecordingMessage(tab.id!), { success: false });

      if (response?.success) {
        const newSettings = { ...settings, logRequests: true };
        setSettings(newSettings);
        await Storage.saveSettings(newSettings);
        setActiveTabTitle(tab.title || 'Unknown Tab');
        setActiveTab(Tab.Requests);
        return true;
      }

      return false;
    },
    [settings]
  );

  const stopRecording = useCallback(async (): Promise<void> => {
    await withContextCheck(() => sendStopRecordingMessage()).catch(() => {});
    const newSettings = { ...settings, logRequests: false };
    setSettings(newSettings);
    await Storage.saveSettings(newSettings);
    setActiveTabTitle('');
  }, [settings]);

  useEffect(() => {
    loadData();

    // Listen for rule updates from background (e.g., counter increments)
    const messageListener = (message: any) => {
      if (message.action === 'rulesUpdated') {
        loadData();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    // Always poll for request log updates when recording is active
    // This ensures the badge count updates even when on Rules tab
    if (settings.logRequests) {
      loadRequestLog();
      const interval = setInterval(loadRequestLog, 500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [settings.logRequests, loadRequestLog]);

  const loadData = async () => {
    const [loadedRules, loadedFolders, loadedSettings, loadedRequestLog] = await Promise.all([
      withContextCheck(() => Storage.getRules(), []),
      withContextCheck(() => Storage.getFolders(), []),
      withContextCheck(() => Storage.getSettings(), {
        enabled: true,
        logRequests: false,
        showNotifications: false,
        corsAutoFix: false,
      }),
      withContextCheck(() => Storage.getRequestLog(), []),
    ]);

    setRules(loadedRules);
    setFolders(loadedFolders);
    setSettings(loadedSettings);
    setRequestLog(loadedRequestLog);

    // Validate all rules
    const warnings = validateAllRules(loadedRules);
    setRuleWarnings(warnings);

    if (loadedSettings.logRequests) {
      try {
        const response = await withContextCheck(() => getRecordingStatus(), { success: false });
        if (response.success && response.data?.tabId) {
          const tab = await chrome.tabs.get(response.data.tabId);
          setActiveTabTitle(tab.title || 'Unknown Tab');
        }
      } catch (error) {
        console.error('Failed to restore recording status:', error);
      }
    }
  };

  const handleGlobalToggle = useCallback(
    async (enabled: boolean) => {
      const newSettings = enabled ? { ...settings, enabled } : createDisabledSettings(settings);

      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() => chrome.runtime.sendMessage({ action: 'toggleMocking', enabled })).catch(() => {});

      if (!enabled && settings.logRequests) {
        setActiveTabTitle('');
      }
    },
    [settings]
  );

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      if (logRequests && !settings.enabled) {
        return;
      }

      try {
        if (logRequests) {
          const webTab = await findValidWebTab();
          if (webTab?.id) {
            await startRecording(webTab);
          }
        } else {
          await stopRecording();
        }
      } catch (error) {
        console.error('Recording toggle error:', error);
      }
    },
    [settings.enabled, startRecording, stopRecording]
  );

  const handleCorsToggle = useCallback(
    async (corsAutoFix: boolean) => {
      const newSettings = { ...settings, corsAutoFix };
      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() =>
        chrome.runtime.sendMessage({ action: 'updateSettings', settings: newSettings })
      ).catch(() => {});
    },
    [settings]
  );

  const updateRulesEverywhere = async (updatedRules: MockRule[]): Promise<void> => {
    setRules(updatedRules);

    const warnings = validateAllRules(updatedRules);
    setRuleWarnings(warnings);

    await Storage.saveRules(updatedRules);
    await withContextCheck(() => chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules })).catch(
      () => {}
    );
  };

  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      let updatedRules: MockRule[];
      if (editingRuleId && editingRuleId !== 'new') {
        updatedRules = rules.map((r) => (r.id === editingRuleId ? rule : r));
      } else {
        updatedRules = [...rules, rule];
      }

      await updateRulesEverywhere(updatedRules);
      setEditingRuleId(null);
    },
    [editingRuleId, rules]
  );

  const handleDeleteRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.filter((r) => r.id !== id);
      await updateRulesEverywhere(updatedRules);
      if (editingRuleId === id) {
        setEditingRuleId(null);
      }
    },
    [rules, editingRuleId]
  );

  const handleToggleRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  const handleDuplicateRule = useCallback(
    async (id: string) => {
      const ruleToDuplicate = rules.find((r) => r.id === id);
      if (!ruleToDuplicate) return;

      const now = Date.now();
      const duplicatedRule: MockRule = {
        ...ruleToDuplicate,
        id: uuidv4(),
        name: `${ruleToDuplicate.name} (Copy)`,
        created: now,
        modified: now,
      };

      const updatedRules = [...rules, duplicatedRule];
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  const handleResetRuleHits = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) =>
        r.id === id
          ? {
              ...r,
              matchCount: 0,
              lastMatched: undefined,
            }
          : r
      );
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  const handleClearLog = useCallback(async () => {
    await Storage.clearRequestLog();
    setRequestLog([]);
  }, []);

  const handleMockRequest = useCallback((request: RequestLog) => {
    setActiveTab(Tab.Rules);
    setEditingRuleId('new');
    sessionStorage.setItem('mockRequest', JSON.stringify(request));
  }, []);

  const handleExportRules = useCallback(
    (selectedIds?: string[]) => {
      const dataStr = exportRulesToJSON(rules, selectedIds);
      const filename = generateExportFilename();
      downloadFile(dataStr, filename, 'application/json');
    },
    [rules]
  );

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const importedRules = await parseImportFile(file);
        const validation = validateImportedRules(importedRules);

        if (!validation.valid) {
          setToast({ type: ToastType.Error, message: t('rules.importError') + ': ' + validation.error });
          return;
        }

        setImportDialogData({ rules: importedRules });
      } catch (error) {
        console.error('Import error:', error);
        setToast({ type: ToastType.Error, message: t('rules.importError') + ': ' + (error as Error).message });
      }
    },
    [t]
  );

  const handleConfirmImport = useCallback(
    async (mode: ImportMode) => {
      if (!importDialogData) return;

      try {
        const importedRules = importDialogData.rules;
        const updatedRules = mode === ImportMode.Merge ? mergeRules(rules, importedRules) : importedRules;
        const newRulesCount = mode === ImportMode.Merge ? updatedRules.length - rules.length : importedRules.length;

        await updateRulesEverywhere(updatedRules);
        setImportDialogData(null);
        setToast({
          type: ToastType.Success,
          message: t('rules.importSuccess').replace('{count}', newRulesCount.toString()),
        });
      } catch (error) {
        console.error('Import error:', error);
        setToast({ type: ToastType.Error, message: t('rules.importError') + ': ' + (error as Error).message });
      }
    },
    [importDialogData, rules, t]
  );

  // Folder management handlers
  const handleCreateFolder = useCallback(() => {
    setEditingFolder(FolderEditMode.New);
  }, []);

  const handleEditFolder = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setEditingFolder(folder);
      }
    },
    [folders]
  );

  const handleSaveFolder = useCallback(
    async (name: string) => {
      let updatedFolders: Folder[];

      if (editingFolder === FolderEditMode.New) {
        const newFolder = createFolder(name);
        updatedFolders = [...folders, newFolder];
      } else if (editingFolder) {
        updatedFolders = folders.map((f) => (f.id === editingFolder.id ? renameFolder(f, name) : f));
      } else {
        return;
      }

      setFolders(updatedFolders);
      await Storage.saveFolders(updatedFolders);
      setEditingFolder(null);
    },
    [editingFolder, folders]
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;

      setConfirmDialog({
        title: t('folders.deleteFolder'),
        message: t('folders.deleteConfirmMessage', { name: folder.name }),
        variant: ConfirmDialogVariant.Danger,
        onConfirm: async () => {
          const result = deleteFolderAndUngroup(folders, rules, folderId);
          setFolders(result.folders);
          setRules(result.rules);

          await Promise.all([Storage.saveFolders(result.folders), Storage.saveRules(result.rules)]);

          await withContextCheck(() =>
            chrome.runtime.sendMessage({ action: 'updateRules', rules: result.rules })
          ).catch(() => {});

          setConfirmDialog(null);
        },
      });
    },
    [folders, rules, t]
  );

  const handleToggleFolderCollapse = useCallback(
    async (folderId: string) => {
      const updatedFolders = folders.map((f) => (f.id === folderId ? toggleFolderCollapse(f) : f));
      setFolders(updatedFolders);
      await Storage.saveFolders(updatedFolders);
    },
    [folders]
  );

  const handleEnableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = toggleFolderRules(rules, folderId, true);
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  const handleDisableFolderRules = useCallback(
    async (folderId: string) => {
      const updatedRules = toggleFolderRules(rules, folderId, false);
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white'>
      <Header
        enabled={settings.enabled}
        logRequests={settings.logRequests}
        corsAutoFix={settings.corsAutoFix}
        onToggleEnabled={handleGlobalToggle}
        onToggleRecording={handleRecordingToggle}
        onToggleCors={handleCorsToggle}
        activeTabTitle={activeTabTitle}
      />

      <div className='flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm'>
        <TabButton active={activeTab === Tab.Rules} onClick={() => setActiveTab(Tab.Rules)}>
          {t('tabs.rules')} ({rules.length})
        </TabButton>
        <TabButton active={activeTab === Tab.Requests} onClick={() => setActiveTab(Tab.Requests)}>
          {t('tabs.requests')} ({requestLog.length})
        </TabButton>
      </div>

      {activeTab === Tab.Rules ? (
        <RulesTab
          rules={rules}
          folders={folders}
          ruleWarnings={ruleWarnings}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          editingRuleId={editingRuleId}
          onEditRule={setEditingRuleId}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={handleToggleRule}
          onDuplicateRule={handleDuplicateRule}
          onResetRuleHits={handleResetRuleHits}
          onCancelEdit={() => setEditingRuleId(null)}
          onExportRules={handleExportRules}
          onImportRules={handleImportRules}
          onCreateFolder={handleCreateFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolderCollapse={handleToggleFolderCollapse}
          onEnableFolderRules={handleEnableFolderRules}
          onDisableFolderRules={handleDisableFolderRules}
        />
      ) : (
        <RequestsTab
          requests={requestLog}
          searchTerm={requestsSearchTerm}
          onSearchChange={setRequestsSearchTerm}
          onClearLog={handleClearLog}
          onMockRequest={handleMockRequest}
          logRequests={settings.logRequests}
        />
      )}

      {importDialogData && (
        <ImportDialog
          importedRules={importDialogData.rules}
          existingRules={rules}
          onConfirm={handleConfirmImport}
          onCancel={() => setImportDialogData(null)}
        />
      )}

      {editingFolder && (
        <FolderEditor
          folder={editingFolder === FolderEditMode.New ? null : editingFolder}
          existingFolders={folders}
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
