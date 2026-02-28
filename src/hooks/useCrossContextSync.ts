import { useEffect } from 'react';
import { MessageActionType } from '../enums';

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
    const messageListener = (message: { action: MessageActionType }) => {
      switch (message.action) {
        case MessageActionType.RulesUpdated:
          onRulesUpdated();
          break;
        case MessageActionType.SettingsUpdated:
          onSettingsUpdated();
          break;
        case MessageActionType.FoldersUpdated:
          onFoldersUpdated();
          break;
        case MessageActionType.RequestLogUpdated:
          onRequestLogUpdated();
          break;
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [onRulesUpdated, onSettingsUpdated, onFoldersUpdated, onRequestLogUpdated]);
};
