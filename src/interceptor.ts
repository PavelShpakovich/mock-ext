// This script runs in MAIN world (same context as page JavaScript)
// Intercepts fetch() and XMLHttpRequest before they leave the browser

interface MockRule {
  id: string;
  enabled: boolean;
  urlPattern: string;
  matchType: 'wildcard' | 'exact' | 'regex';
  method: string;
  statusCode: number;
  response: string | object;
  contentType: string;
  delay: number;
}

class RequestInterceptor {
  private rules: MockRule[] = [];
  private originalFetch: typeof fetch;
  private originalXHR: typeof XMLHttpRequest;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    this.interceptFetch();
    this.interceptXHR();
    this.listenForRuleUpdates();
  }

  private matchesRule(url: string, method: string): MockRule | null {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.method && rule.method !== method) continue;
      if (this.matchesPattern(url, rule.urlPattern, rule.matchType)) {
        return rule;
      }
    }
    return null;
  }

  // ⚠️ IMPORTANT: This method is duplicated from helpers/urlMatching.ts
  // The interceptor runs in MAIN world and cannot use ES6 imports
  // If you modify this, also update src/helpers/urlMatching.ts
  private matchesPattern(url: string, pattern: string, type: string): boolean {
    switch (type) {
      case 'exact': {
        // For exact match, ignore query parameters
        const urlWithoutQuery = url.split('?')[0];
        const patternWithoutQuery = pattern.split('?')[0];
        return urlWithoutQuery === patternWithoutQuery;
      }
      case 'wildcard': {
        // For wildcard, ignore query parameters unless pattern includes them
        const urlToMatch = pattern.includes('?') ? url : url.split('?')[0];

        const regexPattern = pattern
          .split('*')
          .map((part) => this.escapeRegExp(part))
          .join('.*');
        try {
          return new RegExp('^' + regexPattern + '$').test(urlToMatch);
        } catch {
          return false;
        }
      }
      case 'regex':
        try {
          return new RegExp(pattern).test(url);
        } catch {
          console.error('[MockAPI] Invalid regex pattern:', pattern);
          return false;
        }
      default:
        return false;
    }
  }

  // ⚠️ IMPORTANT: This method is duplicated from helpers/string.ts
  // Must be kept in sync manually
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async createMockResponse(rule: MockRule): Promise<Response> {
    // Apply delay if specified
    const delay = typeof rule.delay === 'number' && !isNaN(rule.delay) ? rule.delay : 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Prepare response body
    let body = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);

    // Apply dynamic variables
    body = this.applyDynamicVariables(body);

    // Create Response object with proper status
    const statusCode = typeof rule.statusCode === 'number' && !isNaN(rule.statusCode) ? rule.statusCode : 200;
    return new Response(body, {
      status: statusCode,
      statusText: this.getStatusText(statusCode),
      headers: {
        'Content-Type': rule.contentType || 'application/json',
        'X-MockAPI': 'true', // Marker for our extension
      },
    });
  }

  private interceptFetch() {
    const originalFetch = this.originalFetch;
    const matchesRule = this.matchesRule.bind(this);
    const createMockResponse = this.createMockResponse.bind(this);

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      const rule = matchesRule(url, method.toUpperCase());

      if (rule) {
        // Notify content script about interception
        window.postMessage(
          {
            type: 'MOCKAPI_INTERCEPTED',
            url,
            method,
            ruleId: rule.id,
            statusCode: rule.statusCode,
          },
          '*'
        );

        return createMockResponse(rule);
      }

      // Not mocked - proceed with real request and capture response
      const response = await originalFetch.call(this, input, init);

      // Capture response body for logging (clone so original can still be used)
      try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get('content-type') || '';

        // Only capture text-based responses (JSON, HTML, etc.)
        if (contentType.includes('json') || contentType.includes('text') || contentType.includes('xml')) {
          clonedResponse
            .text()
            .then((body) => {
              // Limit body size to prevent memory issues
              const truncatedBody = body.length > 100000 ? body.substring(0, 100000) + '...[truncated]' : body;

              window.postMessage(
                {
                  type: 'MOCKAPI_RESPONSE_CAPTURED',
                  url,
                  method,
                  statusCode: response.status,
                  contentType: contentType.split(';')[0].trim(),
                  responseBody: truncatedBody,
                },
                '*'
              );
            })
            .catch(() => {
              // Failed to read body - ignore
            });
        }
      } catch (e) {
        // Failed to clone/read response - ignore
      }

      return response;
    };
  }

  private interceptXHR() {
    const matchesRule = this.matchesRule.bind(this);
    const applyDynamicVariables = this.applyDynamicVariables.bind(this);
    const getStatusText = this.getStatusText.bind(this);
    const OriginalXHR = this.originalXHR;

    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      let url: string;
      let method: string;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      xhr.open = function (...args: any[]) {
        method = args[0].toUpperCase();
        url = args[1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-rest-params
        return originalOpen.apply(this, args as any);
      };

      xhr.send = function (_body?: Document | XMLHttpRequestBodyInit | null) {
        const rule = matchesRule(url, method);

        if (rule) {
          // eslint-disable-next-line no-console
          console.log('[MockAPI] Intercepted XHR:', url);

          // Notify content script about interception
          window.postMessage(
            {
              type: 'MOCKAPI_INTERCEPTED',
              url,
              method,
              ruleId: rule.id,
              statusCode: rule.statusCode,
            },
            '*'
          );

          // Simulate async behavior
          setTimeout(async () => {
            // Apply delay
            const delay = typeof rule.delay === 'number' && !isNaN(rule.delay) ? rule.delay : 0;
            if (delay > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            let responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);

            responseBody = applyDynamicVariables(responseBody);

            // Manually trigger XHR events with proper properties
            const statusCode = typeof rule.statusCode === 'number' && !isNaN(rule.statusCode) ? rule.statusCode : 200;
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: false, configurable: true });
            Object.defineProperty(xhr, 'status', { value: statusCode, writable: false, configurable: true });
            Object.defineProperty(xhr, 'statusText', {
              value: getStatusText(statusCode),
              writable: false,
              configurable: true,
            });
            Object.defineProperty(xhr, 'responseText', { value: responseBody, writable: false, configurable: true });
            Object.defineProperty(xhr, 'response', { value: responseBody, writable: false, configurable: true });
            Object.defineProperty(xhr, 'responseType', { value: '', writable: false, configurable: true });

            // Override response header methods
            xhr.getResponseHeader = function (name: string) {
              if (name.toLowerCase() === 'content-type') {
                return rule.contentType || 'application/json';
              }
              if (name.toLowerCase() === 'x-mockapi') {
                return 'true';
              }
              return null;
            };

            xhr.getAllResponseHeaders = function () {
              return `content-type: ${rule.contentType || 'application/json'}\r\nx-mockapi: true\r\n`;
            };

            // Trigger events in correct order
            const readyStateEvent = new Event('readystatechange');
            const bodyLength = new Blob([responseBody]).size;
            const loadEvent = new ProgressEvent('load', { loaded: bodyLength, total: bodyLength });
            const loadEndEvent = new ProgressEvent('loadend', {
              loaded: bodyLength,
              total: bodyLength,
            });

            xhr.dispatchEvent(readyStateEvent);
            xhr.dispatchEvent(loadEvent);
            xhr.dispatchEvent(loadEndEvent);

            if (xhr.onreadystatechange) xhr.onreadystatechange(readyStateEvent);
            if (xhr.onload) xhr.onload(loadEvent);
            if (xhr.onloadend) xhr.onloadend(loadEndEvent);
          }, 0);

          return;
        }

        // Not mocked - proceed with real request
        return originalSend.call(this, _body);
      };

      return xhr;
    } as unknown as typeof XMLHttpRequest;

    // Copy prototype and static properties
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
    Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
  }

  private listenForRuleUpdates() {
    // Listen for rule updates from content script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data.type === 'MOCKAPI_UPDATE_RULES') {
        this.rules = event.data.rules;
      }
    });
  }

  private applyDynamicVariables(text: string): string {
    return text
      .replace(/\{\{timestamp\}\}/g, Date.now().toString())
      .replace(/\{\{uuid\}\}/g, this.generateUUID())
      .replace(/\{\{random_number\}\}/g, () => Math.floor(Math.random() * 1000000).toString())
      .replace(/\{\{random_string\}\}/g, () => Math.random().toString(36).substring(7));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return statusTexts[code] || 'Unknown';
  }
}

// Initialize interceptor (singleton pattern)
// TypeScript type augmentation for Window
interface Window {
  __MOCKAPI_INTERCEPTOR__?: RequestInterceptor;
}

if (!window.__MOCKAPI_INTERCEPTOR__) {
  window.__MOCKAPI_INTERCEPTOR__ = new RequestInterceptor();
}
