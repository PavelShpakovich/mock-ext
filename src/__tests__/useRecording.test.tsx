import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecording } from '../hooks/useRecording';
import { Storage } from '../storage';
import { MessageActionType } from '../enums';
import type { Settings } from '../types';
import { listeners } from './setup';
import {
  findValidWebTab,
  sendStartRecordingMessage,
  sendStopRecordingMessage,
  getRecordingStatus,
} from '../helpers/recording';

jest.mock('../helpers/recording', () => ({
  findValidWebTab: jest.fn(),
  sendStartRecordingMessage: jest.fn(),
  sendStopRecordingMessage: jest.fn(),
  getRecordingStatus: jest.fn(),
  createDisabledSettings: (settings: Settings) => ({ ...settings, enabled: false, corsAutoFix: false }),
}));

const baseSettings: Settings = { enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false };
const storage = (
  globalThis as unknown as {
    chrome: {
      storage: { local: { get: jest.Mock }; session: { get: jest.Mock } };
      tabs: { get: jest.Mock };
      runtime: { sendMessage: jest.Mock };
    };
  }
).chrome;

describe('useRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (browser.runtime as unknown as { id: string }).id = 'test-extension';
    storage.runtime.sendMessage.mockResolvedValue(undefined);
    storage.tabs.get = jest.fn().mockResolvedValue({ id: 17, title: 'Active tab' });
    jest.spyOn(Storage, 'getSettings').mockResolvedValue(baseSettings);
    jest.spyOn(Storage, 'saveSettings').mockResolvedValue(undefined);
    jest.spyOn(Storage, 'getRequestLog').mockResolvedValue([]);
    jest.spyOn(Storage, 'clearRequestLog').mockResolvedValue(undefined);
    (getRecordingStatus as jest.Mock).mockResolvedValue({ success: false });
  });
  afterEach(() => jest.restoreAllMocks());

  it('starts and stops recording, persists settings, and handles disabled extension', async () => {
    (sendStartRecordingMessage as jest.Mock).mockResolvedValue({ success: true, data: { reloaded: true } });
    const { result } = renderHook(() => useRecording());
    await waitFor(() => expect(Storage.getSettings).toHaveBeenCalled());
    await act(async () =>
      expect(await result.current.startRecording({ id: 17, title: 'Active tab' } as Browser.tabs.Tab)).toEqual({
        success: true,
        reloaded: true,
      })
    );
    expect(result.current.settings.logRequests).toBe(true);
    expect(result.current.activeTabTitle).toBe('Active tab');
    expect(Storage.saveSettings).toHaveBeenLastCalledWith(expect.objectContaining({ logRequests: true }));

    await act(async () => result.current.handleGlobalToggle(false));
    expect(result.current.settings).toMatchObject({ enabled: false, corsAutoFix: false });
    expect(storage.runtime.sendMessage).toHaveBeenCalledWith({
      action: MessageActionType.ToggleMocking,
      enabled: false,
    });
    await act(async () => result.current.stopRecording());
    expect(result.current.settings.logRequests).toBe(false);
    expect(result.current.activeTabTitle).toBe('');
    expect(sendStopRecordingMessage).toHaveBeenCalledTimes(1);
  });

  it('starts via active web tab, ignores requests while disabled, and applies CORS settings', async () => {
    (findValidWebTab as jest.Mock).mockResolvedValue({ id: 22, title: 'Web tab' });
    (sendStartRecordingMessage as jest.Mock).mockResolvedValue({ success: true, data: { reloaded: false } });
    const { result } = renderHook(() => useRecording());
    await waitFor(() => expect(Storage.getSettings).toHaveBeenCalled());
    await act(async () => expect(await result.current.handleRecordingToggle(true)).toEqual({ reloaded: false }));
    expect(findValidWebTab).toHaveBeenCalledTimes(1);
    expect(sendStartRecordingMessage).toHaveBeenCalledWith(22);

    act(() => result.current.setSettingsDirectly({ ...baseSettings, enabled: false }));
    await act(async () => expect(await result.current.handleRecordingToggle(true)).toEqual({}));
    expect(findValidWebTab).toHaveBeenCalledTimes(1);
    await act(async () => result.current.handleCorsToggle(true));
    expect(result.current.settings.corsAutoFix).toBe(true);
  });

  it('restores active title, clears stale recording state, tracks settings/log updates, and clears logs', async () => {
    (Storage.getSettings as jest.Mock).mockResolvedValue({ ...baseSettings, logRequests: true });
    (getRecordingStatus as jest.Mock).mockResolvedValue({ success: true, data: { tabId: 17 } });
    storage.tabs.get.mockResolvedValue({ id: 17, title: 'Restored tab' });
    (Storage.getRequestLog as jest.Mock).mockResolvedValue([
      { id: 'log', url: '/x', method: 'GET', timestamp: 1, matched: false },
    ]);
    const { result } = renderHook(() => useRecording());
    await waitFor(() => expect(result.current.activeTabTitle).toBe('Restored tab'));
    await act(async () => result.current.loadRequestLog());
    expect(result.current.requestLog).toHaveLength(1);

    await act(async () => {
      listeners['storage.onChanged']?.forEach((listener) =>
        listener({ settings: { newValue: { ...baseSettings, enabled: false } } }, 'local')
      );
    });
    expect(result.current.settings.enabled).toBe(false);
    (Storage.clearRequestLog as jest.Mock).mockClear();
    await act(async () => result.current.clearLog());
    expect(result.current.requestLog).toEqual([]);
    expect(Storage.clearRequestLog).toHaveBeenCalledTimes(1);
    expect(storage.runtime.sendMessage).toHaveBeenCalledWith({ action: MessageActionType.RequestLogUpdated });
  });
});
