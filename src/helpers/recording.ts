import { Settings } from '../types';

export function isValidRecordingTab(tab: chrome.tabs.Tab): boolean {
  return (
    tab.id !== undefined &&
    !!tab.url &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('about:') &&
    tab.windowId !== chrome.windows.WINDOW_ID_NONE
  );
}

export async function findValidWebTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true });
  return tabs.find(isValidRecordingTab);
}

export async function sendStartRecordingMessage(tabId: number): Promise<{ success: boolean }> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'startRecording',
      tabId,
    });
    return response || { success: false };
  } catch {
    return { success: false };
  }
}

export async function sendStopRecordingMessage(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ action: 'stopRecording' });
  } catch {
    // Silent fail - context invalidated
  }
}

export async function getRecordingStatus(): Promise<{ success: boolean; data?: { tabId: number } }> {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRecordingStatus' });
    return response || { success: false };
  } catch {
    return { success: false };
  }
}

export function createUpdatedSettings(currentSettings: Settings, updates: Partial<Settings>): Settings {
  return { ...currentSettings, ...updates };
}

export function createDisabledSettings(currentSettings: Settings): Settings {
  const updates: Partial<Settings> = { enabled: false };

  if (currentSettings.logRequests) {
    updates.logRequests = false;
  }

  if (currentSettings.corsAutoFix) {
    updates.corsAutoFix = false;
  }

  return { ...currentSettings, ...updates };
}
