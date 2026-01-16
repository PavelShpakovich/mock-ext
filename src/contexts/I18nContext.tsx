import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage } from '../storage';
import enTranslations from '../locales/en.json';
import ruTranslations from '../locales/ru.json';
import { Language } from '../enums';

interface Translations {
  [key: string]: any;
}

const translations: Record<string, Translations> = {
  [Language.English]: enTranslations,
  [Language.Russian]: ruTranslations,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(Language.English);

  useEffect(() => {
    // Load saved language preference
    const loadLanguage = async () => {
      const settings = await Storage.getSettings();
      if (settings.language) {
        setLanguageState(settings.language);
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('ru')) {
          setLanguageState(Language.Russian);
        }
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    const settings = await Storage.getSettings();
    await Storage.saveSettings({ ...settings, language: lang });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = translations[language];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      // Replace parameters and handle plural forms
      if (params) {
        // Handle plural forms: {{count, plural, one {...} few {...} other {...}}}
        // Use a more robust regex that handles nested braces
        value = value.replace(/\{\{(\w+),\s*plural,\s*((?:[^{}]|\{[^}]*\})*)\}\}/g, (match, paramKey, pluralRules) => {
          const count = params[paramKey] as number;
          if (count === undefined) return match;

          // Parse plural rules manually to handle nested braces
          let selectedForm = '';
          const rulePattern = /(one|few|other)\s*\{([^}]*)\}/g;
          const matches: Array<{ form: string; text: string }> = [];
          let ruleMatch;

          while ((ruleMatch = rulePattern.exec(pluralRules)) !== null) {
            matches.push({
              form: ruleMatch[1],
              text: ruleMatch[2],
            });
          }

          // Select appropriate form based on count and language
          for (const { form, text } of matches) {
            if (language === 'en') {
              if (form === 'one' && count === 1) {
                selectedForm = text;
                break;
              } else if (form === 'other' && count !== 1) {
                selectedForm = text;
                break;
              }
            } else if (language === 'ru') {
              const lastDigit = count % 10;
              const lastTwoDigits = count % 100;

              if (form === 'one' && lastDigit === 1 && lastTwoDigits !== 11) {
                selectedForm = text;
                break;
              } else if (
                form === 'few' &&
                lastDigit >= 2 &&
                lastDigit <= 4 &&
                (lastTwoDigits < 12 || lastTwoDigits > 14)
              ) {
                selectedForm = text;
                break;
              } else if (form === 'other') {
                selectedForm = text;
                break;
              }
            }
          }

          return selectedForm;
        });

        // Replace simple parameters
        value = value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
          return params[paramKey] !== undefined ? String(params[paramKey]) : match;
        });
      }

      return value;
    },
    [language]
  );

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
