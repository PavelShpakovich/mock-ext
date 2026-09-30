import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Storage } from '../storage';
import { Folder, MockRule } from '../types';
import { withContextCheck } from '../contextHandler';
import {
  createFolder,
  renameFolder,
  toggleFolderCollapse,
  deleteFolderAndUngroup,
  deleteFolderRecursively,
  toggleFolderRules,
} from '../helpers';

interface UseFoldersManagerReturn {
  folders: Folder[];
  loadFolders: () => Promise<void>;
  saveFolder: (name: string, editingFolder: Folder | null, parentFolderId?: string) => Promise<void>;
  deleteFolderAndUpdateRules: (
    folderId: string,
    rules: MockRule[]
  ) => Promise<{ folders: Folder[]; rules: MockRule[] }>;
  deleteFolderRecursivelyAndUpdateRules: (
    folderId: string,
    rules: MockRule[]
  ) => Promise<{ folders: Folder[]; rules: MockRule[] }>;
  toggleCollapse: (folderId: string) => Promise<void>;
  enableFolderRules: (rules: MockRule[], folderId: string) => Promise<MockRule[]>;
  disableFolderRules: (rules: MockRule[], folderId: string) => Promise<MockRule[]>;
  setFoldersDirectly: (folders: Folder[]) => void;
  /** Replace the entire folder list (used by drag-drop reordering/moving) */
  saveFolders: (folders: Folder[]) => Promise<void>;
}

/**
 * Hook to manage folders state and operations
 * Handles CRUD operations and syncing with storage
 */
export const useFoldersManager = (): UseFoldersManagerReturn => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const foldersRef = useRef(folders);

  useEffect(() => {
    const handleStorageChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && changes.folders) {
        const nextFolders = (changes.folders.newValue as Folder[] | undefined) ?? [];
        foldersRef.current = nextFolders;
        setFolders(nextFolders);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const loadFolders = useCallback(async () => {
    const loadedFolders = await withContextCheck(() => Storage.getFolders(), []);
    foldersRef.current = loadedFolders;
    setFolders(loadedFolders);
  }, []);

  const saveFolder = useCallback(async (name: string, editingFolder: Folder | null, parentFolderId?: string) => {
    const updatedFolders = !editingFolder
      ? [...foldersRef.current, createFolder(name, parentFolderId)]
      : foldersRef.current.map((folder) => (folder.id === editingFolder.id ? renameFolder(folder, name) : folder));
    foldersRef.current = updatedFolders;
    setFolders(updatedFolders);
    await Storage.saveFolders(updatedFolders);
  }, []);

  const deleteFolderAndUpdateRules = useCallback(async (folderId: string, rules: MockRule[]) => {
    const result = deleteFolderAndUngroup(foldersRef.current, rules, folderId);
    foldersRef.current = result.folders;
    setFolders(result.folders);

    await Promise.all([Storage.saveFolders(result.folders), Storage.saveRules(result.rules)]);

    return result;
  }, []);

  const deleteFolderRecursivelyAndUpdateRules = useCallback(async (folderId: string, rules: MockRule[]) => {
    const result = deleteFolderRecursively(foldersRef.current, rules, folderId);
    foldersRef.current = result.folders;
    setFolders(result.folders);

    await Promise.all([Storage.saveFolders(result.folders), Storage.saveRules(result.rules)]);

    return result;
  }, []);

  const toggleCollapse = useCallback(async (folderId: string) => {
    const updatedFolders = foldersRef.current.map((f) => (f.id === folderId ? toggleFolderCollapse(f) : f));
    foldersRef.current = updatedFolders;
    setFolders(updatedFolders);
    await Storage.saveFolders(updatedFolders);
  }, []);

  const enableFolderRules = useCallback(async (rules: MockRule[], folderId: string) => {
    return toggleFolderRules(rules, folderId, true);
  }, []);

  const disableFolderRules = useCallback(async (rules: MockRule[], folderId: string) => {
    return toggleFolderRules(rules, folderId, false);
  }, []);

  const setFoldersDirectly = useCallback((updatedFolders: Folder[]) => {
    foldersRef.current = updatedFolders;
    setFolders(updatedFolders);
  }, []);

  const saveFolders = useCallback(async (updatedFolders: Folder[]) => {
    foldersRef.current = updatedFolders;
    setFolders(updatedFolders);
    await Storage.saveFolders(updatedFolders);
  }, []);

  return useMemo(
    () => ({
      folders,
      loadFolders,
      saveFolder,
      deleteFolderAndUpdateRules,
      deleteFolderRecursivelyAndUpdateRules,
      toggleCollapse,
      enableFolderRules,
      disableFolderRules,
      setFoldersDirectly,
      saveFolders,
    }),
    [
      folders,
      loadFolders,
      saveFolder,
      deleteFolderAndUpdateRules,
      deleteFolderRecursivelyAndUpdateRules,
      toggleCollapse,
      enableFolderRules,
      disableFolderRules,
      setFoldersDirectly,
      saveFolders,
    ]
  );
};
