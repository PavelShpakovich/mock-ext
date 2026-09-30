import { act, renderHook } from '@testing-library/react';
import { useAppActions } from '../hooks/useAppActions';
import { ConfirmDialogVariant, EditMode, HttpMethod, MatchType, Tab, ToastType } from '../enums';
import type { Folder, MockRule, ProxyRule, RequestLog } from '../types';

const request: RequestLog = { id: 'request', url: '/api/item', method: 'POST', timestamp: 1, matched: false };
const folders: Folder[] = [{ id: 'folder-1', name: 'Folder one', collapsed: false, created: 1 }];
const rule: MockRule = {
  id: 'rule-1',
  name: 'Rule',
  enabled: true,
  urlPattern: '/api',
  matchType: MatchType.Exact,
  method: HttpMethod.Any,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
};
const proxyRule: ProxyRule = {
  id: 'proxy-1',
  name: 'Proxy',
  enabled: true,
  urlPattern: '/api',
  matchType: MatchType.Exact,
  method: HttpMethod.Any,
  proxyTarget: 'https://upstream.test',
  delay: 0,
  created: 1,
  modified: 1,
};

function makeOptions(overrides: Record<string, unknown> = {}) {
  const confirmState = {
    current: null as null | { title: string; message: string; variant?: ConfirmDialogVariant; onConfirm: () => void },
  };
  const toastState = { current: null as null | { type: ToastType; message: string } };
  const options = {
    rulesManager: {
      rules: [rule],
      saveRule: jest.fn(async () => {}),
      deleteRule: jest.fn(async () => {}),
      setRulesDirectly: jest.fn(),
      saveRules: jest.fn(async () => {}),
    },
    proxyRulesManager: { saveProxyRule: jest.fn(async () => {}), deleteProxyRule: jest.fn(async () => {}) },
    foldersManager: {
      folders,
      saveFolder: jest.fn(async () => {}),
      deleteFolderAndUpdateRules: jest.fn(async () => ({ folders: [], rules: [] })),
      enableFolderRules: jest.fn(async () => [rule]),
      disableFolderRules: jest.fn(async () => [rule]),
    },
    recording: { handleRecordingToggle: jest.fn(async () => ({ reloaded: true })) },
    editingRuleId: 'rule-1',
    editingProxyRuleId: 'proxy-1',
    editingFolder: EditMode.New,
    setActiveTab: jest.fn(),
    setEditingRuleId: jest.fn(),
    setEditingProxyRuleId: jest.fn(),
    setPendingMockRequest: jest.fn(),
    setPendingProxyRequest: jest.fn(),
    setEditingFolder: jest.fn(),
    setConfirmDialog: jest.fn((value) => {
      confirmState.current = typeof value === 'function' ? value(confirmState.current) : value;
    }),
    setToast: jest.fn((value) => {
      toastState.current = typeof value === 'function' ? value(toastState.current) : value;
    }),
    t: (key: string, params?: Record<string, string | number>) => (params ? `${key}:${params.name}` : key),
    ...overrides,
  };
  return { options, confirmState, toastState };
}

describe('useAppActions', () => {
  it('routes request actions to the right tab and clears pending edit state', async () => {
    const { options } = makeOptions();
    const { result } = renderHook(() => useAppActions(options as never));
    act(() => result.current.handleMockRequest(request));
    expect(options.setActiveTab).toHaveBeenCalledWith(Tab.Rules);
    expect(options.setEditingRuleId).toHaveBeenCalledWith(EditMode.New);
    expect(options.setPendingMockRequest).toHaveBeenCalledWith(request);
    act(() => result.current.handleProxyRequest(request));
    expect(options.setActiveTab).toHaveBeenCalledWith(Tab.Proxy);
    expect(options.setEditingProxyRuleId).toHaveBeenCalledWith(EditMode.New);
    expect(options.setPendingProxyRequest).toHaveBeenCalledWith(request);

    await act(async () => result.current.handleSaveRule(rule));
    expect(options.rulesManager.saveRule).toHaveBeenCalledWith(rule, 'rule-1');
    expect(options.setEditingRuleId).toHaveBeenCalledWith(null);
    await act(async () => result.current.handleSaveProxyRule(proxyRule));
    expect(options.proxyRulesManager.saveProxyRule).toHaveBeenCalledWith(proxyRule, 'proxy-1');
    expect(options.setEditingProxyRuleId).toHaveBeenCalledWith(null);
  });

  it('cleans matching edits after delete and always clears edit state when save fails', async () => {
    const { options } = makeOptions();
    options.rulesManager.saveRule.mockRejectedValueOnce(new Error('save failed'));
    const { result } = renderHook(() => useAppActions(options as never));
    await act(async () => expect(result.current.handleSaveRule(rule)).rejects.toThrow('save failed'));
    expect(options.setEditingRuleId).toHaveBeenCalledWith(null);
    await act(async () => result.current.handleDeleteRule('rule-1'));
    expect(options.rulesManager.deleteRule).toHaveBeenCalledWith('rule-1');
    expect(options.setPendingMockRequest).toHaveBeenCalledWith(null);
    await act(async () => result.current.handleDeleteProxyRule('proxy-1'));
    expect(options.setPendingProxyRequest).toHaveBeenCalledWith(null);
  });

  it('handles recording, folder CRUD, delete confirmation and bulk rule toggles', async () => {
    const { options, confirmState, toastState } = makeOptions();
    const { result } = renderHook(() => useAppActions(options as never));
    await act(async () => result.current.handleRecordingToggle(true));
    expect(options.setActiveTab).toHaveBeenCalledWith(Tab.Requests);
    expect(toastState.current).toEqual({ type: ToastType.Info, message: 'recording.pageReloaded' });
    act(() => result.current.handleCreateFolder());
    expect(options.setEditingFolder).toHaveBeenCalledWith(EditMode.New);
    act(() => result.current.handleEditFolder('folder-1'));
    expect(options.setEditingFolder).toHaveBeenCalledWith(folders[0]);
    await act(async () => result.current.handleSaveFolder('New folder'));
    expect(options.foldersManager.saveFolder).toHaveBeenCalledWith('New folder', null);

    act(() => result.current.handleDeleteFolder('folder-1'));
    expect(confirmState.current).toMatchObject({ variant: ConfirmDialogVariant.Danger, title: 'folders.deleteFolder' });
    await act(async () => confirmState.current?.onConfirm());
    expect(options.foldersManager.deleteFolderAndUpdateRules).toHaveBeenCalledWith('folder-1', [rule]);
    expect(options.rulesManager.setRulesDirectly).toHaveBeenCalledWith([]);
    await act(async () => result.current.handleEnableFolderRules('folder-1'));
    await act(async () => result.current.handleDisableFolderRules('folder-1'));
    expect(options.rulesManager.saveRules).toHaveBeenCalledTimes(2);
    act(() => result.current.handleCloseToast());
    expect(options.setToast).toHaveBeenLastCalledWith(null);
  });
});
