import React from 'react';
import { MockRule, Folder, FolderTreeNode } from '../types';
import { ValidationWarning } from '../helpers';
import { RulesView } from '../enums';
import { NestedFolderList } from './NestedFolderList';
import clsx from 'clsx';

interface RulesListProps {
  // Tree structure from buildFolderTree
  folderTree: FolderTreeNode[];
  // Root-level ungrouped rules (no folderId)
  ungroupedRules: MockRule[];
  // Flat lists (still needed for counts)
  folders: Folder[];
  ruleCounts: Map<string | undefined, number>;
  enabledCounts: Map<string | undefined, number>;
  ruleWarnings: Map<string, ValidationWarning[]>;
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

export const RulesList: React.FC<RulesListProps> = ({
  folderTree,
  ungroupedRules,
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
  const isCompact = view === RulesView.Compact;
  const hasContent = folderTree.length > 0 || ungroupedRules.length > 0;

  return (
    <div className={clsx('flex flex-col', isCompact ? 'gap-2' : 'gap-4')}>
      {hasContent && (
        <NestedFolderList
          nodes={folderTree}
          ungroupedRules={ungroupedRules}
          parentFolderId={undefined}
          depth={0}
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
      )}
    </div>
  );
};
