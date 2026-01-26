// This script runs in MAIN world (same context as page JavaScript)
// Intercepts fetch() and XMLHttpRequest before they leave the browser
// ⚠️ IMPORTANT: Cannot use ES6 imports - must be self-contained
// ⚠️ String literal types here mirror enums defined in src/enums.ts

// Constants (duplicated from src/constants.ts - cannot use imports in MAIN world)
const MAX_RESPONSE_BODY_SIZE = 100000;
const MAX_RANDOM_NUMBER = 1000000;

interface MockRule {
  id: string;
  enabled: boolean;
  urlPattern: string;
  matchType: 'wildcard' | 'exact' | 'regex'; // ⚠️ Mirrors MatchType enum
  method: string;
  statusCode: number;
  response: string | object;
  contentType: string;
  delay: number;
  headers?: Record<string, string>;
  matchCount?: number;
  lastMatched?: number;
  responseHook?: string; // Optional JavaScript code to modify response
  responseHookEnabled?: boolean; // Whether the hook is active (default: true if hook exists)
  responseMode?: 'mock' | 'passthrough'; // Note: Cannot use enum in MAIN world - values must match ResponseMode enum
}

interface Settings {
  enabled: boolean;
  logRequests: boolean;
  showNotifications: boolean;
  corsAutoFix: boolean;
  language?: 'en' | 'ru'; // ⚠️ Mirrors Language enum
}

class RequestInterceptor {
  private rules: MockRule[] = [];
  private settings: Settings = {
    enabled: true,
    logRequests: true,
    showNotifications: false,
    corsAutoFix: false,
  };
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
      case 'exact':
        return this.matchesExact(url, pattern);
      case 'wildcard':
        return this.matchesWildcard(url, pattern);
      case 'regex':
        return this.matchesRegex(url, pattern);
      default:
        return false;
    }
  }

  private matchesExact(url: string, pattern: string): boolean {
    // For exact match, ignore query parameters
    const urlWithoutQuery = url.split('?')[0];
    const patternWithoutQuery = pattern.split('?')[0];
    return urlWithoutQuery === patternWithoutQuery;
  }

  private matchesWildcard(url: string, pattern: string): boolean {
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

  private matchesRegex(url: string, pattern: string): boolean {
    try {
      return new RegExp(pattern).test(url);
    } catch {
      console.error('[Moq] Invalid regex pattern:', pattern);
      return false;
    }
  }

  // ⚠️ IMPORTANT: This method is duplicated from helpers/string.ts
  // Must be kept in sync manually
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async createMockResponse(
    rule: MockRule,
    url: string,
    method: string,
    requestInit?: RequestInit
  ): Promise<Response> {
    // Apply delay if specified
    await this.applyDelay(rule.delay);

    // Prepare response body with dynamic variables and optional response hook
    const body = await this.prepareResponseBody(
      rule.response,
      rule.responseHook,
      rule.responseHookEnabled,
      url,
      method,
      requestInit
    );

    // Create Response object with proper status and headers
    const statusCode = this.getValidStatusCode(rule.statusCode);
    const headers = this.buildResponseHeaders(rule);

    return new Response(body, {
      status: statusCode,
      statusText: this.getStatusText(statusCode),
      headers,
    });
  }

  private async createPassthroughResponse(
    rule: MockRule,
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    url: string,
    method: string,
    originalFetch: typeof fetch
  ): Promise<Response> {
    try {
      await this.applyDelay(rule.delay);

      const realResponse = await originalFetch.call(window, input, init);
      const realBody = await realResponse.text();

      let modifiedBody = realBody;
      const hookEnabled = rule.responseHookEnabled !== false; // Default to true
      if (rule.responseHook && rule.responseHook.trim() !== '' && hookEnabled) {
        try {
          const modifiedResponse = this.executeResponseHook(rule.responseHook, realBody, url, method, init);
          modifiedBody = typeof modifiedResponse === 'string' ? modifiedResponse : JSON.stringify(modifiedResponse);
        } catch (error) {
          console.error('[Moq] Passthrough hook failed:', error);
          modifiedBody = realBody;
        }
      }

      const statusCode = this.getValidStatusCode(rule.statusCode);
      const headers = this.buildResponseHeaders(rule);

      return new Response(modifiedBody, {
        status: statusCode,
        statusText: this.getStatusText(statusCode),
        headers,
      });
    } catch (error) {
      console.error('[Moq] Passthrough mode failed:', error);
      // Fallback to mock response on error
      return this.createMockResponse(rule, url, method, init);
    }
  }

  private async applyDelay(delay: number): Promise<void> {
    const validDelay = typeof delay === 'number' && !isNaN(delay) ? delay : 0;
    if (validDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, validDelay));
    }
  }

  private async prepareResponseBody(
    response: string | object,
    responseHook: string | undefined,
    responseHookEnabled: boolean | undefined,
    url: string,
    method: string,
    requestInit?: RequestInit
  ): Promise<string> {
    let responseBody = typeof response === 'string' ? response : JSON.stringify(response);

    const hookEnabled = responseHookEnabled !== false; // Default to true
    if (responseHook && responseHook.trim() !== '' && hookEnabled) {
      try {
        const modifiedResponse = this.executeResponseHook(responseHook, responseBody, url, method, requestInit);
        responseBody = typeof modifiedResponse === 'string' ? modifiedResponse : JSON.stringify(modifiedResponse);
      } catch (error) {
        console.error('[Moq] Response hook failed:', error);
      }
    }

    return this.applyDynamicVariables(responseBody);
  }

  /**
   * Executes a response hook with the provided context.
   * Self-contained implementation (no imports allowed in MAIN world).
   */
  private executeResponseHook(
    hookCode: string,
    response: string,
    url: string,
    method: string,
    requestInit?: RequestInit
  ): unknown {
    try {
      let parsedResponse: unknown = response;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        parsedResponse = response;
      }

      // Helper functions available in response hooks
      const helpers = {
        randomId: (): string => Math.random().toString(36).substring(2, 11),
        timestamp: (): number => Date.now(),
        uuid: (): string => {
          // Simple UUID v4 implementation
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
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
        stripGooglePrefix: (responseBody: string): string => {
          return responseBody.replace(/^[\s\S]*?\)\n/, '');
        },
        parseGoogleJSON: (responseBody: string): any => {
          const stripped = responseBody.replace(/^[\s\S]*?\)\n/, '');
          try {
            return JSON.parse(stripped);
          } catch (e) {
            return stripped;
          }
        },
      };

      const requestHeaders: Record<string, string> = {};
      if (requestInit?.headers) {
        const headers = requestInit.headers;
        if (headers instanceof Headers) {
          headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else if (Array.isArray(headers)) {
          headers.forEach(([key, value]) => {
            requestHeaders[key] = value;
          });
        } else {
          Object.assign(requestHeaders, headers);
        }
      }

      const request = {
        url,
        method,
        headers: requestHeaders,
        body: requestInit?.body ? String(requestInit.body) : undefined,
      };

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
      const modifiedResponse = fn(parsedResponse, request, helpers);
      return modifiedResponse;
    } catch (error) {
      console.error('[Moq] Failed to execute response hook:', error);
      return response; // Return original on error
    }
  }

  /**
   * Executes a response hook for XHR requests.
   * Handles XHR-specific request body types.
   */
  private executeResponseHookForXHR(
    hookCode: string,
    response: string,
    url: string,
    method: string,
    requestBody?: Document | XMLHttpRequestBodyInit | null
  ): unknown {
    try {
      let parsedResponse: unknown = response;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        parsedResponse = response;
      }

      const helpers = {
        randomId: (): string => Math.random().toString(36).substring(2, 11),
        timestamp: (): number => Date.now(),
        uuid: (): string => {
          // Simple UUID v4 implementation
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
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
        stripGooglePrefix: (responseBody: string): string => {
          // Remove )]}' prefix (Google's XSSI protection)
          let stripped = responseBody.replace(/^\)\]\}'\s*/, '');

          // Handle chunked responses: remove chunk size indicators (numbers on separate lines)
          // Format: "144\n[...json...]\n25\n[...json...]" -> "[...json...][...json...]"
          stripped = stripped.replace(/^\d+\n/gm, '');

          return stripped;
        },
        parseGoogleJSON: (responseBody: string): any => {
          // Remove )]}' prefix
          let stripped = responseBody.replace(/^\)\]\}'\s*/, '');

          // Handle chunked responses by removing size indicators
          stripped = stripped.replace(/^\d+\n/gm, '');

          try {
            // Try parsing as single JSON
            return JSON.parse(stripped);
          } catch (e) {
            // If it fails, try parsing line by line (each line might be a JSON chunk)
            try {
              const lines = stripped.split('\n').filter((line) => line.trim());
              if (lines.length > 1) {
                const parsed = [];
                for (const line of lines) {
                  try {
                    parsed.push(JSON.parse(line));
                  } catch {
                    // Skip unparseable lines
                  }
                }
                return parsed.length > 0 ? parsed : stripped;
              }
            } catch (e2) {
              // Return stripped string if all parsing attempts fail
            }
            return stripped;
          }
        },
      };

      const request = {
        url,
        method,
        headers: {},
        body: requestBody ? String(requestBody) : undefined,
      };

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

      return fn(parsedResponse, request, helpers);
    } catch (error) {
      console.error('[Moq] XHR hook execution failed:', error);
      return response;
    }
  }

  private getValidStatusCode(statusCode: number): number {
    return typeof statusCode === 'number' && !isNaN(statusCode) ? statusCode : 200;
  }

  private buildResponseHeaders(rule: MockRule): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': rule.contentType || 'application/json',
      'X-Moq': 'true',
    };

    if (this.settings.corsAutoFix) {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = '*';
      headers['Access-Control-Allow-Headers'] = '*';
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return { ...headers, ...(rule.headers || {}) };
  }

  private notifyInterception(url: string, method: string, ruleId: string, statusCode: number): void {
    window.postMessage({ type: 'MOQ_INTERCEPTED', url, method, ruleId, statusCode, timestamp: Date.now() }, '*');
    window.postMessage({ type: 'MOQ_INCREMENT_COUNTER', ruleId }, '*');
  }

  private captureResponseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private notifyResponseCaptured(
    url: string,
    method: string,
    statusCode: number,
    contentType: string,
    body: any,
    headers: Record<string, string>
  ): void {
    const safeBody = typeof body === 'string' ? body : String(body || '');
    const truncatedBody =
      safeBody.length > MAX_RESPONSE_BODY_SIZE
        ? safeBody.substring(0, MAX_RESPONSE_BODY_SIZE) + '...[truncated]'
        : safeBody;

    window.postMessage(
      {
        type: 'MOQ_RESPONSE_CAPTURED',
        url,
        method,
        statusCode,
        contentType: contentType ? contentType.split(';')[0].trim() : '',
        responseBody: truncatedBody,
        responseHeaders: headers,
      },
      '*'
    );
  }

  private async captureResponse(response: Response, url: string, method: string): Promise<void> {
    try {
      const clonedResponse = response.clone();
      const contentType = clonedResponse.headers.get('content-type') || '';
      const headers = this.captureResponseHeaders(response);
      const isTextBased = contentType.includes('json') || contentType.includes('text');

      if (isTextBased) {
        clonedResponse
          .text()
          .then((body) => {
            this.notifyResponseCaptured(url, method, response.status, contentType, body, headers);
          })
          .catch(() => {
            this.notifyResponseCaptured(url, method, response.status, contentType, '[Error reading body]', headers);
          });
      } else {
        this.notifyResponseCaptured(url, method, response.status, contentType, '[Binary Data]', headers);
      }
    } catch (e) {
      // Silently ignore clone/read errors
    }
  }

  private captureXHRResponse(
    xhr: XMLHttpRequest,
    url: string,
    method: string,
    _requestHeaders: Record<string, string>,
    _requestBody?: string
  ): void {
    try {
      const contentType = xhr.getResponseHeader('content-type') || '';
      const headers: Record<string, string> = {};
      const headersString = xhr.getAllResponseHeaders();
      if (headersString) {
        headersString.split('\r\n').forEach((line) => {
          const [key, ...value] = line.split(': ');
          if (key) headers[key.toLowerCase()] = value.join(': ');
        });
      }

      const isTextBased = contentType.includes('json') || contentType.includes('text');

      let responseBody = '[Binary Data]';

      if (isTextBased) {
        try {
          // Access responseText only if responseType is "" or "text"
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            responseBody = xhr.responseText;
          } else {
            responseBody = `[Data: ${xhr.responseType}]`;
          }
        } catch (e) {
          responseBody = '[Error reading responseText]';
        }
      }

      this.notifyResponseCaptured(url, method, xhr.status, contentType, responseBody, headers);
    } catch (e) {
      // Silently ignore
    }
  }

  private interceptFetch() {
    const originalFetch = this.originalFetch;
    const matchesRule = this.matchesRule.bind(this);
    const createMockResponse = this.createMockResponse.bind(this);
    const createPassthroughResponse = this.createPassthroughResponse.bind(this);
    const captureResponse = this.captureResponse.bind(this);
    const notifyInterception = this.notifyInterception.bind(this);

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Extract method: from init, or from Request object, or default to GET
      let method = init?.method || 'GET';
      if (typeof input === 'object' && 'method' in input && input.method) {
        method = input.method;
      }

      // Normalize method to uppercase for consistency
      method = method.toUpperCase();

      const rule = matchesRule(url, method);

      if (rule) {
        notifyInterception(url, method, rule.id, rule.statusCode);

        // Check if this is passthrough mode with a response hook
        if (rule.responseMode === 'passthrough' && rule.responseHook) {
          return createPassthroughResponse(rule, input, init, url, method, originalFetch);
        }

        // Default: mock mode
        return createMockResponse(rule, url, method, init);
      }

      // Not mocked - proceed with real request and capture response for logging
      const response = await originalFetch.call(this, input, init);
      await captureResponse(response, url, method);
      return response;
    };
  }

  private createXHRResponseHeaders(rule: MockRule): {
    getHeader: (name: string) => string | null;
    getAllHeaders: () => string;
  } {
    return {
      getHeader: (name: string) => {
        const lowerName = name.toLowerCase();

        // Check custom headers first
        if (rule.headers) {
          const headerKey = Object.keys(rule.headers).find((k) => k.toLowerCase() === lowerName);
          if (headerKey) return rule.headers[headerKey];
        }

        // Check CORS headers if enabled
        if (this.settings.corsAutoFix) {
          if (lowerName === 'access-control-allow-origin') return '*';
          if (lowerName === 'access-control-allow-methods') return '*';
          if (lowerName === 'access-control-allow-headers') return '*';
          if (lowerName === 'access-control-allow-credentials') return 'true';
        }

        // Check default headers
        if (lowerName === 'content-type') {
          return rule.contentType || 'application/json';
        }
        if (lowerName === 'x-moq') {
          return 'true';
        }

        return null;
      },

      getAllHeaders: () => {
        let headers = `content-type: ${rule.contentType || 'application/json'}\r\nx-moq: true\r\n`;

        // Add CORS headers if enabled
        if (this.settings.corsAutoFix) {
          headers += 'access-control-allow-origin: *\r\n';
          headers += 'access-control-allow-methods: *\r\n';
          headers += 'access-control-allow-headers: *\r\n';
          headers += 'access-control-allow-credentials: true\r\n';
        }

        // Add custom headers
        if (rule.headers) {
          for (const [key, value] of Object.entries(rule.headers)) {
            headers += `${key.toLowerCase()}: ${value}\r\n`;
          }
        }

        return headers;
      },
    };
  }

  private setupXHRResponse(
    xhr: XMLHttpRequest,
    rule: MockRule,
    responseBody: string,
    getStatusText: (code: number) => string
  ): void {
    const statusCode = typeof rule.statusCode === 'number' && !isNaN(rule.statusCode) ? rule.statusCode : 200;

    // Set response properties
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

    // Set header methods
    const headerHandlers = this.createXHRResponseHeaders(rule);
    xhr.getResponseHeader = headerHandlers.getHeader;
    xhr.getAllResponseHeaders = headerHandlers.getAllHeaders;
  }

  private triggerXHREvents(xhr: XMLHttpRequest, responseBody: string): void {
    const readyStateEvent = new Event('readystatechange');
    const bodyLength = new Blob([responseBody]).size;
    const loadEvent = new ProgressEvent('load', { loaded: bodyLength, total: bodyLength });
    const loadEndEvent = new ProgressEvent('loadend', { loaded: bodyLength, total: bodyLength });

    xhr.dispatchEvent(readyStateEvent);
    xhr.dispatchEvent(loadEvent);
    xhr.dispatchEvent(loadEndEvent);

    // Trigger event handlers if set
    if (xhr.onreadystatechange) xhr.onreadystatechange(readyStateEvent);
    if (xhr.onload) xhr.onload(loadEvent);
    if (xhr.onloadend) xhr.onloadend(loadEndEvent);
  }

  private async handleXHRMock(
    xhr: XMLHttpRequest,
    rule: MockRule,
    url: string,
    method: string,
    applyDynamicVariables: (text: string) => string,
    getStatusText: (code: number) => string,
    requestBody?: Document | XMLHttpRequestBodyInit | null,
    requestHeaders?: Record<string, string>
  ): Promise<void> {
    this.notifyInterception(url, method, rule.id, rule.statusCode);

    const delay = typeof rule.delay === 'number' && !isNaN(rule.delay) ? rule.delay : 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (rule.responseMode === 'passthrough' && rule.responseHook) {
      await this.handleXHRPassthrough(xhr, rule, url, method, requestBody, getStatusText, requestHeaders);
      return;
    }

    let responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);

    const hookEnabled = rule.responseHookEnabled !== false; // Default to true
    if (rule.responseHook && rule.responseHook.trim() !== '' && hookEnabled) {
      try {
        const modifiedResponse = this.executeResponseHookForXHR(
          rule.responseHook,
          responseBody,
          url,
          method,
          requestBody
        );
        responseBody = typeof modifiedResponse === 'string' ? modifiedResponse : JSON.stringify(modifiedResponse);
      } catch (error) {
        console.error('[Moq] XHR hook failed:', error);
      }
    }

    responseBody = applyDynamicVariables(responseBody);

    // Setup XHR response
    this.setupXHRResponse(xhr, rule, responseBody, getStatusText);

    // Trigger events
    this.triggerXHREvents(xhr, responseBody);
  }

  private async handleXHRPassthrough(
    mockXhr: XMLHttpRequest,
    rule: MockRule,
    url: string,
    method: string,
    requestBody: Document | XMLHttpRequestBodyInit | null | undefined,
    getStatusText: (code: number) => string,
    requestHeaders?: Record<string, string>
  ): Promise<void> {
    try {
      const realXhr = new this.originalXHR();
      realXhr.open(method, url, true);

      // Set original request headers
      if (requestHeaders) {
        for (const [header, value] of Object.entries(requestHeaders)) {
          realXhr.setRequestHeader(header, value);
        }
      }

      await new Promise<void>((resolve, reject) => {
        realXhr.onload = () => resolve();
        realXhr.onerror = () => reject(new Error('XHR request failed'));
        realXhr.send(requestBody);
      });

      let realBody = realXhr.responseText;

      const hookEnabled = rule.responseHookEnabled !== false; // Default to true
      if (rule.responseHook && rule.responseHook.trim() !== '' && hookEnabled) {
        try {
          const modifiedResponse = this.executeResponseHookForXHR(
            rule.responseHook,
            realBody,
            url,
            method,
            requestBody
          );
          realBody = typeof modifiedResponse === 'string' ? modifiedResponse : JSON.stringify(modifiedResponse);
        } catch (error) {
          console.error('[Moq] XHR passthrough hook failed:', error);
        }
      }

      const statusCode = this.getValidStatusCode(rule.statusCode);
      Object.defineProperty(mockXhr, 'readyState', { value: 4, writable: false, configurable: true });
      Object.defineProperty(mockXhr, 'status', { value: statusCode, writable: false, configurable: true });
      Object.defineProperty(mockXhr, 'statusText', {
        value: getStatusText(statusCode),
        writable: false,
        configurable: true,
      });
      Object.defineProperty(mockXhr, 'responseText', { value: realBody, writable: false, configurable: true });
      Object.defineProperty(mockXhr, 'response', { value: realBody, writable: false, configurable: true });
      Object.defineProperty(mockXhr, 'responseType', { value: '', writable: false, configurable: true });

      const headerHandlers = this.createXHRResponseHeaders(rule);
      mockXhr.getResponseHeader = headerHandlers.getHeader;
      mockXhr.getAllResponseHeaders = headerHandlers.getAllHeaders;

      this.triggerXHREvents(mockXhr, realBody);
    } catch (error) {
      console.error('[Moq] XHR passthrough failed:', error);
      const responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);
      this.setupXHRResponse(mockXhr, rule, responseBody, getStatusText);
      this.triggerXHREvents(mockXhr, responseBody);
    }
  }

  private interceptXHR() {
    const matchesRule = this.matchesRule.bind(this);
    const applyDynamicVariables = this.applyDynamicVariables.bind(this);
    const getStatusText = this.getStatusText.bind(this);
    const handleXHRMock = this.handleXHRMock.bind(this);
    const captureXHRResponse = this.captureXHRResponse.bind(this);
    const OriginalXHR = this.originalXHR;

    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;

      let url: string;
      let method: string;
      const requestHeaders: Record<string, string> = {};

      xhr.open = function (
        httpMethod: string,
        requestUrl: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        method = httpMethod.toUpperCase();
        url = requestUrl.toString();
        return originalOpen.call(this, httpMethod, requestUrl, async ?? true, username, password);
      };

      xhr.setRequestHeader = function (header: string, value: string) {
        requestHeaders[header] = value;
        return originalSetRequestHeader.call(this, header, value);
      };

      xhr.send = function (_body?: Document | XMLHttpRequestBodyInit | null) {
        const rule = matchesRule(url, method);

        if (rule) {
          setTimeout(() => {
            handleXHRMock(xhr, rule, url, method, applyDynamicVariables, getStatusText, _body, requestHeaders);
          }, 0);
          return;
        }

        // Add listener to capture response for logging if not mocked
        xhr.addEventListener('load', () => {
          captureXHRResponse(xhr, url, method, requestHeaders, _body ? String(_body) : undefined);
        });

        return originalSend.call(this, _body);
      };

      return xhr;
    } as unknown as typeof XMLHttpRequest;

    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
    Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
  }

  private listenForRuleUpdates() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data.type === 'MOQ_UPDATE_RULES') {
        this.rules = event.data.rules;
        if (event.data.settings) {
          this.settings = event.data.settings;
        }
      }
    });
  }

  private applyDynamicVariables(text: string): string {
    return text
      .replace(/\{\{timestamp\}\}/g, Date.now().toString())
      .replace(/\{\{uuid\}\}/g, this.generateUUID())
      .replace(/\{\{random_number\}\}/g, () => Math.floor(Math.random() * MAX_RANDOM_NUMBER).toString())
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  __MOQ_INTERCEPTOR__?: RequestInterceptor;
}

if (!window.__MOQ_INTERCEPTOR__) {
  window.__MOQ_INTERCEPTOR__ = new RequestInterceptor();
}
