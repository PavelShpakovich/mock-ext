/**
 * Lazy-loaded validation for response hooks
 * This reduces initial bundle size by loading dependencies only when needed
 */

let validationModule: typeof import('acorn') | null = null;
let eslintModule: typeof import('eslint-scope') | null = null;

/**
 * Translation function type
 */
type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Validates response hook code for safety and syntax with lazy-loaded dependencies
 * @param hookCode - JavaScript code to validate
 * @param t - Translation function for error messages
 * @returns Error message or null if valid
 */
export async function validateResponseHookLazy(hookCode: string, t: TranslateFn): Promise<string | null> {
  // Empty hook is valid (no modification)
  if (!hookCode || hookCode.trim() === '') {
    return null;
  }

  const blockedGlobals: Record<string, string> = {
    eval: 'editor.validationErrors.evalNotAllowed',
    import: 'editor.validationErrors.importNotAllowed',
    require: 'editor.validationErrors.requireNotAllowed',
    process: 'editor.validationErrors.processNotAllowed',
    window: 'editor.validationErrors.windowNotAllowed',
    document: 'editor.validationErrors.documentNotAllowed',
    location: 'editor.validationErrors.locationNotAllowed',
    cookie: 'editor.validationErrors.cookieNotAllowed',
    localStorage: 'editor.validationErrors.storageNotAllowed',
    sessionStorage: 'editor.validationErrors.storageNotAllowed',
    fetch: 'editor.validationErrors.fetchNotAllowed',
    XMLHttpRequest: 'editor.validationErrors.xhrNotAllowed',
    Image: 'editor.validationErrors.imageNotAllowed',
    Function: 'editor.validationErrors.functionNotAllowed',
    globalThis: 'editor.validationErrors.globalThisNotAllowed',
    self: 'editor.validationErrors.dynamicSelfNotAllowed',
  };

  // Lazy load validation dependencies only when needed
  if (!validationModule || !eslintModule) {
    try {
      [validationModule, eslintModule] = await Promise.all([import('acorn'), import('eslint-scope')]);
    } catch (error) {
      console.error('Failed to load validation dependencies:', error);
      return t('editor.validationErrors.validationUnavailable');
    }
  }

  // Parse and validate with eslint-scope for proper scope analysis
  let ast;
  try {
    ast = validationModule.parse(hookCode, {
      ecmaVersion: 2020,
      sourceType: 'script',
      locations: true,
    });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return t('editor.validationErrors.syntaxError', { message: error.message });
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return t('editor.validationErrors.syntaxError', { message: (error as { message: string }).message });
    }
    return t('editor.validationErrors.invalidJavaScript');
  }

  // Analyze scopes to find undefined variables
  try {
    const scopeManager = eslintModule.analyze(
      ast as unknown as Parameters<typeof eslintModule.analyze>[0],
      {
        ecmaVersion: 2020,
        sourceType: 'script',
        ignoreEval: true,
      } as Parameters<typeof eslintModule.analyze>[1]
    );

    // Define allowed global variables (available in hook context)
    const allowedGlobals = new Set([
      'response',
      'request',
      'helpers',
      // JavaScript built-ins
      'console',
      'Math',
      'JSON',
      'Date',
      'String',
      'Number',
      'Boolean',
      'Array',
      'Object',
      'RegExp',
      'Error',
      'DOMParser',
      'XMLSerializer',
      'parseInt',
      'parseFloat',
      'isNaN',
      'isFinite',
      'undefined',
      'null',
      'true',
      'false',
      'Infinity',
      'NaN',
    ]);

    // Check for undefined variables
    for (const scope of scopeManager.scopes) {
      for (const ref of scope.references) {
        // ref.resolved is null if the variable is not defined in any scope
        // ref.identifier.name is the variable name
        if (!ref.resolved && !allowedGlobals.has(ref.identifier.name)) {
          const blockedGlobalMessage = blockedGlobals[ref.identifier.name];
          if (blockedGlobalMessage) return t(blockedGlobalMessage);
          return t('editor.validationErrors.undefinedVariable', { name: ref.identifier.name });
        }
      }
    }

    return null;
  } catch {
    // If scope analysis fails, fall back to syntax-only validation
    return null;
  }
}
