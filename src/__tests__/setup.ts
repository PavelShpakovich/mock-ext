import '@testing-library/jest-dom';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

// Mock chrome API
export const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

export const resetListeners = () => {
  for (const key in listeners) delete listeners[key];
};

const createListener = (name: string) => ({
  addListener: jest.fn((callback: (...args: unknown[]) => void) => {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(callback);
  }),
  // Helper to trigger listeners in tests
  callListeners: async (...args: unknown[]) => {
    if (listeners[name]) {
      // For runtime.onMessage, we need to handle the return value (Promise or boolean)
      // and the sendResponse callback
      const results = listeners[name].map((cb) => cb(...args));
      return results.length === 1 ? results[0] : results;
    }
  },
});

(globalThis as any).chrome = {
  resetListeners, // Exposed for testing
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    session: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: createListener('runtime.onMessage'),
    onInstalled: createListener('runtime.onInstalled'),
    onSuspend: createListener('runtime.onSuspend'),
  },
  declarativeNetRequest: {
    updateEnabledRulesets: jest.fn().mockResolvedValue(undefined),
    RuleActionType: {
      REDIRECT: 'redirect',
    },
    ResourceType: {
      XMLHTTPREQUEST: 'xmlhttprequest',
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    reload: jest.fn(),
    onRemoved: createListener('tabs.onRemoved'),
    onUpdated: createListener('tabs.onUpdated'),
  },
  scripting: {
    executeScript: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: createListener('action.onClicked'),
  },
  windows: {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    onRemoved: createListener('windows.onRemoved'),
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: createListener('contextMenus.onClicked'),
  },
};

export {};
