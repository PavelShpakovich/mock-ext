import { isValidJSON } from '../helpers/validation';
import { escapeRegExp } from '../helpers/string';
import { formatDate } from '../helpers/formatting';

describe('utils', () => {
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

  describe('formatDate', () => {
    it('should format timestamp to locale string', () => {
      const timestamp = new Date('2026-01-12T12:00:00').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toContain('2026');
      expect(typeof formatted).toBe('string');
    });
  });
});
