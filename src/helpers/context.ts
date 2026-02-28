/**
 * Helper functions to detect the extension context (DevTools, Standalone Window, or Popup)
 */

import { Language } from '../enums';

export type ExtensionContext = 'devtools' | 'window' | 'popup';

/**
 * Detect current extension context
 */
export function getExtensionContext(): ExtensionContext {
  // Check URL to distinguish between contexts
  const url = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);

  // DevTools panel has tabId query parameter
  if (url.includes('window.html') && urlParams.has('tabId')) {
    return 'devtools';
  }

  // Standalone window
  if (url.includes('window.html')) {
    return 'window';
  }

  // Default to popup (icon click)
  return 'popup';
}

/**
 * Check if running in DevTools
 */
export function isDevTools(): boolean {
  return getExtensionContext() === 'devtools';
}

/**
 * Check if running in standalone window
 */
export function isStandaloneWindow(): boolean {
  return getExtensionContext() === 'window';
}

/**
 * Check if running in popup (toolbar icon)
 */
export function isPopup(): boolean {
  return getExtensionContext() === 'popup';
}

/**
 * Open standalone window from any context
 */
export async function openStandaloneWindow(language?: Language): Promise<void> {
  try {
    await browser.runtime.sendMessage({ action: 'openStandaloneWindow', language });
  } catch (error) {
    console.error('[Moq] Failed to open standalone window:', error);
  }
}
