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

export interface MessageAction {
  action:
    | 'updateRules'
    | 'updateSettings'
    | 'toggleMocking'
    | 'getRules'
    | 'getSettings'
    | 'exportRules'
    | 'startRecording'
    | 'stopRecording'
    | 'getRecordingStatus'
    | 'captureResponse'
    | 'setRecordingState'
    | 'updateRulesInPage'
    | 'logMockedRequest'
    | 'logCapturedResponse'
    | 'incrementRuleCounter'
    | 'rulesUpdated'
    | 'settingsUpdated'
    | 'foldersUpdated'
    | 'requestLogUpdated'
    | 'recordingTabUpdated'
    | 'openDevTools'
    | 'updateFolders'
    | 'openStandaloneWindow'
    | 'getStandaloneWindowStatus';
  rules?: MockRule[];
  settings?: Settings;
  enabled?: boolean;
  tabId?: number;
  tabTitle?: string;
  data?: any;
  isRecording?: boolean;
  url?: string;
  method?: string;
  statusCode?: number;
  contentType?: string;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  ruleId?: string;
  language?: Language;
  folders?: Folder[];
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
