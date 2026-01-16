import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Storage } from '../storage';
import { Theme, ResolvedTheme } from '../enums';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(Theme.System);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    // Initialize with system theme immediately
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return ResolvedTheme.Light;
    }
    return ResolvedTheme.Dark;
  });

  // Detect system theme
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return ResolvedTheme.Light;
    }
    return ResolvedTheme.Dark;
  }, []);

  // Resolve theme based on user preference
  const resolveTheme = useCallback(
    (userTheme: Theme): ResolvedTheme => {
      if (userTheme === Theme.System) {
        return getSystemTheme();
      }
      return userTheme as unknown as ResolvedTheme;
    },
    [getSystemTheme]
  );

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const settings = await Storage.getSettings();
      const savedTheme = settings.theme || Theme.System;
      setThemeState(savedTheme);
      setResolvedTheme(resolveTheme(savedTheme));
    };
    loadTheme();
  }, [resolveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== Theme.System) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      setResolvedTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    // Also set data attribute for debugging
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);

      // Apply immediately to DOM
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      root.setAttribute('data-theme', resolved);

      // Save to storage
      const settings = await Storage.getSettings();
      await Storage.saveSettings({ ...settings, theme: newTheme });
    },
    [resolveTheme]
  );

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
};
