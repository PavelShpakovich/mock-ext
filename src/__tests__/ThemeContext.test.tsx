import { act, renderHook, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { Storage } from '../storage';
import { Theme, ResolvedTheme } from '../enums';
import { listeners } from './setup';

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

function setSystemLight(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
}

describe('ThemeContext', () => {
  beforeEach(() => {
    setSystemLight(false);
    jest.spyOn(Storage, 'getSettings').mockResolvedValue({
      enabled: true,
      logRequests: false,
      showNotifications: false,
      corsAutoFix: false,
      theme: Theme.System,
    });
    jest.spyOn(Storage, 'saveSettings').mockResolvedValue(undefined);
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
    jest.restoreAllMocks();
  });

  it('loads the saved system theme and applies the dark system preference', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe(Theme.System));

    expect(result.current.resolvedTheme).toBe(ResolvedTheme.Dark);
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('resolves an explicit light or dark selection and persists it', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe(Theme.System));

    await act(async () => result.current.setTheme(Theme.Light));
    expect(result.current.resolvedTheme).toBe(ResolvedTheme.Light);
    expect(document.documentElement).toHaveClass('light');
    expect(Storage.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ theme: Theme.Light }));
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({ action: 'settingsUpdated' });

    await act(async () => result.current.setTheme(Theme.Dark));
    expect(result.current.resolvedTheme).toBe(ResolvedTheme.Dark);
    expect(document.documentElement).toHaveClass('dark');
  });

  it('reloads external theme changes and removes the runtime listener on unmount', async () => {
    const getSettings = Storage.getSettings as jest.Mock;
    const { result, unmount } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.theme).toBe(Theme.System));
    getSettings.mockResolvedValue({
      enabled: true,
      logRequests: false,
      showNotifications: false,
      corsAutoFix: false,
      theme: Theme.Light,
    });

    await act(async () => {
      await Promise.all(
        (listeners['runtime.onMessage'] || []).map((listener) => listener({ action: 'settingsUpdated' }))
      );
    });
    expect(result.current.theme).toBe(Theme.Light);
    expect(result.current.resolvedTheme).toBe(ResolvedTheme.Light);

    unmount();
    expect(listeners['runtime.onMessage']).toHaveLength(0);
  });

  it('throws when useTheme is rendered outside its provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
  });
});
