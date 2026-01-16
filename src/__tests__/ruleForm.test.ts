import { getInitialFormData } from '../helpers/ruleForm';
import { MockRule, RequestLog } from '../types';
import { MatchType, HttpMethod } from '../enums';

describe('Rule Form Helpers', () => {
  describe('getInitialFormData', () => {
    it('should initialize from existing rule', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test Rule',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: { message: 'success' },
        contentType: 'application/json',
        delay: 100,
        headers: {
          'X-Custom-Header': 'value',
        },
        created: Date.now(),
        modified: Date.now(),
      };

      const result = getInitialFormData(rule, null);

      expect(result.name).toBe('Test Rule');
      expect(result.urlPattern).toBe('https://api.example.com/*');
      expect(result.matchType).toBe(MatchType.Wildcard);
      expect(result.method).toBe(HttpMethod.GET);
      expect(result.statusCode).toBe(200);
      expect(result.contentType).toBe('application/json');
      expect(result.delay).toBe(100);
      expect(result.headers).toEqual([{ key: 'X-Custom-Header', value: 'value' }]);
    });

    it('should format response object as JSON string', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test Rule',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Exact,
        method: HttpMethod.POST,
        statusCode: 201,
        response: { id: 123, name: 'test' },
        contentType: 'application/json',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const result = getInitialFormData(rule, null);

      expect(result.responseBody).toBe('{\n  "id": 123,\n  "name": "test"\n}');
    });

    it('should keep response as string if already string', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Test Rule',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: 'Plain text response',
        contentType: 'text/plain',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const result = getInitialFormData(rule, null);

      expect(result.responseBody).toBe('Plain text response');
    });

    it('should initialize from mock request', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/users/123',
        method: 'GET',
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"id": 123, "name": "John"}',
        matched: true,
        responseHeaders: {
          'X-Rate-Limit': '100',
          'X-Custom': 'value',
        },
      };

      const result = getInitialFormData(null, mockRequest);

      expect(result.name).toBe('Mock for /users/123');
      expect(result.urlPattern).toBe('https://api.example.com/users/123');
      expect(result.matchType).toBe(MatchType.Exact);
      expect(result.method).toBe('GET');
      expect(result.statusCode).toBe(200);
      expect(result.contentType).toBe('application/json');
      expect(result.responseBody).toBe('{"id": 123, "name": "John"}');
      expect(result.delay).toBe(0);
    });

    it('should extract headers from mock request', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{}',
        matched: true,
        responseHeaders: {
          'X-Rate-Limit': '100',
          'X-Custom': 'value',
          'content-type': 'application/json',
        },
      };

      const result = getInitialFormData(null, mockRequest);

      expect(result.headers).toEqual([
        { key: 'X-Rate-Limit', value: '100' },
        { key: 'X-Custom', value: 'value' },
      ]);
    });

    it('should use default statusCode if missing in request', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'GET',
        contentType: 'application/json',
        responseBody: '{}',
        matched: true,
      };

      const result = getInitialFormData(null, mockRequest);

      expect(result.statusCode).toBe(200);
    });

    it('should use default contentType if missing in request', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        responseBody: '{}',
        matched: true,
      };

      const result = getInitialFormData(null, mockRequest);

      expect(result.contentType).toBe('application/json');
    });

    it('should use default responseBody if missing in request', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        contentType: 'application/json',
        matched: true,
      };

      const result = getInitialFormData(null, mockRequest);

      expect(result.responseBody).toBe('{}');
    });

    it('should return default form data when both rule and request are null', () => {
      const result = getInitialFormData(null, null);

      expect(result.name).toBe('');
      expect(result.urlPattern).toBe('');
      expect(result.matchType).toBe(MatchType.Wildcard);
      expect(result.method).toBe('');
      expect(result.statusCode).toBe(200);
      expect(result.contentType).toBe('application/json');
      expect(result.responseBody).toBe('');
      expect(result.delay).toBe(0);
      expect(result.headers).toEqual([]);
    });

    it('should prioritize rule over request when both provided', () => {
      const rule: MockRule = {
        id: '1',
        name: 'Rule Name',
        enabled: true,
        urlPattern: 'https://api.example.com/*',
        matchType: MatchType.Wildcard,
        method: HttpMethod.GET,
        statusCode: 200,
        response: 'rule response',
        contentType: 'text/plain',
        delay: 0,
        created: Date.now(),
        modified: Date.now(),
      };

      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'POST',
        statusCode: 201,
        contentType: 'application/json',
        responseBody: 'request response',
        matched: true,
      };

      const result = getInitialFormData(rule, mockRequest);

      expect(result.name).toBe('Rule Name');
      expect(result.method).toBe(HttpMethod.GET);
      expect(result.responseBody).toBe('rule response');
    });
  });
});
