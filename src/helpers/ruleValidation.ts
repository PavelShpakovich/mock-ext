import { MockRule } from '../types';
import { matchURL } from './urlMatching';

export type ValidationWarningType = 'overlapping' | 'invalidRegex' | 'invalidJson' | 'unused';
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationWarning {
  type: ValidationWarningType;
  severity: ValidationSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  relatedRuleIds?: string[];
}

/**
 * Validate a regex pattern
 */
export function validateRegexPattern(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): boolean {
  if (!jsonString || !jsonString.trim()) {
    return true; // Empty is valid
  }
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a rule hasn't been matched in X days
 */
export function isRuleUnused(rule: MockRule, daysThreshold: number = 30): boolean {
  if (!rule.lastMatched) {
    // If never matched and created more than X days ago
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

  // Only check enabled rules (disabled rules can't cause conflicts)
  const enabledRules = allRules.filter((r) => r.enabled && r.id !== rule.id);

  for (const otherRule of enabledRules) {
    // If methods don't match, they can't overlap
    if (rule.method && otherRule.method && rule.method !== otherRule.method) {
      continue;
    }

    // Check if patterns could match the same URLs
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
  // For exact match, check if patterns are identical
  if (rule1.matchType === 'exact' && rule2.matchType === 'exact') {
    return rule1.urlPattern === rule2.urlPattern;
  }

  // For wildcard and regex, test sample URLs derived from the patterns themselves
  const testUrls = [rule1.urlPattern.replace(/\*/g, 'test'), rule2.urlPattern.replace(/\*/g, 'test')];

  // If any test URL matches both patterns, they overlap
  for (const url of testUrls) {
    try {
      const matches1 = matchURL(url, rule1.urlPattern, rule1.matchType);
      const matches2 = matchURL(url, rule2.urlPattern, rule2.matchType);

      if (matches1 && matches2) {
        return true;
      }
    } catch {
      // Ignore match errors
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
        type: 'invalidRegex',
        severity: 'error',
        messageKey: 'warnings.invalidRegex',
        messageParams: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  // Check for invalid JSON response
  if (rule.contentType === 'application/json' && typeof rule.response === 'string') {
    if (!validateJSON(rule.response)) {
      warnings.push({
        type: 'invalidJson',
        severity: 'error',
        messageKey: 'warnings.invalidJson',
      });
    }
  }

  // Check for unused rule
  if (isRuleUnused(rule, 30)) {
    warnings.push({
      type: 'unused',
      severity: 'info',
      messageKey: 'warnings.unusedRule',
    });
  }

  // Check for overlapping rules
  const overlapping = findOverlappingRules(rule, allRules);
  if (overlapping.length > 0) {
    warnings.push({
      type: 'overlapping',
      severity: 'warning',
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
