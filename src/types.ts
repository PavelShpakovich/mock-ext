import { MatchType, HttpMethod, Language, Theme, ResponseMode } from './enums';

// Re-export enums for convenience
export { MatchType, HttpMethod, Language, Theme, ResponseMode };
export type { ResolvedTheme } from './enums';

export interface MockRule {
  id: string;
  name: string;
  enabled: boolean;
  urlPattern: string;
  matchType: MatchType;
  method: HttpMethod;
  statusCode: number;
  response: string | object;
  contentType: string;
  delay: number;
  headers?: Record<string, string>;
  created: number;
  modified: number;
  matchCount?: number;
  lastMatched?: number;
  folderId?: string;
  responseHook?: string; // Optional JavaScript code to modify response before returning
  responseHookEnabled?: boolean; // Whether the hook is active (default: true if hook exists)
  responseMode?: ResponseMode; // Mock = use mock response + hook, Passthrough = forward real request + apply hook
}

export interface Folder {
  id: string;
  name: string;
  collapsed: boolean;
  created: number;
}

export interface Settings {
  enabled: boolean;
  logRequests: boolean;
  showNotifications: boolean;
  corsAutoFix: boolean;
  language?: Language;
  theme?: Theme;
  rulesView?: string;
}

export interface RequestLog {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  matched: boolean;
  ruleId?: string;
  statusCode?: number;
  responseBody?: string;
  requestBody?: string;
  contentType?: string;
  responseHeaders?: Record<string, string>;
}

export interface StorageData {
  mockRules?: MockRule[];
  settings?: Settings;
  requestLog?: RequestLog[];
  folders?: Folder[];
}

// ============================================================================
// Message Types (Discriminated Unions)
// ============================================================================

export type MessageAction =
  | { action: 'updateRules'; rules: MockRule[] }
  | { action: 'updateSettings'; settings: Settings }
  | { action: 'toggleMocking'; enabled: boolean }
  | { action: 'getRules' }
  | { action: 'getSettings' }
  | { action: 'exportRules' }
  | { action: 'startRecording'; tabId: number; tabTitle: string }
  | { action: 'stopRecording' }
  | { action: 'getRecordingStatus' }
  | { action: 'updateRulesInPage'; rules: MockRule[]; settings: Settings }
  | { action: 'logMockedRequest'; url: string; method: string; ruleId: string; timestamp: number }
  | {
      action: 'logCapturedResponse';
      url: string;
      method: string;
      statusCode: number;
      contentType: string;
      responseBody: string;
      responseHeaders: Record<string, string>;
      timestamp: number;
    }
  | { action: 'incrementRuleCounter'; ruleId: string }
  | { action: 'rulesUpdated' }
  | { action: 'settingsUpdated' }
  | { action: 'foldersUpdated' }
  | { action: 'requestLogUpdated' }
  | { action: 'recordingTabUpdated'; tabId: number; tabTitle: string }
  | { action: 'openDevTools'; language: Language; theme: string }
  | { action: 'updateFolders'; folders: Folder[] }
  | { action: 'openStandaloneWindow'; language?: Language }
  | { action: 'getStandaloneWindowStatus' }
  | { action: 'ping' };

export type MessageResponse<T = unknown> = { success: true; data?: T } | { success: false; error: string };
