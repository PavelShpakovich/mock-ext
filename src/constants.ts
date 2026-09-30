import { RulesView, Theme } from './enums';
import type { Settings } from './types';

/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for maintainability
 */

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Debounce delay for real-time validation (ms)
 * Used for JSON and response hook validation to avoid excessive validation calls
 */
export const VALIDATION_DEBOUNCE_MS = 500;

/**
 * Maximum folder name length
 */
export const MAX_FOLDER_NAME_LENGTH = 50;

/**
 * Number of days after which a rule is considered unused
 */
export const UNUSED_RULE_DAYS_THRESHOLD = 30;

// ============================================================================
// Drag & Drop Constants
// ============================================================================

/**
 * ID used to identify the root drop zone for ungrouping items
 */
export const ROOT_DROP_ZONE_ID = 'root-drop-zone';

/** Maximum allowed nesting depth for folders */
export const MAX_FOLDER_DEPTH = 5;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default delay for mock responses (ms)
 */
export const DEFAULT_DELAY_MS = 0;

/**
 * Maximum random number value for {{random_number}} variable
 */
export const MAX_RANDOM_NUMBER = 1000000;

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  logRequests: false,
  showNotifications: false,
  corsAutoFix: false,
  theme: Theme.System,
  rulesView: RulesView.Detailed,
};

export const STATUS_TEXTS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};
