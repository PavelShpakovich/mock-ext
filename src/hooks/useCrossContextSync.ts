import { useEffect } from 'react';
import { MessageActionType } from '../enums';

interface SyncCallbacks {
  onRequestLogUpdated: () => void;
}

/**
 * Hook to listen for cross-context sync messages
 * Handles messages from other contexts (standalone window, DevTools, popup)
 */
export const useCrossContextSync = ({ onRequestLogUpdated }: SyncCallbacks): void => {
  useEffect(() => {
    const messageListener = (message: { action: MessageActionType }) => {
      switch (message.action) {
        case MessageActionType.RequestLogUpdated:
          onRequestLogUpdated();
          break;
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [onRequestLogUpdated]);
};
