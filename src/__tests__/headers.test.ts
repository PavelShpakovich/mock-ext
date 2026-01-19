import { convertHeadersToArray, convertArrayToHeaders, extractCapturedHeaders } from '../helpers/headers';
import { RequestLog } from '../types';

describe('Headers Helpers', () => {
  describe('convertHeadersToArray', () => {
    it('should convert headers object to array', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      };

      const result = convertHeadersToArray(headers);

      expect(result).toEqual([
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ]);
    });

    it('should return empty array for undefined headers', () => {
      const result = convertHeadersToArray(undefined);

      expect(result).toEqual([]);
    });

    it('should handle empty headers object', () => {
      const result = convertHeadersToArray({});

      expect(result).toEqual([]);
    });

    it('should preserve header order', () => {
      const headers = {
        'X-Custom-1': 'value1',
        'X-Custom-2': 'value2',
        'X-Custom-3': 'value3',
      };

      const result = convertHeadersToArray(headers);

      expect(result[0].key).toBe('X-Custom-1');
      expect(result[1].key).toBe('X-Custom-2');
      expect(result[2].key).toBe('X-Custom-3');
    });
  });

  describe('convertArrayToHeaders', () => {
    it('should convert array to headers object', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ];

      const result = convertArrayToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      });
    });

    it('should filter out empty keys', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: '', value: 'should-be-filtered' },
        { key: '   ', value: 'should-also-be-filtered' },
      ];

      const result = convertArrayToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should filter out empty values', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Empty-Header', value: '' },
        { key: 'Whitespace-Header', value: '   ' },
      ];

      const result = convertArrayToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should return undefined for empty array', () => {
      const result = convertArrayToHeaders([]);

      expect(result).toBeUndefined();
    });

    it('should return undefined for array with only empty entries', () => {
      const headers = [
        { key: '', value: '' },
        { key: '   ', value: '   ' },
      ];

      const result = convertArrayToHeaders(headers);

      expect(result).toBeUndefined();
    });

    it('should trim keys and values', () => {
      const headers = [
        { key: '  Content-Type  ', value: '  application/json  ' },
        { key: ' Authorization ', value: ' Bearer token123 ' },
      ];

      const result = convertArrayToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      });
    });
  });

  describe('extractCapturedHeaders', () => {
    it('should extract headers from request log', () => {
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
          'X-Custom-Header': 'custom-value',
          'X-Rate-Limit': '100',
          Server: 'nginx',
        },
      };

      const result = extractCapturedHeaders(mockRequest);

      expect(result).toEqual([
        { key: 'X-Custom-Header', value: 'custom-value' },
        { key: 'X-Rate-Limit', value: '100' },
        { key: 'Server', value: 'nginx' },
      ]);
    });

    it('should exclude content-type header', () => {
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
          'content-type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      };

      const result = extractCapturedHeaders(mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('X-Custom-Header');
    });

    it('should exclude x-moq header', () => {
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
          'x-moq': 'true',
          'X-Custom-Header': 'custom-value',
        },
      };

      const result = extractCapturedHeaders(mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('X-Custom-Header');
    });

    it('should handle case-insensitive excluded headers', () => {
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
          'Content-Type': 'application/json',
          'X-MOQ': 'true',
          'X-Custom-Header': 'custom-value',
        },
      };

      const result = extractCapturedHeaders(mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('X-Custom-Header');
    });

    it('should return empty array for undefined request', () => {
      const result = extractCapturedHeaders(undefined);

      expect(result).toEqual([]);
    });

    it('should return empty array for null request', () => {
      const result = extractCapturedHeaders(null);

      expect(result).toEqual([]);
    });

    it('should return empty array when no responseHeaders', () => {
      const mockRequest: RequestLog = {
        id: '1',
        timestamp: Date.now(),
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{}',
        matched: true,
      };

      const result = extractCapturedHeaders(mockRequest);

      expect(result).toEqual([]);
    });
  });
});
