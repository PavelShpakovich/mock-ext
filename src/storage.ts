import { MockRule, Settings, StorageData, RequestLog } from './types';

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
    const result = await chrome.storage.local.get(this.LOG_KEY);
    return result[this.LOG_KEY] || [];
  }

  static async saveRequestLog(log: RequestLog[]): Promise<void> {
    await chrome.storage.local.set({ [this.LOG_KEY]: log });
  }

  static async addToRequestLog(entry: RequestLog): Promise<void> {
    const log = await this.getRequestLog();
    log.unshift(entry);

    // Keep only last 1000 entries
    if (log.length > 1000) {
      log.splice(1000);
    }

    await this.saveRequestLog(log);
  }

  static async clearRequestLog(): Promise<void> {
    await chrome.storage.local.remove(this.LOG_KEY);
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
