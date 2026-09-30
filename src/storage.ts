import { MockRule, Settings, StorageData, RequestLog, Folder, ProxyRule, RuleStats } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { migrateFoldersAndRules } from './helpers/folderManagement';
import { stripRuleStats } from './helpers/ruleStats';

// Batch buffer for log entries
let logBuffer: RequestLog[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Constants
const BATCH_INTERVAL_MS = 500;
const MAX_LOG_ENTRIES = 1000;
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit for session storage logs
const RULE_STATS_KEY = 'ruleStats';

export class Storage {
  private static readonly RULES_KEY = 'mockRules';
  private static readonly SETTINGS_KEY = 'settings';
  private static readonly LOG_KEY = 'requestLog';
  private static readonly DRAFT_KEY = 'ruleDraft';
  private static readonly FOLDERS_KEY = 'folders';
  private static readonly PROXY_RULES_KEY = 'proxyRules';
  private static readonly SCHEMA_VERSION_KEY = 'schemaVersion';
  private static readonly CURRENT_SCHEMA_VERSION = 4;

  /**
   * Run storage schema migrations (idempotent — safe to call multiple times).
   * v1 → v2: adds `order` to rules/folders and `parentFolderId` to folders.
   */
  static async migrateStorageSchema(): Promise<void> {
    try {
      const result = (await browser.storage.local.get(this.SCHEMA_VERSION_KEY)) as { [key: string]: unknown };
      const storedVersion: number = (result[this.SCHEMA_VERSION_KEY] as number) ?? 1;

      if (storedVersion >= this.CURRENT_SCHEMA_VERSION) return; // Already up to date

      if (storedVersion < 2) {
        const [folders, rules] = await Promise.all([this.getFolders(), this.getRules()]);
        const migrated = migrateFoldersAndRules(folders, rules);
        await Promise.all([
          browser.storage.local.set({ [this.FOLDERS_KEY]: migrated.folders }),
          browser.storage.local.set({ [this.RULES_KEY]: migrated.rules }),
        ]);
        // eslint-disable-next-line no-console
        console.log('[Moq] Storage migrated to schema v2 (order fields added)');
      }

      if (storedVersion < 3) {
        // v2 → v3: ensure proxyRules key exists
        const result2 = (await browser.storage.local.get(this.PROXY_RULES_KEY)) as { [key: string]: unknown };
        if (!result2[this.PROXY_RULES_KEY]) {
          await browser.storage.local.set({ [this.PROXY_RULES_KEY]: [] });
        }
        // eslint-disable-next-line no-console
        console.log('[Moq] Storage migrated to schema v3 (proxy rules added)');
      }

      if (storedVersion < 4) {
        const [rules, proxyRules] = await Promise.all([this.getRules(), this.getProxyRules()]);
        const storedStats = await this.getRuleStats();
        const migratedStats = { ...storedStats };
        for (const rule of [...rules, ...proxyRules]) {
          if (!migratedStats[rule.id] && (rule.matchCount || rule.lastMatched)) {
            migratedStats[rule.id] = { count: rule.matchCount ?? 0, last: rule.lastMatched };
          }
        }
        await Promise.all([this.saveRules(rules), this.saveProxyRules(proxyRules), this.saveRuleStats(migratedStats)]);
        // eslint-disable-next-line no-console
        console.log('[Moq] Storage migrated to schema v4 (rule statistics separated)');
      }

      await browser.storage.local.set({ [this.SCHEMA_VERSION_KEY]: this.CURRENT_SCHEMA_VERSION });
    } catch (error) {
      console.error('[Moq] Storage migration failed:', error);
    }
  }

  // Rules operations
  static async getRules(): Promise<MockRule[]> {
    const result = (await browser.storage.local.get(this.RULES_KEY)) as { [key: string]: unknown };
    return (result[this.RULES_KEY] as MockRule[]) || [];
  }

  static async saveRules(rules: MockRule[]): Promise<void> {
    await browser.storage.local.set({ [this.RULES_KEY]: stripRuleStats(rules) });
  }

  // Folders operations
  static async getFolders(): Promise<Folder[]> {
    const result = (await browser.storage.local.get(this.FOLDERS_KEY)) as { [key: string]: unknown };
    return (result[this.FOLDERS_KEY] as Folder[]) || [];
  }

  static async saveFolders(folders: Folder[]): Promise<void> {
    await browser.storage.local.set({ [this.FOLDERS_KEY]: folders });
  }

  // Proxy rules operations
  static async getProxyRules(): Promise<ProxyRule[]> {
    const result = (await browser.storage.local.get(this.PROXY_RULES_KEY)) as { [key: string]: unknown };
    return (result[this.PROXY_RULES_KEY] as ProxyRule[]) || [];
  }

  static async saveProxyRules(proxyRules: ProxyRule[]): Promise<void> {
    await browser.storage.local.set({ [this.PROXY_RULES_KEY]: stripRuleStats(proxyRules) });
  }

  static async getRuleStats(): Promise<RuleStats> {
    const result = (await browser.storage.local.get(RULE_STATS_KEY)) as { [key: string]: unknown };
    const storedStats = result[RULE_STATS_KEY] as RuleStats | undefined;
    if (storedStats) return storedStats;

    const [rules, proxyRules] = await Promise.all([this.getRules(), this.getProxyRules()]);
    const legacyStats: RuleStats = {};
    for (const rule of [...rules, ...proxyRules]) {
      if (rule.matchCount || rule.lastMatched) {
        legacyStats[rule.id] = { count: rule.matchCount ?? 0, last: rule.lastMatched };
      }
    }
    return legacyStats;
  }

  static async saveRuleStats(ruleStats: RuleStats): Promise<void> {
    await browser.storage.local.set({ [RULE_STATS_KEY]: ruleStats });
  }

  // Settings operations
  static async getSettings(): Promise<Settings> {
    const result = (await browser.storage.local.get(this.SETTINGS_KEY)) as { [key: string]: unknown };
    const storedSettings = result[this.SETTINGS_KEY] as Partial<Settings> | undefined;
    return { ...DEFAULT_SETTINGS, ...storedSettings };
  }

  static async saveSettings(settings: Settings): Promise<void> {
    await browser.storage.local.set({ [this.SETTINGS_KEY]: settings });
  }

  // Request log operations
  static async getRequestLog(): Promise<RequestLog[]> {
    const result = (await browser.storage.session.get(this.LOG_KEY)) as { [key: string]: unknown };
    const storedLog = (result[this.LOG_KEY] as RequestLog[]) || [];
    // Prepend buffered entries (they are the most recent)
    return [...logBuffer, ...storedLog];
  }

  static async saveRequestLog(log: RequestLog[]): Promise<void> {
    await browser.storage.session.set({ [this.LOG_KEY]: log });
  }

  static async addToRequestLog(entry: RequestLog): Promise<void> {
    logBuffer.unshift(entry);
    this.scheduleLogFlush();
  }

  static async clearRequestLog(): Promise<void> {
    this.cancelLogFlush();
    logBuffer = [];
    await browser.storage.session.remove(this.LOG_KEY);
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
      const result = (await browser.storage.session.get(this.LOG_KEY)) as { [key: string]: unknown };
      const existingLog = (result[this.LOG_KEY] as RequestLog[]) || [];
      const candidates = [...currentBuffer, ...existingLog].slice(0, MAX_LOG_ENTRIES);
      const combinedLog: RequestLog[] = [];
      let totalBytes = 2;

      for (const entry of candidates) {
        const serializedEntry = JSON.stringify(entry);
        const entryBytes = new Blob([serializedEntry]).size;
        const separatorBytes = combinedLog.length > 0 ? 1 : 0;
        if (totalBytes + separatorBytes + entryBytes > MAX_LOG_SIZE_BYTES) break;

        combinedLog.push(entry);
        totalBytes += separatorBytes + entryBytes;
      }

      await browser.storage.session.set({ [this.LOG_KEY]: combinedLog });
    } catch (error) {
      console.error('[Moq] Error flushing log buffer:', error);
    }
  }

  // Import/Export operations
  static async exportAll(): Promise<StorageData> {
    const [rules, proxyRules, settings, log, folders] = await Promise.all([
      this.getRules(),
      this.getProxyRules(),
      this.getSettings(),
      this.getRequestLog(),
      this.getFolders(),
    ]);

    return { mockRules: rules, proxyRules, settings, requestLog: log, folders };
  }

  // Draft operations
  static async saveDraft(draft: unknown): Promise<void> {
    await browser.storage.local.set({ [this.DRAFT_KEY]: draft });
  }

  static async getDraft(): Promise<unknown> {
    const result = await browser.storage.local.get(this.DRAFT_KEY);
    return result[this.DRAFT_KEY] || null;
  }

  static async clearDraft(): Promise<void> {
    await browser.storage.local.remove(this.DRAFT_KEY);
  }

  /** Reset schema version (for testing only) */
  static async _resetSchemaVersion(): Promise<void> {
    await browser.storage.local.remove(this.SCHEMA_VERSION_KEY);
  }
}
