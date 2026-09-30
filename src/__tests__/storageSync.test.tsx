import { act, renderHook, waitFor } from '@testing-library/react';
import { useRulesManager } from '../hooks/useRulesManager';
import { useRecording } from '../hooks/useRecording';
import { useStandaloneWindowStatus } from '../hooks/useStandaloneWindowStatus';
import { MockRule } from '../types';
import { listeners } from './setup';

describe('storage change subscriptions', () => {
  it('keeps the rules manager return object stable between unchanged renders', () => {
    const { result, rerender } = renderHook(() => useRulesManager());
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('updates rules state after another context changes local storage', () => {
    const { result } = renderHook(() => useRulesManager());
    const updatedRules = [{ id: 'external-rule', enabled: true } as MockRule];

    act(() => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ mockRules: { newValue: updatedRules } }, 'local')
      );
    });

    expect(result.current.rules).toMatchObject(updatedRules);
  });

  it('projects separate hit statistics onto rules shown in the UI', () => {
    const { result } = renderHook(() => useRulesManager());
    const storedRules = [{ id: 'stat-rule', enabled: true } as MockRule];

    act(() => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ mockRules: { newValue: storedRules } }, 'local')
      );
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ ruleStats: { newValue: { 'stat-rule': { count: 7, last: 99 } } } }, 'local')
      );
    });

    expect(result.current.rules[0]).toMatchObject({ matchCount: 7, lastMatched: 99 });
  });

  it('resets rule hits through the stats key without saving rule configuration', async () => {
    const { result } = renderHook(() => useRulesManager());
    const rule = { id: 'reset-rule', enabled: true, matchCount: 8, lastMatched: 100 } as MockRule;
    act(() => result.current.setRulesDirectly([rule]));
    (
      globalThis as unknown as { chrome: { storage: { local: { set: jest.Mock } } } }
    ).chrome.storage.local.set.mockClear();

    await act(async () => {
      await result.current.resetRuleHits(rule.id);
    });

    expect(result.current.rules[0]).toMatchObject({ matchCount: 0, lastMatched: undefined });
    expect(
      (globalThis as unknown as { chrome: { storage: { local: { set: jest.Mock } } } }).chrome.storage.local.set
    ).toHaveBeenCalledWith({ ruleStats: expect.objectContaining({ [rule.id]: { count: 0 } }) });
    expect(
      (globalThis as unknown as { chrome: { storage: { local: { set: jest.Mock } } } }).chrome.storage.local.set
    ).not.toHaveBeenCalledWith(expect.objectContaining({ mockRules: expect.anything() }));
  });

  it('refreshes request logs from session storage change events', async () => {
    const expectedLog = [{ id: 'captured', url: '/items', method: 'GET', timestamp: 1, matched: false }];
    const storage = (
      globalThis as unknown as { chrome: { storage: { local: { get: jest.Mock }; session: { get: jest.Mock } } } }
    ).chrome.storage;
    (globalThis as unknown as { browser: { runtime: { id?: string } } }).browser.runtime.id = 'test-extension';
    storage.local.get.mockResolvedValue({ settings: { enabled: true, logRequests: false } });
    storage.session.get.mockResolvedValue({ requestLog: expectedLog });
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ requestLog: { newValue: expectedLog } }, 'session')
      );
    });

    await waitFor(() => expect(result.current.requestLog).toEqual(expectedLog));
  });

  it('tracks standalone window status from the runtime session key', async () => {
    window.history.pushState({}, '', '/window.html?tabId=1');
    const storage = (globalThis as unknown as { chrome: { storage: { session: { get: jest.Mock } } } }).chrome.storage;
    storage.session.get.mockResolvedValue({ runtimeState: { recordingTabId: null, standaloneWindowId: 55 } });
    const { result, unmount } = renderHook(() => useStandaloneWindowStatus());

    await waitFor(() => expect(result.current).toBe(true));
    act(() => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ runtimeState: { newValue: { recordingTabId: null, standaloneWindowId: null } } }, 'session')
      );
    });
    expect(result.current).toBe(false);

    unmount();
    window.history.pushState({}, '', '/');
  });
});
