import { act, renderHook } from '@testing-library/react';
import { useProxyRulesManager } from '../hooks/useProxyRulesManager';
import { Storage } from '../storage';
import { HttpMethod, MatchType } from '../enums';
import type { ProxyRule } from '../types';
import { listeners } from './setup';

const makeRule = (id: string, enabled = true): ProxyRule => ({
  id,
  name: `Proxy ${id}`,
  enabled,
  urlPattern: `https://api.example.com/${id}`,
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  proxyTarget: 'https://upstream.example.net',
  delay: 0,
  created: 1,
  modified: 1,
});

describe('useProxyRulesManager', () => {
  beforeEach(() => {
    (browser.runtime as unknown as { id: string }).id = 'test-extension';
    jest.spyOn(Storage, 'getProxyRules').mockResolvedValue([]);
    jest.spyOn(Storage, 'getRuleStats').mockResolvedValue({});
    jest.spyOn(Storage, 'saveProxyRules').mockResolvedValue(undefined);
    jest.spyOn(Storage, 'saveRuleStats').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('loads rules with separate stats and handles create/edit/toggle/duplicate/delete', async () => {
    (Storage.getProxyRules as jest.Mock).mockResolvedValue([makeRule('one')]);
    (Storage.getRuleStats as jest.Mock).mockResolvedValue({ one: { count: 5, last: 99 } });
    const { result } = renderHook(() => useProxyRulesManager());
    await act(async () => result.current.loadProxyRules());
    expect(result.current.proxyRules[0]).toMatchObject({ matchCount: 5, lastMatched: 99 });

    await act(async () => result.current.saveProxyRule(makeRule('two'), null));
    expect(result.current.proxyRules.map((item) => item.id)).toEqual(['one', 'two']);
    await act(async () => result.current.saveProxyRule({ ...makeRule('updated'), id: 'one' }, 'one'));
    expect(result.current.proxyRules[0].name).toBe('Proxy updated');
    await act(async () => result.current.toggleProxyRule('one'));
    expect(result.current.proxyRules[0].enabled).toBe(false);
    await act(async () => result.current.duplicateProxyRule('two'));
    expect(result.current.proxyRules).toHaveLength(3);
    expect(result.current.proxyRules[2].name).toBe('Proxy two (Copy)');
    await act(async () => result.current.deleteProxyRule('one'));
    expect(result.current.proxyRules.some((item) => item.id === 'one')).toBe(false);
  });

  it('projects storage changes and resets hit statistics without saving rule configuration', async () => {
    const { result } = renderHook(() => useProxyRulesManager());
    act(() => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ proxyRules: { newValue: [makeRule('two')] } }, 'local')
      );
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ ruleStats: { newValue: { two: { count: 7, last: 123 } } } }, 'local')
      );
    });
    expect(result.current.proxyRules[0]).toMatchObject({ matchCount: 7, lastMatched: 123 });
    (Storage.saveRuleStats as jest.Mock).mockClear();

    await act(async () => result.current.resetProxyRuleHits('two'));
    expect(result.current.proxyRules[0]).toMatchObject({ matchCount: 0, lastMatched: undefined });
    expect(Storage.saveRuleStats).toHaveBeenCalledWith({ two: { count: 0 } });
    expect(Storage.saveProxyRules).not.toHaveBeenCalled();
  });
});
