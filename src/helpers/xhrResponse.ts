import type { MockRule } from '../types';
import { STATUS_TEXTS } from '../constants';

export interface FakeXHRResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
  url: string;
}

export function createXHRResponseHeaders(
  rule: Pick<MockRule, 'contentType' | 'headers'>,
  corsAutoFix: boolean
): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': rule.contentType || 'application/json',
    'x-moq': 'true',
  };

  if (corsAutoFix) {
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = '*';
    headers['access-control-allow-headers'] = '*';
    headers['access-control-allow-credentials'] = 'true';
  }

  for (const [name, value] of Object.entries(rule.headers || {})) {
    headers[name.toLowerCase()] = value;
  }
  return headers;
}

function setResponseData(xhr: XMLHttpRequest, body: string, contentType: string): void {
  const responseType = xhr.responseType;
  let response: unknown = body;

  try {
    switch (responseType) {
      case 'json':
        response = JSON.parse(body);
        break;
      case 'blob':
        response = new Blob([body], { type: contentType });
        break;
      case 'arraybuffer':
        response = new TextEncoder().encode(body).buffer;
        break;
      case 'document':
        response = new DOMParser().parseFromString(body, contentType.includes('xml') ? 'application/xml' : 'text/html');
        break;
    }
  } catch {
    response = null;
  }

  Object.defineProperty(xhr, 'response', { value: response, writable: false, configurable: true });
  Object.defineProperty(xhr, 'responseText', {
    configurable: true,
    get: () => {
      if (responseType !== '' && responseType !== 'text') {
        throw new DOMException(
          "The object's 'responseText' is only available if 'responseType' is '' or 'text'.",
          'InvalidStateError'
        );
      }
      return body;
    },
  });
}

export function fakeXHRResponse(xhr: XMLHttpRequest, response: FakeXHRResponse): void {
  Object.defineProperty(xhr, 'readyState', { value: 4, writable: false, configurable: true });
  Object.defineProperty(xhr, 'status', { value: response.status, writable: false, configurable: true });
  Object.defineProperty(xhr, 'statusText', {
    value: STATUS_TEXTS[response.status] || 'Unknown',
    writable: false,
    configurable: true,
  });
  setResponseData(xhr, response.body, response.headers['content-type'] || '');
  Object.defineProperty(xhr, 'responseURL', { value: response.url, writable: false, configurable: true });
  xhr.getResponseHeader = (name) => response.headers[name.toLowerCase()] ?? null;
  xhr.getAllResponseHeaders = () =>
    Object.entries(response.headers)
      .map(([name, value]) => `${name}: ${value}`)
      .join('\r\n') + '\r\n';
}

export function triggerXHREvents(xhr: XMLHttpRequest, body: string): void {
  const readyStateEvent = new Event('readystatechange');
  const bodyLength = new Blob([body]).size;
  const loadEvent = new ProgressEvent('load', { loaded: bodyLength, total: bodyLength });
  const loadEndEvent = new ProgressEvent('loadend', { loaded: bodyLength, total: bodyLength });

  xhr.dispatchEvent(readyStateEvent);
  xhr.dispatchEvent(loadEvent);
  xhr.dispatchEvent(loadEndEvent);
}
