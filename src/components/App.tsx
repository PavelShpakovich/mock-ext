import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';
import { MockRule, Settings, RequestLog } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { withContextCheck } from '../contextHandler';
import { validateAllRules, ValidationWarning } from '../helpers';
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
    corsAutoFix: false,
  });
  const [requestLog, setRequestLog] = useState<RequestLog[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');
  const [ruleWarnings, setRuleWarnings] = useState<Map<string, ValidationWarning[]>>(new Map());

  const loadRequestLog = useCallback(async () => {
    const loadedRequestLog = await withContextCheck(() => Storage.getRequestLog(), []);
    setRequestLog(loadedRequestLog);
  }, []);

  // Helper: Check if tab is valid for recording
  const isValidRecordingTab = (tab: chrome.tabs.Tab): boolean => {
    return (
      tab.id !== undefined &&
      !!tab.url &&
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('about:') &&
      tab.windowId !== chrome.windows.WINDOW_ID_NONE
    );
  };

  // Helper: Find valid web tab
  const findValidWebTab = async (): Promise<chrome.tabs.Tab | undefined> => {
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(isValidRecordingTab);
  };

  // Helper: Start recording in tab
  const startRecording = async (tab: chrome.tabs.Tab): Promise<boolean> => {
    const response = await withContextCheck(
      () =>
        chrome.runtime.sendMessage({
          action: 'startRecording',
          tabId: tab.id,
        }),
      { success: false }
    );

    if (response?.success) {
      const newSettings = { ...settings, logRequests: true };
      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      setActiveTabTitle(tab.title || 'Unknown Tab');
      setActiveTab('requests');
      return true;
    }

    return false;
  };

  // Helper: Stop recording
  const stopRecording = async (): Promise<void> => {
    await withContextCheck(() => chrome.runtime.sendMessage({ action: 'stopRecording' })).catch(() => {});
    const newSettings = { ...settings, logRequests: false };
    setSettings(newSettings);
    await Storage.saveSettings(newSettings);
    setActiveTabTitle('');
  };

  useEffect(() => {
    loadData();

    // Listen for rule updates from background (e.g., counter increments)
    const messageListener = (message: any) => {
      if (message.action === 'rulesUpdated') {
        loadData();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
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
      withContextCheck(() => Storage.getRules(), []),
      withContextCheck(() => Storage.getSettings(), {
        enabled: true,
        logRequests: false,
        showNotifications: false,
        corsAutoFix: false,
      }),
      withContextCheck(() => Storage.getRequestLog(), []),
    ]);

    setRules(loadedRules);
    setSettings(loadedSettings);
    setRequestLog(loadedRequestLog);

    // Validate all rules
    const warnings = validateAllRules(loadedRules);
    setRuleWarnings(warnings);

    if (loadedSettings.logRequests) {
      try {
        const response = await withContextCheck(() => chrome.runtime.sendMessage({ action: 'getRecordingStatus' }), {
          success: false,
        });
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

      // If disabling extension, also stop recording and disable CORS
      if (!enabled) {
        if (settings.logRequests) {
          newSettings.logRequests = false;
          setActiveTabTitle('');
        }
        if (settings.corsAutoFix) {
          newSettings.corsAutoFix = false;
        }
      }

      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() => chrome.runtime.sendMessage({ action: 'toggleMocking', enabled })).catch(() => {
        // Silent fail - context invalidated
      });
    },
    [settings]
  );

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean) => {
      // Don't allow recording when extension is disabled
      if (logRequests && !settings.enabled) {
        return;
      }

      try {
        if (logRequests) {
          const webTab = await findValidWebTab();
          if (webTab?.id) {
            await startRecording(webTab);
          }
        } else {
          await stopRecording();
        }
      } catch (error) {
        console.error('Recording toggle error:', error);
      }
    },
    [settings]
  );

  const handleCorsToggle = useCallback(
    async (corsAutoFix: boolean) => {
      const newSettings = { ...settings, corsAutoFix };
      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      // Notify background to update settings in all tabs
      await withContextCheck(() =>
        chrome.runtime.sendMessage({ action: 'updateSettings', settings: newSettings })
      ).catch(() => {});
    },
    [settings]
  );

  // Helper: Update rules in storage and background
  const updateRulesEverywhere = async (updatedRules: MockRule[]): Promise<void> => {
    setRules(updatedRules);

    // Validate rules after update
    const warnings = validateAllRules(updatedRules);
    setRuleWarnings(warnings);

    await Storage.saveRules(updatedRules);
    await withContextCheck(() => chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules })).catch(
      () => {}
    );
  };

  const handleSaveRule = useCallback(
    async (rule: MockRule) => {
      let updatedRules: MockRule[];
      if (editingRuleId && editingRuleId !== 'new') {
        updatedRules = rules.map((r) => (r.id === editingRuleId ? rule : r));
      } else {
        updatedRules = [...rules, rule];
      }

      await updateRulesEverywhere(updatedRules);
      setEditingRuleId(null);
    },
    [editingRuleId, rules]
  );

  const handleDeleteRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.filter((r) => r.id !== id);
      await updateRulesEverywhere(updatedRules);
      if (editingRuleId === id) {
        setEditingRuleId(null);
      }
    },
    [rules, editingRuleId]
  );

  const handleToggleRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      await updateRulesEverywhere(updatedRules);
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
        id: uuidv4(),
        name: `${ruleToDuplicate.name} (Copy)`,
        created: now,
        modified: now,
      };

      const updatedRules = [...rules, duplicatedRule];
      await updateRulesEverywhere(updatedRules);
    },
    [rules]
  );

  const handleResetRuleHits = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) =>
        r.id === id
          ? {
              ...r,
              matchCount: 0,
              lastMatched: undefined,
            }
          : r
      );
      await updateRulesEverywhere(updatedRules);
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

  // Helper: Download file
  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportRules = useCallback(() => {
    const dataStr = JSON.stringify(rules, null, 2);
    const filename = `mockapi-rules-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(dataStr, filename, 'application/json');
  }, [rules]);

  // Helper: Validate imported rules structure
  const validateImportedRules = (data: any): { valid: boolean; error?: string } => {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Invalid format - expected array' };
    }

    const hasRequiredFields = data.every(
      (rule) => rule.id && rule.name && rule.urlPattern && rule.method && rule.statusCode !== undefined
    );

    if (!hasRequiredFields) {
      return { valid: false, error: 'Missing required fields' };
    }

    return { valid: true };
  };

  // Helper: Merge imported rules with existing
  const mergeImportedRules = (importedRules: MockRule[]): MockRule[] => {
    const existingIds = new Set(rules.map((r) => r.id));
    const newRules = importedRules.filter((rule) => !existingIds.has(rule.id));
    return [...rules, ...newRules];
  };

  const handleImportRules = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const importedRules = JSON.parse(text);

        const validation = validateImportedRules(importedRules);
        if (!validation.valid) {
          alert(t('rules.importError') + ': ' + validation.error);
          return;
        }

        const updatedRules = mergeImportedRules(importedRules);
        const newRulesCount = updatedRules.length - rules.length;

        await updateRulesEverywhere(updatedRules);
        alert(t('rules.importSuccess').replace('{count}', newRulesCount.toString()));
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
        corsAutoFix={settings.corsAutoFix}
        onToggleEnabled={handleGlobalToggle}
        onToggleRecording={handleRecordingToggle}
        onToggleCors={handleCorsToggle}
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
          ruleWarnings={ruleWarnings}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          editingRuleId={editingRuleId}
          onEditRule={setEditingRuleId}
          onSaveRule={handleSaveRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={handleToggleRule}
          onDuplicateRule={handleDuplicateRule}
          onResetRuleHits={handleResetRuleHits}
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
