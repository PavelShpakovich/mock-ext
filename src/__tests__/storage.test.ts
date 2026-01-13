import { Storage } from '../storage';
import { MockRule, Settings, RequestLog } from '../types';

// Mock chrome.storage.local and session
const mockLocalStorage: { [key: string]: any } = {};
const mockSessionStorage: { [key: string]: any } = {};

// Use fake timers to control batching
beforeEach(async () => {
  jest.useFakeTimers();

  // Clear mock storage before each test
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);

  (globalThis as any).chrome.storage.local.get = jest.fn((keys: string | string[] | null) => {
    const result: any = {};
    if (typeof keys === 'string') {
      result[keys] = mockLocalStorage[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        result[key] = mockLocalStorage[key];
      });
    } else {
      Object.assign(result, mockLocalStorage);
    }
    return Promise.resolve(result);
  });

  (globalThis as any).chrome.storage.local.set = jest.fn((items: { [key: string]: any }) => {
    Object.assign(mockLocalStorage, items);
    return Promise.resolve();
  });

  (globalThis as any).chrome.storage.local.remove = jest.fn((keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    keysArray.forEach((key) => delete mockLocalStorage[key]);
    return Promise.resolve();
  });

  // Mock session storage
  (globalThis as any).chrome.storage.session.get = jest.fn((keys: string | string[] | null) => {
    const result: any = {};
    if (typeof keys === 'string') {
      result[keys] = mockSessionStorage[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        result[key] = mockSessionStorage[key];
      });
    } else {
      Object.assign(result, mockSessionStorage);
    }
    return Promise.resolve(result);
  });

  (globalThis as any).chrome.storage.session.set = jest.fn((items: { [key: string]: any }) => {
    Object.assign(mockSessionStorage, items);
    return Promise.resolve();
  });

  (globalThis as any).chrome.storage.session.remove = jest.fn((keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    keysArray.forEach((key) => delete mockSessionStorage[key]);
    return Promise.resolve();
  });

  // Clear any lingering buffer state from previous tests
  await Storage.clearRequestLog();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Storage', () => {
  describe('getRules', () => {
    it('should return rules from storage', async () => {
      const mockRules: MockRule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          urlPattern: 'https://api.example.com/*',
          matchType: 'wildcard',
          method: 'GET',
          statusCode: 200,
          response: {},
          contentType: 'application/json',
          delay: 0,
          created: Date.now(),
          modified: Date.now(),
        },
      ];
      mockLocalStorage.mockRules = mockRules;

      const rules = await Storage.getRules();
      expect(rules).toEqual(mockRules);
    });

    it('should return empty array if no rules exist', async () => {
      const rules = await Storage.getRules();
      expect(rules).toEqual([]);
    });
  });

  describe('saveRules', () => {
    it('should save rules to storage', async () => {
      const mockRules: MockRule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          urlPattern: 'https://api.example.com/*',
          matchType: 'wildcard',
          method: 'GET',
          statusCode: 200,
          response: {},
          contentType: 'application/json',
          delay: 0,
          created: Date.now(),
          modified: Date.now(),
        },
      ];

      await Storage.saveRules(mockRules);
      expect(mockLocalStorage.mockRules).toEqual(mockRules);
    });
  });

  describe('getSettings', () => {
    it('should return settings from storage', async () => {
      const mockSettings: Settings = {
        enabled: true,
        logRequests: true,
        showNotifications: false,
        language: 'en',
      };
      mockLocalStorage.settings = mockSettings;

      const settings = await Storage.getSettings();
      expect(settings).toEqual(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      const settings = await Storage.getSettings();
      expect(settings).toHaveProperty('enabled');
      expect(settings).toHaveProperty('logRequests');
    });
  });

  describe('saveSettings', () => {
    it('should save settings to storage', async () => {
      const mockSettings: Settings = {
        enabled: false,
        logRequests: false,
        showNotifications: true,
        language: 'ru',
      };

      await Storage.saveSettings(mockSettings);
      expect(mockLocalStorage.settings).toEqual(mockSettings);
    });
  });

  describe('getRequestLog', () => {
    it('should return request log from storage', async () => {
      const mockLog: RequestLog[] = [
        {
          id: '1',
          url: 'https://api.example.com/test',
          method: 'GET',
          timestamp: Date.now(),
          matched: false,
        },
      ];
      mockSessionStorage.requestLog = mockLog;

      const log = await Storage.getRequestLog();
      expect(log).toEqual(mockLog);
    });

    it('should return empty array if no log exists', async () => {
      const log = await Storage.getRequestLog();
      expect(log).toEqual([]);
    });
  });

  describe('addToRequestLog', () => {
    it('should add entry to request log (buffered)', async () => {
      const entry: RequestLog = {
        id: '1',
        url: 'https://api.example.com/test',
        method: 'GET',
        timestamp: Date.now(),
        matched: false,
      };

      await Storage.addToRequestLog(entry);
      // Entry is in buffer, not yet flushed to storage
      const log = await Storage.getRequestLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(entry);
    });

    it('should add new entries to the beginning', async () => {
      const entry1: RequestLog = {
        id: '1',
        url: 'https://api.example.com/test1',
        method: 'GET',
        timestamp: Date.now(),
        matched: false,
      };
      const entry2: RequestLog = {
        id: '2',
        url: 'https://api.example.com/test2',
        method: 'POST',
        timestamp: Date.now(),
        matched: false,
      };

      await Storage.addToRequestLog(entry1);
      await Storage.addToRequestLog(entry2);

      const log = await Storage.getRequestLog();
      expect(log[0]).toEqual(entry2);
      expect(log[1]).toEqual(entry1);
    });

    it('should flush buffer after timeout', async () => {
      const entry: RequestLog = {
        id: '1',
        url: 'https://api.example.com/test',
        method: 'GET',
        timestamp: Date.now(),
        matched: false,
      };

      await Storage.addToRequestLog(entry);

      // Run timers to trigger flush
      await jest.runAllTimersAsync();

      // Now it should be in session storage
      expect(mockSessionStorage.requestLog).toHaveLength(1);
      expect(mockSessionStorage.requestLog[0]).toEqual(entry);
    });
  });

  describe('clearRequestLog', () => {
    it('should clear request log', async () => {
      mockSessionStorage.requestLog = [{ id: '1', url: 'test', method: 'GET', timestamp: Date.now(), matched: false }];

      await Storage.clearRequestLog();
      const log = await Storage.getRequestLog();
      expect(log).toEqual([]);
    });
  });

  describe('exportAll', () => {
    it('should export all data', async () => {
      const mockRules: MockRule[] = [
        {
          id: '1',
          name: 'Test',
          enabled: true,
          urlPattern: 'https://example.com',
          matchType: 'exact',
          method: 'GET',
          statusCode: 200,
          response: {},
          contentType: 'application/json',
          delay: 0,
          created: Date.now(),
          modified: Date.now(),
        },
      ];
      const mockSettings: Settings = { enabled: true, logRequests: false, showNotifications: false };
      const mockLog: RequestLog[] = [
        { id: '1', url: 'https://example.com', method: 'GET', timestamp: Date.now(), matched: false },
      ];

      mockLocalStorage.mockRules = mockRules;
      mockLocalStorage.settings = mockSettings;
      mockSessionStorage.requestLog = mockLog;

      const exported = await Storage.exportAll();
      expect(exported.mockRules).toEqual(mockRules);
      expect(exported.settings).toMatchObject(mockSettings);
      expect(exported.requestLog).toEqual(mockLog);
    });
  });

  describe('draft operations', () => {
    it('should save and retrieve draft', async () => {
      const draft = { test: 'data' };
      await Storage.saveDraft(draft);

      const retrieved = await Storage.getDraft();
      expect(retrieved).toEqual(draft);
    });

    it('should clear draft', async () => {
      await Storage.saveDraft({ test: 'data' });
      await Storage.clearDraft();

      const retrieved = await Storage.getDraft();
      expect(retrieved).toBeNull();
    });
  });
});
