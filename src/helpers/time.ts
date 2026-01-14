/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number, t: (key: string, params?: any) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return t('time.justNow');
  } else if (minutes < 60) {
    return t('time.minutesAgo', { count: minutes });
  } else if (hours < 24) {
    return t('time.hoursAgo', { count: hours });
  } else if (days < 7) {
    return t('time.daysAgo', { count: days });
  } else {
    const weeks = Math.floor(days / 7);
    return t('time.weeksAgo', { count: weeks });
  }
}
