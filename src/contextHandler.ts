/**
 * Wraps chrome API calls to gracefully handle context invalidation errors
 * This can happen when the service worker is terminated or extension is reloaded
 */

export async function withContextCheck<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = String(error);

    // Check if this is a context invalidation error
    if (
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('The message port closed before a response was received')
    ) {
      console.warn('[MockAPI] Extension context invalidated. Attempting to reload...');

      // Try to reload the extension by sending a message to trigger re-initialization
      try {
        await chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {
          // This will fail, which is expected
        });
      } catch {
        // Silent fail - context is truly invalid
      }

      // Return fallback if provided
      if (fallback !== undefined) {
        return fallback;
      }
    }

    throw error;
  }
}
