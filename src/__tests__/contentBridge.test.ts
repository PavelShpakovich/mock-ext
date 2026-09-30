import { DEFAULT_SETTINGS } from '../constants';
import { MatchType, MessageActionType } from '../enums';
import { Storage } from '../storage';

interface ContentScriptDefinition {
  main: () => void;
}

jest.mock('../storage', () => ({
  Storage: {
    getRules: jest.fn(),
    getProxyRules: jest.fn(),
    getSettings: jest.fn(),
  },
}));

const rule = (id: string, urlPattern: string) => ({
  id,
  name: id,
  enabled: true,
  urlPattern,
  matchType: MatchType.Exact,
  method: 'GET',
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
});

describe('isolated content bridge', () => {
  let main: () => void;
  const chrome = (
    globalThis as unknown as { chrome: { runtime: { sendMessage: jest.Mock; onMessage: { addListener: jest.Mock } } } }
  ).chrome;

  beforeEach(async () => {
    jest.resetModules();
    (browser.runtime as unknown as { id: string }).id = 'test-extension';
    (globalThis as unknown as { defineContentScript: unknown }).defineContentScript = (
      definition: ContentScriptDefinition
    ) => definition;
    chrome.runtime.sendMessage.mockResolvedValue({ success: true, data: { isRecording: false } });
    jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    (Storage.getRules as jest.Mock).mockResolvedValue([rule('same-origin', 'http://localhost/api')]);
    (Storage.getProxyRules as jest.Mock).mockResolvedValue([]);
    (Storage.getSettings as jest.Mock).mockResolvedValue({ ...DEFAULT_SETTINGS, enabled: true });
    const module = await import('../entrypoints/content.content');
    main = (module.default as unknown as ContentScriptDefinition).main;
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends enabled same-origin initial rules and handles ping/update messages', async () => {
    main();
    const listener =
      chrome.runtime.onMessage.addListener.mock.calls[chrome.runtime.onMessage.addListener.mock.calls.length - 1]?.[0];
    const sendResponse = jest.fn();
    expect(listener({ action: MessageActionType.Ping }, {}, sendResponse)).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
    expect(
      listener(
        { action: MessageActionType.UpdateRulesInPage, rules: [rule('regex', '.*')], proxyRules: [], capture: true },
        {},
        sendResponse
      )
    ).toBe(true);
    expect(window.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ rules: [expect.objectContaining({ id: 'regex' })], capture: true }),
      '*'
    );
    expect(listener({ action: 'unknown' }, {}, sendResponse)).toBe(false);
  });

  it('forwards intercepted requests and counters, but captures responses only while recording', async () => {
    main();
    await Promise.resolve();
    await Promise.resolve();
    const message = (data: object) => {
      const event = new MessageEvent('message', { data });
      Object.defineProperty(event, 'source', { value: window });
      window.dispatchEvent(event);
    };
    chrome.runtime.sendMessage.mockClear();
    message({ type: 'MOQ_INTERCEPTED', url: '/api', method: 'GET', ruleId: 'r1', statusCode: 201, timestamp: 9 });
    message({ type: 'MOQ_INCREMENT_COUNTER', ruleId: 'r1' });
    message({
      type: 'MOQ_RESPONSE_CAPTURED',
      url: '/api',
      method: 'GET',
      statusCode: 200,
      contentType: 'application/json',
      responseBody: '{}',
      responseHeaders: {},
    });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: MessageActionType.LogMockedRequest, ruleId: 'r1' })
    );
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: MessageActionType.IncrementRuleCounter,
      ruleId: 'r1',
    });
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: MessageActionType.LogCapturedResponse })
    );

    const listener =
      chrome.runtime.onMessage.addListener.mock.calls[chrome.runtime.onMessage.addListener.mock.calls.length - 1]?.[0];
    listener({ action: MessageActionType.UpdateRulesInPage, capture: true }, {}, jest.fn());
    chrome.runtime.sendMessage.mockClear();
    message({
      type: 'MOQ_RESPONSE_CAPTURED',
      url: '/api',
      method: 'GET',
      statusCode: 200,
      contentType: 'application/json',
      responseBody: '{}',
      responseHeaders: {},
    });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: MessageActionType.LogCapturedResponse, responseBody: '{}' })
    );
  });

  it('ignores page messages from another window and does not send rules when disabled', async () => {
    (Storage.getSettings as jest.Mock).mockResolvedValue({ ...DEFAULT_SETTINGS, enabled: false });
    main();
    await Promise.resolve();
    await Promise.resolve();
    expect(window.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'MOQ_UPDATE_RULES' }), '*');
    const event = new MessageEvent('message', { data: { type: 'MOQ_INTERCEPTED' } });
    Object.defineProperty(event, 'source', { value: null });
    window.dispatchEvent(event);
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: MessageActionType.LogMockedRequest })
    );
  });
});
