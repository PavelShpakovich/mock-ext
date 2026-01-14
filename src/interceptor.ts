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
  headers?: Record<string, string>;
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
      console.error('[MockAPI] Invalid regex pattern:', pattern);
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
    await this.applyDelay(rule.delay);

    // Prepare response body with dynamic variables
    const body = this.prepareResponseBody(rule.response);

    // Create Response object with proper status and headers
    const statusCode = this.getValidStatusCode(rule.statusCode);
    const headers = this.buildResponseHeaders(rule);

    return new Response(body, {
      status: statusCode,
      statusText: this.getStatusText(statusCode),
      headers,
    });
  }

  private async applyDelay(delay: number): Promise<void> {
    const validDelay = typeof delay === 'number' && !isNaN(delay) ? delay : 0;
    if (validDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, validDelay));
    }
  }

  private prepareResponseBody(response: string | object): string {
    const body = typeof response === 'string' ? response : JSON.stringify(response);
    return this.applyDynamicVariables(body);
  }

  private getValidStatusCode(statusCode: number): number {
    return typeof statusCode === 'number' && !isNaN(statusCode) ? statusCode : 200;
  }

  private buildResponseHeaders(rule: MockRule): Record<string, string> {
    return {
      'Content-Type': rule.contentType || 'application/json',
      'X-MockAPI': 'true',
      ...(rule.headers || {}),
    };
  }

  private notifyInterception(url: string, method: string, ruleId: string, statusCode: number): void {
    window.postMessage(
      {
        type: 'MOCKAPI_INTERCEPTED',
        url,
        method,
        ruleId,
        statusCode,
      },
      '*'
    );
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
    body: string,
    headers: Record<string, string>
  ): void {
    const truncatedBody = body.length > 100000 ? body.substring(0, 100000) + '...[truncated]' : body;

    window.postMessage(
      {
        type: 'MOCKAPI_RESPONSE_CAPTURED',
        url,
        method,
        statusCode,
        contentType: contentType.split(';')[0].trim(),
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

      // Only capture text-based responses
      const isTextBased = contentType.includes('json') || contentType.includes('text') || contentType.includes('xml');

      if (isTextBased) {
        clonedResponse
          .text()
          .then((body) => {
            this.notifyResponseCaptured(url, method, response.status, contentType, body, headers);
          })
          .catch(() => {
            // Failed to read body - ignore silently
          });
      }
    } catch (e) {
      // Failed to clone/read response - ignore silently
    }
  }

  private interceptFetch() {
    const originalFetch = this.originalFetch;
    const matchesRule = this.matchesRule.bind(this);
    const createMockResponse = this.createMockResponse.bind(this);
    const captureResponse = this.captureResponse.bind(this);
    const notifyInterception = this.notifyInterception.bind(this);

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      const rule = matchesRule(url, method.toUpperCase());

      if (rule) {
        notifyInterception(url, method, rule.id, rule.statusCode);
        return createMockResponse(rule);
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

        // Check default headers
        if (lowerName === 'content-type') {
          return rule.contentType || 'application/json';
        }
        if (lowerName === 'x-mockapi') {
          return 'true';
        }

        return null;
      },

      getAllHeaders: () => {
        let headers = `content-type: ${rule.contentType || 'application/json'}\r\nx-mockapi: true\r\n`;

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
    getStatusText: (code: number) => string
  ): Promise<void> {
    // Notify about interception
    this.notifyInterception(url, method, rule.id, rule.statusCode);

    // Apply delay if specified
    const delay = typeof rule.delay === 'number' && !isNaN(rule.delay) ? rule.delay : 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Prepare response body
    let responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);
    responseBody = applyDynamicVariables(responseBody);

    // Setup XHR response
    this.setupXHRResponse(xhr, rule, responseBody, getStatusText);

    // Trigger events
    this.triggerXHREvents(xhr, responseBody);
  }

  private interceptXHR() {
    const matchesRule = this.matchesRule.bind(this);
    const applyDynamicVariables = this.applyDynamicVariables.bind(this);
    const getStatusText = this.getStatusText.bind(this);
    const handleXHRMock = this.handleXHRMock.bind(this);
    const OriginalXHR = this.originalXHR;

    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      let url: string;
      let method: string;

      // Intercept open() to capture URL and method
      xhr.open = function (...args: any[]) {
        method = args[0].toUpperCase();
        url = args[1];
        return originalOpen.apply(this, args as any);
      };

      // Intercept send() to check for mock rules
      xhr.send = function (_body?: Document | XMLHttpRequestBodyInit | null) {
        const rule = matchesRule(url, method);

        if (rule) {
          // Mock the request asynchronously
          setTimeout(() => {
            handleXHRMock(xhr, rule, url, method, applyDynamicVariables, getStatusText);
          }, 0);
          return;
        }

        // Not mocked - proceed with real request
        return originalSend.call(this, _body);
      };

      return xhr;
    } as unknown as typeof XMLHttpRequest;

    // Preserve prototype and static properties
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
