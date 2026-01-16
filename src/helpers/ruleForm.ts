import { MockRule, RequestLog } from '../types';
import { HttpMethod, MatchType } from '../enums';
import { convertHeadersToArray, extractCapturedHeaders, HeaderEntry } from './headers';

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
    };
  }

  if (mockRequest) {
    return {
      name: `Mock for ${new URL(mockRequest.url).pathname}`,
      urlPattern: mockRequest.url,
      matchType: MatchType.Exact,
      method: mockRequest.method as HttpMethod,
      statusCode: mockRequest.statusCode || 200,
      contentType: mockRequest.contentType || 'application/json',
      responseBody: mockRequest.responseBody || '{}',
      delay: 0,
      headers: extractCapturedHeaders(mockRequest),
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
    delay: 0,
    headers: [],
  };
}
