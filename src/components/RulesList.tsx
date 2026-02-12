import React from 'react';
import { MockRule, Folder } from '../types';
import { ValidationWarning } from '../helpers';
import FolderItem from './FolderItem';
import { CompactFolderItem } from './CompactFolderItem';
import { SelectableRuleItem } from './SelectableRuleItem';
import { CompactRuleItem } from './CompactRuleItem';
import { RulesView } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import clsx from 'clsx';

interface RulesListProps {
  groupedRules: Map<string | undefined, MockRule[]>;
  folders: Folder[];
  ruleCounts: Map<string | undefined, number>;
  enabledCounts: Map<string | undefined, number>;
  ruleWarnings: Map<string, ValidationWarning[]>;
  searchTerm: string;
  selectionMode: boolean;
  selectedIds: Set<string>;
  view: RulesView;
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

export const RulesList: React.FC<RulesListProps> = ({
  groupedRules,
  folders,
  ruleCounts,
  enabledCounts,
  ruleWarnings,
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
  const { t } = useI18n();
  const isCompact = view === RulesView.Compact;

  return (
    <div className={clsx('flex flex-col', isCompact ? 'gap-1' : 'gap-4')}>
      {folders.map((folder) => {
        const folderRules = groupedRules.get(folder.id) || [];
        if (folderRules.length === 0 && searchTerm) {
          return null;
        }

        return (
          <div key={folder.id}>
            {isCompact ? (
              <CompactFolderItem
                folder={folder}
                ruleCount={ruleCounts.get(folder.id) || 0}
                enabledCount={enabledCounts.get(folder.id) || 0}
                onToggleCollapse={() => onToggleFolderCollapse(folder.id)}
                onEdit={() => onEditFolder(folder.id)}
                onDelete={() => onDeleteFolder(folder.id)}
                onEnableAll={() => onEnableFolderRules(folder.id)}
                onDisableAll={() => onDisableFolderRules(folder.id)}
              />
            ) : (
              <FolderItem
                folder={folder}
                ruleCount={ruleCounts.get(folder.id) || 0}
                enabledCount={enabledCounts.get(folder.id) || 0}
                onToggleCollapse={() => onToggleFolderCollapse(folder.id)}
                onEdit={() => onEditFolder(folder.id)}
                onDelete={() => onDeleteFolder(folder.id)}
                onEnableAll={() => onEnableFolderRules(folder.id)}
                onDisableAll={() => onDisableFolderRules(folder.id)}
              />
            )}

            {!folder.collapsed && (
              <div className={clsx(isCompact ? 'pl-4 gap-1 mt-0.5' : 'pl-8 pt-2 gap-2', 'flex flex-col')}>
                {folderRules.map((rule) =>
                  isCompact ? (
                    <CompactRuleItem
                      key={rule.id}
                      rule={rule}
                      warnings={ruleWarnings.get(rule.id) || []}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(rule.id)}
                      onToggleSelection={onToggleSelection}
                      onEdit={() => onEditRule(rule.id)}
                      onDelete={() => onDeleteRule(rule.id)}
                      onToggle={() => onToggleRule(rule.id)}
                      onDuplicate={() => onDuplicateRule(rule.id)}
                    />
                  ) : (
                    <SelectableRuleItem
                      key={rule.id}
                      rule={rule}
                      warnings={ruleWarnings.get(rule.id) || []}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(rule.id)}
                      onToggleSelection={onToggleSelection}
                      onEdit={() => onEditRule(rule.id)}
                      onDelete={() => onDeleteRule(rule.id)}
                      onToggle={() => onToggleRule(rule.id)}
                      onDuplicate={() => onDuplicateRule(rule.id)}
                      onResetHits={() => onResetRuleHits(rule.id)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}

      {(groupedRules.get(undefined) || []).length > 0 && (
        <div className={clsx('flex flex-col', isCompact ? 'gap-1' : 'gap-2')}>
          {folders.length > 0 && (
            <div
              className={clsx(
                'font-semibold text-gray-600 dark:text-gray-400 px-2',
                isCompact ? 'text-xs py-0.5' : 'text-sm'
              )}
            >
              {t('folders.ungrouped')}
            </div>
          )}
          <div className={clsx('flex flex-col', isCompact ? 'gap-1' : 'gap-2')}>
            {(groupedRules.get(undefined) || []).map((rule) =>
              isCompact ? (
                <CompactRuleItem
                  key={rule.id}
                  rule={rule}
                  warnings={ruleWarnings.get(rule.id) || []}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(rule.id)}
                  onToggleSelection={onToggleSelection}
                  onEdit={() => onEditRule(rule.id)}
                  onDelete={() => onDeleteRule(rule.id)}
                  onToggle={() => onToggleRule(rule.id)}
                  onDuplicate={() => onDuplicateRule(rule.id)}
                />
              ) : (
                <SelectableRuleItem
                  key={rule.id}
                  rule={rule}
                  warnings={ruleWarnings.get(rule.id) || []}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(rule.id)}
                  onToggleSelection={onToggleSelection}
                  onEdit={() => onEditRule(rule.id)}
                  onDelete={() => onDeleteRule(rule.id)}
                  onToggle={() => onToggleRule(rule.id)}
                  onDuplicate={() => onDuplicateRule(rule.id)}
                  onResetHits={() => onResetRuleHits(rule.id)}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
