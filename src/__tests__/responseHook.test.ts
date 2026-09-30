import { executeResponseHook } from '../helpers/responseHook';

describe('response hook executor', () => {
  it('provides the same parsed response and request context to hooks', () => {
    const result = executeResponseHook(
      'return { count: response.count + 1, url: request.url, header: request.headers.Authorization, body: request.body };',
      '{"count":1}',
      {
        url: 'https://api.example.com/items',
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: '{"name":"Moq"}',
      }
    );

    expect(result).toEqual({
      count: 2,
      url: 'https://api.example.com/items',
      header: 'Bearer token',
      body: '{"name":"Moq"}',
    });
  });

  it('parses Google XSSI and chunked JSON consistently', () => {
    const result = executeResponseHook('return helpers.parseGoogleJSON(response);', ')]}\'\n13\n{"ok":true}', {
      url: '/data',
      method: 'GET',
    });

    expect(result).toEqual({ ok: true });
  });

  it('returns the original response when hook syntax is invalid', () => {
    const result = executeResponseHook('return (', '{"ok":true}', { url: '/data', method: 'GET' });

    expect(result).toBe('{"ok":true}');
  });
});
