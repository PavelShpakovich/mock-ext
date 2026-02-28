import { withContextCheck } from '../contextHandler';

// Mock chrome and browser globals
declare const global: {
  chrome?: { runtime?: { id?: string } };
  browser?: { runtime?: { id?: string } };
} & typeof globalThis;

describe('contextHandler', () => {
  describe('withContextCheck', () => {
    beforeEach(() => {
      // Mock chrome.runtime.id to simulate valid extension context
      global.chrome = {
        runtime: {
          id: 'test-extension-id',
        },
      } as typeof global.chrome;

      // Mock browser.runtime.id for WXT compatibility
      global.browser = {
        runtime: {
          id: 'test-extension-id',
        },
      } as typeof global.browser;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return the result when function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await withContextCheck(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return fallback when context is invalidated', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Extension context invalidated'));
      const fallback = 'fallback-value';

      const result = await withContextCheck(mockFn, fallback);

      expect(result).toBe(fallback);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return fallback when message port closed error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('The message port closed before a response was received'));
      const fallback = { data: 'fallback' };

      const result = await withContextCheck(mockFn, fallback);

      expect(result).toEqual(fallback);
    });

    it('should throw error if context invalidated and no fallback provided', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Extension context invalidated'));

      await expect(withContextCheck(mockFn)).rejects.toThrow('Extension context invalidated');
    });

    it('should throw non-context-related errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(withContextCheck(mockFn)).rejects.toThrow('Network error');
    });

    it('should work with different return types', async () => {
      const mockFnNumber = jest.fn().mockResolvedValue(42);
      const mockFnObject = jest.fn().mockResolvedValue({ key: 'value' });
      const mockFnArray = jest.fn().mockResolvedValue([1, 2, 3]);

      expect(await withContextCheck(mockFnNumber)).toBe(42);
      expect(await withContextCheck(mockFnObject)).toEqual({ key: 'value' });
      expect(await withContextCheck(mockFnArray)).toEqual([1, 2, 3]);
    });

    it('should throw error when context invalidated and fallback is explicitly undefined', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Extension context invalidated'));

      // When fallback is undefined and context is invalidated, it should throw
      await expect(withContextCheck(mockFn)).rejects.toThrow('Extension context invalidated');
    });

    it('should return fallback when chrome.runtime.id is not available', async () => {
      // Simulate invalidated context
      if (global.chrome?.runtime && 'id' in global.chrome.runtime) {
        (global.chrome.runtime as { id?: string }).id = undefined;
      }
      if (global.browser?.runtime && 'id' in global.browser.runtime) {
        (global.browser.runtime as { id?: string }).id = undefined;
      }

      const mockFn = jest.fn().mockResolvedValue('should not be called');
      const fallback = 'fallback-value';

      const result = await withContextCheck(mockFn, fallback);

      expect(result).toBe(fallback);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should throw when chrome.runtime.id is not available and no fallback', async () => {
      // Simulate invalidated context
      if (global.chrome?.runtime && 'id' in global.chrome.runtime) {
        (global.chrome.runtime as { id?: string }).id = undefined;
      }
      if (global.browser?.runtime && 'id' in global.browser.runtime) {
        (global.browser.runtime as { id?: string }).id = undefined;
      }

      const mockFn = jest.fn().mockResolvedValue('should not be called');

      await expect(withContextCheck(mockFn)).rejects.toThrow('Extension context invalidated');
      expect(mockFn).not.toHaveBeenCalled();
    });
  });
});
