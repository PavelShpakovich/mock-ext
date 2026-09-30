import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AppWorkspace from '../components/AppWorkspace';
import { Tab } from '../enums';
import type { RequestLog } from '../types';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('../components/Header', () => ({
  __esModule: true,
  default: (props: { enabled: boolean; onToggleEnabled: (enabled: boolean) => void }) => (
    <button onClick={() => props.onToggleEnabled(!props.enabled)}>header</button>
  ),
}));
jest.mock('../components/RulesTab', () => ({
  __esModule: true,
  default: () => <div data-testid='rules-tab' />,
}));
jest.mock('../components/ProxyTab', () => ({
  __esModule: true,
  default: () => <div data-testid='proxy-tab' />,
}));
jest.mock('../components/RequestsTab', () => ({
  __esModule: true,
  default: () => <div data-testid='requests-tab' />,
}));
jest.mock('../components/DisabledBanner', () => ({
  __esModule: true,
  default: ({ onEnable }: { onEnable: () => void }) => <button onClick={onEnable}>enable-banner</button>,
}));

const noop = jest.fn();
const asyncNoop = jest.fn(async () => {});

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    activeTab: Tab.Rules,
    setActiveTab: noop,
    rulesManager: {
      rules: [],
      ruleWarnings: [],
      toggleRule: noop,
      duplicateRule: noop,
      resetRuleHits: asyncNoop,
    },
    proxyRulesManager: {
      proxyRules: [],
      toggleProxyRule: noop,
      duplicateProxyRule: noop,
      resetProxyRuleHits: asyncNoop,
    },
    foldersManager: {
      folders: [],
      toggleCollapse: noop,
    },
    recording: {
      settings: { enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false },
      activeTabTitle: '',
      requestLog: [],
      handleGlobalToggle: noop,
      handleCorsToggle: noop,
      clearLog: noop,
    },
    searchTerm: '',
    setSearchTerm: noop,
    requestsSearchTerm: '',
    setRequestsSearchTerm: noop,
    editingRuleId: null,
    editingProxyRuleId: null,
    onEditRule: noop,
    onSaveRule: asyncNoop,
    onDeleteRule: asyncNoop,
    onMockRequest: noop,
    onEditProxyRule: noop,
    onSaveProxyRule: asyncNoop,
    onDeleteProxyRule: asyncNoop,
    onProxyRequest: noop,
    initialMockRequest: null as RequestLog | null,
    initialProxyRequest: null as RequestLog | null,
    onExportRules: noop,
    onExportProxyRules: noop,
    onImportRules: asyncNoop,
    onImportProxyRules: asyncNoop,
    onCreateFolder: noop,
    onEditFolder: noop,
    onDeleteFolder: noop,
    onEnableFolderRules: asyncNoop,
    onDisableFolderRules: asyncNoop,
    onCancelRuleEdit: noop,
    onCancelProxyEdit: noop,
    onRecordingToggle: asyncNoop,
    ...overrides,
  } as unknown as React.ComponentProps<typeof AppWorkspace>;
}

describe('AppWorkspace', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders navigation and the active rules view', () => {
    render(<AppWorkspace {...makeProps()} />);
    expect(screen.getByTestId('rules-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('proxy-tab')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'tabs.proxy (0)' }));
    expect(noop).toHaveBeenCalledWith(Tab.Proxy);
  });

  it('renders proxy and request views based on the active tab', () => {
    const props = makeProps();
    const { rerender } = render(<AppWorkspace {...props} activeTab={Tab.Proxy} />);
    expect(screen.getByTestId('proxy-tab')).toBeInTheDocument();
    rerender(<AppWorkspace {...props} activeTab={Tab.Requests} />);
    expect(screen.getByTestId('requests-tab')).toBeInTheDocument();
  });

  it('shows a disabled banner and forwards its enable action', () => {
    const handleGlobalToggle = jest.fn();
    render(
      <AppWorkspace
        {...makeProps({
          recording: {
            ...makeProps().recording,
            settings: { ...makeProps().recording.settings, enabled: false },
            handleGlobalToggle,
          },
        })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'enable-banner' }));
    expect(handleGlobalToggle).toHaveBeenCalledWith(true);
  });
});
