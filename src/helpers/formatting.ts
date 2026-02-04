/**
 * Formats a timestamp to a localized date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Formats a timestamp to a time string (HH:MM:SS)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Normalizes content-type by removing charset and other parameters
 * @param contentType - Content-Type header value
 * @returns Normalized content-type
 */
export function normalizeContentType(contentType: string | undefined): string {
  if (!contentType) return 'application/json';

  // Remove charset and other params (e.g., "application/json; charset=utf-8" -> "application/json")
  if (contentType.includes(';')) {
    return contentType.split(';')[0].trim();
  }

  return contentType;
}

/**
 * Checks if content type is text-based (not binary)
 * @param contentType - Content-Type header value
 * @returns true if text-based, false if binary
 */
export function isTextBasedContentType(contentType: string | undefined): boolean {
  if (!contentType) return true; // Default to text

  const normalized = normalizeContentType(contentType).toLowerCase();

  return (
    normalized.includes('json') ||
    normalized.includes('text') ||
    normalized.includes('csv') ||
    normalized.includes('form-urlencoded')
  );
}

/**
 * Detects the content type from response body
 * Simplified to only distinguish between JSON and plain text
 * @param serverContentType - Content-Type header from server response
 * @param responseBody - Response body text
 * @returns Detected content-type (application/json or text/plain)
 */
export function detectContentType(serverContentType: string | undefined, responseBody: string | undefined): string {
  const normalized = normalizeContentType(serverContentType);

  // Try to detect from response body
  if (responseBody?.trim()) {
    const body = responseBody.trim();

    // JSON detection (including Google's )]}' XSSI protection prefix)
    if (body.startsWith('{') || body.startsWith('[') || body.startsWith(")]}'\n")) {
      return 'application/json';
    }
  }

  // Default logic: if it looks like JSON, return JSON, otherwise plain text
  if (normalized.includes('json')) {
    return 'application/json';
  }

  return 'text/plain';
}
