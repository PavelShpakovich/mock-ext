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
 * Detects the content type from response body if server-provided type is missing or incorrect
 * @param serverContentType - Content-Type header from server response
 * @param responseBody - Response body text
 * @returns Detected or normalized content-type
 */
export function detectContentType(serverContentType: string | undefined, responseBody: string | undefined): string {
  let detectedContentType = serverContentType || 'application/json';

  // Normalize content-type (remove charset and other params)
  if (detectedContentType.includes(';')) {
    detectedContentType = detectedContentType.split(';')[0].trim();
  }

  // Always try to infer from response body for better accuracy
  if (responseBody && responseBody.trim()) {
    const body = responseBody.trim();

    // Avoid detection on truncated responses
    const isTruncated = responseBody.includes('...[truncated]');

    if (!isTruncated) {
      // Try JSON detection (most common API format)
      // Handle Google's )]}' prefix and chunked format (e.g., ")]}'144\n[...]")
      if (body.startsWith('{') || body.startsWith('[') || body.startsWith(")]}'") || /^\)\]\}'\s*\d+\n/.test(body)) {
        return 'application/json';
      }
      // HTML detection
      if (
        body.toLowerCase().startsWith('<!doctype html') ||
        body.toLowerCase().startsWith('<html') ||
        (body.startsWith('<') && (body.includes('</html>') || body.includes('<head>') || body.includes('<body>')))
      ) {
        return 'text/html';
      }
      // XML detection (but not HTML)
      if (body.startsWith('<?xml') || (body.startsWith('<') && body.includes('</') && !body.includes('<html'))) {
        return 'application/xml';
      }
      // JavaScript detection
      if (
        body.startsWith('(function') ||
        body.startsWith('function ') ||
        body.startsWith('var ') ||
        body.startsWith('const ') ||
        body.startsWith('let ')
      ) {
        return 'application/javascript';
      }
      // Default to plain text if unknown
      if (detectedContentType === 'application/octet-stream' || detectedContentType === '') {
        return 'text/plain';
      }
    }
  }

  return detectedContentType;
}
