import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProxyTab from '../components/ProxyTab';
import { MatchType, HttpMethod } from '../enums';
import type { ProxyRule } from '../types';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('../components/ProxyEditor', () => ({
  __esModule: true,
  default: ({
    rule,
    mockRequest,
    onCancel,
  }: {
    rule: ProxyRule | null;
    mockRequest: unknown;
    onCancel: () => void;
  }) => (
    <div>
      <span data-testid='proxy-editor-rule'>{rule?.id ?? 'new-proxy'}</span>
      <span>{mockRequest ? 'has-request' : 'no-request'}</span>
      <button onClick={onCancel}>cancel-proxy-edit</button>
    </div>
  ),
}));
jest.mock('../components/ProxyRuleItem', () => ({
  __esModule: true,
  default: ({
    rule,
    onEdit,
    onDelete,
    onToggle,
    onDuplicate,
    onResetHits,
  }: {
    rule: ProxyRule;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    onDuplicate: () => void;
    onResetHits: () => void;
  }) => (
    <div>
      <span>detail {rule.id}</span>
      <button onClick={onEdit}>edit {rule.id}</button>
      <button onClick={onDelete}>delete {rule.id}</button>
      <button onClick={onToggle}>toggle {rule.id}</button>
      <button onClick={onDuplicate}>duplicate {rule.id}</button>
      <button onClick={onResetHits}>reset {rule.id}</button>
    </div>
  ),
}));
jest.mock('../components/CompactProxyRuleItem', () => ({
  CompactProxyRuleItem: ({ rule, onEdit }: { rule: ProxyRule; onEdit: () => void }) => (
    <button onClick={onEdit}>compact {rule.id}</button>
  ),
}));

const proxyRule: ProxyRule = {
  id: 'proxy-one',
  name: 'Users proxy',
  enabled: true,
  urlPattern: 'https://api.example.com/users/*',
  matchType: MatchType.Wildcard,
  method: HttpMethod.GET,
  proxyTarget: 'https://upstream.example.net/v1',
  delay: 0,
  created: 1,
  modified: 1,
};
const noop = jest.fn();
function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    proxyRules: [proxyRule],
    mockRules: [],
    editingRuleId: null,
    onEditRule: noop,
    onSaveRule: noop,
    onDeleteRule: noop,
    onToggleRule: noop,
    onDuplicateRule: noop,
    onResetRuleHits: noop,
    onCancelEdit: noop,
    onExportRules: noop,
    onImportRules: noop,
    ...overrides,
  } as unknown as React.ComponentProps<typeof ProxyTab>;
}

describe('ProxyTab', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters proxy rules by name, pattern, target, or method', () => {
    render(<ProxyTab {...makeProps()} />);
    fireEvent.change(screen.getByPlaceholderText('proxy.search'), { target: { value: 'upstream' } });
    expect(screen.getByText('detail proxy-one')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('proxy.search'), { target: { value: 'PATCH' } });
    expect(screen.getByText('proxy.empty')).toBeInTheDocument();
  });

  it('switches between detailed and compact rows and forwards row actions', () => {
    render(<ProxyTab {...makeProps()} />);
    fireEvent.click(screen.getByTitle('rules.viewCompact'));
    fireEvent.click(screen.getByRole('button', { name: 'compact proxy-one' }));
    expect(noop).toHaveBeenCalledWith('proxy-one');

    fireEvent.click(screen.getByTitle('rules.viewDetailed'));
    fireEvent.click(screen.getByRole('button', { name: 'toggle proxy-one' }));
    fireEvent.click(screen.getByRole('button', { name: 'duplicate proxy-one' }));
    fireEvent.click(screen.getByRole('button', { name: 'reset proxy-one' }));
    expect(noop).toHaveBeenCalledTimes(4);
  });

  it('imports and exports rules and handles empty state actions', () => {
    const onImportRules = jest.fn();
    const onExportRules = jest.fn();
    const { rerender } = render(<ProxyTab {...makeProps({ onImportRules, onExportRules })} />);
    fireEvent.click(screen.getByTitle('rules.exportAll'));
    expect(onExportRules).toHaveBeenCalledTimes(1);
    const file = new File(['{}'], 'proxy.json', { type: 'application/json' });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
    expect(onImportRules).toHaveBeenCalledWith(file);

    rerender(<ProxyTab {...makeProps({ proxyRules: [] })} />);
    fireEvent.click(screen.getByTitle('proxy.createNew'));
    expect(noop).toHaveBeenCalledWith('new');
  });

  it('routes create/edit actions to the proxy editor', () => {
    const { rerender } = render(<ProxyTab {...makeProps({ editingRuleId: 'proxy-one' })} />);
    expect(screen.getByTestId('proxy-editor-rule')).toHaveTextContent('proxy-one');
    rerender(
      <ProxyTab
        {...makeProps({
          editingRuleId: 'new',
          initialRequest: { id: 'r', url: '/u', method: 'POST', timestamp: 1, matched: false },
        })}
      />
    );
    expect(screen.getByText('has-request')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'cancel-proxy-edit' }));
    expect(noop).toHaveBeenCalled();
  });
});
