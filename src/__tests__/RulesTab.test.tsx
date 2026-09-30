import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RulesTab from '../components/RulesTab';
import { Storage } from '../storage';
import { HttpMethod, MatchType, RulesView } from '../enums';
import type { MockRule } from '../types';

jest.mock('../components/RuleEditor', () => ({
  __esModule: true,
  default: ({ rule, mockRequest, onCancel }: { rule: MockRule | null; mockRequest: unknown; onCancel: () => void }) => (
    <div>
      <span data-testid='editor-rule'>{rule?.id ?? 'new-rule'}</span>
      <span data-testid='editor-request'>{mockRequest ? 'has-request' : 'no-request'}</span>
      <button onClick={onCancel}>cancel-edit</button>
    </div>
  ),
}));
jest.mock('../components/RulesSearchBar', () => ({
  RulesSearchBar: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input aria-label='rule-search' value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));
jest.mock('../components/RulesToolbar', () => ({
  RulesToolbar: (props: {
    selectedCount: number;
    onToggleSelectionMode: () => void;
    onToggleSelectAll: () => void;
    onExportSelected: () => void;
    onExportAll: () => void;
    onImportClick: () => void;
    onCreateFolder: () => void;
    onCreateRule: () => void;
    onViewChange: (view: RulesView) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div>
      <span data-testid='selection-count'>{props.selectedCount}</span>
      <button onClick={props.onToggleSelectionMode}>selection-mode</button>
      <button onClick={props.onToggleSelectAll}>select-all</button>
      <button onClick={props.onExportSelected}>export-selected</button>
      <button onClick={props.onExportAll}>export-all</button>
      <button onClick={props.onImportClick}>import</button>
      <button onClick={props.onCreateFolder}>create-folder</button>
      <button onClick={props.onCreateRule}>create-rule</button>
      <button onClick={() => props.onViewChange(RulesView.Compact)}>compact-view</button>
      <input aria-label='rule-file' type='file' ref={props.fileInputRef} onChange={props.onFileChange} />
    </div>
  ),
}));
jest.mock('../components/RulesEmptyState', () => ({
  RulesEmptyState: ({ onCreateRule }: { onCreateRule: () => void }) => (
    <button onClick={onCreateRule}>empty-create-rule</button>
  ),
}));
jest.mock('../components/RulesList', () => ({
  RulesList: (props: {
    ungroupedRules: MockRule[];
    selectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
  }) => (
    <div>
      <span data-testid='visible-rules'>{props.ungroupedRules.map((rule) => rule.id).join(',')}</span>
      <span data-testid='selection-mode-state'>{String(props.selectionMode)}</span>
      {props.ungroupedRules.map((rule) => (
        <button key={rule.id} onClick={() => props.onToggleSelection(rule.id)}>
          {props.selectedIds.has(rule.id) ? 'selected' : 'unselected'} {rule.id}
        </button>
      ))}
    </div>
  ),
}));

const makeRule = (id: string, name: string, enabled = true): MockRule => ({
  id,
  name,
  enabled,
  urlPattern: `https://api.example.com/${name}`,
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
});

const noop = jest.fn();
function props(overrides: Record<string, unknown> = {}) {
  return {
    rules: [makeRule('one', 'users'), makeRule('two', 'items', false)],
    folders: [],
    ruleWarnings: new Map(),
    searchTerm: '',
    settings: {
      enabled: true,
      logRequests: false,
      showNotifications: false,
      corsAutoFix: false,
      rulesView: RulesView.Detailed,
    },
    onSearchChange: noop,
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
    onCreateFolder: noop,
    onEditFolder: noop,
    onDeleteFolder: noop,
    onToggleFolderCollapse: noop,
    onEnableFolderRules: noop,
    onDisableFolderRules: noop,
    ...overrides,
  } as unknown as React.ComponentProps<typeof RulesTab>;
}

describe('RulesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(Storage, 'getSettings')
      .mockResolvedValue({ enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false });
    jest.spyOn(Storage, 'saveSettings').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('filters rules by name, URL, and method and enters a new-rule editor', () => {
    const { rerender } = render(<RulesTab {...props()} />);
    expect(screen.getByTestId('visible-rules')).toHaveTextContent('one,two');
    fireEvent.change(screen.getByLabelText('rule-search'), { target: { value: 'items' } });
    rerender(<RulesTab {...props({ searchTerm: 'items' })} />);
    expect(screen.getByTestId('visible-rules')).toHaveTextContent('two');

    fireEvent.click(screen.getByRole('button', { name: 'create-rule' }));
    expect(noop).toHaveBeenCalledWith('new');
  });

  it('selects all filtered rules, exports selected IDs, and clears selection mode', () => {
    const onExportRules = jest.fn();
    render(<RulesTab {...props({ onExportRules })} />);
    fireEvent.click(screen.getByRole('button', { name: 'selection-mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-all' }));
    expect(screen.getByTestId('selection-count')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: 'export-selected' }));
    expect(onExportRules).toHaveBeenCalledWith(['one', 'two']);
    expect(screen.getByTestId('selection-mode-state')).toHaveTextContent('false');
  });

  it('supports toggling individual selection and exporting all rules', () => {
    const onExportRules = jest.fn();
    render(<RulesTab {...props({ onExportRules })} />);
    fireEvent.click(screen.getByRole('button', { name: 'selection-mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'unselected one' }));
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'export-all' }));
    expect(onExportRules).toHaveBeenCalledWith();
  });

  it('persists view changes and imports selected files', async () => {
    const onImportRules = jest.fn();
    render(<RulesTab {...props({ onImportRules })} />);
    fireEvent.click(screen.getByRole('button', { name: 'compact-view' }));
    await waitFor(() =>
      expect(Storage.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ rulesView: RulesView.Compact }))
    );
    const file = new File(['{}'], 'rules.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('rule-file'), { target: { files: [file] } });
    expect(onImportRules).toHaveBeenCalledWith(file);
  });

  it('renders the empty state and passes initial requests to new-rule editor', () => {
    const request = { id: 'request', url: '/items', method: 'POST', timestamp: 1, matched: false };
    const { rerender } = render(<RulesTab {...props({ rules: [] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'empty-create-rule' }));
    rerender(<RulesTab {...props({ rules: [], editingRuleId: 'new', initialRequest: request })} />);
    expect(screen.getByTestId('editor-request')).toHaveTextContent('has-request');

    rerender(<RulesTab {...props({ editingRuleId: 'missing' })} />);
    expect(screen.getByTestId('editor-rule')).toHaveTextContent('new-rule');
  });
});
