import { fireEvent, render, screen } from '@testing-library/react';
import { CompactRuleItem } from '../components/CompactRuleItem';
import FolderItem from '../components/FolderItem';
import ProxyRuleItem from '../components/ProxyRuleItem';
import { HttpMethod, MatchType, ValidationSeverity, ValidationWarningType } from '../enums';
import type { MockRule, ProxyRule, Folder } from '../types';

jest.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${params.name ?? params.delay}` : key,
  }),
}));
const mockRule: MockRule = {
  id: 'r',
  name: 'Rule',
  enabled: true,
  urlPattern: '/api',
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
  matchCount: 3,
};
const proxyRule: ProxyRule = {
  id: 'p',
  name: 'Proxy',
  enabled: true,
  urlPattern: '/api/*',
  matchType: MatchType.Wildcard,
  method: HttpMethod.POST,
  proxyTarget: 'https://upstream.test',
  pathRewriteFrom: '/api',
  pathRewriteTo: '/v2',
  delay: 50,
  created: 1,
  modified: 1,
  matchCount: 2,
};
const folder: Folder = { id: 'f', name: 'Folder', collapsed: false, created: 1 };

describe('compact and proxy rule rows', () => {
  it('renders compact selection/warning states and forwards selection/reset actions', () => {
    const onToggleSelection = jest.fn();
    const onResetHits = jest.fn();
    const error = {
      type: ValidationWarningType.InvalidJson,
      severity: ValidationSeverity.Error,
      messageKey: 'bad-json',
    };
    const warning = { type: ValidationWarningType.Unused, severity: ValidationSeverity.Warning, messageKey: 'unused' };
    const { rerender } = render(
      <CompactRuleItem
        rule={mockRule}
        warnings={[error, warning]}
        selectionMode
        isSelected={false}
        onToggleSelection={onToggleSelection}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
        onResetHits={onResetHits}
      />
    );
    fireEvent.click(screen.getByTitle('rules.selectAll'));
    fireEvent.click(screen.getByTitle('rules.resetHits'));
    expect(onToggleSelection).toHaveBeenCalledWith('r');
    expect(onResetHits).toHaveBeenCalledTimes(1);

    rerender(
      <CompactRuleItem
        rule={mockRule}
        warnings={[warning]}
        selectionMode={false}
        isSelected={false}
        onToggleSelection={onToggleSelection}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );
    expect(screen.getByText('Rule')).toBeInTheDocument();
    expect(screen.getByTitle('rules.duplicate')).toBeInTheDocument();
  });

  it('renders proxy rewrite/conflicts and forwards row actions', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggle = jest.fn();
    const onDuplicate = jest.fn();
    const onResetHits = jest.fn();
    render(
      <ProxyRuleItem
        rule={proxyRule}
        conflictingMockNames={['Mock A']}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onDuplicate={onDuplicate}
        onResetHits={onResetHits}
      />
    );
    expect(screen.getByText(/https:\/\/upstream\.test\s+\(\/api → \/v2\)/)).toBeInTheDocument();
    expect(screen.getByText('proxy.conflictWarning:Mock A')).toBeInTheDocument();
    expect(screen.getByText('rules.delayMs:50')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('common.edit'));
    fireEvent.click(screen.getByTitle('common.delete'));
    fireEvent.click(screen.getByTitle('rules.duplicate'));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByTitle('rules.resetHits'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onResetHits).toHaveBeenCalledTimes(1);
  });
});

describe('FolderItem', () => {
  it('toggles collapse, exposes edit/delete and selects enable-all based on counts', () => {
    const onToggleCollapse = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onEnableAll = jest.fn();
    const onDisableAll = jest.fn();
    const { rerender } = render(
      <FolderItem
        folder={folder}
        ruleCount={2}
        enabledCount={1}
        onToggleCollapse={onToggleCollapse}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnableAll={onEnableAll}
        onDisableAll={onDisableAll}
      />
    );
    fireEvent.mouseEnter(screen.getByText('Folder'));
    fireEvent.click(screen.getByTitle('folders.enableAll'));
    fireEvent.click(screen.getByTitle('folders.rename'));
    fireEvent.click(screen.getByTitle('folders.delete'));
    expect(onToggleCollapse).not.toHaveBeenCalled();
    expect(onEnableAll).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);

    rerender(
      <FolderItem
        folder={{ ...folder, collapsed: true }}
        ruleCount={2}
        enabledCount={2}
        onToggleCollapse={onToggleCollapse}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnableAll={onEnableAll}
        onDisableAll={onDisableAll}
      />
    );
    fireEvent.click(screen.getByText('Folder'));
    fireEvent.click(screen.getByTitle('folders.disableAll'));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    expect(onDisableAll).toHaveBeenCalledTimes(1);
  });

  it('hides bulk controls when a folder has no rules and stops drag-handle bubbling', () => {
    const onToggleCollapse = jest.fn();
    render(
      <FolderItem
        folder={folder}
        ruleCount={0}
        enabledCount={0}
        onToggleCollapse={onToggleCollapse}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onEnableAll={jest.fn()}
        onDisableAll={jest.fn()}
      />
    );
    expect(screen.queryByTitle('folders.enableAll')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Folder').closest('.cursor-pointer')!.querySelector('.cursor-grab')!);
    expect(onToggleCollapse).not.toHaveBeenCalled();
  });
});
