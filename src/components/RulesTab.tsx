import React, { useEffect, useState } from 'react';
import { MockRule, Folder, Settings, RequestLog } from '../types';
import { ValidationWarning, getFolderRuleCounts } from '../helpers';
import { RulesView, EditMode } from '../enums';
import { Storage } from '../storage';
import RuleEditor from './RuleEditor';
import { RulesSearchBar } from './RulesSearchBar';
import { RulesToolbar } from './RulesToolbar';
import { RulesEmptyState } from './RulesEmptyState';
import { RulesList } from './RulesList';
import { buildFolderTree } from '../helpers/folderManagement';

interface RulesTabProps {
  rules: MockRule[];
  folders: Folder[];
  ruleWarnings: Map<string, ValidationWarning[]>;
  searchTerm: string;
  settings: Settings;
  onSearchChange: (term: string) => void;
  editingRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: MockRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
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
  settings,
  onSearchChange,
  editingRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
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
  const [mockRequest, setMockRequest] = useState<RequestLog | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rulesView, setRulesView] = useState<RulesView>((settings.rulesView as RulesView) || RulesView.Detailed);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync rulesView with settings when they change
  useEffect(() => {
    if (settings.rulesView) {
      setRulesView(settings.rulesView as RulesView);
    }
  }, [settings.rulesView]);

  const filteredRules = rules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rule.name.toLowerCase().includes(searchLower) ||
      rule.urlPattern.toLowerCase().includes(searchLower) ||
      rule.method.toLowerCase().includes(searchLower)
    );
  });

  const folderTree = buildFolderTree(folders, filteredRules);
  const ungroupedRules = filteredRules.filter((r) => !r.folderId);
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

  const handleViewChange = async (view: RulesView) => {
    setRulesView(view);
    const currentSettings = await Storage.getSettings();
    await Storage.saveSettings({ ...currentSettings, rulesView: view });
  };

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
    if (requestData && editingRuleId === EditMode.New) {
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
          rule={editingRuleId === EditMode.New ? null : rules.find((r) => r.id === editingRuleId) || null}
          onSave={onSaveRule}
          onCancel={onCancelEdit}
          mockRequest={mockRequest}
          folders={folders}
        />
      </div>
    );
  }

  return (
    <div className='p-6 flex flex-col gap-3'>
      <RulesSearchBar value={searchTerm} onChange={onSearchChange} />

      <RulesToolbar
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        totalFilteredCount={filteredRules.length}
        totalRulesCount={rules.length}
        currentView={rulesView}
        onToggleSelectionMode={handleToggleSelectionMode}
        onToggleSelectAll={handleToggleSelectAll}
        onExportSelected={handleExportSelected}
        onExportAll={() => onExportRules()}
        onImportClick={handleImportClick}
        onCreateFolder={onCreateFolder}
        onCreateRule={() => onEditRule(EditMode.New)}
        onViewChange={handleViewChange}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />

      {filteredRules.length === 0 && folders.length === 0 && (
        <RulesEmptyState onCreateRule={() => onEditRule(EditMode.New)} />
      )}

      {(filteredRules.length > 0 || folders.length > 0) && (
        <RulesList
          folderTree={folderTree}
          ungroupedRules={ungroupedRules}
          folders={folders}
          ruleCounts={ruleCounts}
          enabledCounts={enabledCounts}
          ruleWarnings={ruleWarnings}
          searchTerm={searchTerm}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          view={rulesView}
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
        />
      )}
    </div>
  );
};

export default RulesTab;
