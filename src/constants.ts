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
// Response Body Limits
// ============================================================================

/**
 * Maximum response body size before truncation (bytes)
 * Used when capturing responses to prevent memory issues
 */
export const MAX_RESPONSE_BODY_SIZE = 100000;

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
