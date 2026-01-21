import { v4 as uuidv4 } from 'uuid';

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
 * @returns Promise that resolves to error message or null if valid
 */
export async function validateResponseHook(hookCode: string): Promise<string | null> {
  // Empty hook is valid (no modification)
  if (!hookCode || hookCode.trim() === '') {
    return null;
  }

  // Lazy load validation module
  const { validateResponseHookLazy } = await import('./lazyValidation');
  return validateResponseHookLazy(hookCode);
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
