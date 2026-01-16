import '@testing-library/jest-dom';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

// Mock chrome API
(globalThis as any).chrome = {
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
