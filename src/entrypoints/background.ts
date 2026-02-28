import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';
import { MockRule, Settings, MessageAction, MessageResponse } from '../types';
import { MatchType, HttpMethod, Language, MessageActionType } from '../enums';
import { findMatchingRule } from '../helpers/urlMatching';

// WINDOW_ID_NONE constant (-1) - used instead of chrome.windows.WINDOW_ID_NONE
// to avoid dependency on chrome.windows object (not available in all contexts)
const WINDOW_ID_NONE = -1;

export default defineBackground(() => {
  let mockRules: MockRule[] = [];
  let settings: Settings = {
    enabled: true,
    logRequests: false,
    showNotifications: false,
    corsAutoFix: false,
    language: undefined,
  };
  let recordingTabId: number | null = null;
  let standaloneWindowId: number | null = null;

  // Load initial state
  async function initialize(): Promise<void> {
    try {
      mockRules = await Storage.getRules();
      settings = await Storage.getSettings();

      // Clear logRequests if no recording tab is active
      // This handles cases where service worker crashed before onSuspend could fire
      if (settings.logRequests && recordingTabId === null) {
        // eslint-disable-next-line no-console
        console.log('[Moq] Clearing stale logRequests state on initialization');
        settings.logRequests = false;
        await Storage.saveSettings(settings);
      }

      await updateRulesInAllTabs();
      await injectScriptsToExistingTabs();
      await syncCorsRules();
    } catch (error) {
      console.error('[Moq] Initialization error:', error);
    }
  }

  // Helper: Update CORS auto-fix rules via static declarativeNetRequest ruleset.
  // This is the same approach as the original src/background.ts (Chrome MV3).
  // cors_rules is defined in public/cors-rules.json and declared in the manifest.
  async function syncCorsRules(): Promise<void> {
    try {
      const shouldBeEnabled = settings.enabled && settings.corsAutoFix;

      if (shouldBeEnabled) {
        await browser.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: ['cors_rules'],
        });
      } else {
        await browser.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: ['cors_rules'],
        });
      }
    } catch (error) {
      console.error('[Moq] Failed to sync CORS rules:', error);
    }
  }

  // Helper: Inject scripts into existing tabs (e.g., after extension install/reload)
  async function injectScriptsToExistingTabs(): Promise<void> {
    const tabs = await browser.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    for (const tab of tabs) {
      if (!tab.id) continue;

      try {
        // Check if content script is already there
        const isAlive = await browser.tabs
          .sendMessage(tab.id, { action: MessageActionType.Ping })
          .then(() => true)
          .catch(() => false);

        if (!isAlive) {
          // Inject content script
          await browser.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['/content-scripts/content.js'],
          });

          // Inject interceptor into MAIN world
          await browser.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['/content-scripts/interceptor.js'],
            world: 'MAIN',
          });

          // eslint-disable-next-line no-console
          console.log(`[Moq] Scripts force-injected into tab ${tab.id}`);
        }
      } catch {
        // Ignore errors for restricted tabs (e.g., chrome://)
      }
    }
  }

  // Helper: Check if tab can receive content script messages
  function isValidTab(tab: Browser.tabs.Tab): boolean {
    return !!tab.id && !!tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://');
  }

  // Helper: Send rules to a single tab
  // Returns true if scripts were already present, false if they needed injection
  async function sendRulesToTab(tabId: number, rules: MockRule[]): Promise<boolean> {
    const isAlive = await browser.tabs
      .sendMessage(tabId, { action: MessageActionType.Ping })
      .then(() => true)
      .catch(() => false);

    if (!isAlive) {
      try {
        await browser.scripting.executeScript({
          target: { tabId, allFrames: true },
          files: ['/content-scripts/content.js'],
        });
        await browser.scripting.executeScript({
          target: { tabId, allFrames: true },
          files: ['/content-scripts/interceptor.js'],
          world: 'MAIN',
        });
      } catch {
        // restricted tab
        return false;
      }
      return false;
    }

    try {
      await browser.tabs.sendMessage(tabId, {
        action: MessageActionType.UpdateRulesInPage,
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
    browser.runtime.sendMessage({ action: MessageActionType.RulesUpdated }).catch(() => {
      // Popup might not be open, ignore
    });
  }

  // Update rules in all tabs via content script
  async function updateRulesInAllTabs(): Promise<void> {
    const enabledRules = getEnabledRules();
    const tabs = await browser.tabs.query({});

    // Send rules to each valid tab
    const sendPromises = tabs.filter(isValidTab).map((tab) => sendRulesToTab(tab.id!, enabledRules));

    await Promise.allSettled(sendPromises);

    // Update badge
    updateBadge(settings.enabled && enabledRules.length > 0, enabledRules.length);
  }

  // Helper: Set badge appearance
  function setBadge(text: string, color?: string): void {
    browser.action.setBadgeText({ text });
    if (color) {
      browser.action.setBadgeBackgroundColor({ color });
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

  async function handleMessage(
    message: MessageAction,
    sender?: Browser.runtime.MessageSender
  ): Promise<MessageResponse> {
    switch (message.action) {
      case MessageActionType.IncrementRuleCounter:
        if (message.ruleId) {
          await incrementRuleCounter(message.ruleId);
          return { success: true };
        }
        return { success: false, error: 'Missing ruleId' };

      case MessageActionType.UpdateRules:
        if (message.rules) {
          mockRules = message.rules;
          await Storage.saveRules(mockRules);
          await updateRulesInAllTabs();
          return { success: true };
        }
        return { success: false, error: 'No rules provided' };

      case MessageActionType.UpdateSettings:
        if (message.settings) {
          settings = message.settings;
          await Storage.saveSettings(settings);
          await updateRulesInAllTabs();
          await syncCorsRules();

          return { success: true };
        }
        return { success: false, error: 'No settings provided' };

      case MessageActionType.ToggleMocking:
        if (message.enabled !== undefined) {
          // Reload settings from storage to get the latest state
          settings = await Storage.getSettings();
          settings.enabled = message.enabled;

          // If disabling extension, clear recording tab ID and CORS auto-fix
          if (!message.enabled) {
            recordingTabId = null;
            settings.corsAutoFix = false;
            settings.logRequests = false;
          }

          await Storage.saveSettings(settings);
          await updateRulesInAllTabs();
          await syncCorsRules();
          return { success: true };
        }
        return { success: false, error: 'No enabled state provided' };

      case MessageActionType.GetRules:
        return { success: true, data: mockRules };

      case MessageActionType.GetSettings:
        return { success: true, data: settings };

      case MessageActionType.ExportRules: {
        const dataStr = JSON.stringify(mockRules, null, 2);
        return { success: true, data: dataStr };
      }

      case MessageActionType.StartRecording:
        if (message.tabId !== undefined) {
          // Check if scripts are already present
          const scriptsPresent = await sendRulesToTab(message.tabId, getEnabledRules());

          if (!scriptsPresent) {
            // Scripts weren't present - reload the tab to properly inject them
            try {
              await browser.tabs.reload(message.tabId);
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

      case MessageActionType.StopRecording:
        recordingTabId = null;
        return { success: true };

      case MessageActionType.GetRecordingStatus:
        return { success: true, data: { tabId: recordingTabId } };

      case MessageActionType.GetTabById:
        if (message.tabId !== undefined) {
          try {
            const tab = await browser.tabs.get(message.tabId);
            return { success: true, data: tab };
          } catch (error) {
            return { success: false, error: `Tab not found: ${error}` };
          }
        }
        return { success: false, error: 'No tab ID provided' };

      case MessageActionType.LogCapturedResponse:
        await handleCapturedResponse(message, sender);
        return { success: true };

      case MessageActionType.LogMockedRequest:
        await handleMockedRequest(message, sender);
        return { success: true };

      case MessageActionType.OpenStandaloneWindow:
        await openStandaloneWindow(message.language);
        return { success: true };

      case MessageActionType.GetStandaloneWindowStatus:
        return { success: true, data: { isOpen: standaloneWindowId !== null } };

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  // Helper: Handle captured response logging
  async function handleCapturedResponse(message: MessageAction, sender?: Browser.runtime.MessageSender): Promise<void> {
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
  async function handleMockedRequest(message: MessageAction, sender?: Browser.runtime.MessageSender): Promise<void> {
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
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    if (tabs[0]?.id) {
      try {
        await browser.tabs.sendMessage(tabs[0].id, {
          action: MessageActionType.OpenDevTools,
          language: settings.language || 'en',
          theme: settings.theme || 'system',
        });
      } catch {
        // Silent fail - content script may not be loaded yet
      }
    }
  }

  // Helper function to check if tab is valid for recording
  function isValidRecordingTab(tab: Browser.tabs.Tab): boolean {
    return (
      tab.id !== undefined &&
      !!tab.url &&
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('about:') &&
      tab.windowId !== WINDOW_ID_NONE
    );
  }

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
  async function openStandaloneWindow(language?: Language): Promise<void> {
    // Check if window already exists
    if (standaloneWindowId !== null) {
      try {
        const existingWindow = await browser.windows.get(standaloneWindowId);
        if (existingWindow) {
          // Focus existing window
          await browser.windows.update(standaloneWindowId, { focused: true });
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
    const window = await browser.windows.create({
      url,
      type: 'popup',
      width: 800,
      height: 600,
      left: 100,
      top: 100,
    });

    standaloneWindowId = window?.id || null;
  }

  // Helper: Create context menu
  async function createContextMenu(): Promise<void> {
    browser.contextMenus.create({
      id: 'openFloatingWindow',
      title: 'Open Moq',
      contexts: ['action'],
    });
  }

  // Helper: Clean up recording state on service worker suspend
  async function cleanupRecordingState(): Promise<void> {
    recordingTabId = null;

    // Clear logRequests in storage when service worker is suspended
    const currentSettings = await Storage.getSettings();
    if (currentSettings.logRequests) {
      currentSettings.logRequests = false;
      await Storage.saveSettings(currentSettings);
    }
  }

  // Handle messages from popup
  browser.runtime.onMessage.addListener(
    (
      message: MessageAction,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
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

  // Clear recording tab if it's closed
  browser.tabs.onRemoved.addListener((tabId) => {
    if (tabId === recordingTabId) {
      recordingTabId = null;

      // Also clear logRequests in storage when recording tab closes
      Storage.getSettings().then((currentSettings) => {
        if (currentSettings.logRequests) {
          currentSettings.logRequests = false;
          Storage.saveSettings(currentSettings).then(() => {
            // Notify popup about recording stop
            browser.runtime.sendMessage({ action: MessageActionType.SettingsUpdated }).catch(() => {});
          });
        }
      });
    }
  });

  // Update tab title when the recording tab navigates
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only process if this is the recording tab
    if (tabId === recordingTabId) {
      // Check if tab navigated to a restricted URL
      if (changeInfo.url && !isValidRecordingTab(tab)) {
        // eslint-disable-next-line no-console
        console.log('[Moq] Recording tab navigated to restricted URL, stopping recording');
        recordingTabId = null;

        // Clear logRequests in storage
        Storage.getSettings().then((currentSettings) => {
          if (currentSettings.logRequests) {
            currentSettings.logRequests = false;
            Storage.saveSettings(currentSettings).then(() => {
              // Notify popup about recording stop
              browser.runtime.sendMessage({ action: MessageActionType.SettingsUpdated }).catch(() => {});
            });
          }
        });
        return;
      }

      // Notify about title change if it changed
      if (changeInfo.title && tab.title) {
        browser.runtime
          .sendMessage({
            action: MessageActionType.RecordingTabUpdated,
            tabTitle: tab.title,
          })
          .catch(() => {
            // Silent fail - no listeners
          });
      }
    }
  });

  // Install/update handler
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await createExampleRule();
    }

    await createContextMenu();
    await initialize();
  });

  // Stop recording and clear state when service worker is about to suspend
  browser.runtime.onSuspend.addListener(() => {
    cleanupRecordingState().catch((error) => {
      console.error('[Moq] Failed to cleanup recording state on suspend:', error);
    });
  });

  // Clean up window reference when window is closed
  browser.windows.onRemoved.addListener((windowId) => {
    if (windowId === standaloneWindowId) {
      standaloneWindowId = null;
    }
  });

  // Service worker startup
  initialize();

  // Handle extension icon click to show DevTools prompt
  browser.action.onClicked.addListener(showDevToolsPromptInActiveTab);

  // Context menu handler
  browser.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === 'openFloatingWindow') {
      await openStandaloneWindow();
    }
  });
});
