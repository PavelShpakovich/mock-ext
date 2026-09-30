import { render, screen } from '@testing-library/react';
import { SortableRuleItem } from '../components/SortableRuleItem';
import { HttpMethod, MatchType, RulesView } from '../enums';
import type { MockRule } from '../types';

jest.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable: jest.fn(() => jest.fn()),
  dropTargetForElements: jest.fn(() => jest.fn()),
}));
jest.mock('@atlaskit/pragmatic-drag-and-drop/combine', () => ({
  combine:
    (...cleanups: Array<() => void>) =>
    () =>
      cleanups.forEach((cleanup) => cleanup()),
}));
jest.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge', () => ({
  attachClosestEdge: (data: unknown) => data,
  extractClosestEdge: () => 'top',
}));
jest.mock('../helpers', () => ({ addFirefoxDragSupport: jest.fn(() => jest.fn()) }));
jest.mock('../helpers/dragPreview', () => ({ setRoundedCardDragPreview: jest.fn() }));
jest.mock('../components/ui/DropIndicator', () => ({
  CustomDropIndicator: () => <div data-testid='drop-indicator' />,
}));
jest.mock('../components/RuleItem', () => ({
  __esModule: true,
  default: ({ rule }: { rule: MockRule }) => <div>detail-{rule.id}</div>,
}));
jest.mock('../components/CompactRuleItem', () => ({
  CompactRuleItem: ({ rule }: { rule: MockRule }) => <div>compact-{rule.id}</div>,
}));
jest.mock('../components/SelectableRuleItem', () => ({
  SelectableRuleItem: ({ rule, isSelected }: { rule: MockRule; isSelected: boolean }) => (
    <div>
      select-{rule.id}-{String(isSelected)}
    </div>
  ),
}));

const rule: MockRule = {
  id: 'rule-1',
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
};

describe('SortableRuleItem', () => {
  it('renders detailed and compact variants and registers drag/drop behavior', () => {
    const { unmount, rerender } = render(
      <SortableRuleItem
        rule={rule}
        warnings={[]}
        index={0}
        folderId={undefined}
        view={RulesView.Detailed}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );
    expect(screen.getByText('detail-rule-1')).toBeInTheDocument();
    const adapter = require('@atlaskit/pragmatic-drag-and-drop/element/adapter');
    expect(adapter.draggable).toHaveBeenCalledTimes(1);
    expect(adapter.dropTargetForElements).toHaveBeenCalledTimes(1);

    rerender(
      <SortableRuleItem
        rule={rule}
        warnings={[]}
        index={0}
        folderId='folder'
        view={RulesView.Compact}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );
    expect(screen.getByText('compact-rule-1')).toBeInTheDocument();
    unmount();
  });

  it('renders selectable rules without registering drag behavior', () => {
    const adapter = require('@atlaskit/pragmatic-drag-and-drop/element/adapter');
    adapter.draggable.mockClear();
    render(
      <SortableRuleItem
        rule={rule}
        warnings={[]}
        index={1}
        folderId='folder'
        view={RulesView.Detailed}
        selectionMode
        isSelected
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
      />
    );
    expect(screen.getByText('select-rule-1-true')).toBeInTheDocument();
    expect(adapter.draggable).not.toHaveBeenCalled();
  });
});
