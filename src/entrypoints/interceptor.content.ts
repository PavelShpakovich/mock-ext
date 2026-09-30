import { clearURLMatchCache, matchURL } from '../helpers/urlMatching';
import { executeResponseHook } from '../helpers/responseHook';
import type { ResponseHookRequest } from '../helpers/responseHook';
import { MAX_RANDOM_NUMBER, STATUS_TEXTS } from '../constants';
import { DEFAULT_SETTINGS } from '../constants';
import type { MockRule, ProxyRule, Settings } from '../types';
import { createXHRResponseHeaders, fakeXHRResponse, triggerXHREvents } from '../helpers/xhrResponse';
import { captureResponse, captureXHRResponse } from '../helpers/responseCapture';
import { buildProxyUrl, normalizeRequestUrl, responseBodyForStatus } from '../helpers/requestTransforms';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,
  world: 'MAIN',

  main() {
    class RequestInterceptor {
      private rules: MockRule[] = [];
      private proxyRules: ProxyRule[] = [];
      private settings: Settings = DEFAULT_SETTINGS;
      private captureEnabled = false;
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
          if (matchURL(url, rule.urlPattern, rule.matchType)) {
            return rule;
          }
        }
        return null;
      }

      private matchesProxyRule(url: string, method: string): ProxyRule | null {
        for (const rule of this.proxyRules) {
          if (!rule.enabled) continue;
          if (rule.method && rule.method !== method) continue;
          if (matchURL(url, rule.urlPattern, rule.matchType)) {
            return rule;
          }
        }
        return null;
      }

      private async createMockResponse(
        rule: MockRule,
        url: string,
        method: string,
        requestInit?: RequestInit,
        signal?: AbortSignal
      ): Promise<Response> {
        await this.applyDelay(rule.delay, signal);
        const body = await this.prepareResponseBody(
          rule.response,
          rule.responseHook,
          rule.responseHookEnabled,
          url,
          method,
          requestInit
        );
        const statusCode = this.getValidStatusCode(rule.statusCode);
        const headers = this.buildResponseHeaders(rule);
        return new Response(responseBodyForStatus(statusCode, body), {
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
        originalFetch: typeof fetch,
        signal?: AbortSignal
      ): Promise<Response> {
        try {
          await this.applyDelay(rule.delay, signal);
          const realResponse = await originalFetch.call(window, input, init);
          const realBody = await realResponse.text();
          const modifiedBody = this.applyResponseHook(rule.responseHook, rule.responseHookEnabled, realBody, {
            url,
            method,
            headers: init?.headers,
            body: init?.body,
          });
          const statusCode = this.getValidStatusCode(rule.statusCode);
          const headers = this.buildResponseHeaders(rule);
          return new Response(responseBodyForStatus(statusCode, modifiedBody), {
            status: statusCode,
            statusText: this.getStatusText(statusCode),
            headers,
          });
        } catch (error) {
          if (signal?.aborted) throw error;
          console.error('[Moq] Passthrough mode failed:', error);
          return this.createMockResponse(rule, url, method, init, signal);
        }
      }

      private async createProxyResponse(
        rule: ProxyRule,
        input: RequestInfo | URL,
        init: RequestInit | undefined,
        url: string,
        method: string,
        originalFetch: typeof fetch,
        signal?: AbortSignal
      ): Promise<Response> {
        try {
          await this.applyDelay(rule.delay, signal);
          const proxyUrl = buildProxyUrl(url, rule);
          const proxyInput = input instanceof Request ? new Request(proxyUrl, input) : proxyUrl;
          const realResponse = await originalFetch.call(window, proxyInput, init);
          const realBody = await realResponse.text();
          const modifiedBody = this.applyResponseHook(rule.responseHook, rule.responseHookEnabled, realBody, {
            url,
            method,
            headers: init?.headers,
            body: init?.body,
          });
          const statusCode = realResponse.status;
          const headers: Record<string, string> = { 'X-Moq': 'true', 'X-Moq-Proxy': 'true' };
          realResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'content-encoding' || key.toLowerCase() === 'content-length') return;
            headers[key] = value;
          });
          return new Response(responseBodyForStatus(statusCode, modifiedBody), {
            status: statusCode,
            statusText: this.getStatusText(statusCode),
            headers,
          });
        } catch (error) {
          if (signal?.aborted) throw error;
          console.error('[Moq] Proxy mode failed:', error);
          return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
            status: 502,
            statusText: 'Bad Gateway',
            headers: { 'Content-Type': 'application/json', 'X-Moq': 'true' },
          });
        }
      }

      private applyResponseHook(
        hookCode: string | undefined,
        hookEnabled: boolean | undefined,
        responseBody: string,
        request: ResponseHookRequest
      ): string {
        if (!hookCode?.trim() || hookEnabled === false) return responseBody;
        const modifiedResponse = executeResponseHook(hookCode, responseBody, request);
        return typeof modifiedResponse === 'string' ? modifiedResponse : JSON.stringify(modifiedResponse);
      }

      private async applyDelay(delay: number, signal?: AbortSignal): Promise<void> {
        const validDelay = typeof delay === 'number' && !isNaN(delay) ? delay : 0;
        if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
        if (validDelay <= 0) return;

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            signal?.removeEventListener('abort', abort);
            resolve();
          }, validDelay);
          const abort = () => {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', abort);
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          };
          signal?.addEventListener('abort', abort, { once: true });
          if (signal?.aborted) abort();
        });
      }

      private async prepareResponseBody(
        response: string | object,
        responseHook: string | undefined,
        responseHookEnabled: boolean | undefined,
        url: string,
        method: string,
        requestInit?: RequestInit
      ): Promise<string> {
        const responseBody = typeof response === 'string' ? response : JSON.stringify(response);
        const modifiedBody = this.applyResponseHook(responseHook, responseHookEnabled, responseBody, {
          url,
          method,
          headers: requestInit?.headers,
          body: requestInit?.body,
        });

        return this.applyDynamicVariables(modifiedBody);
      }

      private getValidStatusCode(statusCode: number): number {
        return Number.isInteger(statusCode) && statusCode >= 200 && statusCode <= 599 ? statusCode : 200;
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

      private interceptFetch() {
        const originalFetch = this.originalFetch;
        const matchesRule = this.matchesRule.bind(this);
        const matchesProxyRule = this.matchesProxyRule.bind(this);
        const createMockResponse = this.createMockResponse.bind(this);
        const createPassthroughResponse = this.createPassthroughResponse.bind(this);
        const createProxyResponse = this.createProxyResponse.bind(this);
        const notifyInterception = this.notifyInterception.bind(this);
        const shouldCapture = () => this.captureEnabled;

        window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
          let url: string;
          if (typeof input === 'string') {
            url = input;
          } else if (input instanceof URL) {
            url = input.href;
          } else {
            url = input.url;
          }
          url = normalizeRequestUrl(url, window.location.href);

          let method = init?.method || (input instanceof Request ? input.method : 'GET');

          // Normalize method to uppercase for consistency
          method = method.toUpperCase();
          const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);

          // Mock rules take priority
          const rule = matchesRule(url, method);

          if (rule) {
            notifyInterception(url, method, rule.id, rule.statusCode);

            // Check if this is passthrough mode with a response hook
            if (rule.responseMode === 'passthrough' && rule.responseHook) {
              return createPassthroughResponse(rule, input, init, url, method, originalFetch, signal);
            }

            // Default: mock mode
            return createMockResponse(rule, url, method, init, signal);
          }

          // Check proxy rules (lower priority than mock rules)
          const proxyRule = matchesProxyRule(url, method);
          if (proxyRule) {
            notifyInterception(url, method, proxyRule.id, 0);
            return createProxyResponse(proxyRule, input, init, url, method, originalFetch, signal);
          }

          // Not mocked or proxied - proceed with real request and capture response for logging
          const response = await originalFetch.call(this, input, init);
          if (shouldCapture()) void captureResponse(response, url, method);
          return response;
        };
      }

      private async handleXHRMock(
        xhr: XMLHttpRequest,
        rule: MockRule,
        url: string,
        method: string,
        applyDynamicVariables: (text: string) => string,
        requestBody?: Document | XMLHttpRequestBodyInit | null,
        requestHeaders?: Record<string, string>
      ): Promise<void> {
        this.notifyInterception(url, method, rule.id, rule.statusCode);

        await this.applyDelay(rule.delay);

        if (rule.responseMode === 'passthrough' && rule.responseHook) {
          await this.handleXHRPassthrough(xhr, rule, url, method, requestBody, requestHeaders);
          return;
        }

        const responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);
        let modifiedBody = this.applyResponseHook(rule.responseHook, rule.responseHookEnabled, responseBody, {
          url,
          method,
          headers: requestHeaders,
          body: requestBody,
        });

        modifiedBody = applyDynamicVariables(modifiedBody);

        // Setup XHR response
        fakeXHRResponse(xhr, {
          status: this.getValidStatusCode(rule.statusCode),
          body: modifiedBody,
          headers: createXHRResponseHeaders(rule, this.settings.corsAutoFix),
          url,
        });

        // Trigger events
        triggerXHREvents(xhr, modifiedBody);
      }

      private async handleXHRPassthrough(
        mockXhr: XMLHttpRequest,
        rule: MockRule,
        url: string,
        method: string,
        requestBody: Document | XMLHttpRequestBodyInit | null | undefined,
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

          const realBody = this.applyResponseHook(rule.responseHook, rule.responseHookEnabled, realXhr.responseText, {
            url,
            method,
            headers: requestHeaders,
            body: requestBody,
          });

          fakeXHRResponse(mockXhr, {
            status: this.getValidStatusCode(rule.statusCode),
            body: realBody,
            headers: createXHRResponseHeaders(rule, this.settings.corsAutoFix),
            url: realXhr.responseURL,
          });

          triggerXHREvents(mockXhr, realBody);
        } catch (error) {
          console.error('[Moq] XHR passthrough failed:', error);
          const responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response);
          fakeXHRResponse(mockXhr, {
            status: this.getValidStatusCode(rule.statusCode),
            body: responseBody,
            headers: createXHRResponseHeaders(rule, this.settings.corsAutoFix),
            url,
          });
          triggerXHREvents(mockXhr, responseBody);
        }
      }

      private async handleXHRProxy(
        mockXhr: XMLHttpRequest,
        rule: ProxyRule,
        url: string,
        method: string,
        requestBody: Document | XMLHttpRequestBodyInit | null | undefined,
        requestHeaders?: Record<string, string>
      ): Promise<void> {
        this.notifyInterception(url, method, rule.id, 0);
        try {
          await this.applyDelay(rule.delay);

          const proxyUrl = buildProxyUrl(url, rule);
          const realXhr = new this.originalXHR();
          realXhr.open(method, proxyUrl, true);

          if (requestHeaders) {
            for (const [header, value] of Object.entries(requestHeaders)) {
              realXhr.setRequestHeader(header, value);
            }
          }

          await new Promise<void>((resolve, reject) => {
            realXhr.onload = () => resolve();
            realXhr.onerror = () => reject(new Error('XHR proxy request failed'));
            realXhr.send(requestBody);
          });

          const realBody = this.applyResponseHook(rule.responseHook, rule.responseHookEnabled, realXhr.responseText, {
            url,
            method,
            headers: requestHeaders,
            body: requestBody,
          });

          const statusCode = realXhr.status;
          const headers: Record<string, string> = { 'x-moq': 'true', 'x-moq-proxy': 'true' };
          const rawHeaders = realXhr.getAllResponseHeaders();
          if (rawHeaders) {
            rawHeaders.split('\r\n').forEach((line: string) => {
              const idx = line.indexOf(':');
              if (idx > 0) {
                const key = line.substring(0, idx).trim();
                const val = line.substring(idx + 1).trim();
                const normalizedKey = key.toLowerCase();
                if (normalizedKey !== 'content-length' && normalizedKey !== 'content-encoding') {
                  headers[normalizedKey] = val;
                }
              }
            });
          }
          fakeXHRResponse(mockXhr, { status: statusCode, body: realBody, headers, url: realXhr.responseURL });

          triggerXHREvents(mockXhr, realBody);
        } catch (error) {
          console.error('[Moq] XHR proxy failed:', error);
          const errorBody = JSON.stringify({ error: 'Proxy request failed' });
          fakeXHRResponse(mockXhr, {
            status: 502,
            body: errorBody,
            headers: { 'content-type': 'application/json', 'x-moq': 'true' },
            url,
          });
          triggerXHREvents(mockXhr, errorBody);
        }
      }

      private interceptXHR() {
        const matchesRule = this.matchesRule.bind(this);
        const matchesProxyRule = this.matchesProxyRule.bind(this);
        const applyDynamicVariables = this.applyDynamicVariables.bind(this);
        const handleXHRMock = this.handleXHRMock.bind(this);
        const handleXHRProxy = this.handleXHRProxy.bind(this);
        const OriginalXHR = this.originalXHR;
        const shouldCapture = () => this.captureEnabled;

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
            url = normalizeRequestUrl(requestUrl.toString(), window.location.href);
            return originalOpen.call(this, httpMethod, requestUrl, async ?? true, username, password);
          };

          xhr.setRequestHeader = function (header: string, value: string) {
            requestHeaders[header] = value;
            return originalSetRequestHeader.call(this, header, value);
          };

          xhr.send = function (_body?: Document | XMLHttpRequestBodyInit | null) {
            // Mock rules take priority
            const rule = matchesRule(url, method);

            if (rule) {
              setTimeout(() => {
                handleXHRMock(xhr, rule, url, method, applyDynamicVariables, _body, requestHeaders);
              }, 0);
              return;
            }

            // Check proxy rules
            const proxyRule = matchesProxyRule(url, method);
            if (proxyRule) {
              setTimeout(() => {
                handleXHRProxy(xhr, proxyRule, url, method, _body, requestHeaders);
              }, 0);
              return;
            }

            if (shouldCapture()) {
              xhr.addEventListener('load', () => {
                if (shouldCapture()) {
                  captureXHRResponse(xhr, url, method);
                }
              });
            }

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
            this.proxyRules = event.data.proxyRules || [];
            this.captureEnabled = event.data.capture === true;
            clearURLMatchCache();
            if (event.data.settings) {
              this.settings = event.data.settings;
            }
          }
        });
      }

      private applyDynamicVariables(text: string): string {
        return text
          .replace(/\{\{timestamp\}\}/g, Date.now().toString())
          .replace(/\{\{uuid\}\}/g, () => crypto.randomUUID())
          .replace(/\{\{random_number\}\}/g, () => Math.floor(Math.random() * MAX_RANDOM_NUMBER).toString())
          .replace(/\{\{random_string\}\}/g, () => Math.random().toString(36).substring(7));
      }

      private getStatusText(code: number): string {
        return STATUS_TEXTS[code] || 'Unknown';
      }
    }

    interface WindowWithInterceptor extends Window {
      __MOQ_INTERCEPTOR__?: RequestInterceptor;
    }

    const windowExt = window as WindowWithInterceptor;

    if (!windowExt.__MOQ_INTERCEPTOR__) {
      windowExt.__MOQ_INTERCEPTOR__ = new RequestInterceptor();
    }
  },
});
