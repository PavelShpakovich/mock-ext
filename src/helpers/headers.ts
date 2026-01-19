import { RequestLog } from '../types';

export interface HeaderEntry {
  key: string;
  value: string;
}

export function convertHeadersToArray(headers?: Record<string, string>): HeaderEntry[] {
  if (!headers) return [];
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

export function convertArrayToHeaders(headers: HeaderEntry[]): Record<string, string> | undefined {
  const filtered = headers.filter((h) => h.key.trim() && h.value.trim());
  if (filtered.length === 0) return undefined;

  return filtered.reduce(
    (acc, { key, value }) => {
      acc[key.trim()] = value.trim();
      return acc;
    },
    {} as Record<string, string>
  );
}

export function extractCapturedHeaders(mockRequest?: RequestLog | null): HeaderEntry[] {
  if (!mockRequest?.responseHeaders) return [];

  const excludeHeaders = ['content-type', 'x-moq'];
  return Object.entries(mockRequest.responseHeaders)
    .filter(([key]) => !excludeHeaders.includes(key.toLowerCase()))
    .map(([key, value]) => ({ key, value }));
}
