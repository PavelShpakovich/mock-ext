import { validateResponseHookLazy } from '../helpers/lazyValidation';

describe('response hook lazy validation', () => {
  const translate = (key: string) => key;

  it('allows ordinary response properties named like browser globals', async () => {
    const result = await validateResponseHookLazy('response.location; response.cookie; response.document;', translate);

    expect(result).toBeNull();
  });

  it.each([
    ['window', 'editor.validationErrors.windowNotAllowed'],
    ['document', 'editor.validationErrors.documentNotAllowed'],
    ['location', 'editor.validationErrors.locationNotAllowed'],
    ['localStorage', 'editor.validationErrors.storageNotAllowed'],
    ['fetch', 'editor.validationErrors.fetchNotAllowed'],
  ])('blocks actual %s global references', async (globalName, expectedKey) => {
    const result = await validateResponseHookLazy(`${globalName};`, translate);

    expect(result).toBe(expectedKey);
  });
});
