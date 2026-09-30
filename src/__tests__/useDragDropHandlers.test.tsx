import { act, renderHook } from '@testing-library/react';
import { useDragDropHandlers } from '../hooks/useDragDropHandlers';
import { DragDropItemType, DropEdge, HttpMethod, MatchType } from '../enums';
import { ROOT_DROP_ZONE_ID } from '../constants';
import type { Folder, MockRule } from '../types';

interface DropEvent {
  source: { data: Record<string, unknown> };
  location: { current: { dropTargets: { data: Record<string, unknown> }[] } };
}

let monitorConfig: { onDrop: (args: DropEvent) => Promise<void> };
jest.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  monitorForElements: jest.fn((config) => {
    monitorConfig = config;
    return jest.fn();
  }),
}));
jest.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge', () => ({
  extractClosestEdge: (data: { closestEdge?: string }) => data.closestEdge ?? null,
}));

const makeRule = (id: string, folderId?: string, order = 1000): MockRule => ({
  id,
  name: id,
  enabled: true,
  urlPattern: `/api/${id}`,
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
  folderId,
  order,
});
const makeFolder = (id: string, parentFolderId?: string, order = 1000): Folder => ({
  id,
  name: id,
  collapsed: false,
  created: 1,
  parentFolderId,
  order,
});

async function drop(sourceData: Record<string, unknown>, targetData: Record<string, unknown>) {
  await act(async () => {
    await monitorConfig.onDrop({
      source: { data: sourceData },
      location: { current: { dropTargets: [{ data: targetData }] } },
    });
  });
}

describe('useDragDropHandlers', () => {
  it('moves a rule into a folder and to the root with stable order values', async () => {
    const rules = [makeRule('move'), makeRule('sibling', 'target', 2000)];
    const folders = [makeFolder('target')];
    const onRulesChange = jest.fn(async () => {});
    renderHook(() => useDragDropHandlers({ rules, folders, onRulesChange, onFoldersChange: jest.fn(async () => {}) }));

    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'move' },
      { itemType: DragDropItemType.Folder, itemId: 'target', acceptsDrop: true }
    );
    expect(onRulesChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'move', folderId: 'target', order: 3000 })])
    );

    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'move' },
      { itemType: DragDropItemType.Folder, itemId: ROOT_DROP_ZONE_ID, acceptsDrop: true }
    );
    expect(onRulesChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'move', folderId: undefined, order: 2000 })])
    );
  });

  it('moves folders, reorders rules at the bottom edge, and ignores missing targets', async () => {
    const rules = [makeRule('first', 'parent', 1000), makeRule('second', 'parent', 2000)];
    const folders = [makeFolder('child'), makeFolder('parent')];
    const onRulesChange = jest.fn(async () => {});
    const onFoldersChange = jest.fn(async () => {});
    renderHook(() => useDragDropHandlers({ rules, folders, onRulesChange, onFoldersChange }));

    await drop(
      { itemType: DragDropItemType.Folder, itemId: 'child' },
      { itemType: DragDropItemType.Folder, itemId: 'parent', acceptsDrop: true }
    );
    expect(onFoldersChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'child', parentFolderId: 'parent' })])
    );

    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'first' },
      {
        itemType: DragDropItemType.Rule,
        itemId: 'second',
        sourceParentId: 'parent',
        isSortable: true,
        closestEdge: DropEdge.Bottom,
      }
    );
    expect(onRulesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'second', order: 0 }),
        expect.objectContaining({ id: 'first', order: 1000 }),
      ])
    );

    const calls = onRulesChange.mock.calls.length;
    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'absent' },
      { itemType: DragDropItemType.Folder, itemId: 'parent', acceptsDrop: true }
    );
    expect(onRulesChange).toHaveBeenCalledTimes(calls);
    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'first' },
      { itemType: DragDropItemType.Rule, itemId: 'second', isSortable: true }
    );
  });

  it('reorders folders and handles sortable cross-type drops and invalid targets', async () => {
    const rules = [makeRule('rule', 'parent')];
    const folders = [
      makeFolder('parent', undefined, 1000),
      makeFolder('child', 'parent', 1000),
      makeFolder('other', undefined, 2000),
    ];
    const onRulesChange = jest.fn(async () => {});
    const onFoldersChange = jest.fn(async () => {});
    renderHook(() => useDragDropHandlers({ rules, folders, onRulesChange, onFoldersChange }));

    await drop(
      { itemType: DragDropItemType.Folder, itemId: 'other' },
      {
        itemType: DragDropItemType.Folder,
        itemId: 'parent',
        sourceParentId: undefined,
        isSortable: true,
        closestEdge: DropEdge.Top,
      }
    );
    expect(onFoldersChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'other', order: 0 }),
        expect.objectContaining({ id: 'parent', order: 1000 }),
      ])
    );

    await drop(
      { itemType: DragDropItemType.Rule, itemId: 'rule' },
      { itemType: DragDropItemType.Folder, itemId: 'parent', sourceParentId: undefined, isSortable: true }
    );
    expect(onRulesChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'rule', folderId: undefined })])
    );

    const folderCalls = onFoldersChange.mock.calls.length;
    await drop(
      { itemType: DragDropItemType.Folder, itemId: 'parent' },
      { itemType: DragDropItemType.Rule, itemId: 'rule', sourceParentId: 'child', isSortable: true }
    );
    expect(onFoldersChange).toHaveBeenCalledTimes(folderCalls);
    await act(async () =>
      monitorConfig.onDrop({
        source: { data: { itemType: DragDropItemType.Rule, itemId: 'rule' } },
        location: { current: { dropTargets: [] } },
      })
    );
  });
});
