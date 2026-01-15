import { v4 as uuidv4 } from 'uuid';
import { Storage } from './storage';
import { MockRule, Settings, MessageAction, MessageResponse } from './types';
import { findMatchingRule } from './helpers/urlMatching';

let mockRules: MockRule[] = [];
let settings: Settings = {
  enabled: true,
  logRequests: false,
  showNotifications: false,
  corsAutoFix: false,
  language: undefined,
};
let recordingTabId: number | null = null;

// Load initial state
async function initialize(): Promise<void> {
  try {
    mockRules = await Storage.getRules();
    settings = await Storage.getSettings();
    await updateRulesInAllTabs();
  } catch (error) {
    console.error('[MockAPI] Initialization error:', error);
  }
}

// Helper: Check if tab can receive content script messages
function isValidTab(tab: chrome.tabs.Tab): boolean {
  return !!tab.id && !!tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://');
}

// Helper: Send rules to a single tab
async function sendRulesToTab(tabId: number, rules: MockRule[]): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'updateRulesInPage',
      rules,
      settings,
    });
  } catch {
    // Silent fail - content script may not be injected yet
  }
}

// Helper: Get enabled rules
function getEnabledRules(): MockRule[] {
  return settings.enabled ? mockRules.filter((rule) => rule.enabled) : [];
}

// Helper: Increment rule match counter
async function incrementRuleCounter(ruleId: string): Promise<void> {
  const rule = mockRules.find((r) => r.id === ruleId);
  if (!rule) return;

  rule.matchCount = (rule.matchCount || 0) + 1;
  rule.lastMatched = Date.now();

  // Save updated rules
  await Storage.saveRules(mockRules);

  // Notify popup to reload rules for real-time counter updates
  chrome.runtime.sendMessage({ action: 'rulesUpdated' }).catch(() => {
    // Popup might not be open, ignore
  });
}

// Update rules in all tabs via content script
async function updateRulesInAllTabs(): Promise<void> {
  const enabledRules = getEnabledRules();
  const tabs = await chrome.tabs.query({});

  // Send rules to each valid tab
  const sendPromises = tabs.filter(isValidTab).map((tab) => sendRulesToTab(tab.id!, enabledRules));

  await Promise.allSettled(sendPromises);

  // Update badge
  updateBadge(settings.enabled && enabledRules.length > 0, enabledRules.length);
}

// Helper: Set badge appearance
function setBadge(text: string, color?: string): void {
  chrome.action.setBadgeText({ text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

// Update extension badge
function updateBadge(enabled: boolean, count?: number): void {
  if (!enabled) {
    setBadge('');
  } else if (count && count > 0) {
    setBadge(count.toString(), '#4CAF50');
  } else {
    setBadge('✓', '#4CAF50');
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener(
  (message: MessageAction, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error('[MockAPI] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: MessageAction, sender?: chrome.runtime.MessageSender): Promise<MessageResponse> {
  switch (message.action) {
    case 'incrementRuleCounter':
      if (message.ruleId) {
        await incrementRuleCounter(message.ruleId);
        return { success: true };
      }
      return { success: false, error: 'Missing ruleId' };

    case 'updateRules':
      if (message.rules) {
        mockRules = message.rules;
        await Storage.saveRules(mockRules);
        await updateRulesInAllTabs();
        return { success: true };
      }
      return { success: false, error: 'No rules provided' };

    case 'updateSettings':
      if (message.settings) {
        settings = message.settings;
        await Storage.saveSettings(settings);
        await updateRulesInAllTabs();
        return { success: true };
      }
      return { success: false, error: 'No settings provided' };

    case 'toggleMocking':
      if (message.enabled !== undefined) {
        settings.enabled = message.enabled;

        // If disabling extension, clear recording tab ID
        if (!message.enabled) {
          recordingTabId = null;
        }

        await Storage.saveSettings(settings);
        await updateRulesInAllTabs();
        return { success: true };
      }
      return { success: false, error: 'No enabled state provided' };

    case 'getRules':
      return { success: true, data: mockRules };

    case 'getSettings':
      return { success: true, data: settings };

    case 'exportRules': {
      const dataStr = JSON.stringify(mockRules, null, 2);
      return { success: true, data: dataStr };
    }

    case 'startRecording':
      if (message.tabId !== undefined) {
        recordingTabId = message.tabId;
        return { success: true, data: { tabId: recordingTabId } };
      }
      return { success: false, error: 'No tab ID provided' };

    case 'stopRecording':
      recordingTabId = null;
      return { success: true };

    case 'getRecordingStatus':
      return { success: true, data: { tabId: recordingTabId } };

    case 'logCapturedResponse':
      await handleCapturedResponse(message, sender);
      return { success: true };

    case 'logMockedRequest':
      if (message.data) {
        await handleMockedRequest(message.data);
        return { success: true };
      }
      return { success: false, error: 'No request data provided' };

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Helper: Handle captured response logging
async function handleCapturedResponse(message: MessageAction, sender?: chrome.runtime.MessageSender): Promise<void> {
  const { url, method, statusCode, contentType, responseBody, responseHeaders } = message;

  // Only log if from recording tab
  if (!url || !method || recordingTabId === null || sender?.tab?.id !== recordingTabId) {
    return;
  }

  const matchedRule = findMatchingRule(url, method, mockRules);

  // Don't log if it's a mocked request and extension is enabled
  if (matchedRule && settings.enabled) {
    return;
  }

  await Storage.addToRequestLog({
    id: uuidv4(),
    url,
    method,
    timestamp: Date.now(),
    matched: !!matchedRule,
    ruleId: matchedRule?.id,
    statusCode: statusCode || 200,
    contentType: contentType || '',
    responseBody: responseBody || '',
    responseHeaders,
  });
}

// Helper: Handle mocked request logging
async function handleMockedRequest(data: any): Promise<void> {
  const { url, method, statusCode, ruleId, timestamp } = data;
  const matchedRule = mockRules.find((r) => r.id === ruleId);

  await Storage.addToRequestLog({
    id: uuidv4(),
    url,
    method,
    timestamp,
    matched: true,
    ruleId,
    statusCode,
    contentType: matchedRule?.contentType || '',
  });
}

// Helper: Show DevTools prompt in active tab
async function showDevToolsPromptInActiveTab(): Promise<void> {
  const settings = await Storage.getSettings();
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs[0]?.id) {
    try {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'openDevTools',
        language: settings.language || 'en',
      });
    } catch {
      // Silent fail - content script may not be loaded yet
    }
  }
}

// Clear recording tab if it's closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === recordingTabId) {
    recordingTabId = null;
  }
});

// Install/update handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await createExampleRule();
  }

  await createContextMenu();
  await initialize();
});

// Helper: Create example rule on first install
async function createExampleRule(): Promise<void> {
  const exampleRule: MockRule = {
    id: '1',
    name: 'Example API Mock',
    enabled: false,
    urlPattern: 'https://jsonplaceholder.typicode.com/users/*',
    matchType: 'wildcard',
    method: 'GET',
    statusCode: 200,
    response: {
      id: 1,
      name: 'Mocked User',
      email: 'mock@example.com',
    },
    contentType: 'application/json',
    delay: 0,
    created: Date.now(),
    modified: Date.now(),
  };

  await Storage.saveRules([exampleRule]);
}

// Helper: Create context menu
async function createContextMenu(): Promise<void> {
  chrome.contextMenus.create({
    id: 'openFloatingWindow',
    title: 'Open MockAPI',
    contexts: ['action'],
  });
}

// Service worker startup
initialize();

// Handle extension icon click to show DevTools prompt
chrome.action.onClicked.addListener(showDevToolsPromptInActiveTab);

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'openFloatingWindow') {
    await showDevToolsPromptInActiveTab();
  }
});
