import { v4 as uuidv4 } from 'uuid';
import { Storage } from './storage';
import { MockRule, Settings, MessageAction, MessageResponse } from './types';
import { MatchType, HttpMethod, Language } from './enums';
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
    await injectScriptsToExistingTabs();
    await syncCorsRules();
  } catch (error) {
    console.error('[Moq] Initialization error:', error);
  }
}

// Helper: Update CORS auto fix rules in declarativeNetRequest
async function syncCorsRules(): Promise<void> {
  try {
    const shouldBeEnabled = settings.enabled && settings.corsAutoFix;

    if (shouldBeEnabled) {
      console.log('[Moq] Activating CORS auto fix rules');
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['cors_rules'],
      });
    } else {
      console.log('[Moq] Deactivating CORS auto fix rules');
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ['cors_rules'],
      });
    }
  } catch (error) {
    console.error('[Moq] Failed to sync CORS rules:', error);
  }
}

// Helper: Inject scripts into existing tabs (e.g., after extension install/reload)
async function injectScriptsToExistingTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });

  for (const tab of tabs) {
    if (!tab.id) continue;

    try {
      // Check if content script is already there
      const isAlive = await chrome.tabs
        .sendMessage(tab.id, { action: 'ping' })
        .then(() => true)
        .catch(() => false);

      if (!isAlive) {
        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['content-script.js'],
        });

        // Inject interceptor into MAIN world
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['interceptor.js'],
          world: 'MAIN',
        });

        console.log(`[Moq] Scripts force-injected into tab ${tab.id}`);
      }
    } catch {
      // Ignore errors for restricted tabs (e.g., chrome://)
    }
  }
}

// Helper: Check if tab can receive content script messages
function isValidTab(tab: chrome.tabs.Tab): boolean {
  return !!tab.id && !!tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://');
}

// Helper: Send rules to a single tab
// Returns true if scripts were already present, false if they needed injection
async function sendRulesToTab(tabId: number, rules: MockRule[]): Promise<boolean> {
  const isAlive = await chrome.tabs
    .sendMessage(tabId, { action: 'ping' })
    .then(() => true)
    .catch(() => false);

  if (!isAlive) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['content-script.js'],
      });
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['interceptor.js'],
        world: 'MAIN',
      });
    } catch {
      // restricted tab
      return false;
    }
    return false;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'updateRulesInPage',
      rules,
      settings,
    });
  } catch {
    // Silent fail - content script may not be injected yet
  }
  return true;
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
        console.error('[Moq] Message handler error:', error);
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
        await syncCorsRules();

        return { success: true };
      }
      return { success: false, error: 'No settings provided' };

    case 'toggleMocking':
      if (message.enabled !== undefined) {
        // Reload settings from storage to get the latest state (e.g., corsAutoFix may have been disabled)
        settings = await Storage.getSettings();
        settings.enabled = message.enabled;

        // If disabling extension, clear recording tab ID
        if (!message.enabled) {
          recordingTabId = null;
        }

        await Storage.saveSettings(settings);
        await updateRulesInAllTabs();
        await syncCorsRules();
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
        // Check if scripts are already present
        const scriptsPresent = await sendRulesToTab(message.tabId, getEnabledRules());

        if (!scriptsPresent) {
          // Scripts weren't present - reload the tab to properly inject them
          try {
            await chrome.tabs.reload(message.tabId);
            // Set recording tab AFTER reload to catch requests on page load
            recordingTabId = message.tabId;
            return { success: true, data: { tabId: recordingTabId, reloaded: true } };
          } catch {
            return { success: false, error: 'Failed to reload tab' };
          }
        }

        // Scripts were already present, start recording immediately
        recordingTabId = message.tabId;
        return { success: true, data: { tabId: recordingTabId, reloaded: false } };
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
      await handleMockedRequest(message, sender);
      return { success: true };

    case 'openStandaloneWindow':
      await openStandaloneWindow(message.language);
      return { success: true };

    case 'getStandaloneWindowStatus':
      return { success: true, data: { isOpen: standaloneWindowId !== null } };

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Helper: Handle captured response logging
async function handleCapturedResponse(message: MessageAction, sender?: chrome.runtime.MessageSender): Promise<void> {
  if (message.action !== 'logCapturedResponse') {
    return;
  }

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
    contentType: contentType || 'application/octet-stream',
    responseBody: responseBody || '',
    responseHeaders,
  });
}

// Helper: Handle mocked request logging
async function handleMockedRequest(message: MessageAction, sender?: chrome.runtime.MessageSender): Promise<void> {
  if (message.action !== 'logMockedRequest') {
    return;
  }

  const { url, method, ruleId, timestamp } = message;

  // Only log if from recording tab
  if (!url || !method || recordingTabId === null || sender?.tab?.id !== recordingTabId) {
    return;
  }

  const matchedRule = mockRules.find((r) => r.id === ruleId);

  await Storage.addToRequestLog({
    id: uuidv4(),
    url,
    method,
    timestamp: timestamp || Date.now(),
    matched: true,
    ruleId,
    statusCode: matchedRule?.statusCode || 200,
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
        theme: settings.theme || 'system',
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

// Update tab title when the recording tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process if this is the recording tab and the title has changed
  if (tabId === recordingTabId && changeInfo.title && tab.title) {
    // Notify all extension contexts about the title change
    chrome.runtime
      .sendMessage({
        action: 'recordingTabUpdated',
        tabTitle: tab.title,
      })
      .catch(() => {
        // Silent fail - no listeners
      });
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
    matchType: MatchType.Wildcard,
    method: HttpMethod.GET,
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

// Helper: Open standalone window
let standaloneWindowId: number | null = null;

async function openStandaloneWindow(language?: Language): Promise<void> {
  // Check if window already exists
  if (standaloneWindowId !== null) {
    try {
      const existingWindow = await chrome.windows.get(standaloneWindowId);
      if (existingWindow) {
        // Focus existing window
        await chrome.windows.update(standaloneWindowId, { focused: true });
        return;
      }
    } catch {
      // Window doesn't exist anymore
      standaloneWindowId = null;
    }
  }

  // Preserve language preference from caller or settings
  const lang = language || settings.language;
  const url = lang ? `window.html?lang=${lang}` : 'window.html';

  // Create new window
  const window = await chrome.windows.create({
    url,
    type: 'popup',
    width: 800,
    height: 600,
    left: 100,
    top: 100,
  });

  standaloneWindowId = window.id || null;
}

// Clean up window reference when window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === standaloneWindowId) {
    standaloneWindowId = null;
  }
});

// Helper: Create context menu
async function createContextMenu(): Promise<void> {
  chrome.contextMenus.create({
    id: 'openFloatingWindow',
    title: 'Open Moq',
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
    await openStandaloneWindow();
  }
});
