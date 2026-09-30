import React from 'react';
import { MockRule, ProxyRule, RequestLog } from '../types';
import { Tab } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import { useFoldersManager, useProxyRulesManager, useRecording, useRulesManager } from '../hooks';
import Header from './Header';
import RulesTab from './RulesTab';
import ProxyTab from './ProxyTab';
import RequestsTab from './RequestsTab';
import DisabledBanner from './DisabledBanner';
import { TabButton } from './ui/TabButton';

interface AppWorkspaceProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  rulesManager: ReturnType<typeof useRulesManager>;
  proxyRulesManager: ReturnType<typeof useProxyRulesManager>;
  foldersManager: ReturnType<typeof useFoldersManager>;
  recording: ReturnType<typeof useRecording>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  requestsSearchTerm: string;
  setRequestsSearchTerm: (term: string) => void;
  editingRuleId: string | null;
  editingProxyRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: MockRule) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onMockRequest: (request: RequestLog) => void;
  onEditProxyRule: (id: string | null) => void;
  onSaveProxyRule: (rule: ProxyRule) => Promise<void>;
  onDeleteProxyRule: (id: string) => Promise<void>;
  onProxyRequest: (request: RequestLog) => void;
  initialMockRequest: RequestLog | null;
  initialProxyRequest: RequestLog | null;
  onExportRules: (selectedIds?: string[]) => void;
  onExportProxyRules: () => void;
  onImportRules: (file: File) => Promise<void>;
  onImportProxyRules: (file: File) => Promise<void>;
  onCreateFolder: () => void;
  onEditFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onEnableFolderRules: (id: string) => Promise<void>;
  onDisableFolderRules: (id: string) => Promise<void>;
  onCancelRuleEdit: () => void;
  onCancelProxyEdit: () => void;
  onRecordingToggle: (enabled: boolean) => Promise<void>;
}

const AppWorkspace: React.FC<AppWorkspaceProps> = ({
  activeTab,
  setActiveTab,
  rulesManager,
  proxyRulesManager,
  foldersManager,
  recording,
  searchTerm,
  setSearchTerm,
  requestsSearchTerm,
  setRequestsSearchTerm,
  editingRuleId,
  editingProxyRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onMockRequest,
  onEditProxyRule,
  onSaveProxyRule,
  onDeleteProxyRule,
  onProxyRequest,
  initialMockRequest,
  initialProxyRequest,
  onExportRules,
  onExportProxyRules,
  onImportRules,
  onImportProxyRules,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onEnableFolderRules,
  onDisableFolderRules,
  onCancelRuleEdit,
  onCancelProxyEdit,
  onRecordingToggle,
}) => {
  const { t } = useI18n();

  return (
    <>
      <Header
        enabled={recording.settings.enabled}
        logRequests={recording.settings.logRequests}
        corsAutoFix={recording.settings.corsAutoFix}
        onToggleEnabled={recording.handleGlobalToggle}
        onToggleRecording={onRecordingToggle}
        onToggleCors={recording.handleCorsToggle}
        activeTabTitle={recording.activeTabTitle}
      />

      {!recording.settings.enabled && <DisabledBanner onEnable={() => recording.handleGlobalToggle(true)} />}

      <div className='flex bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800'>
        <TabButton active={activeTab === Tab.Rules} onClick={() => setActiveTab(Tab.Rules)}>
          {t('tabs.rules')} ({rulesManager.rules.length})
        </TabButton>
        <TabButton active={activeTab === Tab.Proxy} onClick={() => setActiveTab(Tab.Proxy)}>
          {t('tabs.proxy')} ({proxyRulesManager.proxyRules.length})
        </TabButton>
        <TabButton active={activeTab === Tab.Requests} onClick={() => setActiveTab(Tab.Requests)}>
          {t('tabs.requests')} ({recording.requestLog.length})
        </TabButton>
      </div>

      {activeTab === Tab.Rules && (
        <RulesTab
          rules={rulesManager.rules}
          folders={foldersManager.folders}
          ruleWarnings={rulesManager.ruleWarnings}
          searchTerm={searchTerm}
          settings={recording.settings}
          initialRequest={initialMockRequest}
          onSearchChange={setSearchTerm}
          editingRuleId={editingRuleId}
          onEditRule={onEditRule}
          onSaveRule={onSaveRule}
          onDeleteRule={onDeleteRule}
          onToggleRule={rulesManager.toggleRule}
          onDuplicateRule={rulesManager.duplicateRule}
          onResetRuleHits={rulesManager.resetRuleHits}
          onCancelEdit={onCancelRuleEdit}
          onExportRules={onExportRules}
          onImportRules={onImportRules}
          onCreateFolder={onCreateFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onToggleFolderCollapse={foldersManager.toggleCollapse}
          onEnableFolderRules={onEnableFolderRules}
          onDisableFolderRules={onDisableFolderRules}
        />
      )}

      {activeTab === Tab.Proxy && (
        <ProxyTab
          proxyRules={proxyRulesManager.proxyRules}
          mockRules={rulesManager.rules}
          initialRequest={initialProxyRequest}
          editingRuleId={editingProxyRuleId}
          onEditRule={onEditProxyRule}
          onSaveRule={onSaveProxyRule}
          onDeleteRule={onDeleteProxyRule}
          onToggleRule={proxyRulesManager.toggleProxyRule}
          onDuplicateRule={proxyRulesManager.duplicateProxyRule}
          onResetRuleHits={proxyRulesManager.resetProxyRuleHits}
          onCancelEdit={onCancelProxyEdit}
          onExportRules={onExportProxyRules}
          onImportRules={onImportProxyRules}
        />
      )}

      {activeTab === Tab.Requests && (
        <RequestsTab
          requests={recording.requestLog}
          searchTerm={requestsSearchTerm}
          onSearchChange={setRequestsSearchTerm}
          onClearLog={recording.clearLog}
          onMockRequest={onMockRequest}
          onProxyRequest={onProxyRequest}
          logRequests={recording.settings.logRequests}
        />
      )}
    </>
  );
};

export default AppWorkspace;
