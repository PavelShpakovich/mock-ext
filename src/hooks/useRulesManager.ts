import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Storage } from '../storage';
import { MockRule, RuleStats } from '../types';
import { withContextCheck } from '../contextHandler';
import {
  attachRuleStats,
  stripRuleStats,
  validateAllRules,
  refreshUnusedRuleWarnings,
  ValidationWarning,
} from '../helpers';
import { EditMode } from '../enums';

interface UseRulesManagerReturn {
  rules: MockRule[];
  ruleWarnings: Map<string, ValidationWarning[]>;
  loadRules: () => Promise<void>;
  saveRule: (rule: MockRule, editingRuleId: string | null) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  duplicateRule: (id: string) => Promise<void>;
  resetRuleHits: (id: string) => Promise<void>;
  setRulesDirectly: (rules: MockRule[]) => void;
  /** Replace the entire rule list (used by drag-drop reordering) */
  saveRules: (rules: MockRule[]) => Promise<void>;
}

/**
 * Hook to manage rules state and operations
 * Handles CRUD operations, validation, and syncing with storage
 */
export const useRulesManager = (): UseRulesManagerReturn => {
  const [rules, setRules] = useState<MockRule[]>([]);
  const rulesRef = useRef(rules);
  const [ruleStats, setRuleStats] = useState<RuleStats>({});
  const [ruleWarnings, setRuleWarnings] = useState<Map<string, ValidationWarning[]>>(new Map());

  const validateAndUpdateWarnings = useCallback((updatedRules: MockRule[]) => {
    const warnings = validateAllRules(updatedRules);
    setRuleWarnings(warnings);
  }, []);

  useEffect(() => {
    const handleStorageChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.ruleStats) {
        const updatedStats = (changes.ruleStats.newValue as RuleStats | undefined) ?? {};
        setRuleStats(updatedStats);
        const updatedRules = attachRuleStats(stripRuleStats(rulesRef.current), updatedStats);
        rulesRef.current = updatedRules;
        setRules(updatedRules);
        setRuleWarnings((currentWarnings) => refreshUnusedRuleWarnings(updatedRules, currentWarnings));
      }
      if (changes.mockRules) {
        const storedRules = (changes.mockRules.newValue as MockRule[] | undefined) ?? [];
        const updatedRules = attachRuleStats(storedRules, ruleStats);
        rulesRef.current = updatedRules;
        setRules(updatedRules);
        validateAndUpdateWarnings(updatedRules);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, [ruleStats, validateAndUpdateWarnings]);

  const updateRulesEverywhere = useCallback(
    async (update: (currentRules: MockRule[]) => MockRule[]) => {
      const updatedRules = update(rulesRef.current);
      const rulesWithStats = attachRuleStats(stripRuleStats(updatedRules), ruleStats);
      rulesRef.current = rulesWithStats;
      setRules(rulesWithStats);
      validateAndUpdateWarnings(rulesWithStats);

      await Storage.saveRules(updatedRules);
    },
    [ruleStats, validateAndUpdateWarnings]
  );

  const loadRules = useCallback(async () => {
    const [loadedRules, loadedStats] = await Promise.all([
      withContextCheck(() => Storage.getRules(), []),
      withContextCheck(() => Storage.getRuleStats(), {}),
    ]);
    setRuleStats(loadedStats);
    const rulesWithStats = attachRuleStats(loadedRules, loadedStats);
    rulesRef.current = rulesWithStats;
    setRules(rulesWithStats);
    validateAndUpdateWarnings(rulesWithStats);
  }, [validateAndUpdateWarnings]);

  const saveRule = useCallback(
    async (rule: MockRule, editingRuleId: string | null) => {
      await updateRulesEverywhere((currentRules) =>
        editingRuleId && editingRuleId !== EditMode.New
          ? currentRules.map((currentRule) => (currentRule.id === editingRuleId ? rule : currentRule))
          : [...currentRules, rule]
      );
    },
    [updateRulesEverywhere]
  );

  const deleteRule = useCallback(
    async (id: string) => {
      await updateRulesEverywhere((currentRules) => currentRules.filter((rule) => rule.id !== id));
    },
    [updateRulesEverywhere]
  );

  const toggleRule = useCallback(
    async (id: string) => {
      await updateRulesEverywhere((currentRules) =>
        currentRules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
      );
    },
    [updateRulesEverywhere]
  );

  const duplicateRule = useCallback(
    async (id: string) => {
      await updateRulesEverywhere((currentRules) => {
        const ruleToDuplicate = currentRules.find((rule) => rule.id === id);
        if (!ruleToDuplicate) return currentRules;
        const now = Date.now();
        const duplicatedRule: MockRule = {
          ...ruleToDuplicate,
          id: crypto.randomUUID(),
          name: `${ruleToDuplicate.name} (Copy)`,
          created: now,
          modified: now,
        };
        return [...currentRules, duplicatedRule];
      });
    },
    [updateRulesEverywhere]
  );

  const resetRuleHits = useCallback(
    async (id: string) => {
      const updatedStats = { ...ruleStats, [id]: { count: 0 } };
      setRuleStats(updatedStats);
      const updatedRules = attachRuleStats(stripRuleStats(rulesRef.current), updatedStats);
      rulesRef.current = updatedRules;
      setRules(updatedRules);
      setRuleWarnings((currentWarnings) => refreshUnusedRuleWarnings(updatedRules, currentWarnings));
      await Storage.saveRuleStats(updatedStats);
    },
    [ruleStats]
  );

  const setRulesDirectly = useCallback(
    (updatedRules: MockRule[]) => {
      const rulesWithStats = attachRuleStats(stripRuleStats(updatedRules), ruleStats);
      rulesRef.current = rulesWithStats;
      setRules(rulesWithStats);
      validateAndUpdateWarnings(rulesWithStats);
    },
    [ruleStats, validateAndUpdateWarnings]
  );

  const saveRules = useCallback(
    async (updatedRules: MockRule[]) => {
      await updateRulesEverywhere(() => updatedRules);
    },
    [updateRulesEverywhere]
  );

  return useMemo(
    () => ({
      rules,
      ruleWarnings,
      loadRules,
      saveRule,
      deleteRule,
      toggleRule,
      duplicateRule,
      resetRuleHits,
      setRulesDirectly,
      saveRules,
    }),
    [
      rules,
      ruleWarnings,
      loadRules,
      saveRule,
      deleteRule,
      toggleRule,
      duplicateRule,
      resetRuleHits,
      setRulesDirectly,
      saveRules,
    ]
  );
};
