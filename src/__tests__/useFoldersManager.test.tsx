import { act, renderHook } from '@testing-library/react';
import { useFoldersManager } from '../hooks/useFoldersManager';
import { Storage } from '../storage';
import { HttpMethod, MatchType } from '../enums';
import type { Folder, MockRule } from '../types';

const folder = (id: string, parentFolderId?: string): Folder => ({
  id,
  name: id,
  parentFolderId,
  collapsed: false,
  created: 1,
});
const rule = (id: string, folderId?: string): MockRule => ({
  id,
  name: id,
  enabled: false,
  urlPattern: `/${id}`,
  matchType: MatchType.Exact,
  method: HttpMethod.Any,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
  folderId,
});

describe('useFoldersManager', () => {
  beforeEach(() => {
    (browser.runtime as unknown as { id: string }).id = 'test-extension';
    jest.spyOn(Storage, 'getFolders').mockResolvedValue([]);
    jest.spyOn(Storage, 'saveFolders').mockResolvedValue(undefined);
    jest.spyOn(Storage, 'saveRules').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('creates, renames, toggles collapse, and persists folders', async () => {
    const { result } = renderHook(() => useFoldersManager());
    await act(async () => result.current.saveFolder('Parent', null));
    const created = result.current.folders[0];
    expect(created.name).toBe('Parent');
    expect(created.collapsed).toBe(false);

    await act(async () => result.current.saveFolder('Renamed', created));
    expect(result.current.folders[0].name).toBe('Renamed');
    await act(async () => result.current.toggleCollapse(created.id));
    expect(result.current.folders[0].collapsed).toBe(true);
    expect(Storage.saveFolders).toHaveBeenCalledTimes(3);
  });

  it('deletes folders by ungrouping or recursively deleting descendants and rules', async () => {
    const { result } = renderHook(() => useFoldersManager());
    act(() => result.current.setFoldersDirectly([folder('parent'), folder('child', 'parent'), folder('other')]));
    const rules = [rule('parent-rule', 'parent'), rule('child-rule', 'child')];

    let ungrouped!: { folders: Folder[]; rules: MockRule[] };
    await act(async () => {
      ungrouped = await result.current.deleteFolderAndUpdateRules('parent', rules);
    });
    expect(ungrouped.folders.map((item) => item.id)).toEqual(['child', 'other']);
    expect(ungrouped.folders[0].parentFolderId).toBeUndefined();
    expect(ungrouped.rules.find((item) => item.id === 'parent-rule')?.folderId).toBeUndefined();

    act(() => result.current.setFoldersDirectly([folder('parent'), folder('child', 'parent'), folder('other')]));
    let recursivelyDeleted!: { folders: Folder[]; rules: MockRule[] };
    await act(async () => {
      recursivelyDeleted = await result.current.deleteFolderRecursivelyAndUpdateRules('parent', rules);
    });
    expect(recursivelyDeleted.folders.map((item) => item.id)).toEqual(['other']);
    expect(recursivelyDeleted.rules.map((item) => item.folderId)).toEqual([undefined, undefined]);
  });

  it('enables/disables only rules belonging to a folder and saves external lists', async () => {
    const { result } = renderHook(() => useFoldersManager());
    const rules = [rule('inside', 'folder'), rule('outside')];
    await expect(result.current.enableFolderRules(rules, 'folder')).resolves.toMatchObject([
      { enabled: true },
      { enabled: false },
    ]);
    await expect(result.current.disableFolderRules(rules, 'folder')).resolves.toMatchObject([
      { enabled: false },
      { enabled: false },
    ]);
    await act(async () => result.current.saveFolders([folder('saved')]));
    expect(result.current.folders[0].id).toBe('saved');
  });
});
