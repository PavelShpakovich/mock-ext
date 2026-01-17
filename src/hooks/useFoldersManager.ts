import { useState, useCallback } from 'react';
import { Storage } from '../storage';
import { Folder, MockRule } from '../types';
import { withContextCheck } from '../contextHandler';
import {
  createFolder,
  renameFolder,
  toggleFolderCollapse,
  deleteFolderAndUngroup,
  toggleFolderRules,
} from '../helpers';

interface UseFoldersManagerReturn {
  folders: Folder[];
  loadFolders: () => Promise<void>;
  saveFolder: (name: string, editingFolder: Folder | null) => Promise<void>;
  deleteFolderAndUpdateRules: (
    folderId: string,
    rules: MockRule[]
  ) => Promise<{ folders: Folder[]; rules: MockRule[] }>;
  toggleCollapse: (folderId: string) => Promise<void>;
  enableFolderRules: (rules: MockRule[], folderId: string) => Promise<MockRule[]>;
  disableFolderRules: (rules: MockRule[], folderId: string) => Promise<MockRule[]>;
  setFoldersDirectly: (folders: Folder[]) => void;
}

/**
 * Hook to manage folders state and operations
 * Handles CRUD operations and syncing with storage
 */
export const useFoldersManager = (): UseFoldersManagerReturn => {
  const [folders, setFolders] = useState<Folder[]>([]);

  const loadFolders = useCallback(async () => {
    const loadedFolders = await withContextCheck(() => Storage.getFolders(), []);
    setFolders(loadedFolders);
  }, []);

  const saveFolder = useCallback(
    async (name: string, editingFolder: Folder | null) => {
      let updatedFolders: Folder[];

      if (!editingFolder) {
        // Create new folder
        const newFolder = createFolder(name);
        updatedFolders = [...folders, newFolder];
      } else {
        // Rename existing folder
        updatedFolders = folders.map((f) => (f.id === editingFolder.id ? renameFolder(f, name) : f));
      }

      setFolders(updatedFolders);
      await Storage.saveFolders(updatedFolders);
      chrome.runtime.sendMessage({ action: 'foldersUpdated' }).catch(() => {});
    },
    [folders]
  );

  const deleteFolderAndUpdateRules = useCallback(
    async (folderId: string, rules: MockRule[]) => {
      const result = deleteFolderAndUngroup(folders, rules, folderId);
      setFolders(result.folders);

      await Promise.all([Storage.saveFolders(result.folders), Storage.saveRules(result.rules)]);

      await withContextCheck(() => chrome.runtime.sendMessage({ action: 'updateRules', rules: result.rules })).catch(
        () => {}
      );

      chrome.runtime.sendMessage({ action: 'foldersUpdated' }).catch(() => {});
      chrome.runtime.sendMessage({ action: 'rulesUpdated' }).catch(() => {});

      return result;
    },
    [folders]
  );

  const toggleCollapse = useCallback(
    async (folderId: string) => {
      const updatedFolders = folders.map((f) => (f.id === folderId ? toggleFolderCollapse(f) : f));
      setFolders(updatedFolders);
      await Storage.saveFolders(updatedFolders);
      chrome.runtime.sendMessage({ action: 'foldersUpdated' }).catch(() => {});
    },
    [folders]
  );

  const enableFolderRules = useCallback(async (rules: MockRule[], folderId: string) => {
    return toggleFolderRules(rules, folderId, true);
  }, []);

  const disableFolderRules = useCallback(async (rules: MockRule[], folderId: string) => {
    return toggleFolderRules(rules, folderId, false);
  }, []);

  const setFoldersDirectly = useCallback((updatedFolders: Folder[]) => {
    setFolders(updatedFolders);
  }, []);

  return {
    folders,
    loadFolders,
    saveFolder,
    deleteFolderAndUpdateRules,
    toggleCollapse,
    enableFolderRules,
    disableFolderRules,
    setFoldersDirectly,
  };
};
