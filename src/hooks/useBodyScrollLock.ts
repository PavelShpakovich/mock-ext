import { useEffect } from 'react';

/**
 * Custom hook to lock/unlock body scroll
 * Useful for modals and overlays
 *
 * @param isLocked - Whether to lock the body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}
