import { Storage } from '../storage';
import { MockRule, Settings, RequestLog } from '../types';

// Mock chrome.storage.local
const mockStorage: { [key: string]: any } = {};

beforeEach(() => {
  // Clear mock storage before each test
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  (globalThis as any).chrome.storage.local.get = jest.fn((keys: string | string[] | null) => {
    const result: any = {};
    if (typeof keys === 'string') {
      result[keys] = mockStorage[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        result[key] = mockStorage[key];
      });
    } else {
      Object.assign(result, mockStorage);
    }
    return Promise.resolve(result);
  });

  (globalThis as any).chrome.storage.local.set = jest.fn((items: { [key: string]: any }) => {
    Object.assign(mockStorage, items);
    return Promise.resolve();
  });

  (globalThis as any).chrome.storage.local.remove = jest.fn((keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    keysArray.forEach((key) => delete mockStorage[key]);
    return Promise.resolve();
  });
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
      mockStorage.mockRules = mockRules;

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
      expect(mockStorage.mockRules).toEqual(mockRules);
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
      mockStorage.settings = mockSettings;

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
      expect(mockStorage.settings).toEqual(mockSettings);
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
      mockStorage.requestLog = mockLog;

      const log = await Storage.getRequestLog();
      expect(log).toEqual(mockLog);
    });

    it('should return empty array if no log exists', async () => {
      const log = await Storage.getRequestLog();
      expect(log).toEqual([]);
    });
  });

  describe('addToRequestLog', () => {
    it('should add entry to request log', async () => {
      const entry: RequestLog = {
        id: '1',
        url: 'https://api.example.com/test',
        method: 'GET',
        timestamp: Date.now(),
        matched: false,
      };

      await Storage.addToRequestLog(entry);
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

    it('should limit log to 1000 entries', async () => {
      // Add 1001 entries
      for (let i = 0; i < 1001; i++) {
        await Storage.addToRequestLog({
          id: `${i}`,
          url: `https://api.example.com/test${i}`,
          method: 'GET',
          timestamp: Date.now(),
          matched: false,
        });
      }

      const log = await Storage.getRequestLog();
      expect(log).toHaveLength(1000);
      expect(log[0].id).toBe('1000'); // Most recent
    });
  });

  describe('clearRequestLog', () => {
    it('should clear request log', async () => {
      mockStorage.requestLog = [{ id: '1', url: 'test', method: 'GET', timestamp: Date.now(), matched: false }];

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

      mockStorage.mockRules = mockRules;
      mockStorage.settings = mockSettings;
      mockStorage.requestLog = mockLog;

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
