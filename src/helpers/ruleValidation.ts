import { MockRule } from '../types';
import { ValidationWarningType, ValidationSeverity } from '../enums';
import { matchURL } from './urlMatching';
import { isValidJSON } from './validation';
import { UNUSED_RULE_DAYS_THRESHOLD } from '../constants';

const REGEX_TIMEOUT_MS = 100;

export interface ValidationWarning {
  type: ValidationWarningType;
  severity: ValidationSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  relatedRuleIds?: string[];
}

export interface FormValidationErrors {
  [key: string]: string;
}

export interface JSONValidation {
  isValid: boolean;
  message: string;
}

/**
 * Validate a regex pattern with ReDoS protection
 */
export function validateRegexPattern(pattern: string): boolean {
  try {
    // 1. Basic syntax check
    new RegExp(pattern);

    // 2. Strict ReDoS checks
    if (hasReDoSRisk(pattern)) {
      console.warn('[Moq] Potential ReDoS pattern detected:', pattern);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if regex pattern has ReDoS risks
 */
function hasReDoSRisk(pattern: string): boolean {
  // Detect nested quantifiers: (a+)+, (a*)*, (a+)*
  // Looks for group closing ')' followed by *, +, or {
  // inside a group that likely contains quantifiers
  const nestedQuantifiers = /(\([^)]*[*+]\)[*+])|(\([^)]*[*+]\)\{)/;
  if (nestedQuantifiers.test(pattern)) {
    return true;
  }

  // Detect alternation with overlapping patterns: (a|a)*
  // This is a rough heuristic
  const overlappingAlternation = /\([^|)]*\|[^)]*\)[*+]/;
  if (overlappingAlternation.test(pattern)) {
    return true;
  }

  // 3. Runtime Timeout Stress Test
  return !testRegexWithTimeout(pattern);
}

/**
 * Execute regex against a stress string with timeout
 */
function testRegexWithTimeout(pattern: string): boolean {
  // Create a long repetitive string that triggers backtracking in bad regexes
  // 'a' repeated 50-100 times is usually enough to hang bad regexes for >100ms
  const testString = 'a'.repeat(100) + 'b';
  const startTime = Date.now();

  try {
    const regex = new RegExp(pattern);
    regex.test(testString);

    const elapsed = Date.now() - startTime;
    return elapsed < REGEX_TIMEOUT_MS;
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): boolean {
  if (!jsonString || !jsonString.trim()) {
    return true;
  }
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON and return detailed result
 */
export function validateJSONDetailed(jsonString: string): JSONValidation {
  if (!jsonString.trim()) {
    return { isValid: true, message: 'Empty JSON is valid' };
  }

  // Handle Google's JSON protection prefix and chunked responses
  let bodyToValidate = jsonString;
  const hasGooglePrefix = jsonString.trim().startsWith(")]}'");

  if (hasGooglePrefix) {
    // Remove )]}' prefix
    bodyToValidate = jsonString.replace(/^\)\]\}'\s*/, '');

    // Check if this is a chunked response (has size indicators)
    const hasChunkSizes = /^\d+\s*\n/.test(bodyToValidate);

    // Remove chunk size indicators (numbers on separate lines)
    bodyToValidate = bodyToValidate.replace(/^\d+\n/gm, '');

    // Try parsing the body after stripping prefix/chunks
    try {
      JSON.parse(bodyToValidate);
      // Valid JSON after stripping - it's a valid Google response
      return {
        isValid: true,
        message: hasChunkSizes ? 'Valid Google chunked response ✓' : 'Valid Google response ✓',
      };
    } catch (e) {
      // Not valid JSON - might be JavaScript code (e.g., with bare identifiers)
      // This is acceptable for Google responses with chunk sizes
      if (hasChunkSizes && bodyToValidate.trim().startsWith('[')) {
        return { isValid: true, message: 'Valid Google response format (JavaScript) ✓' };
      }
      // Otherwise fall through to normal validation
    }
  }

  try {
    JSON.parse(bodyToValidate);
    return { isValid: true, message: 'Valid JSON ✓' };
  } catch (e) {
    // Try parsing as chunked JSON (multiple arrays)
    try {
      const chunks = bodyToValidate.match(/\[[\s\S]*?\](?=\s*(?:\[|$))/g);
      if (chunks && chunks.length > 0) {
        // Try to parse each chunk
        const validChunks = chunks.filter((chunk) => {
          try {
            JSON.parse(chunk);
            return true;
          } catch {
            return false;
          }
        });

        if (validChunks.length > 0) {
          return {
            isValid: true,
            message: `Valid chunked response (${validChunks.length}/${chunks.length} valid chunks) ✓`,
          };
        }
      }
    } catch (e2) {
      // Fall through to return original error
    }

    const error = e as Error;
    return {
      isValid: false,
      message: `Invalid JSON: ${error.message}`,
    };
  }
}

/**
 * Validate rule editor form data
 */
export async function validateRuleForm(
  formData: {
    name: string;
    urlPattern: string;
    matchType: string;
    contentType: string;
    responseBody: string;
    responseHook?: string;
  },
  jsonValidation: JSONValidation | null,
  t: (key: string, params?: Record<string, string>) => string
): Promise<FormValidationErrors> {
  const errors: FormValidationErrors = {};

  if (!formData.name.trim()) {
    errors.name = t('validation.nameRequired');
  }

  if (!formData.urlPattern.trim()) {
    errors.urlPattern = t('validation.urlPatternRequired');
  }

  if (formData.matchType === 'regex' && !validateRegexPattern(formData.urlPattern)) {
    errors.urlPattern = t('validation.invalidRegexPattern');
  }

  if (formData.contentType === 'application/json' && formData.responseBody.trim()) {
    if (jsonValidation && !jsonValidation.isValid) {
      return errors;
    }
    if (!jsonValidation && !isValidJSON(formData.responseBody)) {
      return errors;
    }
  }

  // Validate response hook if provided
  if (formData.responseHook && formData.responseHook.trim()) {
    // Lazy load validation
    const { validateResponseHookLazy } = await import('./lazyValidation');
    const hookError = await validateResponseHookLazy(formData.responseHook, t);
    if (hookError) {
      errors.responseHook = hookError;
    }
  }

  return errors;
}

/**
 * Check if a rule hasn't been matched in X days
 */
export function isRuleUnused(rule: MockRule, daysThreshold: number = UNUSED_RULE_DAYS_THRESHOLD): boolean {
  if (!rule.lastMatched) {
    const daysSinceCreated = (Date.now() - rule.created) / (1000 * 60 * 60 * 24);
    return daysSinceCreated > daysThreshold;
  }

  const daysSinceMatched = (Date.now() - rule.lastMatched) / (1000 * 60 * 60 * 24);
  return daysSinceMatched > daysThreshold;
}

/**
 * Find overlapping rules (rules that match the same URL)
 */
export function findOverlappingRules(rule: MockRule, allRules: MockRule[]): MockRule[] {
  const overlapping: MockRule[] = [];

  const enabledRules = allRules.filter((r) => r.enabled && r.id !== rule.id);

  for (const otherRule of enabledRules) {
    if (rule.method && otherRule.method && rule.method !== otherRule.method) {
      continue;
    }

    if (patternsOverlap(rule, otherRule)) {
      overlapping.push(otherRule);
    }
  }

  return overlapping;
}

/**
 * Check if two URL patterns could match the same URLs
 */
function patternsOverlap(rule1: MockRule, rule2: MockRule): boolean {
  if (rule1.matchType === 'exact' && rule2.matchType === 'exact') {
    return rule1.urlPattern === rule2.urlPattern;
  }

  const testUrls = [rule1.urlPattern.replace(/\*/g, 'test'), rule2.urlPattern.replace(/\*/g, 'test')];

  for (const url of testUrls) {
    try {
      const matches1 = matchURL(url, rule1.urlPattern, rule1.matchType);
      const matches2 = matchURL(url, rule2.urlPattern, rule2.matchType);

      if (matches1 && matches2) {
        return true;
      }
    } catch {
      // Ignore pattern matching errors for invalid regex
    }
  }

  return false;
}

/**
 * Validate a single rule and return warnings
 */
export function validateRule(rule: MockRule, allRules: MockRule[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check for invalid regex pattern
  if (rule.matchType === 'regex') {
    try {
      new RegExp(rule.urlPattern);
    } catch (error) {
      warnings.push({
        type: ValidationWarningType.InvalidRegex,
        severity: ValidationSeverity.Error,
        messageKey: 'warnings.invalidRegex',
        messageParams: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  // Check for invalid JSON response
  if (rule.contentType === 'application/json' && typeof rule.response === 'string') {
    if (!validateJSON(rule.response)) {
      warnings.push({
        type: ValidationWarningType.InvalidJson,
        severity: ValidationSeverity.Error,
        messageKey: 'warnings.invalidJson',
      });
    }
  }

  // Check for unused rule
  if (isRuleUnused(rule, 30)) {
    warnings.push({
      type: ValidationWarningType.Unused,
      severity: ValidationSeverity.Info,
      messageKey: 'warnings.unusedRule',
    });
  }

  // Check for overlapping rules
  const overlapping = findOverlappingRules(rule, allRules);
  if (overlapping.length > 0) {
    warnings.push({
      type: ValidationWarningType.Overlapping,
      severity: ValidationSeverity.Warning,
      messageKey: 'warnings.overlappingRules',
      messageParams: { count: overlapping.length },
      relatedRuleIds: overlapping.map((r) => r.id),
    });
  }

  return warnings;
}

/**
 * Validate all rules and return a map of rule ID to warnings
 */
export function validateAllRules(rules: MockRule[]): Map<string, ValidationWarning[]> {
  const warningsMap = new Map<string, ValidationWarning[]>();

  for (const rule of rules) {
    const warnings = validateRule(rule, rules);
    if (warnings.length > 0) {
      warningsMap.set(rule.id, warnings);
    }
  }

  return warningsMap;
}
