import { Storage } from './storage';
import { MockRule, Settings, MessageAction, MessageResponse, MatchType } from './types';
import { escapeRegExp } from './utils';

// URL matching helper functions (used for logging to check if request would be mocked)
function matchURL(url: string, pattern: string, type: MatchType): boolean {
  switch (type) {
    case 'exact':
      return url === pattern;
    case 'wildcard': {
      const regexPattern = pattern
        .split('*')
        .map((part) => escapeRegExp(part))
        .join('.*');
      try {
        return new RegExp('^' + regexPattern + '$').test(url);
      } catch {
        return false;
      }
    }
    case 'regex':
      try {
        return new RegExp(pattern).test(url);
      } catch {
        console.error('Invalid regex pattern:', pattern);
        return false;
      }
    default:
      return false;
  }
}

function findMatchingRule(url: string, method: string, rules: MockRule[]): MockRule | undefined {
  return rules.find(
    (rule) =>
      rule.enabled && matchURL(url, rule.urlPattern, rule.matchType) && (rule.method === '' || rule.method === method)
  );
}

let mockRules: MockRule[] = [];
let settings: Settings = {
  enabled: true,
  logRequests: false,
  showNotifications: false,
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

// Update rules in all tabs via content script
async function updateRulesInAllTabs(): Promise<void> {
  const enabledRules = settings.enabled ? mockRules.filter((rule) => rule.enabled) : [];

  // Query all tabs
  const tabs = await chrome.tabs.query({});

  // Send rules to each tab's content script
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      chrome.tabs
        .sendMessage(tab.id, {
          action: 'updateRulesInPage',
          rules: enabledRules,
        })
        .catch(() => {
          // Silent fail - content script may not be injected yet
        });
    }
  }

  // Update badge
  updateBadge(settings.enabled && enabledRules.length > 0, enabledRules.length);
}

// Update extension badge
function updateBadge(enabled: boolean, count?: number): void {
  if (enabled && count !== undefined && count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else if (enabled) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener(
  (
    message: MessageAction,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error('[MockAPI] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: MessageAction): Promise<MessageResponse> {
  switch (message.action) {
    case 'updateRules':
      if (message.rules) {
        mockRules = message.rules;
        await Storage.saveRules(mockRules);
        await updateRulesInAllTabs();
        return { success: true };
      }
      return { success: false, error: 'No rules provided' };

    case 'toggleMocking':
      if (message.enabled !== undefined) {
        settings.enabled = message.enabled;
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

    case 'logMockedRequest':
      // Log intercepted requests from content script
      if (message.data) {
        const { url, method, statusCode, ruleId, timestamp } = message.data;
        const matchedRule = mockRules.find((r) => r.id === ruleId);

        await Storage.addToRequestLog({
          id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          method,
          timestamp,
          matched: true,
          ruleId,
          statusCode,
          contentType: matchedRule?.contentType || '',
        });

        return { success: true };
      }
      return { success: false, error: 'No request data provided' };

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Map to track recent requests and avoid duplicates (URL+method as key)
const recentRequests = new Map<string, number>();

// Listen for web requests
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (recordingTabId === null || details.tabId !== recordingTabId) {
      return;
    }

    if (details.tabId < 0 || details.url.startsWith('chrome-extension://') || details.url.startsWith('data:')) {
      return;
    }

    const requestKey = `${details.url}:${details.method}`;
    const now = Date.now();

    // Simple deduplication (within 500ms)
    const lastSeen = recentRequests.get(requestKey);
    if (lastSeen && now - lastSeen < 500) {
      return;
    }

    // Get content-type from response headers
    let contentType = '';
    if (details.responseHeaders) {
      const contentTypeHeader = details.responseHeaders.find((h) => h.name.toLowerCase() === 'content-type');
      if (contentTypeHeader && contentTypeHeader.value) {
        contentType = contentTypeHeader.value.split(';')[0].trim();
      }
    }

    const matchedRule = findMatchingRule(details.url, details.method, mockRules);

    // Don't log mocked requests - they're being intercepted at the client-side level
    // The interceptor will send 'logMockedRequest' messages instead
    if (matchedRule && settings.enabled) {
      return;
    }

    await Storage.addToRequestLog({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: details.url,
      method: details.method,
      timestamp: now,
      matched: !!matchedRule,
      ruleId: matchedRule?.id,
      statusCode: details.statusCode,
      contentType,
    });

    // Track this request
    recentRequests.set(requestKey, now);

    // Clean up old entries (older than 2 seconds)
    for (const [key, timestamp] of recentRequests.entries()) {
      if (now - timestamp > 2000) {
        recentRequests.delete(key);
      }
    }
  },
  {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'], // Only capture fetch/XHR requests
  },
  ['responseHeaders']
);

// Clear recording tab if it's closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === recordingTabId) {
    recordingTabId = null;
  }
});

// Install/update handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
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

  chrome.contextMenus.create({
    id: 'openFloatingWindow',
    title: 'Open MockAPI',
    contexts: ['action'],
  });

  await initialize();
});

// Service worker startup
initialize();

// Handle extension icon click to show DevTools prompt
chrome.action.onClicked.addListener(async () => {
  const settings = await Storage.getSettings();
  // Send message to show DevTools prompt
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'openDevTools', language: settings.language || 'en' }).catch(() => {
        // Silent fail - content script may not be loaded yet
      });
    }
  });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'openFloatingWindow') {
    const settings = await Storage.getSettings();
    // Show DevTools prompt
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { action: 'openDevTools', language: settings.language || 'en' })
          .catch(() => {
            // Silent fail
          });
      }
    });
  }
});

initialize();
