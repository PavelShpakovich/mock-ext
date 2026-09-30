import { Storage } from '../storage';
import { DEFAULT_SETTINGS } from '../constants';
import { MockRule, Settings, MessageAction, MessageResponse, ProxyRule, RuleStats } from '../types';
import { MatchType, HttpMethod, Language, MessageActionType } from '../enums';
import { clearURLMatchCache, findMatchingRule } from '../helpers/urlMatching';

// WINDOW_ID_NONE constant (-1) - used instead of chrome.windows.WINDOW_ID_NONE
// to avoid dependency on chrome.windows object (not available in all contexts)
const WINDOW_ID_NONE = -1;
const RUNTIME_STATE_KEY = 'runtimeState';
const RULE_STATS_FLUSH_MS = 1000;

interface RuntimeState {
  recordingTabId: number | null;
  standaloneWindowId: number | null;
}

function sameRuleConfiguration<T extends { matchCount?: number; lastMatched?: number }>(
  previous: T[],
  next: T[]
): boolean {
  const withoutStats = (rules: T[]) =>
    rules.map(({ matchCount: _matchCount, lastMatched: _lastMatched, ...rule }) => rule);
  return JSON.stringify(withoutStats(previous)) === JSON.stringify(withoutStats(next));
}

export default defineBackground(() => {
  let mockRules: MockRule[] = [];
  let proxyRules: ProxyRule[] = [];
  let ruleStats: RuleStats = {};
  let ruleStatsDirty = false;
  let ruleStatsWritePending = false;
  let ruleStatsFlushTimer: ReturnType<typeof setTimeout> | null = null;
  let settings: Settings = DEFAULT_SETTINGS;
  let recordingTabId: number | null = null;
  let standaloneWindowId: number | null = null;
  let ready: Promise<void> = Promise.resolve();

  async function restoreRuntimeState(): Promise<void> {
    const result = (await browser.storage.session.get(RUNTIME_STATE_KEY)) as { [RUNTIME_STATE_KEY]?: RuntimeState };
    recordingTabId = result[RUNTIME_STATE_KEY]?.recordingTabId ?? null;
    standaloneWindowId = result[RUNTIME_STATE_KEY]?.standaloneWindowId ?? null;
  }

  async function persistRuntimeState(): Promise<void> {
    await browser.storage.session.set({ [RUNTIME_STATE_KEY]: { recordingTabId, standaloneWindowId } });
  }

  // Load initial state
  async function initialize(): Promise<void> {
    try {
      await Storage.migrateStorageSchema();
      await restoreRuntimeState();
      mockRules = await Storage.getRules();
      proxyRules = await Storage.getProxyRules();
      ruleStats = await Storage.getRuleStats();
      settings = await Storage.getSettings();
      clearURLMatchCache();

      await updateRulesInAllTabs();
      await injectScriptsToExistingTabs();
      await syncCorsRules();
    } catch (error) {
      console.error('[Moq] Initialization error:', error);
    }
  }

  async function clearStaleRecordingState(): Promise<void> {
    recordingTabId = null;
    standaloneWindowId = null;
    await persistRuntimeState();

    if (settings.logRequests) {
      settings = { ...settings, logRequests: false };
      await Storage.saveSettings(settings);
    }
    await updateRulesInAllTabs();
  }

  // Helper: Update CORS auto-fix rules via static declarativeNetRequest ruleset.
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
      if (!isInjectableTab(tab)) continue;

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
  function isInjectableTab(tab: Browser.tabs.Tab): tab is Browser.tabs.Tab & { id: number; url: string } {
    return tab.id !== undefined && !!tab.url && /^https?:\/\//i.test(tab.url) && tab.windowId !== WINDOW_ID_NONE;
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
        proxyRules: getEnabledProxyRules(),
        settings,
        capture: recordingTabId === tabId,
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

  function getEnabledProxyRules(): ProxyRule[] {
    return settings.enabled ? proxyRules.filter((rule) => rule.enabled) : [];
  }

  // Helper: Increment rule match counter
  async function incrementRuleCounter(ruleId: string): Promise<void> {
    if (!mockRules.some((rule) => rule.id === ruleId) && !proxyRules.some((rule) => rule.id === ruleId)) return;
    const previous = ruleStats[ruleId];
    ruleStats = { ...ruleStats, [ruleId]: { count: (previous?.count ?? 0) + 1, last: Date.now() } };
    ruleStatsDirty = true;
    if (ruleStatsFlushTimer) clearTimeout(ruleStatsFlushTimer);
    ruleStatsFlushTimer = setTimeout(() => {
      void flushRuleStats();
    }, RULE_STATS_FLUSH_MS);
  }

  async function flushRuleStats(): Promise<void> {
    if (ruleStatsFlushTimer) clearTimeout(ruleStatsFlushTimer);
    ruleStatsFlushTimer = null;
    if (!ruleStatsDirty) return;

    const snapshot = ruleStats;
    ruleStatsDirty = false;
    ruleStatsWritePending = true;
    try {
      await Storage.saveRuleStats(snapshot);
    } catch (error) {
      ruleStatsDirty = true;
      console.error('[Moq] Failed to save rule statistics:', error);
    } finally {
      ruleStatsWritePending = false;
    }
  }

  // Update rules in all tabs via content script
  async function updateRulesInAllTabs(): Promise<void> {
    const enabledRules = getEnabledRules();
    const tabs = await browser.tabs.query({});

    // Send rules to each valid tab
    const sendPromises = tabs.filter(isInjectableTab).map((tab) => sendRulesToTab(tab.id!, enabledRules));

    await Promise.allSettled(sendPromises);

    // Update badge
    const totalActive = enabledRules.length + getEnabledProxyRules().length;
    updateBadge(settings.enabled && totalActive > 0, totalActive);
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

      case MessageActionType.ToggleMocking:
        if (message.enabled !== undefined) {
          settings = await Storage.getSettings();

          // If disabling extension, clear recording tab ID and CORS auto-fix
          if (!message.enabled) {
            recordingTabId = null;
            await persistRuntimeState();
          }

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
          const previousRecordingTabId = recordingTabId;
          recordingTabId = message.tabId;
          await persistRuntimeState();
          if (previousRecordingTabId !== null && previousRecordingTabId !== message.tabId) {
            await sendRulesToTab(previousRecordingTabId, getEnabledRules());
          }

          // Check if scripts are already present
          const scriptsPresent = await sendRulesToTab(message.tabId, getEnabledRules());

          if (!scriptsPresent) {
            // Scripts weren't present - reload the tab to properly inject them
            try {
              await browser.tabs.reload(message.tabId);
              return { success: true, data: { tabId: recordingTabId, reloaded: true } };
            } catch {
              recordingTabId = previousRecordingTabId;
              await persistRuntimeState();
              if (previousRecordingTabId !== null) {
                await sendRulesToTab(previousRecordingTabId, getEnabledRules());
              }
              return { success: false, error: 'Failed to reload tab' };
            }
          }

          return { success: true, data: { tabId: recordingTabId, reloaded: false } };
        }
        return { success: false, error: 'No tab ID provided' };

      case MessageActionType.StopRecording: {
        const stoppedTabId = recordingTabId;
        recordingTabId = null;
        await persistRuntimeState();
        if (stoppedTabId !== null) await sendRulesToTab(stoppedTabId, getEnabledRules());
        return { success: true };
      }

      case MessageActionType.GetRecordingStatus:
        return {
          success: true,
          data: { tabId: recordingTabId, isRecording: sender?.tab?.id === recordingTabId },
        };

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

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  // Helper: Handle captured response logging
  async function handleCapturedResponse(
    message: Extract<MessageAction, { action: MessageActionType.LogCapturedResponse }>,
    sender?: Browser.runtime.MessageSender
  ): Promise<void> {
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
      id: crypto.randomUUID(),
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
  async function handleMockedRequest(
    message: Extract<MessageAction, { action: MessageActionType.LogMockedRequest }>,
    sender?: Browser.runtime.MessageSender
  ): Promise<void> {
    const { url, method, ruleId, timestamp } = message;

    // Only log if from recording tab
    if (!url || !method || recordingTabId === null || sender?.tab?.id !== recordingTabId) {
      return;
    }

    const matchedRule = mockRules.find((r) => r.id === ruleId);

    await Storage.addToRequestLog({
      id: crypto.randomUUID(),
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
    const currentSettings = await Storage.getSettings();
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    if (tabs[0]?.id) {
      try {
        await browser.tabs.sendMessage(tabs[0].id, {
          action: MessageActionType.OpenDevTools,
          language: currentSettings.language || 'en',
          theme: currentSettings.theme || 'system',
        });
      } catch {
        // Silent fail - content script may not be loaded yet
      }
    }
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
        await persistRuntimeState();
      }
    }

    // Preserve language preference from caller or settings
    const lang = language || settings.language;
    const url = lang ? `window.html?lang=${lang}` : 'window.html';

    // Create new window
    const createdWindow = await browser.windows.create({
      url,
      type: 'popup',
      width: 800,
      height: 600,
      left: 100,
      top: 100,
    });

    standaloneWindowId = createdWindow?.id || null;
    await persistRuntimeState();
  }

  // Helper: Create context menu
  async function createContextMenu(): Promise<void> {
    browser.contextMenus.create({
      id: 'openFloatingWindow',
      title: 'Open Moq',
      contexts: ['action'],
    });
  }

  // Handle messages from popup
  browser.runtime.onMessage.addListener(
    (
      message: MessageAction,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      ready
        .then(() => handleMessage(message, sender))
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
      persistRuntimeState().catch(() => {});

      // Also clear logRequests in storage when recording tab closes
      Storage.getSettings().then((currentSettings) => {
        if (currentSettings.logRequests) {
          currentSettings.logRequests = false;
          Storage.saveSettings(currentSettings);
        }
      });
    }
  });

  // Update tab title when the recording tab navigates
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only process if this is the recording tab
    if (tabId === recordingTabId) {
      // Check if tab navigated to a restricted URL
      if (changeInfo.url && !isInjectableTab(tab)) {
        // eslint-disable-next-line no-console
        console.log('[Moq] Recording tab navigated to restricted URL, stopping recording');
        recordingTabId = null;
        persistRuntimeState().catch(() => {});

        // Clear logRequests in storage
        Storage.getSettings().then((currentSettings) => {
          if (currentSettings.logRequests) {
            currentSettings.logRequests = false;
            Storage.saveSettings(currentSettings);
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
    await ready;

    if (details.reason === 'install') {
      mockRules = await Storage.getRules();
      await updateRulesInAllTabs();
    }
  });

  browser.runtime.onStartup.addListener(() =>
    ready
      .then(() => clearStaleRecordingState())
      .catch((error) => {
        console.error('[Moq] Failed to clear recording state on startup:', error);
      })
  );

  browser.runtime.onSuspend.addListener(() => {
    void flushRuleStats();
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    return ready
      .then(async () => {
        let rulesChanged = false;
        if (changes.mockRules) {
          const nextRules = (changes.mockRules.newValue as MockRule[] | undefined) ?? [];
          rulesChanged ||= !sameRuleConfiguration(mockRules, nextRules);
          mockRules = nextRules;
          clearURLMatchCache();
        }
        if (changes.proxyRules) {
          const nextRules = (changes.proxyRules.newValue as ProxyRule[] | undefined) ?? [];
          rulesChanged ||= !sameRuleConfiguration(proxyRules, nextRules);
          proxyRules = nextRules;
          clearURLMatchCache();
        }
        if (changes.settings) {
          settings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<Settings> | undefined) };
          rulesChanged = true;
          await syncCorsRules();
        }
        if (changes.ruleStats && !ruleStatsWritePending && !ruleStatsDirty) {
          ruleStats = (changes.ruleStats.newValue as RuleStats | undefined) ?? {};
        }
        if (rulesChanged) await updateRulesInAllTabs();
      })
      .catch((error) => {
        console.error('[Moq] Failed to synchronize storage changes:', error);
      });
  });

  // Clean up window reference when window is closed
  browser.windows.onRemoved.addListener((windowId) => {
    if (windowId === standaloneWindowId) {
      standaloneWindowId = null;
      persistRuntimeState().catch(() => {});
    }
  });

  // Service worker startup
  ready = initialize();

  // Handle extension icon click to show DevTools prompt
  browser.action.onClicked.addListener(showDevToolsPromptInActiveTab);

  // Context menu handler
  browser.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === 'openFloatingWindow') {
      await openStandaloneWindow();
    }
  });
});
