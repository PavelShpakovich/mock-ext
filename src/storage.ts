import { MockRule, Settings, StorageData, RequestLog, Folder } from './types';
import { Theme } from './enums';

// Batch buffer for log entries
let logBuffer: RequestLog[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Constants
const BATCH_INTERVAL_MS = 500;
const MAX_LOG_ENTRIES = 1000;

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  logRequests: false,
  showNotifications: false,
  corsAutoFix: false,
  theme: Theme.System,
};

export class Storage {
  private static readonly RULES_KEY = 'mockRules';
  private static readonly SETTINGS_KEY = 'settings';
  private static readonly LOG_KEY = 'requestLog';
  private static readonly DRAFT_KEY = 'ruleDraft';
  private static readonly FOLDERS_KEY = 'folders';

  // Rules operations
  static async getRules(): Promise<MockRule[]> {
    const result = await chrome.storage.local.get(this.RULES_KEY);
    return result[this.RULES_KEY] || [];
  }

  static async saveRules(rules: MockRule[]): Promise<void> {
    await chrome.storage.local.set({ [this.RULES_KEY]: rules });
  }

  // Folders operations
  static async getFolders(): Promise<Folder[]> {
    const result = await chrome.storage.local.get(this.FOLDERS_KEY);
    return result[this.FOLDERS_KEY] || [];
  }

  static async saveFolders(folders: Folder[]): Promise<void> {
    await chrome.storage.local.set({ [this.FOLDERS_KEY]: folders });
  }

  // Settings operations
  static async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(this.SETTINGS_KEY);
    return result[this.SETTINGS_KEY] || DEFAULT_SETTINGS;
  }

  static async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ [this.SETTINGS_KEY]: settings });
  }

  // Request log operations
  static async getRequestLog(): Promise<RequestLog[]> {
    const result = await chrome.storage.session.get(this.LOG_KEY);
    const storedLog = result[this.LOG_KEY] || [];
    // Prepend buffered entries (they are the most recent)
    return [...logBuffer, ...storedLog];
  }

  static async saveRequestLog(log: RequestLog[]): Promise<void> {
    await chrome.storage.session.set({ [this.LOG_KEY]: log });
  }

  static async addToRequestLog(entry: RequestLog): Promise<void> {
    logBuffer.unshift(entry);
    this.scheduleLogFlush();
  }

  static async clearRequestLog(): Promise<void> {
    this.cancelLogFlush();
    logBuffer = [];
    await chrome.storage.session.remove(this.LOG_KEY);
  }

  // Buffer management
  private static scheduleLogFlush(): void {
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => this.flushLogBuffer(), BATCH_INTERVAL_MS);
    }
  }

  private static cancelLogFlush(): void {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
  }

  private static async flushLogBuffer(): Promise<void> {
    if (logBuffer.length === 0) {
      this.cancelLogFlush();
      return;
    }

    // Capture current buffer and clear it to avoid race conditions
    const currentBuffer = [...logBuffer];
    logBuffer = [];
    this.cancelLogFlush();

    try {
      const result = await chrome.storage.session.get(this.LOG_KEY);
      const existingLog = result[this.LOG_KEY] || [];
      const combinedLog = [...currentBuffer, ...existingLog].slice(0, MAX_LOG_ENTRIES);
      await chrome.storage.session.set({ [this.LOG_KEY]: combinedLog });
    } catch (error) {
      console.error('[Moq] Error flushing log buffer:', error);
    }
  }

  // Import/Export operations
  static async exportAll(): Promise<StorageData> {
    const [rules, settings, log] = await Promise.all([this.getRules(), this.getSettings(), this.getRequestLog()]);

    return { mockRules: rules, settings, requestLog: log };
  }

  static async importRules(rules: MockRule[]): Promise<void> {
    const existingRules = await this.getRules();
    const mergedRules = [...existingRules, ...rules];
    await this.saveRules(mergedRules);
  }

  // Draft operations
  static async saveDraft(draft: any): Promise<void> {
    await chrome.storage.local.set({ [this.DRAFT_KEY]: draft });
  }

  static async getDraft(): Promise<any> {
    const result = await chrome.storage.local.get(this.DRAFT_KEY);
    return result[this.DRAFT_KEY] || null;
  }

  static async clearDraft(): Promise<void> {
    await chrome.storage.local.remove(this.DRAFT_KEY);
  }
}
