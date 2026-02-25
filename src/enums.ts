// ============================================================================
// Core Application Enums
// ============================================================================

export enum Tab {
  Rules = 'rules',
  Requests = 'requests',
}

export enum RulesView {
  Detailed = 'detailed',
  Compact = 'compact',
}

export enum MatchType {
  Wildcard = 'wildcard',
  Exact = 'exact',
  Regex = 'regex',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  Any = '',
}

export enum Language {
  English = 'en',
  Russian = 'ru',
}

export enum Theme {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

export enum ResolvedTheme {
  Light = 'light',
  Dark = 'dark',
}

// ============================================================================
// Import/Export Enums
// ============================================================================

export enum ImportMode {
  Merge = 'merge',
  Replace = 'replace',
}

export enum ResponseMode {
  Mock = 'mock',
  Passthrough = 'passthrough',
}

// ============================================================================
// UI Component Enums
// ============================================================================

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}

export enum ConfirmDialogVariant {
  Danger = 'danger',
  Primary = 'primary',
}

export enum EditMode {
  New = 'new',
}

// ============================================================================
// Drag & Drop Enums
// ============================================================================

export enum DragDropItemType {
  Rule = 'rule',
  Folder = 'folder',
}

export enum DropEdge {
  Top = 'top',
  Bottom = 'bottom',
}

// ============================================================================
// Validation Enums
// ============================================================================

export enum MessageActionType {
  UpdateRules = 'updateRules',
  UpdateSettings = 'updateSettings',
  ToggleMocking = 'toggleMocking',
  GetRules = 'getRules',
  GetSettings = 'getSettings',
  ExportRules = 'exportRules',
  StartRecording = 'startRecording',
  StopRecording = 'stopRecording',
  GetRecordingStatus = 'getRecordingStatus',
  UpdateRulesInPage = 'updateRulesInPage',
  LogMockedRequest = 'logMockedRequest',
  LogCapturedResponse = 'logCapturedResponse',
  IncrementRuleCounter = 'incrementRuleCounter',
  RulesUpdated = 'rulesUpdated',
  SettingsUpdated = 'settingsUpdated',
  FoldersUpdated = 'foldersUpdated',
  RequestLogUpdated = 'requestLogUpdated',
  RecordingTabUpdated = 'recordingTabUpdated',
  OpenDevTools = 'openDevTools',
  UpdateFolders = 'updateFolders',
  OpenStandaloneWindow = 'openStandaloneWindow',
  GetStandaloneWindowStatus = 'getStandaloneWindowStatus',
  Ping = 'ping',
}

export enum ValidationWarningType {
  Overlapping = 'overlapping',
  InvalidRegex = 'invalidRegex',
  InvalidJson = 'invalidJson',
  Unused = 'unused',
}

export enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

// ============================================================================
// UI Component Enums
// ============================================================================

export enum ButtonVariant {
  Primary = 'primary',
  Danger = 'danger',
  Ghost = 'ghost',
  Secondary = 'secondary',
  Outline = 'outline',
}

export enum ButtonSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}

export enum IconButtonVariant {
  Danger = 'danger',
  Ghost = 'ghost',
  Primary = 'primary',
}

export enum IconButtonSize {
  Small = 'sm',
  Medium = 'md',
}

export enum BadgeVariant {
  Default = 'default',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Info = 'info',
  Purple = 'purple',
  Outline = 'outline',
}
