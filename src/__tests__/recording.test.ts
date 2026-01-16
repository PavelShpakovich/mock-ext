import { isValidRecordingTab, createUpdatedSettings, createDisabledSettings } from '../helpers/recording';
import { Settings } from '../types';

// Mock Chrome API
(globalThis as any).chrome = {
  windows: {
    WINDOW_ID_NONE: -1,
  },
};

describe('Recording Helpers', () => {
  describe('isValidRecordingTab', () => {
    it('should return true for valid web tabs', () => {
      const validTab: chrome.tabs.Tab = {
        id: 123,
        url: 'https://example.com',
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(validTab)).toBe(true);
    });

    it('should return false for tabs without id', () => {
      const tab: chrome.tabs.Tab = {
        url: 'https://example.com',
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });

    it('should return false for tabs without url', () => {
      const tab: chrome.tabs.Tab = {
        id: 123,
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });

    it('should return false for chrome extension URLs', () => {
      const tab: chrome.tabs.Tab = {
        id: 123,
        url: 'chrome-extension://abc123/popup.html',
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });

    it('should return false for chrome:// URLs', () => {
      const tab: chrome.tabs.Tab = {
        id: 123,
        url: 'chrome://settings',
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });

    it('should return false for about: URLs', () => {
      const tab: chrome.tabs.Tab = {
        id: 123,
        url: 'about:blank',
        windowId: 1,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });

    it('should return false for tabs with WINDOW_ID_NONE', () => {
      const tab: chrome.tabs.Tab = {
        id: 123,
        url: 'https://example.com',
        windowId: chrome.windows.WINDOW_ID_NONE,
        index: 0,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      };

      expect(isValidRecordingTab(tab)).toBe(false);
    });
  });

  describe('createUpdatedSettings', () => {
    it('should merge updates into current settings', () => {
      const currentSettings: Settings = {
        enabled: true,
        logRequests: false,
        showNotifications: true,
        corsAutoFix: false,
      };

      const updates = { logRequests: true };

      const result = createUpdatedSettings(currentSettings, updates);

      expect(result).toEqual({
        enabled: true,
        logRequests: true,
        showNotifications: true,
        corsAutoFix: false,
      });
    });

    it('should handle multiple updates', () => {
      const currentSettings: Settings = {
        enabled: true,
        logRequests: false,
        showNotifications: true,
        corsAutoFix: false,
      };

      const updates = {
        logRequests: true,
        corsAutoFix: true,
      };

      const result = createUpdatedSettings(currentSettings, updates);

      expect(result).toEqual({
        enabled: true,
        logRequests: true,
        showNotifications: true,
        corsAutoFix: true,
      });
    });
  });

  describe('createDisabledSettings', () => {
    it('should disable all features when extension is disabled', () => {
      const currentSettings: Settings = {
        enabled: true,
        logRequests: true,
        showNotifications: true,
        corsAutoFix: true,
      };

      const result = createDisabledSettings(currentSettings);

      expect(result).toEqual({
        enabled: false,
        logRequests: false,
        showNotifications: true,
        corsAutoFix: false,
      });
    });

    it('should only disable enabled features', () => {
      const currentSettings: Settings = {
        enabled: true,
        logRequests: false,
        showNotifications: true,
        corsAutoFix: false,
      };

      const result = createDisabledSettings(currentSettings);

      expect(result).toEqual({
        enabled: false,
        logRequests: false,
        showNotifications: true,
        corsAutoFix: false,
      });
    });

    it('should preserve showNotifications', () => {
      const currentSettings: Settings = {
        enabled: true,
        logRequests: true,
        showNotifications: false,
        corsAutoFix: true,
      };

      const result = createDisabledSettings(currentSettings);

      expect(result.showNotifications).toBe(false);
    });
  });
});
