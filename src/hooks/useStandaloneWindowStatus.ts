import { useState, useEffect } from 'react';
import { isDevTools } from '../helpers/context';

/**
 * Hook to check if standalone window is open (only works in DevTools context)
 * Tracks the persisted service-worker window ID
 */
export const useStandaloneWindowStatus = (): boolean => {
  const [standaloneWindowOpen, setStandaloneWindowOpen] = useState(false);

  useEffect(() => {
    if (!isDevTools()) return;

    const updateStatus = (runtimeState?: { standaloneWindowId?: number | null }) => {
      setStandaloneWindowOpen(runtimeState?.standaloneWindowId != null);
    };

    browser.storage.session
      .get('runtimeState')
      .then((result) => updateStatus(result.runtimeState as { standaloneWindowId?: number | null } | undefined))
      .catch(() => updateStatus());

    const storageListener = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName === 'session' && changes.runtimeState) {
        updateStatus(changes.runtimeState.newValue as { standaloneWindowId?: number | null } | undefined);
      }
    };
    browser.storage.onChanged.addListener(storageListener);

    return () => browser.storage.onChanged.removeListener(storageListener);
  }, []);

  return standaloneWindowOpen;
};
