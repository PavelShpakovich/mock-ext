import { useState, useCallback, useEffect, useMemo } from 'react';
import { Storage } from '../storage';
import { DEFAULT_SETTINGS } from '../constants';
import { MessageActionType } from '../enums';
import { MessageAction, Settings, RequestLog } from '../types';
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
  startRecording: (tab: Browser.tabs.Tab) => Promise<{ success: boolean; reloaded?: boolean }>;
  stopRecording: () => Promise<void>;
  handleGlobalToggle: (enabled: boolean) => Promise<void>;
  handleRecordingToggle: (logRequests: boolean) => Promise<{ reloaded?: boolean }>;
  handleCorsToggle: (corsAutoFix: boolean) => Promise<void>;
  clearLog: () => Promise<void>;
  setSettingsDirectly: (settings: Settings) => void;
  setRequestLogDirectly: (log: RequestLog[]) => void;
}

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

  useEffect(() => {
    const handleStorageChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && changes.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<Settings> | undefined) });
      }
      if (areaName === 'session' && changes.requestLog) void loadRequestLog();
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, [loadRequestLog]);

  const startRecording = useCallback(
    async (tab: Browser.tabs.Tab): Promise<{ success: boolean; reloaded?: boolean }> => {
      const response = await withContextCheck(() => sendStartRecordingMessage(tab.id!), { success: false });

      if (response?.success) {
        const newSettings = { ...settings, logRequests: true };
        setSettings(newSettings);
        await Storage.saveSettings(newSettings);
        setActiveTabTitle(tab.title || 'Unknown Tab');

        // Notify other contexts about recording state change
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
  }, [settings]);

  const handleGlobalToggle = useCallback(
    async (enabled: boolean) => {
      const newSettings = enabled ? { ...settings, enabled } : createDisabledSettings(settings);

      setSettings(newSettings);
      await Storage.saveSettings(newSettings);
      await withContextCheck(() =>
        browser.runtime.sendMessage({ action: MessageActionType.ToggleMocking, enabled })
      ).catch(() => {});

      // Notify other contexts about settings change
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
    },
    [settings]
  );

  const clearLog = useCallback(async () => {
    await Storage.clearRequestLog();
    setRequestLog([]);

    // Notify other contexts about request log clear
    browser.runtime.sendMessage({ action: MessageActionType.RequestLogUpdated }).catch(() => {});
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
              const tab = await browser.tabs.get(response.data.tabId);
              setActiveTabTitle(tab.title || 'Unknown Tab');
            } catch {
              // Recording tab no longer exists or is invalid
              // eslint-disable-next-line no-console
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

  // Listen for recording tab title updates
  useEffect(() => {
    const messageListener = (message: Extract<MessageAction, { action: MessageActionType.RecordingTabUpdated }>) => {
      if (message.tabTitle) {
        setActiveTabTitle(message.tabTitle);
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
};
