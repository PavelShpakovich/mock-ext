import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'build',
  manifestVersion: 3,
  zip: {
    artifactTemplate: '../releases/{{name}}-{{browser}}-v{{version}}.zip',
    sourcesTemplate: '../releases/{{name}}-v{{version}}-sources.zip',
  },
  manifest: {
    name: 'Moq - Mock API Requests',
    description:
      'Mock HTTP requests with custom responses, status codes, delays, and headers. Perfect for development, testing, and debugging.',
    version: '2.14.1',
    permissions: ['storage', 'activeTab', 'tabs', 'contextMenus', 'declarativeNetRequest'],
    host_permissions: ['<all_urls>'],

    action: {
      default_icon: {
        '16': '/icons/icon16.png',
        '48': '/icons/icon48.png',
        '128': '/icons/icon128.png',
      },
    },
    icons: {
      '16': '/icons/icon16.png',
      '48': '/icons/icon48.png',
      '128': '/icons/icon128.png',
    },
    declarative_net_request: {
      rule_resources: [
        {
          id: 'cors_rules',
          enabled: false,
          path: 'cors-rules.json',
        },
      ],
    },
    browser_specific_settings: {
      gecko: {
        id: 'moq-mock-api@moq-extension.dev',
        // @ts-expect-error - Firefox requires data_collection_permissions field (not yet in WXT types)
        data_collection_permissions: {
          required: ['none'],
          cookies: false,
          fingerprinting: false,
          network: false,
        },
      },
    },
  },
  vite: () => ({
    build: {
      target: 'esnext',
    },
  }),
});
