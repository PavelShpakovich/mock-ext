import { HttpMethod, MatchType, MessageActionType } from '../enums';
import { listeners } from '../__tests__/setup';
import { MessageAction, MessageResponse, Language, MockRule } from '../types';

// Helper to access the chrome mock with types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockChrome = (globalThis as any).chrome;

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome.resetListeners();

    // Default storage state
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.remove.mockResolvedValue(undefined); // Add this

    mockChrome.storage.session.get.mockResolvedValue({});
    mockChrome.storage.session.set.mockResolvedValue(undefined);
    mockChrome.storage.session.remove.mockResolvedValue(undefined);

    mockChrome.tabs.query.mockResolvedValue([]);
    mockChrome.tabs.get = jest.fn();
    mockChrome.windows.create.mockResolvedValue({ id: 999 });

    // Necessary for .catch() blocks in background.ts
    mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
  });

  const loadBackgroundScript = () => {
    // Isolate modules to ensure a fresh execution of background.ts logic
    // This runs appropriate top-level code like initialize()
    jest.isolateModules(() => {
      require('../entrypoints/background');
    });
  };

  const sendMessage = async (message: MessageAction, sender: object = {}) => {
    // Return a promise that resolves when sendResponse is called
    // This handles the async nature of the background message listener properly
    return new Promise((resolve) => {
      const sendResponse = (response: MessageResponse) => {
        resolve(response);
      };

      mockChrome.runtime.onMessage.callListeners(message, sender, sendResponse);
    });
  };

  describe('Initialization', () => {
    test('should load rules and settings on startup', async () => {
      const mockRules = [{ id: '1', enabled: true }];
      const mockSettings = { enabled: true };

      mockChrome.storage.local.get.mockImplementation((keys: string[]) => {
        if (keys.includes('mockRules')) return Promise.resolve({ mockRules });
        if (keys.includes('settings')) return Promise.resolve({ settings: mockSettings });
        return Promise.resolve({});
      });

      loadBackgroundScript();

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockChrome.storage.local.get).toHaveBeenCalled();

      // Verify badge was updated implies initialization ran
      expect(mockChrome.action.setBadgeText).toHaveBeenCalled();
    });

    test('should inject scripts into existing tabs', async () => {
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://example.com', windowId: 1 },
        { id: 2, url: 'chrome://settings', windowId: 1 },
        { id: 3, url: 'about:blank', windowId: 1 },
        { id: 4, url: 'moz-extension://example/page.html', windowId: 1 },
        { id: 5, url: 'file:///tmp/page.html', windowId: 1 },
      ]);

      // Mock ping failure (content script not present)
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Connection failed'));

      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should inject into valid tab
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 1, allFrames: true },
          files: ['/content-scripts/content.js'],
        })
      );

      for (const tabId of [2, 3, 4, 5]) {
        expect(mockChrome.scripting.executeScript).not.toHaveBeenCalledWith(
          expect.objectContaining({ target: expect.objectContaining({ tabId }) })
        );
      }
    });

    test('should restore recording and window IDs from session storage', async () => {
      mockChrome.storage.session.get.mockImplementation((key: string) =>
        key === 'runtimeState'
          ? Promise.resolve({ runtimeState: { recordingTabId: 321, standaloneWindowId: 654 } })
          : Promise.resolve({})
      );

      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const recordingStatus = await sendMessage({ action: MessageActionType.GetRecordingStatus }, { tab: { id: 321 } });

      expect(recordingStatus).toEqual({ success: true, data: { tabId: 321, isRecording: true } });
      mockChrome.windows.get.mockResolvedValue({ id: 654 });
      await sendMessage({ action: MessageActionType.OpenStandaloneWindow });
      expect(mockChrome.windows.get).toHaveBeenCalledWith(654);
      expect(mockChrome.windows.update).toHaveBeenCalledWith(654, { focused: true });
    });

    test('should refresh cached rules when local storage changes', async () => {
      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const rules: MockRule[] = [{ id: 'externally-updated', enabled: true } as MockRule];

      await mockChrome.storage.onChanged.callListeners({ mockRules: { newValue: rules } }, 'local');

      const response = await sendMessage({ action: MessageActionType.GetRules });
      expect(response).toEqual({ success: true, data: rules });
    });

    test('should not rebroadcast rules when only hit statistics change', async () => {
      const previousRules = [
        { id: 'rule-with-hits', enabled: true, matchCount: 0, lastMatched: undefined } as MockRule,
      ];
      const updatedRules = [{ ...previousRules[0], matchCount: 1, lastMatched: Date.now() }];
      mockChrome.storage.local.get.mockImplementation((key: string) => {
        if (key === 'mockRules') return Promise.resolve({ mockRules: previousRules });
        if (key === 'proxyRules') return Promise.resolve({ proxyRules: [] });
        if (key === 'settings') return Promise.resolve({ settings: { enabled: true, logRequests: false } });
        return Promise.resolve({});
      });
      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockChrome.tabs.sendMessage.mockClear();

      await mockChrome.storage.onChanged.callListeners(
        { mockRules: { oldValue: previousRules, newValue: updatedRules } },
        'local'
      );

      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
      const response = await sendMessage({ action: MessageActionType.GetRules });
      expect(response).toEqual({ success: true, data: updatedRules });
    });

    test('should clear stale recording settings only on browser startup', async () => {
      mockChrome.storage.local.get.mockImplementation((keys: string[]) =>
        keys.includes('settings')
          ? Promise.resolve({ settings: { enabled: true, logRequests: true } })
          : Promise.resolve({})
      );

      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockChrome.storage.local.set).not.toHaveBeenCalledWith(
        expect.objectContaining({ settings: expect.objectContaining({ logRequests: false }) })
      );

      await mockChrome.runtime.onStartup.callListeners();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({ logRequests: false }),
      });
    });

    test('should wait for initialization before handling messages', async () => {
      const storedRules: MockRule[] = [{ id: 'loaded-rule', enabled: true } as MockRule];
      let resolveRules: (value: { mockRules: MockRule[] }) => void = () => {};
      const pendingRules = new Promise<{ mockRules: MockRule[] }>((resolve) => {
        resolveRules = resolve;
      });
      mockChrome.storage.local.get.mockImplementation((key: string) => {
        if (key === 'mockRules') return pendingRules;
        if (key === 'proxyRules') return Promise.resolve({ proxyRules: [] });
        if (key === 'settings') return Promise.resolve({ settings: { enabled: true, logRequests: false } });
        return Promise.resolve({});
      });

      loadBackgroundScript();
      const responsePromise = sendMessage({ action: MessageActionType.GetRules });
      resolveRules({ mockRules: storedRules });

      const response = await responsePromise;
      expect(response).toEqual({ success: true, data: storedRules });
    });

    test('should not initialize a second time on extension update', async () => {
      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const readsBeforeInstallEvent = mockChrome.storage.local.get.mock.calls.length;

      await mockChrome.runtime.onInstalled.callListeners({ reason: 'update' });

      expect(mockChrome.storage.local.get).toHaveBeenCalledTimes(readsBeforeInstallEvent);
      expect(mockChrome.contextMenus.create).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      loadBackgroundScript();
    });

    test('getRules should return rules', async () => {
      const rules: MockRule[] = [
        {
          id: 'test-rule',
          enabled: true,
          urlPattern: 'test',
          method: HttpMethod.GET,
          name: 'Test',
          matchType: MatchType.Exact,
          statusCode: 200,
          response: {},
          contentType: 'application/json',
          delay: 0,
          created: 0,
          modified: 0,
        },
      ];
      await mockChrome.storage.onChanged.callListeners({ mockRules: { newValue: rules } }, 'local');

      // Now get them
      const response = await sendMessage({ action: MessageActionType.GetRules });
      expect((response as MessageResponse).success).toBe(true);
      if ('data' in (response as MessageResponse)) {
        expect((response as { success: true; data: MockRule[] }).data).toEqual(rules);
      }
    });

    test('returns errors for missing tab IDs and absent counter IDs', async () => {
      expect(await sendMessage({ action: MessageActionType.GetTabById } as unknown as MessageAction)).toEqual({
        success: false,
        error: 'No tab ID provided',
      });
      expect(await sendMessage({ action: MessageActionType.IncrementRuleCounter } as unknown as MessageAction)).toEqual(
        {
          success: false,
          error: 'Missing ruleId',
        }
      );
      mockChrome.tabs.get.mockRejectedValue(new Error('closed'));
      expect(
        await sendMessage({ action: MessageActionType.GetTabById, tabId: 44 } as unknown as MessageAction)
      ).toMatchObject({
        success: false,
        error: expect.stringContaining('Tab not found'),
      });
      mockChrome.tabs.get.mockResolvedValue({ id: 44, url: 'https://example.com' });
      expect(
        await sendMessage({ action: MessageActionType.GetTabById, tabId: 44 } as unknown as MessageAction)
      ).toEqual({
        success: true,
        data: { id: 44, url: 'https://example.com' },
      });
    });

    test('rolls back recording when the tab cannot be reloaded after injection failure', async () => {
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('no content script'));
      mockChrome.tabs.reload.mockRejectedValue(new Error('tab closed'));

      const response = await sendMessage({
        action: MessageActionType.StartRecording,
        tabId: 88,
        tabTitle: 'Unavailable',
      } as unknown as MessageAction);

      expect(response).toEqual({ success: false, error: 'Failed to reload tab' });
      expect(mockChrome.storage.session.set).toHaveBeenLastCalledWith({
        runtimeState: { recordingTabId: null, standaloneWindowId: null },
      });
    });

    test('rejects toggles without a value and clears recording when disabling', async () => {
      expect(await sendMessage({ action: MessageActionType.ToggleMocking } as unknown as MessageAction)).toEqual({
        success: false,
        error: 'No enabled state provided',
      });
      mockChrome.tabs.sendMessage.mockResolvedValue(true);
      await sendMessage({
        action: MessageActionType.StartRecording,
        tabId: 12,
        tabTitle: 'Active',
      } as unknown as MessageAction);
      expect(
        await sendMessage({ action: MessageActionType.ToggleMocking, enabled: false } as unknown as MessageAction)
      ).toEqual({ success: true });
      expect(mockChrome.storage.session.set).toHaveBeenLastCalledWith({
        runtimeState: { recordingTabId: null, standaloneWindowId: null },
      });
    });

    test('storage settings changes update background state and refresh tabs', async () => {
      const settings = {
        enabled: false,
        theme: 'dark',
        logRequests: false,
        showNotifications: false,
        corsAutoFix: false,
      };
      await mockChrome.storage.onChanged.callListeners({ settings: { newValue: settings } }, 'local');

      const response = await sendMessage({ action: MessageActionType.GetSettings });
      expect(response).toMatchObject({ success: true, data: settings });

      // Should set badge to disabled state
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    test('startRecording should set recording tab', async () => {
      const tabId = 123;
      mockChrome.tabs.sendMessage.mockResolvedValue(true); // Ping success

      const response: unknown = await sendMessage({
        action: MessageActionType.StartRecording,
        tabId,
        tabTitle: 'Test',
      } as unknown as MessageAction);

      expect((response as MessageResponse).success).toBe(true);
      expect(mockChrome.storage.session.set).toHaveBeenCalledWith({
        runtimeState: { recordingTabId: tabId, standaloneWindowId: null },
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        expect.objectContaining({ action: MessageActionType.UpdateRulesInPage, capture: true })
      );
      if ('data' in (response as MessageResponse)) {
        expect((response as { success: true; data: { tabId: number } }).data.tabId).toBe(tabId);
      }

      // Check status
      const statusRes = await sendMessage({
        action: MessageActionType.GetRecordingStatus,
      } as unknown as MessageAction);
      if ('data' in (statusRes as MessageResponse)) {
        expect((statusRes as { success: true; data: { tabId: number | null } }).data.tabId).toBe(tabId);
      }

      await sendMessage({ action: MessageActionType.StopRecording } as unknown as MessageAction);
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        expect.objectContaining({ action: MessageActionType.UpdateRulesInPage, capture: false })
      );
    });

    test('incrementRuleCounter should debounce writes to rule statistics', async () => {
      jest.useFakeTimers();
      const ruleId = 'counter-rule';
      const initialRule: unknown = {
        id: ruleId,
        enabled: true,
        name: 'Test',
        urlPattern: 'test',
        matchType: 'exact',
        method: 'GET',
        statusCode: 200,
        response: {},
        delay: 0,
        created: 0,
        modified: 0,
      };
      try {
        await mockChrome.storage.onChanged.callListeners({ mockRules: { newValue: [initialRule] } }, 'local');
        mockChrome.storage.local.set.mockClear();

        await sendMessage({ action: MessageActionType.IncrementRuleCounter, ruleId } as unknown as MessageAction);
        expect(mockChrome.storage.local.set).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1000);

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
          ruleStats: expect.objectContaining({
            [ruleId]: expect.objectContaining({ count: 1, last: expect.any(Number) }),
          }),
        });
        expect(mockChrome.storage.local.set).not.toHaveBeenCalledWith(
          expect.objectContaining({ mockRules: expect.anything() })
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('Request Logging', () => {
    beforeEach(() => {
      loadBackgroundScript();
    });

    test('should log captured response when recording', async () => {
      jest.useFakeTimers();

      try {
        const tabId = 100;
        // Start recording
        mockChrome.tabs.sendMessage.mockResolvedValue(true);
        const startRes: unknown = await sendMessage({
          action: MessageActionType.StartRecording,
          tabId,
          tabTitle: 'Test',
        } as unknown as MessageAction);
        expect((startRes as MessageResponse).success).toBe(true);

        // Verify recording status
        const statusRes = await sendMessage({
          action: MessageActionType.GetRecordingStatus,
        } as unknown as MessageAction);
        if ('data' in (statusRes as MessageResponse)) {
          expect((statusRes as { success: true; data: { tabId: number | null } }).data.tabId).toBe(tabId);
        }

        const logMessage: unknown = {
          action: MessageActionType.LogCapturedResponse,
          url: 'https://api.example.com/data',
          method: 'GET',
          statusCode: 200,
          responseBody: '{"test": true}',
          contentType: 'application/json',
          responseHeaders: {},
          timestamp: Date.now(),
        };

        // Send from the recording tab
        await sendMessage(logMessage as MessageAction, { tab: { id: tabId } } as Browser.runtime.MessageSender);

        // Advance timer to trigger buffer flush (500ms interval)
        jest.advanceTimersByTime(1000);

        // Allow async flushLogBuffer to execute property access
        await Promise.resolve();

        // Storage.ts uses session storage for logs!
        expect(mockChrome.storage.session.get).toHaveBeenCalledWith('requestLog');
        expect(mockChrome.storage.session.set).toHaveBeenCalledWith(
          expect.objectContaining({
            requestLog: expect.any(Array),
          })
        );
      } finally {
        jest.useRealTimers();
      }
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should NOT log if not recording', async () => {
      await sendMessage({ action: MessageActionType.StopRecording } as unknown as MessageAction);

      const logMessage: unknown = {
        action: MessageActionType.LogCapturedResponse,
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        responseBody: '',
        contentType: '',
        responseHeaders: {},
        timestamp: Date.now(),
      };

      // Reset mocks to clear previous calls
      mockChrome.storage.local.set.mockClear();

      await sendMessage(logMessage as MessageAction, { tab: { id: 1 } } as Browser.runtime.MessageSender);

      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('Standalone Window', () => {
    beforeEach(() => {
      loadBackgroundScript();
    });

    test('should open new window if none exists', async () => {
      const response: unknown = await sendMessage({
        action: MessageActionType.OpenStandaloneWindow,
      } as unknown as MessageAction);

      expect((response as MessageResponse).success).toBe(true);
      expect(mockChrome.windows.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'window.html',
          type: 'popup',
        })
      );
    });

    test('should pass language param to window URL', async () => {
      const response: unknown = await sendMessage({
        action: MessageActionType.OpenStandaloneWindow,
        language: Language.English,
      } as unknown as MessageAction);

      expect((response as MessageResponse).success).toBe(true);
      expect(mockChrome.windows.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'window.html?lang=en',
          type: 'popup',
        })
      );
    });

    test('should focus existing window if already open', async () => {
      // First open
      mockChrome.windows.create.mockResolvedValue({ id: 555 });
      await sendMessage({ action: MessageActionType.OpenStandaloneWindow } as unknown as MessageAction);

      // Simulate checking existing window
      mockChrome.windows.get.mockResolvedValue({ id: 555 });

      // Second open request
      await sendMessage({ action: MessageActionType.OpenStandaloneWindow } as unknown as MessageAction);

      expect(mockChrome.windows.update).toHaveBeenCalledWith(555, { focused: true });
      // Should not create another
      expect(mockChrome.windows.create).toHaveBeenCalledTimes(1);
    });

    test('creates a new window when a remembered window no longer exists', async () => {
      mockChrome.storage.session.get.mockResolvedValue({
        runtimeState: { recordingTabId: null, standaloneWindowId: 555 },
      });
      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockChrome.windows.get.mockRejectedValue(new Error('window closed'));
      await sendMessage({
        action: MessageActionType.OpenStandaloneWindow,
        language: Language.Russian,
      } as unknown as MessageAction);
      expect(mockChrome.windows.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'window.html?lang=ru' }));
    });
  });

  describe('Browser lifecycle events', () => {
    beforeEach(() => loadBackgroundScript());

    test('clears recording when its tab closes and stops when it navigates to a restricted URL', async () => {
      mockChrome.tabs.sendMessage.mockResolvedValue(true);
      await sendMessage({
        action: MessageActionType.StartRecording,
        tabId: 71,
        tabTitle: 'Current',
      } as unknown as MessageAction);
      await Promise.all((listeners['tabs.onRemoved'] || []).map((listener) => listener(71)));
      expect(mockChrome.storage.session.set).toHaveBeenLastCalledWith({
        runtimeState: { recordingTabId: null, standaloneWindowId: null },
      });

      await sendMessage({
        action: MessageActionType.StartRecording,
        tabId: 72,
        tabTitle: 'Current',
      } as unknown as MessageAction);
      await Promise.all(
        (listeners['tabs.onUpdated'] || []).map((listener) =>
          listener(72, { url: 'chrome://settings' }, { id: 72, url: 'chrome://settings' })
        )
      );
      expect(mockChrome.storage.session.set).toHaveBeenLastCalledWith({
        runtimeState: { recordingTabId: null, standaloneWindowId: null },
      });
    });

    test('broadcasts recording tab title changes and clears a closed standalone window', async () => {
      mockChrome.tabs.sendMessage.mockResolvedValue(true);
      await sendMessage({
        action: MessageActionType.StartRecording,
        tabId: 81,
        tabTitle: 'Current',
      } as unknown as MessageAction);
      await Promise.all(
        (listeners['tabs.onUpdated'] || []).map((listener) =>
          listener(81, { title: 'Updated' }, { id: 81, url: 'https://example.com', title: 'Updated' })
        )
      );
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: MessageActionType.RecordingTabUpdated,
        tabTitle: 'Updated',
      });

      await sendMessage({ action: MessageActionType.OpenStandaloneWindow } as unknown as MessageAction);
      const windowId = mockChrome.windows.create.mock.results.at(-1)?.value?.id ?? 999;
      await Promise.all((listeners['windows.onRemoved'] || []).map((listener) => listener(windowId)));
    });
  });
});
