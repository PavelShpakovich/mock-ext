import { MockRule, Settings, StorageData, RequestLog } from './types';

// Batch buffer for log entries
let logBuffer: RequestLog[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_INTERVAL_MS = 500;
const MAX_LOG_ENTRIES = 1000;

export class Storage {
  private static readonly RULES_KEY = 'mockRules';
  private static readonly SETTINGS_KEY = 'settings';
  private static readonly LOG_KEY = 'requestLog';
  private static readonly DRAFT_KEY = 'ruleDraft';

  static async getRules(): Promise<MockRule[]> {
    const result = await chrome.storage.local.get(this.RULES_KEY);
    return result[this.RULES_KEY] || [];
  }

  static async saveRules(rules: MockRule[]): Promise<void> {
    await chrome.storage.local.set({ [this.RULES_KEY]: rules });
  }

  static async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(this.SETTINGS_KEY);
    return (
      result[this.SETTINGS_KEY] || {
        enabled: true,
        logRequests: true,
        showNotifications: false,
        theme: 'light',
      }
    );
  }

  static async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ [this.SETTINGS_KEY]: settings });
  }

  static async getRequestLog(): Promise<RequestLog[]> {
    // Include any pending buffered entries
    const result = await chrome.storage.session.get(this.LOG_KEY);
    const storedLog = result[this.LOG_KEY] || [];
    // Prepend buffered entries (they are the most recent)
    return [...logBuffer, ...storedLog];
  }

  static async saveRequestLog(log: RequestLog[]): Promise<void> {
    await chrome.storage.session.set({ [this.LOG_KEY]: log });
  }

  static async addToRequestLog(entry: RequestLog): Promise<void> {
    // Add to buffer instead of immediately writing to storage
    logBuffer.unshift(entry);

    // Schedule a flush if not already scheduled
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => this.flushLogBuffer(), BATCH_INTERVAL_MS);
    }
  }

  private static async flushLogBuffer(): Promise<void> {
    if (logBuffer.length === 0) {
      flushTimeout = null;
      return;
    }

    try {
      const result = await chrome.storage.session.get(this.LOG_KEY);
      const existingLog: RequestLog[] = result[this.LOG_KEY] || [];

      // Prepend buffered entries and limit total size
      const combinedLog = [...logBuffer, ...existingLog].slice(0, MAX_LOG_ENTRIES);

      await chrome.storage.session.set({ [this.LOG_KEY]: combinedLog });
    } catch (error) {
      console.error('[MockAPI] Error flushing log buffer:', error);
    } finally {
      logBuffer = [];
      flushTimeout = null;
    }
  }

  static async clearRequestLog(): Promise<void> {
    logBuffer = [];
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    await chrome.storage.session.remove(this.LOG_KEY);
  }

  static async exportAll(): Promise<StorageData> {
    const [rules, settings, log] = await Promise.all([this.getRules(), this.getSettings(), this.getRequestLog()]);

    return { mockRules: rules, settings, requestLog: log };
  }

  static async importRules(rules: MockRule[]): Promise<void> {
    const existingRules = await this.getRules();
    const mergedRules = [...existingRules, ...rules];
    await this.saveRules(mergedRules);
  }

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
