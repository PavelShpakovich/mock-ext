import { v4 as uuidv4 } from 'uuid';
import * as acorn from 'acorn';
import * as eslintScope from 'eslint-scope';

/**
 * Context provided to response hooks
 */
export interface ResponseHookContext {
  response: any; // Parsed response body (can be modified)
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
  helpers: {
    randomId: () => string;
    timestamp: () => number;
    uuid: () => string;
    randomNumber: (min?: number, max?: number) => number;
    randomString: (length?: number) => string;
  };
}

/**
 * Helper functions available in response hooks
 */
const createHelpers = () => ({
  randomId: (): string => {
    return Math.random().toString(36).substring(2, 11);
  },

  timestamp: (): number => {
    return Date.now();
  },

  uuid: (): string => {
    return uuidv4();
  },

  randomNumber: (min: number = 0, max: number = 999999): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
});

/**
 * Executes a response hook with the provided context
 * Modifies the response object in place
 *
 * @param hookCode - JavaScript code to execute
 * @param response - Response body (will be modified)
 * @param request - Request details
 * @returns Modified response or original if hook fails
 */
export function executeResponseHook(
  hookCode: string,
  response: any,
  request: { url: string; method: string; headers?: Record<string, string>; body?: string }
): any {
  // Empty hook means no modification
  if (!hookCode || hookCode.trim() === '') {
    return response;
  }

  try {
    // Parse response if it's a string
    let parsedResponse = response;
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        // Not JSON, keep as string
        parsedResponse = response;
      }
    }

    // Create context
    const context: ResponseHookContext = {
      response: parsedResponse,
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers || {},
        body: request.body,
      },
      helpers: createHelpers(),
    };

    // Create safe execution function
    // The hook has access to: response, request, helpers
    const fn = new Function(
      'response',
      'request',
      'helpers',
      `
      'use strict';
      try {
        ${hookCode}
        return response;
      } catch (error) {
        console.error('[Moq] Response hook error:', error.message);
        return response;
      }
    `
    );

    // Execute hook
    const modifiedResponse = fn(context.response, context.request, context.helpers);

    // Return modified response
    return modifiedResponse;
  } catch (error) {
    console.error('[Moq] Failed to execute response hook:', error);
    return response; // Return original on error
  }
}

/**
 * Validates a response hook for syntax errors
 * Returns an error message if invalid, or null if valid
 *
 * @param hookCode - JavaScript code to validate
 * @returns Error message or null if valid
 */
export function validateResponseHook(hookCode: string): string | null {
  // Empty hook is valid (no modification)
  if (!hookCode || hookCode.trim() === '') {
    return null;
  }

  // Check for dangerous patterns
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

  // Parse and validate with eslint-scope for proper scope analysis
  let ast;
  try {
    ast = acorn.parse(hookCode, {
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
    const scopeManager = eslintScope.analyze(ast as any, {
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

/**
 * Helper function to provide examples for users
 */
export function getResponseHookExamples(): Array<{
  description: string;
  code: string;
}> {
  return [
    {
      description: 'Add timestamp to response',
      code: 'response.timestamp = helpers.timestamp();',
    },
    {
      description: 'Generate unique ID',
      code: 'response.id = helpers.uuid();',
    },
    {
      description: 'Add request info to response',
      code: `response.requestedBy = request.headers['User-Agent'];\nresponse.requestUrl = request.url;`,
    },
    {
      description: 'Add random data',
      code: 'response.randomValue = helpers.randomNumber(1, 100);\nresponse.token = helpers.randomString(16);',
    },
    {
      description: 'Modify existing fields',
      code: `if (response.items) {\n  response.items.forEach((item, index) => {\n    item.id = helpers.uuid();\n    item.position = index + 1;\n  });\n}`,
    },
    {
      description: 'Add pagination metadata',
      code: `response.meta = {\n  page: 1,\n  perPage: 10,\n  total: response.items ? response.items.length : 0,\n  generatedAt: helpers.timestamp()\n};`,
    },
    {
      description: 'Conditionally modify based on request',
      code: `if (request.method === 'POST') {\n  response.created = true;\n  response.createdAt = helpers.timestamp();\n}`,
    },
  ];
}
