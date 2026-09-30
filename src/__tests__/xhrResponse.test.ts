import { createXHRResponseHeaders, fakeXHRResponse, triggerXHREvents } from '../helpers/xhrResponse';

describe('XHR response adapter', () => {
  it('preserves responseType and exposes typed response data', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.example.com/items');
    xhr.responseType = 'json';

    fakeXHRResponse(xhr, {
      status: 201,
      body: '{"created":true}',
      headers: { 'content-type': 'application/json', 'x-moq': 'true' },
      url: 'https://api.example.com/items',
    });

    expect(xhr.responseType).toBe('json');
    expect(xhr.response).toEqual({ created: true });
    expect(xhr.status).toBe(201);
    expect(xhr.getResponseHeader('X-Moq')).toBe('true');
    expect(() => xhr.responseText).toThrow(DOMException);
  });

  it('merges default, CORS, and custom headers', () => {
    const rule = { contentType: 'application/json', headers: { 'X-Moq': 'custom' } };

    expect(createXHRResponseHeaders(rule, true)).toMatchObject({
      'content-type': 'application/json',
      'x-moq': 'custom',
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
    });
  });

  it('dispatches XHR callback properties only once', () => {
    const xhr = new XMLHttpRequest();
    const onLoad = jest.fn();
    const onReadyStateChange = jest.fn();
    xhr.onload = onLoad;
    xhr.onreadystatechange = onReadyStateChange;

    fakeXHRResponse(xhr, { status: 200, body: '{}', headers: {}, url: '/items' });
    triggerXHREvents(xhr, '{}');

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onReadyStateChange).toHaveBeenCalledTimes(1);
  });
});
