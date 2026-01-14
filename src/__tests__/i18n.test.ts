/**
 * Tests for I18nContext
 * Note: Full integration tests would require mocking React hooks and chrome.storage
 * These tests focus on the translation function logic
 */

import enTranslations from '../locales/en.json';
import ruTranslations from '../locales/ru.json';

describe('I18n Translations', () => {
  describe('Translation files structure', () => {
    it('should have valid English translations', () => {
      expect(enTranslations).toBeDefined();
      expect(enTranslations.app).toBeDefined();
      expect(enTranslations.app.name).toBe('MockAPI');
    });

    it('should have valid Russian translations', () => {
      expect(ruTranslations).toBeDefined();
      expect(ruTranslations.app).toBeDefined();
      expect(ruTranslations.app.name).toBe('MockAPI');
    });

    it('should have matching keys between EN and RU', () => {
      const enKeys = JSON.stringify(Object.keys(enTranslations).sort());
      const ruKeys = JSON.stringify(Object.keys(ruTranslations).sort());

      expect(enKeys).toBe(ruKeys);
    });

    it('should have nested structure for app section', () => {
      expect(enTranslations.app).toHaveProperty('name');
      expect(ruTranslations.app).toHaveProperty('name');
    });

    it('should have nested structure for header section', () => {
      expect(enTranslations.header).toBeDefined();
      expect(enTranslations.header).toHaveProperty('enabled');
      expect(enTranslations.header).toHaveProperty('disabled');
      expect(enTranslations.header).toHaveProperty('record');
      expect(enTranslations.header).toHaveProperty('stop');

      expect(ruTranslations.header).toBeDefined();
      expect(ruTranslations.header).toHaveProperty('enabled');
      expect(ruTranslations.header).toHaveProperty('disabled');
    });

    it('should have nested structure for editor section', () => {
      expect(enTranslations.editor).toBeDefined();
      expect(enTranslations.editor).toHaveProperty('createRule');
      expect(enTranslations.editor).toHaveProperty('updateRule');
      expect(enTranslations.editor).toHaveProperty('ruleName');

      expect(ruTranslations.editor).toBeDefined();
      expect(ruTranslations.editor).toHaveProperty('createRule');
      expect(ruTranslations.editor).toHaveProperty('updateRule');
    });

    it('should have nested structure for rules section', () => {
      expect(enTranslations.rules).toBeDefined();
      expect(enTranslations.rules).toHaveProperty('title');
      expect(enTranslations.rules).toHaveProperty('noRules');

      expect(ruTranslations.rules).toBeDefined();
      expect(ruTranslations.rules).toHaveProperty('title');
    });

    it('should have nested structure for requests section', () => {
      expect(enTranslations.requests).toBeDefined();
      expect(enTranslations.requests).toHaveProperty('title');
      expect(enTranslations.requests).toHaveProperty('clear');

      expect(ruTranslations.requests).toBeDefined();
      expect(ruTranslations.requests).toHaveProperty('title');
    });
  });

  describe('Parameter substitution logic', () => {
    // Simulating the t() function logic for testing
    const substituteParams = (text: string, params?: Record<string, string | number>): string => {
      if (!params) return text;

      let result = text;
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return result;
    };

    it('should replace single parameter', () => {
      const template = 'Hello {{name}}!';
      const result = substituteParams(template, { name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should replace multiple parameters', () => {
      const template = '{{count}} items in {{category}}';
      const result = substituteParams(template, { count: 5, category: 'basket' });

      expect(result).toBe('5 items in basket');
    });

    it('should handle numeric parameters', () => {
      const template = 'Page {{page}} of {{total}}';
      const result = substituteParams(template, { page: 1, total: 10 });

      expect(result).toBe('Page 1 of 10');
    });

    it('should return unchanged text when no parameters provided', () => {
      const template = 'Static text';
      const result = substituteParams(template);

      expect(result).toBe('Static text');
    });

    it('should handle empty parameters object', () => {
      const template = 'Static text';
      const result = substituteParams(template, {});

      expect(result).toBe('Static text');
    });

    it('should handle multiple occurrences of same parameter', () => {
      const template = '{{name}} said: "Hello, {{name}}!"';
      const result = substituteParams(template, { name: 'Alice' });

      expect(result).toBe('Alice said: "Hello, Alice!"');
    });
  });

  describe('Translation key validation', () => {
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    it('should retrieve nested translation keys', () => {
      expect(getNestedValue(enTranslations, 'app.name')).toBe('MockAPI');
      expect(getNestedValue(enTranslations, 'header.enabled')).toBe('Enabled');
      expect(getNestedValue(enTranslations, 'editor.createRule')).toBe('Create Rule');
    });

    it('should return undefined for non-existent keys', () => {
      expect(getNestedValue(enTranslations, 'app.nonexistent')).toBeUndefined();
      expect(getNestedValue(enTranslations, 'nonexistent.key')).toBeUndefined();
    });

    it('should handle deeply nested paths', () => {
      expect(getNestedValue(enTranslations, 'editor.ruleName')).toBeDefined();
      expect(getNestedValue(ruTranslations, 'editor.ruleName')).toBeDefined();
    });
  });

  describe('Language coverage', () => {
    const getAllKeys = (obj: any, prefix = ''): string[] => {
      let keys: string[] = [];

      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }

      return keys;
    };

    it('should have same number of translation keys in both languages', () => {
      const enKeys = getAllKeys(enTranslations);
      const ruKeys = getAllKeys(ruTranslations);

      expect(enKeys.length).toBe(ruKeys.length);
    });

    it('should have all EN keys present in RU', () => {
      const enKeys = getAllKeys(enTranslations).sort();
      const ruKeys = getAllKeys(ruTranslations).sort();

      expect(enKeys).toEqual(ruKeys);
    });

    it('should not have empty translation values', () => {
      const checkForEmpty = (obj: any, lang: string, path = ''): void => {
        for (const key in obj) {
          const fullPath = path ? `${path}.${key}` : key;

          if (typeof obj[key] === 'object' && obj[key] !== null) {
            checkForEmpty(obj[key], lang, fullPath);
          } else if (typeof obj[key] === 'string') {
            expect(obj[key].trim()).not.toBe('');
          }
        }
      };

      checkForEmpty(enTranslations, 'EN');
      checkForEmpty(ruTranslations, 'RU');
    });
  });
});
