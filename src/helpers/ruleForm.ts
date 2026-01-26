import { MockRule, RequestLog, ResponseMode } from '../types';
import { HttpMethod, MatchType } from '../enums';
import { convertHeadersToArray, extractCapturedHeaders, HeaderEntry } from './headers';
import { detectContentType } from './formatting';
import { DEFAULT_DELAY_MS } from '../constants';

export interface RuleFormData {
  name: string;
  urlPattern: string;
  matchType: MatchType;
  method: HttpMethod;
  statusCode: number;
  contentType: string;
  responseBody: string;
  delay: number;
  headers: HeaderEntry[];
  folderId?: string;
  responseHook?: string;
  responseHookEnabled?: boolean;
  responseMode?: ResponseMode;
}

export function getInitialFormData(rule: MockRule | null, mockRequest: RequestLog | null | undefined): RuleFormData {
  if (rule) {
    return {
      name: rule.name,
      urlPattern: rule.urlPattern,
      matchType: rule.matchType,
      method: rule.method,
      statusCode: rule.statusCode,
      contentType: rule.contentType,
      responseBody: typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response, null, 2),
      delay: rule.delay,
      headers: convertHeadersToArray(rule.headers),
      folderId: rule.folderId,
      responseHook: rule.responseHook,
      responseHookEnabled: rule.responseHookEnabled !== false, // Default to true if hook exists
      responseMode: (rule.responseMode as ResponseMode) || ResponseMode.Mock,
    };
  }

  if (mockRequest) {
    // Extract pathname safely - handle both absolute and relative URLs
    let pathname: string;
    try {
      pathname = new URL(mockRequest.url).pathname;
    } catch {
      // If URL is relative, use it as-is or extract the path part
      pathname = mockRequest.url.split('?')[0]; // Remove query string if present
    }

    return {
      name: `Mock for ${pathname}`,
      urlPattern: mockRequest.url,
      matchType: MatchType.Exact,
      method: mockRequest.method as HttpMethod,
      statusCode: mockRequest.statusCode || 200,
      contentType: detectContentType(mockRequest.contentType, mockRequest.responseBody),
      responseBody: mockRequest.responseBody || '{}',
      delay: DEFAULT_DELAY_MS,
      headers: extractCapturedHeaders(mockRequest),
      responseMode: ResponseMode.Mock,
      responseHookEnabled: false,
    };
  }

  return {
    name: '',
    urlPattern: '',
    matchType: MatchType.Wildcard,
    method: '' as HttpMethod,
    statusCode: 200,
    contentType: 'application/json',
    responseBody: '',
    delay: DEFAULT_DELAY_MS,
    headers: [],
    responseMode: ResponseMode.Mock,
    responseHookEnabled: false,
  };
}
