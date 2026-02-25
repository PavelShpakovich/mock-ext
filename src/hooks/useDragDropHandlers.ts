import { useEffect } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { MockRule, Folder, DragDropData } from '../types';
import { DragDropItemType, DropEdge } from '../enums';
import { ROOT_DROP_ZONE_ID } from '../constants';
import {
  validateRuleDropTarget,
  validateFolderDropTarget,
  reorderItems,
  moveRuleToFolderWithOrder,
  moveFolderToParent,
  getRulesInFolderByOrder,
  getFoldersInParentByOrder,
} from '../helpers/folderManagement';

interface UseDragDropHandlersOptions {
  rules: MockRule[];
  folders: Folder[];
  onRulesChange: (updated: MockRule[]) => Promise<void>;
  onFoldersChange: (updated: Folder[]) => Promise<void>;
}

export const useDragDropHandlers = ({ rules, folders, onRulesChange, onFoldersChange }: UseDragDropHandlersOptions) => {
  useEffect(() => {
    return monitorForElements({
      onDrop: async ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const dragData = source.data as unknown as DragDropData;
        const dropData = target.data as unknown as DragDropData;

        if (!dragData || !dropData) return;

        const isDropToRoot = dropData.itemId === ROOT_DROP_ZONE_ID;
        const isDropIntoFolder =
          dropData.acceptsDrop &&
          dropData.itemType === DragDropItemType.Folder &&
          !dropData.isSortable &&
          !isDropToRoot;
        const closestEdge = extractClosestEdge(target.data);

        const handleMoveRuleIntoFolder = async (ruleId: string, targetFolderId: string | undefined) => {
          const rule = rules.find((r) => r.id === ruleId);
          if (!rule) return;

          const validation = validateRuleDropTarget(rule, targetFolderId, folders);
          if (!validation.isValid) return;

          const siblingsInTarget = getRulesInFolderByOrder(rules, targetFolderId);
          const newOrder =
            siblingsInTarget.length > 0 ? Math.max(...siblingsInTarget.map((r) => r.order ?? 0)) + 1000 : 1000;

          const updatedRules = rules.map((r) =>
            r.id === ruleId ? moveRuleToFolderWithOrder(r, targetFolderId, newOrder) : r
          );
          await onRulesChange(updatedRules);
        };

        const handleMoveFolderIntoFolder = async (folderId: string, targetFolderId: string | undefined) => {
          const folder = folders.find((f) => f.id === folderId);
          if (!folder) return;

          const validation = validateFolderDropTarget(folder, targetFolderId, folders);
          if (!validation.isValid) return;

          const siblingsInTarget = getFoldersInParentByOrder(folders, targetFolderId);
          const newOrder =
            siblingsInTarget.length > 0 ? Math.max(...siblingsInTarget.map((f) => f.order ?? 0)) + 1000 : 1000;

          const updatedFolders = folders.map((f) =>
            f.id === folderId ? moveFolderToParent(f, targetFolderId, newOrder) : f
          );
          await onFoldersChange(updatedFolders);
        };

        const handleReorderRule = async (
          ruleId: string,
          targetParentId: string | undefined,
          targetItemId: string,
          edge: DropEdge | null
        ) => {
          const rule = rules.find((r) => r.id === ruleId);
          if (!rule) return;

          const validation = validateRuleDropTarget(rule, targetParentId, folders);
          if (!validation.isValid) return;

          let updatedRules = rules;
          if (rule.folderId !== targetParentId) {
            updatedRules = rules.map((r) => (r.id === ruleId ? moveRuleToFolderWithOrder(r, targetParentId) : r));
          }

          const siblings = getRulesInFolderByOrder(updatedRules, targetParentId);
          const draggedIndex = siblings.findIndex((r) => r.id === ruleId);
          let targetIndex = siblings.findIndex((r) => r.id === targetItemId);

          if (edge === DropEdge.Bottom) {
            targetIndex += 1;
          }

          if (draggedIndex !== -1 && targetIndex !== -1) {
            if (draggedIndex < targetIndex) {
              targetIndex -= 1;
            }
            const reordered = reorderItems(siblings, ruleId, targetIndex);

            const reorderedIds = new Set(reordered.map((r) => r.id));
            updatedRules = [...updatedRules.filter((r) => !reorderedIds.has(r.id)), ...reordered];

            await onRulesChange(updatedRules);
          }
        };

        const handleReorderFolder = async (
          folderId: string,
          targetParentId: string | undefined,
          targetItemId: string,
          edge: DropEdge | null
        ) => {
          const folder = folders.find((f) => f.id === folderId);
          if (!folder) return;

          const validation = validateFolderDropTarget(folder, targetParentId, folders);
          if (!validation.isValid) return;

          let updatedFolders = folders;
          if (folder.parentFolderId !== targetParentId) {
            updatedFolders = folders.map((f) => (f.id === folderId ? moveFolderToParent(f, targetParentId) : f));
          }

          const siblings = getFoldersInParentByOrder(updatedFolders, targetParentId);
          const draggedIndex = siblings.findIndex((f) => f.id === folderId);
          let targetIndex = siblings.findIndex((f) => f.id === targetItemId);

          if (edge === DropEdge.Bottom) {
            targetIndex += 1;
          }

          if (draggedIndex !== -1 && targetIndex !== -1) {
            if (draggedIndex < targetIndex) {
              targetIndex -= 1;
            }
            const reordered = reorderItems(siblings, folderId, targetIndex);

            const reorderedIds = new Set(reordered.map((f) => f.id));
            updatedFolders = [...updatedFolders.filter((f) => !reorderedIds.has(f.id)), ...reordered];

            await onFoldersChange(updatedFolders);
          }
        };

        // Case 1: Dropping INTO a folder or ROOT
        if (isDropIntoFolder || isDropToRoot) {
          const targetFolderId = isDropToRoot ? undefined : dropData.itemId;

          if (dragData.itemType === DragDropItemType.Rule) {
            await handleMoveRuleIntoFolder(dragData.itemId, targetFolderId);
          } else if (dragData.itemType === DragDropItemType.Folder) {
            await handleMoveFolderIntoFolder(dragData.itemId, targetFolderId);
          }
          return;
        }

        // Case 2: Reordering/moving in sortable lists
        if (dropData.isSortable && dragData.itemType === dropData.itemType) {
          const targetParentId = dropData.sourceParentId;

          if (dragData.itemType === DragDropItemType.Rule) {
            await handleReorderRule(dragData.itemId, targetParentId, dropData.itemId, closestEdge as DropEdge | null);
          } else if (dragData.itemType === DragDropItemType.Folder) {
            await handleReorderFolder(dragData.itemId, targetParentId, dropData.itemId, closestEdge as DropEdge | null);
          }
          return;
        }

        // Case 3: Dropping a Rule onto a Folder (sortable item)
        if (
          dropData.isSortable &&
          dragData.itemType === DragDropItemType.Rule &&
          dropData.itemType === DragDropItemType.Folder
        ) {
          await handleMoveRuleIntoFolder(dragData.itemId, dropData.sourceParentId);
          return;
        }

        // Case 4: Dropping a Folder onto a Rule (sortable item)
        if (
          dropData.isSortable &&
          dragData.itemType === DragDropItemType.Folder &&
          dropData.itemType === DragDropItemType.Rule
        ) {
          await handleMoveFolderIntoFolder(dragData.itemId, dropData.sourceParentId);
          return;
        }
      },
    });
  }, [rules, folders, onRulesChange, onFoldersChange]);

  return {};
};
