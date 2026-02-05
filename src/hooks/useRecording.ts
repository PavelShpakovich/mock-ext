import { useState, useCallback, useEffect } from 'react';
import { Storage } from '../storage';
import { Settings, RequestLog } from '../types';
import { withContextCheck } from '../contextHandler';
import {
  findValidWebTab,
  sendStartRecordingMessage,
  sendStopRecordingMessage,
  getRecordingStatus,
  createDisabledSettings,
} from '../helpers/recording';

interface UseRecordingReturn {
  settings: Settings;
  requestLog: RequestLog[];
  activeTabTitle: string;
  loadSettings: () => Promise<void>;
  loadRequestLog: () => Promise<void>;
  startRecording: (tab: chrome.tabs.Tab) => Promise<{ success: boolean; reloaded?: boolean }>;
  stopRecording: () => Promise<void>;
  handleGlobalToggle: (enabled: boolean) => Promise<void>;
  handleRecordingToggle: (logRequests: boolean) => Promise<{ reloaded?: boolean }>;
  handleCorsToggle: (corsAutoFix: boolean) => Promise<void>;
  clearLog: () => Promise<void>;
  setSettingsDirectly: (settings: Settings) => void;
  setRequestLogDirectly: (log: RequestLog[]) => void;
}

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  logRequests: false,
  showNotifications: false,
  corsAutoFix: false,
};

/**
 * Hook to manage recording state, settings, and request log
 * Handles recording lifecycle and settings management
 */
export const useRecording = (): UseRecordingReturn => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [requestLog, setRequestLog] = useState<RequestLog[]>([]);
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');

  const loadSettings = useCallback(async () => {
    const loadedSettings = await withContextCheck(() => Storage.getSettings(), DEFAULT_SETTINGS);
    setSettings(loadedSettings);
  }, []);

  const loadRequestLog = useCallback(async () => {
    const loadedRequestLog = await withContextCheck(() => Storage.getRequestLog(), []);
    setRequestLog(loadedRequestLog);
  }, []);

  const startRecording = useCallback(
    async (tab: chrome.tabs.Tab): Promise<{ success: boolean; reloaded?: boolean }> => {
      const response = await withContextCheck(() => sendStartRecordingMessage(tab.id!), { success: false });

      if (response?.success) {
        const newSettings = { ...settings, logRequests: true };
        setSettings(newSettings);
        await Storage.saveSettings(newSettings);
        setActiveTabTitle(tab.title || 'Unknown Tab');

        // Notify other contexts about recording state change
        chrome.runtime.sendMessage({ action: 'settingsUpdated' }).catch(() => {});

        return { success: true, reloaded: response.data?.reloaded };
      }

      return { success: false };
    },
    [settings]
  );

  const stopRecording = useCallback(async (): Promise<void> => {
    await withContextCheck(() => sendStopRecordingMessage()).catch(() => {});
    const newSettings = { ...settings, logRequests: false };
    setSettings(newSettings);
    await Storage.saveSettings(newSettings);
    setActiveTabTitle('');

    // Notify other contexts about recording state change
    chrome.runtime.sendMessage({ action: 'settingsUpdated' }).catch(() => {});
  }, [settings]);

  const handleGlobalToggle = useCallback(
    async (enabled: boolean) => {
      const newSettings = enabled ? { ...settings, enabled } : createDisabledSettings(settings);

      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() => chrome.runtime.sendMessage({ action: 'toggleMocking', enabled })).catch(() => {});

      // Notify other contexts about settings change
      chrome.runtime.sendMessage({ action: 'settingsUpdated' }).catch(() => {});

      if (!enabled && settings.logRequests) {
        setActiveTabTitle('');
      }
    },
    [settings]
  );

  const handleRecordingToggle = useCallback(
    async (logRequests: boolean): Promise<{ reloaded?: boolean }> => {
      if (logRequests && !settings.enabled) {
        return {};
      }

      try {
        if (logRequests) {
          const webTab = await findValidWebTab();
          if (webTab?.id) {
            const result = await startRecording(webTab);
            return { reloaded: result.reloaded };
          }
        } else {
          await stopRecording();
        }
      } catch (error) {
        console.error('Recording toggle error:', error);
      }
      return {};
    },
    [settings.enabled, startRecording, stopRecording]
  );

  const handleCorsToggle = useCallback(
    async (corsAutoFix: boolean) => {
      const newSettings = { ...settings, corsAutoFix };
      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() =>
        chrome.runtime.sendMessage({ action: 'updateSettings', settings: newSettings })
      ).catch(() => {});

      // Notify other contexts about settings change
      chrome.runtime.sendMessage({ action: 'settingsUpdated' }).catch(() => {});
    },
    [settings]
  );

  const clearLog = useCallback(async () => {
    await Storage.clearRequestLog();
    setRequestLog([]);

    // Notify other contexts about request log clear
    chrome.runtime.sendMessage({ action: 'requestLogUpdated' }).catch(() => {});
  }, []);

  const setSettingsDirectly = useCallback((updatedSettings: Settings) => {
    setSettings(updatedSettings);
  }, []);

  const setRequestLogDirectly = useCallback((log: RequestLog[]) => {
    setRequestLog(log);
  }, []);

  // Restore recording status on mount
  useEffect(() => {
    const restoreRecordingStatus = async () => {
      const loadedSettings = await withContextCheck(() => Storage.getSettings(), DEFAULT_SETTINGS);
      if (loadedSettings.logRequests) {
        try {
          const response = await withContextCheck(() => getRecordingStatus(), { success: false });
          if (response.success && response.data?.tabId) {
            try {
              const tab = await chrome.tabs.get(response.data.tabId);
              setActiveTabTitle(tab.title || 'Unknown Tab');
            } catch (error) {
              // Recording tab no longer exists or is invalid
              console.log('[Moq] Recording tab is no longer valid, clearing recording state');
              const newSettings = { ...loadedSettings, logRequests: false };
              setSettings(newSettings);
              await Storage.saveSettings(newSettings);
              setActiveTabTitle('');
            }
          } else {
            // No active recording tab, clear stale state
            if (loadedSettings.logRequests) {
              const newSettings = { ...loadedSettings, logRequests: false };
              setSettings(newSettings);
              await Storage.saveSettings(newSettings);
            }
          }
        } catch (error) {
          console.error('Failed to restore recording status:', error);
        }
      }
    };

    restoreRecordingStatus();
  }, []);

  // Poll for request log updates when recording
  useEffect(() => {
    if (settings.logRequests) {
      loadRequestLog();
      const interval = setInterval(loadRequestLog, 500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [settings.logRequests, loadRequestLog]);

  // Listen for recording tab title updates
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === 'recordingTabUpdated' && message.tabTitle) {
        setActiveTabTitle(message.tabTitle);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return {
    settings,
    requestLog,
    activeTabTitle,
    loadSettings,
    loadRequestLog,
    startRecording,
    stopRecording,
    handleGlobalToggle,
    handleRecordingToggle,
    handleCorsToggle,
    clearLog,
    setSettingsDirectly,
    setRequestLogDirectly,
  };
};
