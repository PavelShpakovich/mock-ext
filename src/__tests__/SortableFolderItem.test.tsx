import { act, render, screen } from '@testing-library/react';
import { SortableFolderItem } from '../components/SortableFolderItem';
import type { Folder } from '../types';
import { DropEdge } from '../enums';

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
  attachClosestEdge: (data: unknown, options: { allowedEdges: string[] }) => ({
    ...(data as object),
    closestEdge: options.allowedEdges[0],
  }),
  extractClosestEdge: (data: { closestEdge?: string }) => data.closestEdge,
}));
jest.mock('../helpers', () => ({ addFirefoxDragSupport: jest.fn(() => jest.fn()) }));
jest.mock('../helpers/dragPreview', () => ({ setRoundedCardDragPreview: jest.fn() }));
jest.mock('../components/ui/DropIndicator', () => ({
  CustomDropIndicator: ({ edge }: { edge: string }) => <div data-testid='drop-indicator'>{edge}</div>,
}));
jest.mock('../components/FolderItem', () => ({
  __esModule: true,
  default: (props: { folder: Folder; isDragging: boolean; isDropTarget: boolean }) => (
    <div>
      {props.folder.name}-{String(props.isDragging)}-{String(props.isDropTarget)}
    </div>
  ),
}));
jest.mock('../components/CompactFolderItem', () => ({
  __esModule: true,
  default: (props: { folder: Folder }) => <div>compact-{props.folder.name}</div>,
}));

const folder: Folder = { id: 'folder-1', name: 'Folder one', collapsed: false, created: 1 };
const props = (isCompact = false) => ({
  folder,
  index: 0,
  parentFolderId: undefined,
  isCompact,
  ruleCount: 2,
  enabledCount: 1,
  onToggleCollapse: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onEnableAll: jest.fn(),
  onDisableAll: jest.fn(),
});

describe('SortableFolderItem', () => {
  it('renders standard and compact variants and registers drag adapters', () => {
    const adapter = require('@atlaskit/pragmatic-drag-and-drop/element/adapter');
    const { rerender, unmount } = render(<SortableFolderItem {...props()} />);
    expect(screen.getByText('Folder one-false-false')).toBeInTheDocument();
    expect(adapter.draggable).toHaveBeenCalledTimes(1);
    expect(adapter.dropTargetForElements).toHaveBeenCalledTimes(1);
    rerender(<SortableFolderItem {...props(true)} />);
    expect(screen.getByText('compact-Folder one')).toBeInTheDocument();
    unmount();
  });

  it('accepts rule drops into folders and exposes edge indicators for folder reordering', () => {
    const adapter = require('@atlaskit/pragmatic-drag-and-drop/element/adapter');
    render(<SortableFolderItem {...props()} />);
    const dropConfig = adapter.dropTargetForElements.mock.calls.at(-1)[0];
    const target = document.querySelector('[style*="border-radius"]') as HTMLElement;
    target.getBoundingClientRect = () => ({
      top: 0,
      height: 100,
      bottom: 100,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const topData = dropConfig.getData({ input: { clientY: 10 } });
    expect(topData.closestEdge).toBe(DropEdge.Top);
    const middleData = dropConfig.getData({ input: { clientY: 50 } });
    expect(middleData.acceptsDrop).toBe(true);

    act(() => dropConfig.onDragEnter({ self: { data: middleData }, source: { data: { itemType: 'rule' } } }));
    expect(screen.getByText('Folder one-false-true')).toBeInTheDocument();
    act(() => dropConfig.onDragLeave());
    expect(screen.getByText('Folder one-false-false')).toBeInTheDocument();
  });
});
