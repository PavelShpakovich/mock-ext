import { MatchType, HttpMethod, Language, Theme, ResponseMode, DragDropItemType, MessageActionType } from './enums';

// Re-export enums for convenience
export { MatchType, HttpMethod, Language, Theme, ResponseMode, DragDropItemType, MessageActionType };
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
  order?: number; // Position within folder/ungrouped list (undefined = end)
  responseHook?: string; // Optional JavaScript code to modify response before returning
  responseHookEnabled?: boolean; // Whether the hook is active (default: true if hook exists)
  responseMode?: ResponseMode; // Mock = use mock response + hook, Passthrough = forward real request + apply hook
}

export interface ProxyRule {
  id: string;
  name: string;
  enabled: boolean;
  urlPattern: string;
  matchType: MatchType;
  method: HttpMethod;
  proxyTarget: string;
  pathRewriteFrom?: string;
  pathRewriteTo?: string;
  delay: number;
  responseHook?: string;
  responseHookEnabled?: boolean;
  created: number;
  modified: number;
  matchCount?: number;
  lastMatched?: number;
  order?: number;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string; // Reference to parent folder (undefined = root level)
  collapsed: boolean;
  created: number;
  order?: number; // Position within parent folder/root (undefined = end)
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
  proxyRules?: ProxyRule[];
  settings?: Settings;
  requestLog?: RequestLog[];
  folders?: Folder[];
}

// ============================================================================
// Message Types (Discriminated Unions)
// ============================================================================

export type MessageAction =
  | { action: MessageActionType.UpdateRules; rules: MockRule[] }
  | { action: MessageActionType.UpdateSettings; settings: Settings }
  | { action: MessageActionType.ToggleMocking; enabled: boolean }
  | { action: MessageActionType.GetRules }
  | { action: MessageActionType.GetSettings }
  | { action: MessageActionType.ExportRules }
  | { action: MessageActionType.StartRecording; tabId: number; tabTitle: string }
  | { action: MessageActionType.StopRecording }
  | { action: MessageActionType.GetRecordingStatus }
  | { action: MessageActionType.GetTabById; tabId: number }
  | { action: MessageActionType.UpdateRulesInPage; rules: MockRule[]; proxyRules: ProxyRule[]; settings: Settings }
  | { action: MessageActionType.LogMockedRequest; url: string; method: string; ruleId: string; timestamp: number }
  | {
      action: MessageActionType.LogCapturedResponse;
      url: string;
      method: string;
      statusCode: number;
      contentType: string;
      responseBody: string;
      responseHeaders: Record<string, string>;
      timestamp: number;
    }
  | { action: MessageActionType.IncrementRuleCounter; ruleId: string }
  | { action: MessageActionType.RulesUpdated }
  | { action: MessageActionType.SettingsUpdated }
  | { action: MessageActionType.FoldersUpdated }
  | { action: MessageActionType.RequestLogUpdated }
  | { action: MessageActionType.RecordingTabUpdated; tabId: number; tabTitle: string }
  | { action: MessageActionType.OpenDevTools; language: Language; theme: string }
  | { action: MessageActionType.UpdateFolders; folders: Folder[] }
  | { action: MessageActionType.OpenStandaloneWindow; language?: Language }
  | { action: MessageActionType.GetStandaloneWindowStatus }
  | { action: MessageActionType.UpdateProxyRules; proxyRules: ProxyRule[] }
  | { action: MessageActionType.ProxyRulesUpdated }
  | { action: MessageActionType.Ping };

export type MessageResponse<T = unknown> = { success: true; data?: T } | { success: false; error: string };

// ============================================================================
// Drag & Drop Types
// ============================================================================

export interface DragDropData {
  itemType: DragDropItemType;
  itemId: string;
  sourceParentId?: string; // Rules: current folderId; Folders: parent folderId
  sourceIndex: number;
  acceptsDrop?: boolean; // For folders: indicates this item can accept drops INTO it
  isSortable?: boolean; // Indicates this item is part of a sortable list
}

export interface DropZoneContext {
  targetParentId?: string; // The folder id where item is being dropped (undefined = root)
  targetIndex: number; // Position within the target parent
}

export interface DropValidation {
  isValid: boolean;
  reason?: string;
}

export interface FolderTreeNode {
  folder: Folder;
  childFolders: FolderTreeNode[];
  rules: MockRule[];
}
