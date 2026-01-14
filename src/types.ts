export type MatchType = 'wildcard' | 'exact' | 'regex';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | '';
export type ResolvedTheme = 'light' | 'dark';

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
}

export interface Settings {
  enabled: boolean;
  logRequests: boolean;
  showNotifications: boolean;
  language?: 'en' | 'ru';
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
}

export interface MessageAction {
  action:
    | 'updateRules'
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
    | 'openDevTools';
  rules?: MockRule[];
  enabled?: boolean;
  tabId?: number;
  data?: any;
  isRecording?: boolean;
  url?: string;
  method?: string;
  statusCode?: number;
  contentType?: string;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  ruleId?: string;
  language?: 'en' | 'ru';
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
