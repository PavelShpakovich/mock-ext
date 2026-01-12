import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrCmdPressed = navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey;

        const matches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrlOrCmd === undefined || ctrlOrCmdPressed === shortcut.ctrlOrCmd) &&
          (shortcut.shift === undefined || event.shiftKey === shortcut.shift) &&
          (shortcut.alt === undefined || event.altKey === shortcut.alt);

        if (matches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Only handle first matching shortcut
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};
