import { render, screen } from '@testing-library/react';
import { NestedFolderList } from '../components/NestedFolderList';
import { HttpMethod, MatchType, RulesView } from '../enums';
import type { FolderTreeNode, MockRule, Folder } from '../types';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  dropTargetForElements: jest.fn(() => jest.fn()),
}));
jest.mock('../components/SortableFolderItem', () => ({
  SortableFolderItem: ({ folder, isCompact }: { folder: Folder; isCompact: boolean }) => (
    <div data-testid={`folder-${folder.id}`} data-compact={isCompact}>
      {folder.name}
    </div>
  ),
}));
jest.mock('../components/SortableRuleItem', () => ({
  SortableRuleItem: ({ rule, folderId, view }: { rule: MockRule; folderId?: string; view: RulesView }) => (
    <div data-testid={`rule-${rule.id}`} data-folder={folderId} data-view={view}>
      {rule.name}
    </div>
  ),
}));

const makeRule = (id: string): MockRule => ({
  id,
  name: `Rule ${id}`,
  enabled: true,
  urlPattern: `https://api.example.com/${id}`,
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 0,
  created: 1,
  modified: 1,
});
const makeFolder = (id: string, collapsed = false): Folder => ({ id, name: `Folder ${id}`, collapsed, created: 1 });
const noop = jest.fn();
function renderList(nodes: FolderTreeNode[], ungroupedRules: MockRule[] = [], overrides: Record<string, unknown> = {}) {
  return render(
    <NestedFolderList
      nodes={nodes}
      ungroupedRules={ungroupedRules}
      ruleWarnings={new Map()}
      ruleCounts={new Map()}
      enabledCounts={new Map()}
      searchTerm=''
      selectionMode={false}
      selectedIds={new Set()}
      view={RulesView.Detailed}
      onToggleSelection={noop}
      onToggleFolderCollapse={noop}
      onEditFolder={noop}
      onDeleteFolder={noop}
      onEnableFolderRules={noop}
      onDisableFolderRules={noop}
      onEditRule={noop}
      onDeleteRule={noop}
      onToggleRule={noop}
      onDuplicateRule={noop}
      onResetRuleHits={noop}
      {...overrides}
    />
  );
}

describe('NestedFolderList', () => {
  it('omits an empty nested level while filtering', () => {
    const { container } = renderList([], [], { parentFolderId: 'parent', searchTerm: 'missing' });
    expect(container.firstChild).toBeNull();
  });

  it('renders folders recursively with grouped and root ungrouped rules', () => {
    const childRule = makeRule('child');
    const rootRule = makeRule('root');
    const childFolder = makeFolder('child-folder');
    const rootFolder = makeFolder('root-folder');
    const tree: FolderTreeNode[] = [
      { folder: rootFolder, childFolders: [{ folder: childFolder, childFolders: [], rules: [childRule] }], rules: [] },
    ];
    renderList(tree, [rootRule]);

    expect(screen.getByTestId('folder-root-folder')).toBeInTheDocument();
    expect(screen.getByTestId('folder-child-folder')).toBeInTheDocument();
    expect(screen.getByTestId('rule-child')).toHaveAttribute('data-folder', 'child-folder');
    expect(screen.getByTestId('rule-root')).not.toHaveAttribute('data-folder');
    expect(screen.getByText('folders.ungrouped')).toBeInTheDocument();
  });

  it('does not render descendants of collapsed folders and passes compact mode', () => {
    const collapsed = makeFolder('collapsed', true);
    const compact = makeFolder('compact');
    const tree: FolderTreeNode[] = [
      { folder: collapsed, childFolders: [], rules: [makeRule('hidden')] },
      { folder: compact, childFolders: [], rules: [makeRule('visible')] },
    ];
    renderList(tree, [], { view: RulesView.Compact });

    expect(screen.queryByTestId('rule-hidden')).not.toBeInTheDocument();
    expect(screen.getByTestId('rule-visible')).toHaveAttribute('data-view', RulesView.Compact);
    expect(screen.getByTestId('folder-compact')).toHaveAttribute('data-compact', 'true');
  });
});
