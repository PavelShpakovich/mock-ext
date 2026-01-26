import '../__tests__/setup';
import { MessageAction, MessageResponse } from '../types';

// Helper to access the chrome mock with types
const mockChrome = (globalThis as any).chrome;

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (globalThis as any).chrome.resetListeners();

    // Default storage state
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.remove.mockResolvedValue(undefined); // Add this

    mockChrome.storage.session.get.mockResolvedValue({});
    mockChrome.storage.session.set.mockResolvedValue(undefined);
    mockChrome.storage.session.remove.mockResolvedValue(undefined);

    mockChrome.tabs.query.mockResolvedValue([]);
    mockChrome.windows.create.mockResolvedValue({ id: 999 });

    // Necessary for .catch() blocks in background.ts
    mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
  });

  const loadBackgroundScript = () => {
    // Isolate modules to ensure a fresh execution of background.ts logic
    // This runs appropriate top-level code like initialize()
    jest.isolateModules(() => {
      require('../background');
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
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'chrome://settings' }, // Should be ignored
      ]);

      // Mock ping failure (content script not present)
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Connection failed'));

      loadBackgroundScript();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should inject into valid tab
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 1, allFrames: true },
          files: ['content-script.js'],
        })
      );

      // Should not inject into restricted tab
      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 2 },
        })
      );
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      loadBackgroundScript();
    });

    test('getRules should return rules', async () => {
      // Setup initial state via storage mock before loading script?
      // Too late, script already loaded in beforeEach.
      // background.ts loads state into local variables on start.
      // We need to either reload script or update via message.

      // Let's update via message first
      const rules: any = [
        {
          id: 'test-rule',
          enabled: true,
          urlPattern: 'test',
          method: 'GET',
          name: 'Test',
          matchType: 'exact',
          statusCode: 200,
          response: {},
          delay: 0,
          created: 0,
          modified: 0,
        },
      ];
      await sendMessage({ action: 'updateRules', rules });

      // Now get them
      const response: any = await sendMessage({ action: 'getRules' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual(rules);
    });

    test('updateSettings should update settings and refresh tabs', async () => {
      const settings: any = {
        enabled: false,
        theme: 'dark',
        logRequests: false,
        showNotifications: false,
        corsAutoFix: false,
      };

      const response: any = await sendMessage({ action: 'updateSettings', settings });

      expect(response.success).toBe(true);
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ settings }));

      // Should set badge to disabled state
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    test('startRecording should set recording tab', async () => {
      const tabId = 123;
      mockChrome.tabs.sendMessage.mockResolvedValue(true); // Ping success

      const response: any = await sendMessage({ action: 'startRecording', tabId, tabTitle: 'Test' });

      expect(response.success).toBe(true);
      expect(response.data.tabId).toBe(tabId);

      // Check status
      const statusRes: any = await sendMessage({ action: 'getRecordingStatus' });
      expect(statusRes.data.tabId).toBe(tabId);
    });

    test('incrementRuleCounter should update match count', async () => {
      // 1. Set up a rule
      const ruleId = 'counter-rule';
      const initialRule: any = {
        id: ruleId,
        matchCount: 0,
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
      await sendMessage({ action: 'updateRules', rules: [initialRule] });

      // 2. Increment
      await sendMessage({ action: 'incrementRuleCounter', ruleId });

      // 3. Verify storage update
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          mockRules: expect.arrayContaining([
            expect.objectContaining({
              id: ruleId,
              matchCount: 1,
            }),
          ]),
        })
      );
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
        const startRes: any = await sendMessage({ action: 'startRecording', tabId, tabTitle: 'Test' });
        expect(startRes.success).toBe(true);

        // Verify recording status
        const statusRes: any = await sendMessage({ action: 'getRecordingStatus' });
        expect(statusRes.data.tabId).toBe(tabId);

        const logMessage: any = {
          action: 'logCapturedResponse',
          url: 'https://api.example.com/data',
          method: 'GET',
          statusCode: 200,
          responseBody: '{"test": true}',
          contentType: 'application/json',
          responseHeaders: {},
          timestamp: Date.now(),
        };

        // Send from the recording tab
        await sendMessage(logMessage, { tab: { id: tabId } });

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
      await sendMessage({ action: 'stopRecording' });

      const logMessage: any = {
        action: 'logCapturedResponse',
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

      await sendMessage(logMessage, { tab: { id: 1 } });

      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('Standalone Window', () => {
    beforeEach(() => {
      loadBackgroundScript();
    });

    test('should open new window if none exists', async () => {
      const response: any = await sendMessage({ action: 'openStandaloneWindow' });

      expect(response.success).toBe(true);
      expect(mockChrome.windows.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'window.html',
          type: 'popup',
        })
      );
    });

    test('should focus existing window if already open', async () => {
      // First open
      mockChrome.windows.create.mockResolvedValue({ id: 555 });
      await sendMessage({ action: 'openStandaloneWindow' });

      // Simulate checking existing window
      mockChrome.windows.get.mockResolvedValue({ id: 555 });

      // Second open request
      await sendMessage({ action: 'openStandaloneWindow' });

      expect(mockChrome.windows.update).toHaveBeenCalledWith(555, { focused: true });
      // Should not create another
      expect(mockChrome.windows.create).toHaveBeenCalledTimes(1);
    });
  });
});
