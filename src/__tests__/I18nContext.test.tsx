import { act, renderHook, waitFor } from '@testing-library/react';
import { I18nProvider, useI18n } from '../contexts/I18nContext';
import { Storage } from '../storage';
import { Language } from '../enums';
import { listeners } from './setup';

const wrapper = ({ children }: { children: React.ReactNode }) => <I18nProvider>{children}</I18nProvider>;

describe('I18nContext provider behavior', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    jest
      .spyOn(Storage, 'getSettings')
      .mockResolvedValue({ enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false });
    jest.spyOn(Storage, 'saveSettings').mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'en-US' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('loads a supported language from the URL before reading settings', async () => {
    window.history.pushState({}, '', '/?lang=ru');
    const { result } = renderHook(() => useI18n(), { wrapper });
    await waitFor(() => expect(result.current.language).toBe(Language.Russian));
    expect(Storage.getSettings).not.toHaveBeenCalled();
    expect(result.current.t('tabs.rules')).toBeTruthy();
  });

  it('detects Russian browser locale and falls back to English for other locales', async () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'ru-RU' });
    const { result, rerender } = renderHook(() => useI18n(), { wrapper });
    await waitFor(() => expect(result.current.language).toBe(Language.Russian));
    expect(result.current.t('tabs.rules')).toBeTruthy();
    rerender();
  });

  it('persists language changes and reacts to external storage updates', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    await waitFor(() => expect(Storage.getSettings).toHaveBeenCalled());
    await act(async () => result.current.setLanguage(Language.Russian));
    expect(Storage.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ language: Language.Russian }));

    await act(async () => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ settings: { newValue: { language: Language.English } } }, 'local')
      );
    });
    expect(result.current.language).toBe(Language.English);
  });

  it('formats English and Russian plural forms and replaces simple parameters', async () => {
    window.history.pushState({}, '', '/?lang=en');
    const { result } = renderHook(() => useI18n(), { wrapper });
    await waitFor(() => expect(result.current.language).toBe(Language.English));
    expect(result.current.t('time.minutesAgo', { count: 1 })).toBe('1 minute ago');
    expect(result.current.t('time.minutesAgo', { count: 4 })).toBe('4 minutes ago');

    await act(async () => result.current.setLanguage(Language.Russian));
    expect(result.current.t('time.daysAgo', { count: 1 })).toBe('1 день назад');
    expect(result.current.t('time.daysAgo', { count: 3 })).toBe('3 дня назад');
    expect(result.current.t('time.daysAgo', { count: 12 })).toBe('12 дней назад');
    expect(result.current.t('tabs.rules')).toBeTruthy();
  });
});
