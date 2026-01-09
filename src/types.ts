export type MatchType = 'wildcard' | 'exact' | 'regex';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | '';

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
  headers?: Record<string, string>;
  delay: number;
  created: number;
  modified: number;
}

export interface Settings {
  enabled: boolean;
  logRequests: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark';
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
    | 'setRecordingState';
  rules?: MockRule[];
  enabled?: boolean;
  tabId?: number;
  data?: any;
  isRecording?: boolean;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
