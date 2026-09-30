import { buildProxyUrl, normalizeRequestUrl, responseBodyForStatus } from '../helpers/requestTransforms';

describe('request transforms', () => {
  it('normalizes relative URLs against the page URL', () => {
    expect(normalizeRequestUrl('/api/users?active=1', 'https://app.example.com/dashboard')).toBe(
      'https://app.example.com/api/users?active=1'
    );
  });

  it('rewrites proxy paths and preserves query strings', () => {
    expect(
      buildProxyUrl('https://api.example.com/v1/users?page=2', {
        proxyTarget: 'https://proxy.example.net/base/',
        pathRewriteFrom: '/v1',
        pathRewriteTo: '/api',
      })
    ).toBe('https://proxy.example.net/base/api/users?page=2');
  });

  it.each([204, 205, 304])('returns a null body for status %s', (status) => {
    expect(responseBodyForStatus(status, 'ignored')).toBeNull();
  });

  it('preserves bodies for ordinary response statuses', () => {
    expect(responseBodyForStatus(200, 'ok')).toBe('ok');
  });
});
