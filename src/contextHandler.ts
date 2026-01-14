/**
 * Wraps chrome API calls to gracefully handle context invalidation errors
 * This can happen when the service worker is terminated or extension is reloaded
 */

export async function withContextCheck<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
  // Check if extension context is valid before attempting operation
  if (!chrome.runtime?.id) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error('Extension context invalidated');
  }

  try {
    return await fn();
  } catch (error) {
    const errorMessage = String(error);

    // Check if this is a context invalidation error
    if (
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('The message port closed before a response was received')
    ) {
      // Return fallback if provided, otherwise silently fail
      if (fallback !== undefined) {
        return fallback;
      }
    }

    throw error;
  }
}
