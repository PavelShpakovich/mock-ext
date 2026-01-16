import React, { useEffect, useState } from 'react';
import { MockRule, Folder } from '../types';
import { ValidationWarning, getRulesGroupedByFolder, getFolderRuleCounts } from '../helpers';
import RuleEditor from './RuleEditor';
import { RulesSearchBar } from './RulesSearchBar';
import { RulesToolbar } from './RulesToolbar';
import { RulesEmptyState } from './RulesEmptyState';
import { RulesList } from './RulesList';

interface RulesTabProps {
  rules: MockRule[];
  folders: Folder[];
  ruleWarnings: Map<string, ValidationWarning[]>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  editingRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: MockRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
  onResetRuleHits: (id: string) => void;
  onCancelEdit: () => void;
  onExportRules: (selectedIds?: string[]) => void;
  onImportRules: (file: File) => void;
  onCreateFolder: () => void;
  onEditFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapse: (folderId: string) => void;
  onEnableFolderRules: (folderId: string) => void;
  onDisableFolderRules: (folderId: string) => void;
}

const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  folders,
  ruleWarnings,
  searchTerm,
  onSearchChange,
  editingRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
  onResetRuleHits,
  onCancelEdit,
  onExportRules,
  onImportRules,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onToggleFolderCollapse,
  onEnableFolderRules,
  onDisableFolderRules,
}) => {
  const [mockRequest, setMockRequest] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredRules = rules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rule.name.toLowerCase().includes(searchLower) ||
      rule.urlPattern.toLowerCase().includes(searchLower) ||
      rule.method.toLowerCase().includes(searchLower)
    );
  });

  const groupedRules = getRulesGroupedByFolder(filteredRules, folders);
  const ruleCounts = getFolderRuleCounts(rules, folders);

  const enabledCounts = new Map<string | undefined, number>();
  folders.forEach((folder) => enabledCounts.set(folder.id, 0));
  enabledCounts.set(undefined, 0);
  rules.forEach((rule) => {
    if (rule.enabled) {
      const count = enabledCounts.get(rule.folderId) || 0;
      enabledCounts.set(rule.folderId, count + 1);
    }
  });

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportRules(file);
      e.target.value = '';
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const handleToggleSelection = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredRules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRules.map((r) => r.id)));
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size > 0) {
      onExportRules(Array.from(selectedIds));
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  useEffect(() => {
    const requestData = sessionStorage.getItem('mockRequest');
    if (requestData && editingRuleId === 'new') {
      setMockRequest(JSON.parse(requestData));
      sessionStorage.removeItem('mockRequest');
    } else if (!editingRuleId) {
      setMockRequest(null);
    }
  }, [editingRuleId]);

  if (editingRuleId) {
    return (
      <div className='p-6'>
        <RuleEditor
          rule={editingRuleId === 'new' ? null : rules.find((r) => r.id === editingRuleId) || null}
          onSave={onSaveRule}
          onCancel={onCancelEdit}
          mockRequest={mockRequest}
          folders={folders}
        />
      </div>
    );
  }

  return (
    <div className='p-6'>
      <RulesSearchBar value={searchTerm} onChange={onSearchChange} />

      <RulesToolbar
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        totalFilteredCount={filteredRules.length}
        totalRulesCount={rules.length}
        onToggleSelectionMode={handleToggleSelectionMode}
        onToggleSelectAll={handleToggleSelectAll}
        onExportSelected={handleExportSelected}
        onExportAll={() => onExportRules()}
        onImportClick={handleImportClick}
        onCreateFolder={onCreateFolder}
        onCreateRule={() => onEditRule('new')}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />

      {filteredRules.length === 0 ? (
        <RulesEmptyState onCreateRule={() => onEditRule('new')} />
      ) : (
        <RulesList
          groupedRules={groupedRules}
          folders={folders}
          ruleCounts={ruleCounts}
          enabledCounts={enabledCounts}
          ruleWarnings={ruleWarnings}
          searchTerm={searchTerm}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
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

export default RulesTab;
