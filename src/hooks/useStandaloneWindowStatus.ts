import { useState, useEffect } from 'react';
import { MessageActionType } from '../enums';
import { isDevTools } from '../helpers/context';

/**
 * Hook to check if standalone window is open (only works in DevTools context)
 * Polls every second to keep status updated
 */
export const useStandaloneWindowStatus = (): boolean => {
  const [standaloneWindowOpen, setStandaloneWindowOpen] = useState(false);

  useEffect(() => {
    if (!isDevTools()) return;

    const checkWindowStatus = () => {
      browser.runtime.sendMessage({ action: MessageActionType.GetStandaloneWindowStatus }, (response) => {
        if (browser.runtime.lastError) {
          return; // Ignore errors
        }
        setStandaloneWindowOpen(Boolean(response?.data?.isOpen));
      });
    };

    // Initial check
    checkWindowStatus();

    // Poll every second
    const interval = setInterval(checkWindowStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return standaloneWindowOpen;
};
