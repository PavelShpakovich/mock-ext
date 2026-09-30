export const MAX_CAPTURED_RESPONSE_BYTES = 1024 * 1024;

function captureHeaders(headers: Headers): Record<string, string> {
  const captured: Record<string, string> = {};
  headers.forEach((value, key) => {
    captured[key] = value;
  });
  return captured;
}

function notifyResponseCaptured(
  url: string,
  method: string,
  statusCode: number,
  contentType: string,
  body: unknown,
  headers: Record<string, string>
): void {
  const safeBody = typeof body === 'string' ? body : String(body || '');
  window.postMessage(
    {
      type: 'MOQ_RESPONSE_CAPTURED',
      url,
      method,
      statusCode,
      contentType: contentType ? contentType.split(';')[0].trim() : '',
      responseBody: safeBody,
      responseHeaders: headers,
    },
    '*'
  );
}

export async function captureResponse(response: Response, url: string, method: string): Promise<void> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('text/event-stream')) return;

    const headers = captureHeaders(response.headers);
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_CAPTURED_RESPONSE_BYTES) return;

    if (!contentType.includes('json') && !contentType.includes('text')) {
      notifyResponseCaptured(url, method, response.status, contentType, '[Binary Data]', headers);
      return;
    }

    const reader = response.clone().body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let body = '';
    let totalBytes = 0;
    let result = await reader.read();
    while (!result.done) {
      totalBytes += result.value.byteLength;
      if (totalBytes > MAX_CAPTURED_RESPONSE_BYTES) {
        await reader.cancel();
        return;
      }
      body += decoder.decode(result.value, { stream: true });
      result = await reader.read();
    }

    body += decoder.decode();
    notifyResponseCaptured(url, method, response.status, contentType, body, headers);
  } catch {
    // Body capture must not interfere with the page request.
  }
}

export function captureXHRResponse(xhr: XMLHttpRequest, url: string, method: string): void {
  try {
    const contentType = xhr.getResponseHeader('content-type') || '';
    if (contentType.toLowerCase().includes('text/event-stream')) return;
    const contentLength = Number(xhr.getResponseHeader('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_CAPTURED_RESPONSE_BYTES) return;

    const headers: Record<string, string> = {};
    const headersString = xhr.getAllResponseHeaders();
    if (headersString) {
      headersString.split('\r\n').forEach((line) => {
        const [key, ...value] = line.split(': ');
        if (key) headers[key.toLowerCase()] = value.join(': ');
      });
    }

    let responseBody = '[Binary Data]';
    if (contentType.includes('json') || contentType.includes('text')) {
      if (xhr.responseType === '' || xhr.responseType === 'text') {
        responseBody = xhr.responseText;
        if (new Blob([responseBody]).size > MAX_CAPTURED_RESPONSE_BYTES) return;
      } else {
        responseBody = `[Data: ${xhr.responseType}]`;
      }
    }

    notifyResponseCaptured(url, method, xhr.status, contentType, responseBody, headers);
  } catch {
    // Response capture is best effort.
  }
}
