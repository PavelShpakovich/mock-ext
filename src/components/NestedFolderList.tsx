import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { MockRule, FolderTreeNode } from '../types';
import { ValidationWarning } from '../helpers';
import { RulesView, DragDropItemType } from '../enums';
import { SortableRuleItem } from './SortableRuleItem';
import { SortableFolderItem } from './SortableFolderItem';
import { ROOT_DROP_ZONE_ID } from '../constants';
import { useI18n } from '../contexts/I18nContext';

// Props for one level of the nested list
export interface NestedFolderListProps {
  nodes: FolderTreeNode[];
  // Ungrouped rules that belong to the current parent level (parentId === undefined at root)
  ungroupedRules: MockRule[];
  // The parent folder id of this level (undefined = root)
  parentFolderId?: string;
  depth?: number;
  // Meta
  ruleWarnings: Map<string, ValidationWarning[]>;
  ruleCounts: Map<string | undefined, number>;
  enabledCounts: Map<string | undefined, number>;
  searchTerm: string;
  selectionMode: boolean;
  selectedIds: Set<string>;
  view: RulesView;
  // Callbacks
  onToggleSelection: (id: string) => void;
  onToggleFolderCollapse: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onEnableFolderRules: (folderId: string) => void;
  onDisableFolderRules: (folderId: string) => void;
  onEditRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
  onResetRuleHits: (id: string) => void;
}

export const NestedFolderList: React.FC<NestedFolderListProps> = ({
  nodes,
  ungroupedRules,
  parentFolderId,
  depth = 0,
  ruleWarnings,
  ruleCounts,
  enabledCounts,
  searchTerm,
  selectionMode,
  selectedIds,
  view,
  onToggleSelection,
  onToggleFolderCollapse,
  onEditFolder,
  onDeleteFolder,
  onEnableFolderRules,
  onDisableFolderRules,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
  onResetRuleHits,
}) => {
  const isCompact = view === RulesView.Compact;
  const { t } = useI18n();

  const isRootLevel = parentFolderId === undefined;
  const rootDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootDropRef.current;
    if (!el || !isRootLevel) return;

    return dropTargetForElements({
      element: el,
      getData: () =>
        ({
          itemType: DragDropItemType.Folder, // Can accept both, handled in monitor
          itemId: ROOT_DROP_ZONE_ID,
          acceptsDrop: true,
          isSortable: false,
        }) as unknown as Record<string, unknown>,
    });
  }, [isRootLevel]);

  if (nodes.length === 0 && ungroupedRules.length === 0 && searchTerm) return null;

  return (
    <div
      ref={isRootLevel ? rootDropRef : undefined}
      className={clsx('flex flex-col relative', isCompact ? 'gap-2' : 'gap-4', isRootLevel && 'pb-24 min-h-50')}
    >
      {nodes.length > 0 && (
        <div className={clsx('min-h-5 flex flex-col', isCompact ? 'gap-2' : 'gap-4')}>
          {nodes.map((node, index) => {
            const { folder, childFolders, rules: folderRules } = node;

            return (
              <div key={folder.id}>
                <SortableFolderItem
                  folder={folder}
                  index={index}
                  parentFolderId={parentFolderId}
                  isCompact={isCompact}
                  ruleCount={ruleCounts.get(folder.id) ?? 0}
                  enabledCount={enabledCounts.get(folder.id) ?? 0}
                  onToggleCollapse={() => onToggleFolderCollapse(folder.id)}
                  onEdit={() => onEditFolder(folder.id)}
                  onDelete={() => onDeleteFolder(folder.id)}
                  onEnableAll={() => onEnableFolderRules(folder.id)}
                  onDisableAll={() => onDisableFolderRules(folder.id)}
                />

                {/* Recursively render child folders + rules inside this folder */}
                {!folder.collapsed && (childFolders.length > 0 || folderRules.length > 0) && (
                  <div
                    className={clsx(
                      'border-l border-gray-200 dark:border-gray-700',
                      isCompact ? 'pl-3 ml-2 mt-2 mb-2' : 'pl-6 ml-2 mt-4 mb-4'
                    )}
                  >
                    <NestedFolderList
                      nodes={childFolders}
                      ungroupedRules={folderRules}
                      parentFolderId={folder.id}
                      depth={depth + 1}
                      ruleWarnings={ruleWarnings}
                      ruleCounts={ruleCounts}
                      enabledCounts={enabledCounts}
                      searchTerm={searchTerm}
                      selectionMode={selectionMode}
                      selectedIds={selectedIds}
                      view={view}
                      onToggleSelection={onToggleSelection}
                      onToggleFolderCollapse={onToggleFolderCollapse}
                      onEditFolder={onEditFolder}
                      onDeleteFolder={onDeleteFolder}
                      onEnableFolderRules={onEnableFolderRules}
                      onDisableFolderRules={onDisableFolderRules}
                      onEditRule={onEditRule}
                      onDeleteRule={onDeleteRule}
                      onToggleRule={onToggleRule}
                      onDuplicateRule={onDuplicateRule}
                      onResetRuleHits={onResetRuleHits}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ungrouped rules */}
      {isRootLevel && nodes.length > 0 && ungroupedRules.length > 0 && (
        <div
          className={clsx(
            'font-semibold text-gray-600 dark:text-gray-400 px-2',
            isCompact ? 'text-xs py-0.5' : 'text-sm'
          )}
        >
          {t('folders.ungrouped')}
        </div>
      )}
      {ungroupedRules.length > 0 && (
        <div className={clsx('min-h-5 flex flex-col', isCompact ? 'gap-2' : 'gap-4')}>
          {ungroupedRules.map((rule, index) => (
            <SortableRuleItem
              key={rule.id}
              rule={rule}
              warnings={ruleWarnings.get(rule.id) ?? []}
              index={index}
              folderId={parentFolderId}
              view={view}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(rule.id)}
              onToggleSelection={onToggleSelection}
              onEdit={() => onEditRule(rule.id)}
              onDelete={() => onDeleteRule(rule.id)}
              onToggle={() => onToggleRule(rule.id)}
              onDuplicate={() => onDuplicateRule(rule.id)}
              onResetHits={() => onResetRuleHits(rule.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
