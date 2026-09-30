import { validateProxyRuleForm } from '../helpers/ruleValidation';

const t = (key: string) => key;
const validForm = {
  name: 'Proxy rule',
  urlPattern: 'https://api.example.com/*',
  matchType: 'wildcard',
  proxyTarget: 'https://upstream.example.net',
};

describe('validateProxyRuleForm', () => {
  it('accepts valid HTTP proxy targets and exact/wildcard patterns', async () => {
    await expect(validateProxyRuleForm(validForm, t)).resolves.toEqual({});
    await expect(validateProxyRuleForm({ ...validForm, proxyTarget: 'http://localhost:3000' }, t)).resolves.toEqual({});
  });

  it('reports missing fields, invalid regexes, malformed URLs, and non-http protocols', async () => {
    await expect(
      validateProxyRuleForm({ name: ' ', urlPattern: ' ', matchType: 'wildcard', proxyTarget: '' }, t)
    ).resolves.toEqual({
      name: 'validation.nameRequired',
      urlPattern: 'validation.urlPatternRequired',
      proxyTarget: 'validation.proxyTargetRequired',
    });
    await expect(
      validateProxyRuleForm({ ...validForm, matchType: 'regex', urlPattern: '[', proxyTarget: 'ftp://example.com' }, t)
    ).resolves.toEqual({
      urlPattern: 'validation.invalidRegexPattern',
      proxyTarget: 'validation.proxyTargetInvalid',
    });
    await expect(validateProxyRuleForm({ ...validForm, proxyTarget: 'not a url' }, t)).resolves.toMatchObject({
      proxyTarget: 'validation.proxyTargetInvalid',
    });
  });

  it('validates a provided response hook asynchronously', async () => {
    const result = await validateProxyRuleForm({ ...validForm, responseHook: 'return missingValue;' }, t);
    expect(result.responseHook).toContain('validation');
  });
});
