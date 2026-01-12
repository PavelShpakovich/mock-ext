import React, { useState, useEffect, useCallback } from 'react';
import { Storage } from '../storage';
import { MockRule, Settings, RequestLog } from '../types';
import { useI18n } from '../contexts/I18nContext';
import Header from './Header';
import RulesTab from './RulesTab';
import RequestsTab from './RequestsTab';
import { TabButton } from './ui/TabButton';

const App: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'rules' | 'requests'>('rules');
  const [rules, setRules] = useState<MockRule[]>([]);
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    logRequests: false,
    showNotifications: true,
  });
  const [requestLog, setRequestLog] = useState<RequestLog[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');

  const loadRequestLog = useCallback(async () => {
    const loadedRequestLog = await Storage.getRequestLog();
    setRequestLog(loadedRequestLog);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Always poll for request log updates when recording is active
    // This ensures the badge count updates even when on Rules tab
    if (settings.logRequests) {
      loadRequestLog();
      const interval = setInterval(loadRequestLog, 500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [settings.logRequests, loadRequestLog]);

  const loadData = async () => {
    const [loadedRules, loadedSettings, loadedRequestLog] = await Promise.all([
      Storage.getRules(),
      Storage.getSettings(),
      Storage.getRequestLog(),
    ]);

    setRules(loadedRules);
    setSettings(loadedSettings);
    setRequestLog(loadedRequestLog);

    if (loadedSettings.logRequests) {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getRecordingStatus' });
        if (response.success && response.data?.tabId) {
          const tab = await chrome.tabs.get(response.data.tabId);
          setActiveTabTitle(tab.title || 'Unknown Tab');
        }
      } catch (error) {
        console.error('Failed to restore recording status:', error);
      }
    }
  };

  const handleGlobalToggle = useCallback(
    async (enabled: boolean) => {
      const newSettings = { ...settings, enabled };
      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      chrome.runtime.sendMessage({ action: 'toggleMocking', enabled });
    },
    [settings]
  );

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      try {
        if (logRequests) {
          const tabs = await chrome.tabs.query({ active: true });
          const webTab = tabs.find(
            (tab) =>
              tab.id !== undefined &&
              tab.url &&
              !tab.url.startsWith('chrome-extension://') &&
              !tab.url.startsWith('chrome://') &&
              !tab.url.startsWith('about:') &&
              tab.windowId !== chrome.windows.WINDOW_ID_NONE
          );

          if (!webTab?.id) {
            return;
          }

          const response = await chrome.runtime.sendMessage({
            action: 'startRecording',
            tabId: webTab.id,
          });

          if (response?.success) {
            const newSettings = { ...settings, logRequests: true };
            setSettings(newSettings);
            await Storage.saveSettings(newSettings);
            setActiveTabTitle(webTab.title || 'Unknown Tab');
            setActiveTab('requests');
          }
        } else {
          await chrome.runtime.sendMessage({ action: 'stopRecording' });
          const newSettings = { ...settings, logRequests: false };
          setSettings(newSettings);
          await Storage.saveSettings(newSettings);
          setActiveTabTitle('');
        }
      } catch (error) {
        console.error('Recording toggle error:', error);
      }
    },
    [settings]
  );

  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      let updatedRules: MockRule[];
      if (editingRuleId && editingRuleId !== 'new') {
        updatedRules = rules.map((r) => (r.id === editingRuleId ? rule : r));
      } else {
        updatedRules = [...rules, rule];
      }

      setRules(updatedRules);
      await Storage.saveRules(updatedRules);
      chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules });
      setEditingRuleId(null);
    },
    [editingRuleId, rules]
  );

  const handleDeleteRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.filter((r) => r.id !== id);
      setRules(updatedRules);
      await Storage.saveRules(updatedRules);
      chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules });
      if (editingRuleId === id) {
        setEditingRuleId(null);
      }
    },
    [rules, editingRuleId]
  );

  const handleToggleRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      setRules(updatedRules);
      await Storage.saveRules(updatedRules);
      chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules });
    },
    [rules]
  );

  const handleDuplicateRule = useCallback(
    async (id: string) => {
      const ruleToDuplicate = rules.find((r) => r.id === id);
      if (!ruleToDuplicate) return;

      const now = Date.now();
      const duplicatedRule: MockRule = {
        ...ruleToDuplicate,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${ruleToDuplicate.name} (Copy)`,
        created: now,
        modified: now,
      };

      const updatedRules = [...rules, duplicatedRule];
      setRules(updatedRules);
      await Storage.saveRules(updatedRules);
      chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules });
    },
    [rules]
  );

  const handleClearLog = useCallback(async () => {
    await Storage.clearRequestLog();
    setRequestLog([]);
  }, []);

  const handleMockRequest = useCallback((request: RequestLog) => {
    setActiveTab('rules');
    setEditingRuleId('new');
    sessionStorage.setItem('mockRequest', JSON.stringify(request));
  }, []);

  const handleExportRules = useCallback(() => {
    const dataStr = JSON.stringify(rules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockapi-rules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [rules]);

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const importedRules = JSON.parse(text);

        // Validate structure
        if (!Array.isArray(importedRules)) {
          alert(t('rules.importError') + ': Invalid format - expected array');
          return;
        }

        // Validate each rule has required fields
        const isValid = importedRules.every(
          (rule) => rule.id && rule.name && rule.urlPattern && rule.method && rule.statusCode !== undefined
        );

        if (!isValid) {
          alert(t('rules.importError') + ': Missing required fields');
          return;
        }

        // Merge with existing rules (avoid duplicates by ID)
        const existingIds = new Set(rules.map((r) => r.id));
        const newRules = importedRules.filter((rule: MockRule) => !existingIds.has(rule.id));
        const updatedRules = [...rules, ...newRules];

        setRules(updatedRules);
        await Storage.saveRules(updatedRules);
        chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules });

        alert(t('rules.importSuccess').replace('{count}', newRules.length.toString()));
      } catch (error) {
        console.error('Import error:', error);
        alert(t('rules.importError') + ': ' + (error as Error).message);
      }
    },
    [rules, t]
  );

  return (
    <div className='min-h-screen bg-black text-white'>
      <Header
        enabled={settings.enabled}
        logRequests={settings.logRequests}
        onToggleEnabled={handleGlobalToggle}
        onToggleRecording={handleRecordingToggle}
        activeTabTitle={activeTabTitle}
      />

      <div className='flex border-b border-gray-800 bg-gray-950 shadow-sm'>
        <TabButton active={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
          {t('tabs.rules')} ({rules.length})
        </TabButton>
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
          {t('tabs.requests')} ({requestLog.length})
        </TabButton>
      </div>

      {activeTab === 'rules' ? (
        <RulesTab
          rules={rules}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          editingRuleId={editingRuleId}
          onEditRule={setEditingRuleId}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={handleToggleRule}
          onDuplicateRule={handleDuplicateRule}
          onCancelEdit={() => setEditingRuleId(null)}
          onExportRules={handleExportRules}
          onImportRules={handleImportRules}
        />
      ) : (
        <RequestsTab
          requests={requestLog}
          searchTerm={requestsSearchTerm}
          onSearchChange={setRequestsSearchTerm}
          onClearLog={handleClearLog}
          onMockRequest={handleMockRequest}
          logRequests={settings.logRequests}
        />
      )}
    </div>
  );
};

export default App;
