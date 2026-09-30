import { TextDecoder as NodeTextDecoder } from 'util';
import { captureResponse, captureXHRResponse, MAX_CAPTURED_RESPONSE_BYTES } from '../helpers/responseCapture';

describe('response capture', () => {
  beforeEach(() => {
    jest.spyOn(window, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips SSE before cloning a fetch response', async () => {
    const response = {
      headers: { get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null) },
      clone: jest.fn(),
    } as unknown as Response;

    await captureResponse(response, '/events', 'GET');

    expect(response.clone).not.toHaveBeenCalled();
    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it('does not read fetch bodies declared larger than the capture limit', async () => {
    const response = {
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          if (name === 'content-length') return String(MAX_CAPTURED_RESPONSE_BYTES + 1);
          return null;
        },
      },
      clone: jest.fn(),
    } as unknown as Response;

    await captureResponse(response, '/large', 'GET');

    expect(response.clone).not.toHaveBeenCalled();
    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it('skips oversized XHR text responses', () => {
    const xhr = {
      status: 200,
      responseType: 'text',
      responseText: 'x'.repeat(MAX_CAPTURED_RESPONSE_BYTES + 1),
      getResponseHeader: (name: string) => (name === 'content-type' ? 'text/plain' : null),
      getAllResponseHeaders: () => 'content-type: text/plain',
    } as unknown as XMLHttpRequest;

    captureXHRResponse(xhr, '/large', 'GET');

    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it('captures streamed fetch text with normalized content type and headers', async () => {
    Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: NodeTextDecoder });
    const headerValues = {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': 'req-1',
    };
    const reader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array([99, 97, 112, 116, 117, 114, 101, 100, 32, 98, 111, 100, 121]),
        })
        .mockResolvedValueOnce({ done: true }),
    };
    const response = {
      status: 201,
      headers: {
        get: (name: string) => headerValues[name as keyof typeof headerValues] || null,
        forEach: (callback: (value: string, key: string) => void) => {
          Object.entries(headerValues).forEach(([key, value]) => callback(value, key));
        },
      },
      clone: () => ({ body: { getReader: () => reader } }),
    } as unknown as Response;

    await captureResponse(response, '/items', 'POST');

    expect(window.postMessage).toHaveBeenCalledWith(
      {
        type: 'MOQ_RESPONSE_CAPTURED',
        url: '/items',
        method: 'POST',
        statusCode: 201,
        contentType: 'application/json',
        responseBody: 'captured body',
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'x-request-id': 'req-1',
        },
      },
      '*'
    );
  });

  it('captures non-text XHR responses as data markers and parses response headers', () => {
    const xhr = {
      status: 200,
      responseType: 'arraybuffer',
      response: new ArrayBuffer(2),
      getResponseHeader: (name: string) => (name === 'content-type' ? 'application/octet-stream' : null),
      getAllResponseHeaders: () => 'X-Request-Id: req-2\r\ncontent-type: application/octet-stream',
    } as unknown as XMLHttpRequest;

    captureXHRResponse(xhr, '/image', 'GET');

    expect(window.postMessage).toHaveBeenCalledWith(
      {
        type: 'MOQ_RESPONSE_CAPTURED',
        url: '/image',
        method: 'GET',
        statusCode: 200,
        contentType: 'application/octet-stream',
        responseBody: '[Binary Data]',
        responseHeaders: {
          'x-request-id': 'req-2',
          'content-type': 'application/octet-stream',
        },
      },
      '*'
    );
  });

  it('cancels a streamed fetch body when it exceeds the capture limit', async () => {
    const reader = {
      read: jest.fn().mockResolvedValue({
        done: false,
        value: new Uint8Array(MAX_CAPTURED_RESPONSE_BYTES + 1),
      }),
      cancel: jest.fn().mockResolvedValue(undefined),
    };
    const response = {
      status: 200,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'text/plain' : null),
        forEach: jest.fn(),
      },
      clone: () => ({ body: { getReader: () => reader } }),
    } as unknown as Response;

    await captureResponse(response, '/stream', 'GET');

    expect(reader.cancel).toHaveBeenCalledTimes(1);
    expect(window.postMessage).not.toHaveBeenCalled();
  });
});
