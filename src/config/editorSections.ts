/**
 * Configuration for Rule Editor collapsible sections
 * Controls which sections are expanded by default
 */

export const EDITOR_SECTIONS_CONFIG = {
  matching: {
    defaultOpen: false,
  },
  responseConfig: {
    defaultOpen: false,
  },
  responseHeaders: {
    defaultOpen: false,
  },
  responseBody: {
    defaultOpen: true,
  },
  responseHook: {
    defaultOpen: false,
  },
} as const;
