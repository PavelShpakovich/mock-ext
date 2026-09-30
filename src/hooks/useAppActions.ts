import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { Folder, MockRule, ProxyRule, RequestLog } from '../types';
import { ConfirmDialogVariant, EditMode, Tab, ToastType } from '../enums';
import { useRulesManager } from './useRulesManager';
import { useProxyRulesManager } from './useProxyRulesManager';
import { useFoldersManager } from './useFoldersManager';
import { useRecording } from './useRecording';

interface ConfirmDialogState {
  title: string;
  message: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
}

interface UseAppActionsOptions {
  rulesManager: ReturnType<typeof useRulesManager>;
  proxyRulesManager: ReturnType<typeof useProxyRulesManager>;
  foldersManager: ReturnType<typeof useFoldersManager>;
  recording: ReturnType<typeof useRecording>;
  editingRuleId: string | null;
  editingProxyRuleId: string | null;
  editingFolder: Folder | null | EditMode;
  setActiveTab: (tab: Tab) => void;
  setEditingRuleId: (id: string | null) => void;
  setEditingProxyRuleId: (id: string | null) => void;
  setPendingMockRequest: (request: RequestLog | null) => void;
  setPendingProxyRequest: (request: RequestLog | null) => void;
  setEditingFolder: (folder: Folder | null | EditMode) => void;
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialogState | null>>;
  setToast: Dispatch<SetStateAction<{ type: ToastType; message: string } | null>>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function useAppActions({
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
}: UseAppActionsOptions) {
  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      try {
        await rulesManager.saveRule(rule, editingRuleId);
      } finally {
        setEditingRuleId(null);
        setPendingMockRequest(null);
      }
    },
    [rulesManager, editingRuleId, setEditingRuleId, setPendingMockRequest]
  );

  const handleDeleteRule = useCallback(
    async (id: string) => {
      await rulesManager.deleteRule(id);
      if (editingRuleId === id) {
        setEditingRuleId(null);
        setPendingMockRequest(null);
      }
    },
    [rulesManager, editingRuleId, setEditingRuleId, setPendingMockRequest]
  );

  const handleMockRequest = useCallback(
    (request: RequestLog) => {
      setActiveTab(Tab.Rules);
      setPendingMockRequest(request);
      setEditingRuleId(EditMode.New);
    },
    [setActiveTab, setEditingRuleId, setPendingMockRequest]
  );

  const handleEditRule = useCallback(
    (id: string | null) => {
      setPendingMockRequest(null);
      setEditingRuleId(id);
    },
    [setEditingRuleId, setPendingMockRequest]
  );

  const handleSaveProxyRule = useCallback(
    async (rule: ProxyRule) => {
      try {
        await proxyRulesManager.saveProxyRule(rule, editingProxyRuleId);
      } finally {
        setEditingProxyRuleId(null);
        setPendingProxyRequest(null);
      }
    },
    [proxyRulesManager, editingProxyRuleId, setEditingProxyRuleId, setPendingProxyRequest]
  );

  const handleDeleteProxyRule = useCallback(
    async (id: string) => {
      await proxyRulesManager.deleteProxyRule(id);
      if (editingProxyRuleId === id) {
        setEditingProxyRuleId(null);
        setPendingProxyRequest(null);
      }
    },
    [proxyRulesManager, editingProxyRuleId, setEditingProxyRuleId, setPendingProxyRequest]
  );

  const handleProxyRequest = useCallback(
    (request: RequestLog) => {
      setActiveTab(Tab.Proxy);
      setPendingProxyRequest(request);
      setEditingProxyRuleId(EditMode.New);
    },
    [setActiveTab, setEditingProxyRuleId, setPendingProxyRequest]
  );

  const handleEditProxyRule = useCallback(
    (id: string | null) => {
      setPendingProxyRequest(null);
      setEditingProxyRuleId(id);
    },
    [setEditingProxyRuleId, setPendingProxyRequest]
  );

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      const result = await recording.handleRecordingToggle(logRequests);
      if (logRequests) {
        setActiveTab(Tab.Requests);
        if (result?.reloaded) setToast({ type: ToastType.Info, message: t('recording.pageReloaded') });
      }
    },
    [recording, setActiveTab, setToast, t]
  );

  const handleCreateFolder = useCallback(() => setEditingFolder(EditMode.New), [setEditingFolder]);

  const handleEditFolder = useCallback(
    (folderId: string) => {
      const folder = foldersManager.folders.find((item) => item.id === folderId);
      if (folder) setEditingFolder(folder);
    },
    [foldersManager.folders, setEditingFolder]
  );

  const handleSaveFolder = useCallback(
    async (name: string) => {
      const folder = editingFolder === EditMode.New ? null : (editingFolder as Folder | null);
      await foldersManager.saveFolder(name, folder);
      setEditingFolder(null);
    },
    [editingFolder, foldersManager, setEditingFolder]
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folder = foldersManager.folders.find((item) => item.id === folderId);
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
    [foldersManager, rulesManager, setConfirmDialog, t]
  );

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

  const handleCloseToast = useCallback(() => setToast(null), [setToast]);

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
