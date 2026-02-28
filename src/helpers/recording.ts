import { Settings } from '../types';
import { MessageActionType } from '../enums';

// WINDOW_ID_NONE constant (-1) - used instead of chrome.windows.WINDOW_ID_NONE
// because chrome.windows is undefined in Firefox DevTools panels
const WINDOW_ID_NONE = -1;

export function isValidRecordingTab(tab: Browser.tabs.Tab): boolean {
  return (
    tab.id !== undefined &&
    !!tab.url &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('about:') &&
    tab.windowId !== WINDOW_ID_NONE
  );
}

export async function findValidWebTab(): Promise<Browser.tabs.Tab | undefined> {
  // Check if running in DevTools panel (has tabId query parameter)
  const urlParams = new URLSearchParams(window.location.search);
  const devToolsTabId = urlParams.get('tabId');

  if (devToolsTabId) {
    // In DevTools: Firefox doesn't allow direct browser.tabs access in DevTools panels
    // Use message passing to background script which has full API access
    try {
      const tabId = parseInt(devToolsTabId, 10);
      const response = await browser.runtime.sendMessage({
        action: MessageActionType.GetTabById,
        tabId,
      });

      if (response?.success && response.data) {
        const tab = response.data as Browser.tabs.Tab;
        if (isValidRecordingTab(tab)) {
          return tab;
        }
      }
    } catch (error) {
      console.error('[Moq] Failed to get DevTools inspected tab:', error);
    }
    return undefined;
  }

  // Standalone mode: get active tab in current window
  try {
    const currentWindow = await browser.windows.getCurrent();
    const tabs = await browser.tabs.query({ active: true, windowId: currentWindow.id });
    return tabs.find(isValidRecordingTab);
  } catch (error) {
    console.error('[Moq] Failed to query tabs:', error);
    return undefined;
  }
}

export async function sendStartRecordingMessage(
  tabId: number
): Promise<{ success: boolean; data?: { reloaded: boolean } }> {
  try {
    const response = await browser.runtime.sendMessage({
      action: MessageActionType.StartRecording,
      tabId,
    });
    return response || { success: false };
  } catch {
    return { success: false };
  }
}

export async function sendStopRecordingMessage(): Promise<void> {
  try {
    await browser.runtime.sendMessage({ action: MessageActionType.StopRecording });
  } catch {
    // Silent fail - context invalidated
  }
}

export async function getRecordingStatus(): Promise<{ success: boolean; data?: { tabId: number } }> {
  try {
    const response = await browser.runtime.sendMessage({ action: MessageActionType.GetRecordingStatus });
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
