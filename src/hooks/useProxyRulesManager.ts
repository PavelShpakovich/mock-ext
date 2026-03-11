import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../storage';
import { ProxyRule } from '../types';
import { withContextCheck } from '../contextHandler';
import { MessageActionType } from '../enums';

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

  const updateProxyRulesEverywhere = useCallback(async (updatedRules: ProxyRule[]) => {
    setProxyRules(updatedRules);
    await Storage.saveProxyRules(updatedRules);
    await withContextCheck(() =>
      browser.runtime.sendMessage({ action: MessageActionType.UpdateProxyRules, proxyRules: updatedRules })
    ).catch(() => {});
  }, []);

  const loadProxyRules = useCallback(async () => {
    const loaded = await withContextCheck(() => Storage.getProxyRules(), []);
    setProxyRules(loaded);
  }, []);

  const saveProxyRule = useCallback(
    async (rule: ProxyRule, editingRuleId: string | null) => {
      let updatedRules: ProxyRule[];
      if (editingRuleId && editingRuleId !== 'new') {
        updatedRules = proxyRules.map((r) => (r.id === editingRuleId ? rule : r));
      } else {
        updatedRules = [...proxyRules, rule];
      }
      await updateProxyRulesEverywhere(updatedRules);
    },
    [proxyRules, updateProxyRulesEverywhere]
  );

  const deleteProxyRule = useCallback(
    async (id: string) => {
      const updatedRules = proxyRules.filter((r) => r.id !== id);
      await updateProxyRulesEverywhere(updatedRules);
    },
    [proxyRules, updateProxyRulesEverywhere]
  );

  const toggleProxyRule = useCallback(
    async (id: string) => {
      const updatedRules = proxyRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      await updateProxyRulesEverywhere(updatedRules);
    },
    [proxyRules, updateProxyRulesEverywhere]
  );

  const duplicateProxyRule = useCallback(
    async (id: string) => {
      const ruleToDuplicate = proxyRules.find((r) => r.id === id);
      if (!ruleToDuplicate) return;
      const now = Date.now();
      const duplicated: ProxyRule = {
        ...ruleToDuplicate,
        id: uuidv4(),
        name: `${ruleToDuplicate.name} (Copy)`,
        created: now,
        modified: now,
      };
      const updatedRules = [...proxyRules, duplicated];
      await updateProxyRulesEverywhere(updatedRules);
    },
    [proxyRules, updateProxyRulesEverywhere]
  );

  const resetProxyRuleHits = useCallback(
    async (id: string) => {
      const updatedRules = proxyRules.map((r) => (r.id === id ? { ...r, matchCount: 0, lastMatched: undefined } : r));
      await updateProxyRulesEverywhere(updatedRules);
    },
    [proxyRules, updateProxyRulesEverywhere]
  );

  const setProxyRulesDirectly = useCallback((updatedRules: ProxyRule[]) => {
    setProxyRules(updatedRules);
  }, []);

  const saveProxyRules = useCallback(
    async (updatedRules: ProxyRule[]) => {
      await updateProxyRulesEverywhere(updatedRules);
    },
    [updateProxyRulesEverywhere]
  );

  return {
    proxyRules,
    loadProxyRules,
    saveProxyRule,
    deleteProxyRule,
    toggleProxyRule,
    duplicateProxyRule,
    resetProxyRuleHits,
    setProxyRulesDirectly,
    saveProxyRules,
  };
};
