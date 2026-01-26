/**
 * Lazy-loaded validation for response hooks
 * This reduces initial bundle size by loading dependencies only when needed
 */

let validationModule: typeof import('acorn') | null = null;
let eslintModule: typeof import('eslint-scope') | null = null;

/**
 * Validates response hook code for safety and syntax with lazy-loaded dependencies
 * @param hookCode - JavaScript code to validate
 * @returns Error message or null if valid
 */
export async function validateResponseHookLazy(hookCode: string): Promise<string | null> {
  // Empty hook is valid (no modification)
  if (!hookCode || hookCode.trim() === '') {
    return null;
  }

  // Check for dangerous patterns (lightweight, no dependencies)
  const dangerousPatterns = [
    { pattern: /\beval\b/i, message: 'eval() is not allowed' },
    { pattern: /\bimport\b/i, message: 'import statements are not allowed' },
    { pattern: /\brequire\b/i, message: 'require() is not allowed' },
    { pattern: /\bprocess\b/i, message: 'process object is not allowed' },
    { pattern: /\bwindow\b/i, message: 'window object is not allowed' },
    { pattern: /\bdocument\b/i, message: 'document object is not allowed' },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(hookCode)) {
      return message;
    }
  }

  // Lazy load validation dependencies only when needed
  if (!validationModule || !eslintModule) {
    try {
      [validationModule, eslintModule] = await Promise.all([import('acorn'), import('eslint-scope')]);
    } catch (error) {
      console.error('Failed to load validation dependencies:', error);
      return 'Validation unavailable';
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
      return `Syntax error: ${error.message}`;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return `Syntax error: ${(error as { message: string }).message}`;
    }
    return 'Invalid JavaScript code';
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
          return `'${ref.identifier.name}' is not defined. Available: response, request, helpers`;
        }
      }
    }

    return null;
  } catch (error: unknown) {
    // If scope analysis fails, fall back to syntax-only validation
    return null;
  }
}
