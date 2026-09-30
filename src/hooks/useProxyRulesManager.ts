import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Storage } from '../storage';
import { ProxyRule, RuleStats } from '../types';
import { withContextCheck } from '../contextHandler';
import { attachRuleStats, stripRuleStats } from '../helpers/ruleStats';

interface UseProxyRulesManagerReturn {
  proxyRules: ProxyRule[];
  loadProxyRules: () => Promise<void>;
  saveProxyRule: (rule: ProxyRule, editingRuleId: string | null) => Promise<void>;
  deleteProxyRule: (id: string) => Promise<void>;
  toggleProxyRule: (id: string) => Promise<void>;
  duplicateProxyRule: (id: string) => Promise<void>;
  resetProxyRuleHits: (id: string) => Promise<void>;
  setProxyRulesDirectly: (rules: ProxyRule[]) => void;
  saveProxyRules: (rules: ProxyRule[]) => Promise<void>;
}

export const useProxyRulesManager = (): UseProxyRulesManagerReturn => {
  const [proxyRules, setProxyRules] = useState<ProxyRule[]>([]);
  const proxyRulesRef = useRef(proxyRules);
  const [ruleStats, setRuleStats] = useState<RuleStats>({});

  useEffect(() => {
    const handleStorageChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.ruleStats) {
        const updatedStats = (changes.ruleStats.newValue as RuleStats | undefined) ?? {};
        setRuleStats(updatedStats);
        setProxyRules((currentRules) => {
          const nextRules = attachRuleStats(stripRuleStats(currentRules), updatedStats);
          proxyRulesRef.current = nextRules;
          return nextRules;
        });
      }
      if (changes.proxyRules) {
        const nextRules = attachRuleStats((changes.proxyRules.newValue as ProxyRule[] | undefined) ?? [], ruleStats);
        proxyRulesRef.current = nextRules;
        setProxyRules(nextRules);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, [ruleStats]);

  const updateProxyRulesEverywhere = useCallback(
    async (update: (currentRules: ProxyRule[]) => ProxyRule[]) => {
      const updatedRules = update(proxyRulesRef.current);
      const rulesWithStats = attachRuleStats(stripRuleStats(updatedRules), ruleStats);
      proxyRulesRef.current = rulesWithStats;
      setProxyRules(rulesWithStats);
      await Storage.saveProxyRules(updatedRules);
    },
    [ruleStats]
  );

  const loadProxyRules = useCallback(async () => {
    const [loaded, loadedStats] = await Promise.all([
      withContextCheck(() => Storage.getProxyRules(), []),
      withContextCheck(() => Storage.getRuleStats(), {}),
    ]);
    setRuleStats(loadedStats);
    const rulesWithStats = attachRuleStats(loaded, loadedStats);
    proxyRulesRef.current = rulesWithStats;
    setProxyRules(rulesWithStats);
  }, []);

  const saveProxyRule = useCallback(
    async (rule: ProxyRule, editingRuleId: string | null) => {
      await updateProxyRulesEverywhere((currentRules) =>
        editingRuleId && editingRuleId !== 'new'
          ? currentRules.map((currentRule) => (currentRule.id === editingRuleId ? rule : currentRule))
          : [...currentRules, rule]
      );
    },
    [updateProxyRulesEverywhere]
  );

  const deleteProxyRule = useCallback(
    async (id: string) => {
      await updateProxyRulesEverywhere((currentRules) => currentRules.filter((rule) => rule.id !== id));
    },
    [updateProxyRulesEverywhere]
  );

  const toggleProxyRule = useCallback(
    async (id: string) => {
      await updateProxyRulesEverywhere((currentRules) =>
        currentRules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
      );
    },
    [updateProxyRulesEverywhere]
  );

  const duplicateProxyRule = useCallback(
    async (id: string) => {
      await updateProxyRulesEverywhere((currentRules) => {
        const ruleToDuplicate = currentRules.find((rule) => rule.id === id);
        if (!ruleToDuplicate) return currentRules;
        const now = Date.now();
        const duplicated: ProxyRule = {
          ...ruleToDuplicate,
          id: crypto.randomUUID(),
          name: `${ruleToDuplicate.name} (Copy)`,
          created: now,
          modified: now,
        };
        return [...currentRules, duplicated];
      });
    },
    [updateProxyRulesEverywhere]
  );

  const resetProxyRuleHits = useCallback(
    async (id: string) => {
      const updatedStats = { ...ruleStats, [id]: { count: 0 } };
      setRuleStats(updatedStats);
      setProxyRules((currentRules) => {
        const nextRules = attachRuleStats(stripRuleStats(currentRules), updatedStats);
        proxyRulesRef.current = nextRules;
        return nextRules;
      });
      await Storage.saveRuleStats(updatedStats);
    },
    [ruleStats]
  );

  const setProxyRulesDirectly = useCallback(
    (updatedRules: ProxyRule[]) => {
      const rulesWithStats = attachRuleStats(stripRuleStats(updatedRules), ruleStats);
      proxyRulesRef.current = rulesWithStats;
      setProxyRules(rulesWithStats);
    },
    [ruleStats]
  );

  const saveProxyRules = useCallback(
    async (updatedRules: ProxyRule[]) => {
      await updateProxyRulesEverywhere(() => updatedRules);
    },
    [updateProxyRulesEverywhere]
  );

  return useMemo(
    () => ({
      proxyRules,
      loadProxyRules,
      saveProxyRule,
      deleteProxyRule,
      toggleProxyRule,
      duplicateProxyRule,
      resetProxyRuleHits,
      setProxyRulesDirectly,
      saveProxyRules,
    }),
    [
      proxyRules,
      loadProxyRules,
      saveProxyRule,
      deleteProxyRule,
      toggleProxyRule,
      duplicateProxyRule,
      resetProxyRuleHits,
      setProxyRulesDirectly,
      saveProxyRules,
    ]
  );
};
