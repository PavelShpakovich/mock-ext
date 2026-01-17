import { useEffect } from 'react';

interface SyncCallbacks {
  onRulesUpdated: () => void;
  onSettingsUpdated: () => void;
  onFoldersUpdated: () => void;
  onRequestLogUpdated: () => void;
}

/**
 * Hook to listen for cross-context sync messages
 * Handles messages from other contexts (standalone window, DevTools, popup)
 */
export const useCrossContextSync = ({
  onRulesUpdated,
  onSettingsUpdated,
  onFoldersUpdated,
  onRequestLogUpdated,
}: SyncCallbacks): void => {
  useEffect(() => {
    const messageListener = (message: any) => {
      switch (message.action) {
        case 'rulesUpdated':
          onRulesUpdated();
          break;
        case 'settingsUpdated':
          onSettingsUpdated();
          break;
        case 'foldersUpdated':
          onFoldersUpdated();
          break;
        case 'requestLogUpdated':
          onRequestLogUpdated();
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [onRulesUpdated, onSettingsUpdated, onFoldersUpdated, onRequestLogUpdated]);
};
