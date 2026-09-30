export interface ResponseHookRequest {
  url: string;
  method: string;
  headers?: HeadersInit;
  body?: unknown;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  const normalized: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      normalized[key] = value;
    });
  } else if (headers) {
    Object.assign(normalized, headers);
  }
  return normalized;
}

function stripGooglePrefix(responseBody: string): string {
  return responseBody.replace(/^\)\]\}'\s*/, '').replace(/^\d+\n/gm, '');
}

function parseGoogleJSON(responseBody: string): unknown {
  const stripped = stripGooglePrefix(responseBody);
  try {
    return JSON.parse(stripped);
  } catch {
    const parsedLines = stripped
      .split('\n')
      .filter((line) => line.trim())
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
    return parsedLines.length > 0 ? parsedLines : stripped;
  }
}

export function executeResponseHook(hookCode: string, response: string, context: ResponseHookRequest): unknown {
  let parsedResponse: unknown = response;
  try {
    parsedResponse = JSON.parse(response);
  } catch {
    parsedResponse = response;
  }

  const request = {
    url: context.url,
    method: context.method,
    headers: normalizeHeaders(context.headers),
    body: context.body ? String(context.body) : undefined,
  };
  const helpers = {
    randomId: (): string => Math.random().toString(36).substring(2, 11),
    timestamp: (): number => Date.now(),
    uuid: (): string => crypto.randomUUID(),
    randomNumber: (min: number = 0, max: number = 999999): number => Math.floor(Math.random() * (max - min + 1)) + min,
    randomString: (length: number = 8): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let index = 0; index < length; index++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    stripGooglePrefix,
    parseGoogleJSON,
  };

  try {
    const execute = new Function(
      'response',
      'request',
      'helpers',
      `
        'use strict';
        try {
          ${hookCode}
          return response;
        } catch (error) {
          console.error('[Moq] Response hook error:', error?.message);
          return response;
        }
      `
    );
    return execute(parsedResponse, request, helpers);
  } catch (error) {
    console.error('[Moq] Failed to execute response hook:', error);
    return response;
  }
}
