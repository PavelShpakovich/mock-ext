import '@testing-library/jest-dom';

// Mock chrome API
(globalThis as any).chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  declarativeNetRequest: {
    RuleActionType: {
      REDIRECT: 'redirect',
    },
    ResourceType: {
      XMLHTTPREQUEST: 'xmlhttprequest',
    },
  },
};

export {};
