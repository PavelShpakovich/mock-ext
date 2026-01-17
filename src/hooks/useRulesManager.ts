import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';
import { MockRule } from '../types';
import { withContextCheck } from '../contextHandler';
import { validateAllRules, ValidationWarning } from '../helpers';

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
}

/**
 * Hook to manage rules state and operations
 * Handles CRUD operations, validation, and syncing with storage
 */
export const useRulesManager = (): UseRulesManagerReturn => {
  const [rules, setRules] = useState<MockRule[]>([]);
  const [ruleWarnings, setRuleWarnings] = useState<Map<string, ValidationWarning[]>>(new Map());

  const validateAndUpdateWarnings = useCallback((updatedRules: MockRule[]) => {
    const warnings = validateAllRules(updatedRules);
    setRuleWarnings(warnings);
  }, []);

  const updateRulesEverywhere = useCallback(
    async (updatedRules: MockRule[]) => {
      setRules(updatedRules);
      validateAndUpdateWarnings(updatedRules);

      await Storage.saveRules(updatedRules);
      await withContextCheck(() => chrome.runtime.sendMessage({ action: 'updateRules', rules: updatedRules })).catch(
        () => {}
      );
    },
    [validateAndUpdateWarnings]
  );

  const loadRules = useCallback(async () => {
    const loadedRules = await withContextCheck(() => Storage.getRules(), []);
    setRules(loadedRules);
    validateAndUpdateWarnings(loadedRules);
  }, [validateAndUpdateWarnings]);

  const saveRule = useCallback(
    async (rule: MockRule, editingRuleId: string | null) => {
      let updatedRules: MockRule[];
      if (editingRuleId && editingRuleId !== 'new') {
        updatedRules = rules.map((r) => (r.id === editingRuleId ? rule : r));
      } else {
        updatedRules = [...rules, rule];
      }
      await updateRulesEverywhere(updatedRules);
    },
    [rules, updateRulesEverywhere]
  );

  const deleteRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.filter((r) => r.id !== id);
      await updateRulesEverywhere(updatedRules);
    },
    [rules, updateRulesEverywhere]
  );

  const toggleRule = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      await updateRulesEverywhere(updatedRules);
    },
    [rules, updateRulesEverywhere]
  );

  const duplicateRule = useCallback(
    async (id: string) => {
      const ruleToDuplicate = rules.find((r) => r.id === id);
      if (!ruleToDuplicate) return;

      const now = Date.now();
      const duplicatedRule: MockRule = {
        ...ruleToDuplicate,
        id: uuidv4(),
        name: `${ruleToDuplicate.name} (Copy)`,
        created: now,
        modified: now,
      };

      const updatedRules = [...rules, duplicatedRule];
      await updateRulesEverywhere(updatedRules);
    },
    [rules, updateRulesEverywhere]
  );

  const resetRuleHits = useCallback(
    async (id: string) => {
      const updatedRules = rules.map((r) =>
        r.id === id
          ? {
              ...r,
              matchCount: 0,
              lastMatched: undefined,
            }
          : r
      );
      await updateRulesEverywhere(updatedRules);
    },
    [rules, updateRulesEverywhere]
  );

  const setRulesDirectly = useCallback(
    (updatedRules: MockRule[]) => {
      setRules(updatedRules);
      validateAndUpdateWarnings(updatedRules);
    },
    [validateAndUpdateWarnings]
  );

  return {
    rules,
    ruleWarnings,
    loadRules,
    saveRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    resetRuleHits,
    setRulesDirectly,
  };
};
