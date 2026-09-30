import type { ProxyRule } from '../types';

export function normalizeRequestUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export function buildProxyUrl(
  originalUrl: string,
  rule: Pick<ProxyRule, 'proxyTarget' | 'pathRewriteFrom' | 'pathRewriteTo'>
): string {
  try {
    const original = new URL(originalUrl);
    const target = rule.proxyTarget.replace(/\/+$/, '');
    let pathname = original.pathname;
    if (rule.pathRewriteFrom) pathname = pathname.replace(rule.pathRewriteFrom, rule.pathRewriteTo || '');
    return target + pathname + original.search;
  } catch {
    const path = originalUrl.replace(/^https?:\/\/[^/]+/, '');
    const rewrittenPath = rule.pathRewriteFrom ? path.replace(rule.pathRewriteFrom, rule.pathRewriteTo || '') : path;
    return rule.proxyTarget.replace(/\/+$/, '') + rewrittenPath;
  }
}

export function responseBodyForStatus(status: number, body: string): string | null {
  return status === 204 || status === 205 || status === 304 ? null : body;
}
