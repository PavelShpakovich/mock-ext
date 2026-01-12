import { generateUUID, isValidJSON, isValidURL, escapeRegExp, debounce, formatDate } from '../utils';

describe('utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isValidJSON', () => {
    it('should return true for valid JSON strings', () => {
      expect(isValidJSON('{}')).toBe(true);
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isValidJSON('{')).toBe(false);
      expect(isValidJSON('{key: value}')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON("{'key': 'value'}")).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com/path')).toBe(true);
      expect(isValidURL('https://example.com:8080/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('example.com')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegExp('hello.world')).toBe('hello\\.world');
      expect(escapeRegExp('test*')).toBe('test\\*');
      expect(escapeRegExp('a+b')).toBe('a\\+b');
      expect(escapeRegExp('(hello)')).toBe('\\(hello\\)');
      expect(escapeRegExp('[abc]')).toBe('\\[abc\\]');
      expect(escapeRegExp('a^b$c')).toBe('a\\^b\\$c');
    });

    it('should handle strings without special characters', () => {
      expect(escapeRegExp('hello')).toBe('hello');
      expect(escapeRegExp('123')).toBe('123');
    });

    it('should handle empty strings', () => {
      expect(escapeRegExp('')).toBe('');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('formatDate', () => {
    it('should format timestamp to locale string', () => {
      const timestamp = new Date('2026-01-12T12:00:00').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toContain('2026');
      expect(typeof formatted).toBe('string');
    });
  });
});
