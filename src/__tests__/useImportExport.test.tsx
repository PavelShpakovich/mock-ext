import { act, renderHook } from '@testing-library/react';
import { ImportDialogData, useImportExport } from '../hooks/useImportExport';
import { ToastType } from '../enums';

describe('useImportExport', () => {
  it('requires confirmation before importing proxy response hooks', async () => {
    const saveProxyRules = jest.fn().mockResolvedValue(undefined);
    const showToast = jest.fn();
    const translate = jest.fn((key: string) => key);
    let confirmImport: (() => void | Promise<void>) | undefined;
    const proxyRule = {
      id: 'proxy-hook',
      name: 'Hooked proxy',
      urlPattern: 'https://api.example.com/*',
      proxyTarget: 'https://upstream.example.com',
      responseHook: 'return response;',
    };
    const file = { text: async () => JSON.stringify([proxyRule]) } as File;
    const options = {
      rules: [],
      folders: [],
      proxyRules: [],
      importDialogData: null as ImportDialogData | null,
      saveRules: jest.fn().mockResolvedValue(undefined),
      saveFolders: jest.fn().mockResolvedValue(undefined),
      saveProxyRules,
      setImportDialogData: jest.fn(),
      t: translate,
      showToast,
      showSecurityWarning: (confirm: () => void | Promise<void>) => {
        confirmImport = confirm;
      },
    };
    const { result } = renderHook(() => useImportExport(options));

    await act(async () => result.current.handleImportProxyRules(file));
    expect(saveProxyRules).not.toHaveBeenCalled();
    expect(confirmImport).toBeDefined();

    await act(async () => confirmImport?.());
    expect(saveProxyRules).toHaveBeenCalledWith([proxyRule]);
    expect(showToast).toHaveBeenCalledWith(ToastType.Success, 'rules.importSuccess');
    expect(translate).toHaveBeenCalledWith('rules.importSuccess', { count: 1 });
  });
});
