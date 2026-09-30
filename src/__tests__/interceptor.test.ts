import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';
import { ReadableStream as NodeReadableStream } from 'stream/web';
import { DEFAULT_SETTINGS } from '../constants';
import { MatchType, ResponseMode } from '../enums';

interface ContentScriptDefinition {
  main: () => void;
}

class TestResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly body: ReadableStream<Uint8Array> | null;
  private readonly responseText: string;

  constructor(body: BodyInit | null, init: ResponseInit = {}) {
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? '';
    this.headers = new Headers(init.headers);
    this.responseText = body === null ? '' : String(body);
    this.body =
      body === null
        ? null
        : (new NodeReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(String(body)));
              controller.close();
            },
          }) as unknown as ReadableStream<Uint8Array>);
  }

  async text(): Promise<string> {
    return this.responseText;
  }

  async json(): Promise<unknown> {
    return JSON.parse(await this.text());
  }

  clone(): TestResponse {
    return new TestResponse(this.responseText, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
}

let contentScript: ContentScriptDefinition;
let originalFetch: typeof window.fetch;
let originalXHR: typeof window.XMLHttpRequest;
let baseFetch: jest.Mock;

class TestRequest {
  readonly url: string;
  readonly method: string;
  readonly signal: AbortSignal;

  constructor(input: string | TestRequest, init: RequestInit = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method ?? (typeof input === 'string' ? 'GET' : input.method);
    this.signal = init.signal ?? new AbortController().signal;
  }
}

describe('MAIN-world request interceptor', () => {
  beforeAll(async () => {
    Object.defineProperty(globalThis, 'defineContentScript', {
      configurable: true,
      value: (definition: ContentScriptDefinition) => definition,
    });
    const module = await import('../entrypoints/interceptor.content');
    contentScript = module.default as unknown as ContentScriptDefinition;
  });

  beforeEach(() => {
    originalFetch = window.fetch;
    originalXHR = window.XMLHttpRequest;
    baseFetch = jest.fn();
    window.fetch = baseFetch;
    Object.defineProperty(globalThis, 'Response', { configurable: true, value: TestResponse });
    Object.defineProperty(globalThis, 'Request', { configurable: true, value: TestRequest });
    Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: NodeTextDecoder });
    Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: NodeTextEncoder });
    Object.defineProperty(globalThis, 'ReadableStream', { configurable: true, value: NodeReadableStream });
    jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    delete (window as Window & { __MOQ_INTERCEPTOR__?: unknown }).__MOQ_INTERCEPTOR__;
    contentScript.main();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    window.XMLHttpRequest = originalXHR;
    delete (window as Window & { __MOQ_INTERCEPTOR__?: unknown }).__MOQ_INTERCEPTOR__;
    jest.restoreAllMocks();
  });

  function updateRules(rules: object[], proxyRules: object[] = [], capture = false): void {
    const event = new MessageEvent('message', {
      data: { type: 'MOQ_UPDATE_RULES', rules, proxyRules, settings: DEFAULT_SETTINGS, capture },
    });
    Object.defineProperty(event, 'source', { value: window });
    window.dispatchEvent(event);
  }

  function mockRule(overrides: Record<string, unknown> = {}) {
    return {
      id: 'rule-1',
      name: 'Mock API',
      enabled: true,
      urlPattern: 'http://localhost/api/items',
      matchType: MatchType.Exact,
      method: 'GET',
      statusCode: 201,
      response: '{"mocked":true}',
      contentType: 'application/json',
      delay: 0,
      created: 1,
      modified: 1,
      ...overrides,
    };
  }

  function proxyRule(overrides: Record<string, unknown> = {}) {
    return {
      id: 'proxy-1',
      name: 'Proxy API',
      enabled: true,
      urlPattern: 'http://localhost/api/*',
      matchType: MatchType.Wildcard,
      method: 'GET',
      proxyTarget: 'https://proxy.example/base/',
      pathRewriteFrom: '/api',
      pathRewriteTo: '/v2',
      delay: 0,
      created: 1,
      modified: 1,
      ...overrides,
    };
  }

  it('mocks relative fetch URLs and normalizes unsupported mock statuses', async () => {
    updateRules([mockRule({ statusCode: 101 })]);

    const response = await window.fetch('/api/items');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mocked: true });
    expect(response.headers.get('x-moq')).toBe('true');
    expect(baseFetch).not.toHaveBeenCalled();
    expect(window.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'MOQ_INTERCEPTED' }), '*');
  });

  it('runs response hooks on passthrough fetch responses', async () => {
    baseFetch.mockResolvedValue(new TestResponse('{"value":1}', { status: 200 }));
    updateRules([
      mockRule({
        responseMode: ResponseMode.Passthrough,
        responseHook: 'return { value: response.value + 1 };',
      }),
    ]);

    const response = await window.fetch('http://localhost/api/items');

    expect(await response.json()).toEqual({ value: 2 });
    expect(baseFetch).toHaveBeenCalledTimes(1);
  });

  it('returns mocked JSON through XHR responseType and fires load once', async () => {
    updateRules([mockRule()]);

    const xhr = new window.XMLHttpRequest();
    const onLoad = jest.fn();
    xhr.open('GET', '/api/items');
    xhr.responseType = 'json';
    xhr.onload = onLoad;
    const loaded = new Promise<void>((resolve) => xhr.addEventListener('load', () => resolve(), { once: true }));
    xhr.send();
    await loaded;

    expect(xhr.status).toBe(201);
    expect(xhr.response).toEqual({ mocked: true });
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('forwards unmatched fetch requests without capture when recording is off', async () => {
    const response = new TestResponse('real response');
    baseFetch.mockResolvedValue(response);
    updateRules([]);

    const result = await window.fetch('/api/other');

    expect(result).toBe(response);
    expect(baseFetch).toHaveBeenCalledWith('/api/other', undefined);
    expect(window.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MOQ_RESPONSE_CAPTURED' }),
      '*'
    );
  });

  it('rewrites proxied Request URLs while preserving method and headers', async () => {
    const request = new TestRequest('http://localhost/api/items?page=3', { method: 'GET' });
    baseFetch.mockResolvedValue(
      new TestResponse('{"proxied":true}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': '16',
          'content-encoding': 'gzip',
          'x-upstream': 'kept',
        },
      })
    );
    updateRules([], [proxyRule()]);

    const response = await window.fetch(request as unknown as RequestInfo);

    expect(baseFetch).toHaveBeenCalledTimes(1);
    const forwardedRequest = baseFetch.mock.calls[0][0] as TestRequest;
    expect(forwardedRequest.url).toBe('https://proxy.example/base/v2/items?page=3');
    expect(response.headers.get('x-moq-proxy')).toBe('true');
    expect(response.headers.get('x-upstream')).toBe('kept');
    expect(response.headers.get('content-length')).toBeNull();
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(await response.json()).toEqual({ proxied: true });
  });

  it('converts proxy transport failures to a 502 response', async () => {
    baseFetch.mockRejectedValue(new Error('upstream unavailable'));
    updateRules([], [proxyRule()]);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await window.fetch('http://localhost/api/items');

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Proxy request failed' });
    expect(consoleError).toHaveBeenCalledWith('[Moq] Proxy mode failed:', expect.any(Error));
  });

  it('rejects delayed mocks with AbortError when their signal is cancelled', async () => {
    updateRules([mockRule({ delay: 100 })]);
    const controller = new AbortController();
    const pending = window.fetch('/api/items', { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('expands dynamic response variables and captures unmatched responses only while recording', async () => {
    updateRules([mockRule({ response: '{{timestamp}}' })]);
    const mocked = await window.fetch('/api/items');
    expect(await mocked.text()).toMatch(/^\d+$/);

    const response = new TestResponse('captured response', {
      headers: { 'content-type': 'text/plain' },
    });
    baseFetch.mockResolvedValue(response);
    updateRules([], [], true);
    await window.fetch('/api/unmatched');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MOQ_RESPONSE_CAPTURED', responseBody: 'captured response' }),
      '*'
    );
  });
});
