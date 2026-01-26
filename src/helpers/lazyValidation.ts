/**
 * Lazy-loaded validation for response hooks
 * This reduces initial bundle size by loading dependencies only when needed
 */

let validationModule: typeof import('acorn') | null = null;
let eslintModule: typeof import('eslint-scope') | null = null;

/**
 * Translation function type
 */
type TranslateFn = (key: string, params?: Record<string, any>) => string;

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

  // Check for dangerous patterns (lightweight, no dependencies)
  const dangerousPatterns = [
    // Original patterns
    { pattern: /\beval\b/i, key: 'editor.validationErrors.evalNotAllowed' },
    { pattern: /\bimport\b/i, key: 'editor.validationErrors.importNotAllowed' },
    { pattern: /\brequire\b/i, key: 'editor.validationErrors.requireNotAllowed' },
    { pattern: /\bprocess\b/i, key: 'editor.validationErrors.processNotAllowed' },
    { pattern: /\bwindow\b/i, key: 'editor.validationErrors.windowNotAllowed' },
    { pattern: /\bdocument\b/i, key: 'editor.validationErrors.documentNotAllowed' },

    // Enhanced security patterns
    { pattern: /\blocation\b/i, key: 'editor.validationErrors.locationNotAllowed' },
    { pattern: /\bcookie\b/i, key: 'editor.validationErrors.cookieNotAllowed' },
    { pattern: /localStorage|sessionStorage/i, key: 'editor.validationErrors.storageNotAllowed' },
    { pattern: /this\[/i, key: 'editor.validationErrors.dynamicThisNotAllowed' },
    { pattern: /\bfetch\b/i, key: 'editor.validationErrors.fetchNotAllowed' },
    { pattern: /XMLHttpRequest/i, key: 'editor.validationErrors.xhrNotAllowed' },
    { pattern: /new\s+Image/i, key: 'editor.validationErrors.imageNotAllowed' },
    { pattern: /\.src\s*=/i, key: 'editor.validationErrors.srcNotAllowed' },
    { pattern: /\.innerHTML\b/i, key: 'editor.validationErrors.innerHTMLNotAllowed' },
    { pattern: /\.outerHTML\b/i, key: 'editor.validationErrors.outerHTMLNotAllowed' },
    { pattern: /\bFunction\b/i, key: 'editor.validationErrors.functionNotAllowed' },
    { pattern: /globalThis/i, key: 'editor.validationErrors.globalThisNotAllowed' },
    { pattern: /self\[/i, key: 'editor.validationErrors.dynamicSelfNotAllowed' },
    {
      pattern: /__proto__|constructor\s*\[|prototype\s*\[/i,
      key: 'editor.validationErrors.prototypePollutionNotAllowed',
    },
  ];

  for (const { pattern, key } of dangerousPatterns) {
    if (pattern.test(hookCode)) {
      return t(key);
    }
  }

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
    const scopeManager = eslintModule.analyze(ast as any, {
      ecmaVersion: 2020,
      sourceType: 'script',
      ignoreEval: true,
    });

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
          return t('editor.validationErrors.undefinedVariable', { name: ref.identifier.name });
        }
      }
    }

    return null;
  } catch (error: unknown) {
    // If scope analysis fails, fall back to syntax-only validation
    return null;
  }
}
