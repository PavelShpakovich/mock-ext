import { formatRelativeTime } from '../helpers/time';

describe('Time Helpers', () => {
  // Mock translation function for English
  const mockT = (key: string, params?: any): string => {
    const translations: Record<string, string> = {
      'time.justNow': 'just now',
      'time.minutesAgo': `${params?.count} minute${params?.count !== 1 ? 's' : ''} ago`,
      'time.hoursAgo': `${params?.count} hour${params?.count !== 1 ? 's' : ''} ago`,
      'time.daysAgo': `${params?.count} day${params?.count !== 1 ? 's' : ''} ago`,
      'time.weeksAgo': `${params?.count} week${params?.count !== 1 ? 's' : ''} ago`,
    };
    return translations[key] || key;
  };

  describe('formatRelativeTime', () => {
    it('should return "just now" for timestamps within last minute', () => {
      const now = Date.now();
      expect(formatRelativeTime(now, mockT)).toBe('just now');
      expect(formatRelativeTime(now - 30 * 1000, mockT)).toBe('just now');
      expect(formatRelativeTime(now - 59 * 1000, mockT)).toBe('just now');
    });

    it('should return minutes for timestamps within last hour', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60 * 1000, mockT)).toBe('1 minute ago');
      expect(formatRelativeTime(now - 2 * 60 * 1000, mockT)).toBe('2 minutes ago');
      expect(formatRelativeTime(now - 30 * 60 * 1000, mockT)).toBe('30 minutes ago');
      expect(formatRelativeTime(now - 59 * 60 * 1000, mockT)).toBe('59 minutes ago');
    });

    it('should return hours for timestamps within last day', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60 * 60 * 1000, mockT)).toBe('1 hour ago');
      expect(formatRelativeTime(now - 2 * 60 * 60 * 1000, mockT)).toBe('2 hours ago');
      expect(formatRelativeTime(now - 12 * 60 * 60 * 1000, mockT)).toBe('12 hours ago');
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000, mockT)).toBe('23 hours ago');
    });

    it('should return days for timestamps within last week', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 24 * 60 * 60 * 1000, mockT)).toBe('1 day ago');
      expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000, mockT)).toBe('2 days ago');
      expect(formatRelativeTime(now - 6 * 24 * 60 * 60 * 1000, mockT)).toBe('6 days ago');
    });

    it('should return weeks for older timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000, mockT)).toBe('1 week ago');
      expect(formatRelativeTime(now - 14 * 24 * 60 * 60 * 1000, mockT)).toBe('2 weeks ago');
      expect(formatRelativeTime(now - 30 * 24 * 60 * 60 * 1000, mockT)).toBe('4 weeks ago');
    });
  });
});
