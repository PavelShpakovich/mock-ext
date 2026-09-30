import type { MockRule, ProxyRule, RuleStats } from '../types';

type RuleWithStats = MockRule | ProxyRule;

export function attachRuleStats<T extends RuleWithStats>(rules: T[], stats: RuleStats): T[] {
  return rules.map((rule) => {
    const stat = stats[rule.id];
    if (!stat) return { ...rule, matchCount: 0, lastMatched: undefined };
    return { ...rule, matchCount: stat.count, lastMatched: stat.last };
  });
}

export function stripRuleStats<T extends RuleWithStats>(rules: T[]): T[] {
  return rules.map(({ matchCount: _matchCount, lastMatched: _lastMatched, ...rule }) => rule as T);
}
