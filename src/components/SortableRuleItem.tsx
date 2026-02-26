import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { CustomDropIndicator } from './ui/DropIndicator';
import { MockRule, DragDropData } from '../types';
import { DragDropItemType, RulesView, DropEdge } from '../enums';
import { ValidationWarning } from '../helpers';
import { setRoundedCardDragPreview } from '../helpers/dragPreview';
import RuleItem from './RuleItem';
import { CompactRuleItem } from './CompactRuleItem';
import { SelectableRuleItem } from './SelectableRuleItem';

interface SortableRuleItemProps {
  rule: MockRule;
  warnings: ValidationWarning[];
  index: number;
  folderId: string | undefined;
  view: RulesView;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

export const SortableRuleItem: React.FC<SortableRuleItemProps> = ({
  rule,
  warnings,
  index,
  folderId,
  view,
  selectionMode,
  isSelected,
  onToggleSelection,
  ...restProps
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<DropEdge | null>(null);

  const dragData: DragDropData = React.useMemo(
    () => ({
      itemType: DragDropItemType.Rule,
      itemId: rule.id,
      sourceParentId: folderId,
      sourceIndex: index,
      isSortable: true,
    }),
    [rule.id, folderId, index]
  );

  useEffect(() => {
    const el = interactiveRef.current;
    if (!el || selectionMode) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => dragData as unknown as Record<string, unknown>,
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          setRoundedCardDragPreview({
            element: el,
            nativeSetDragImage,
            input: location.initial.input,
          });
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input }) => {
          return attachClosestEdge(dragData as unknown as Record<string, unknown>, {
            element: el,
            input,
            allowedEdges: [DropEdge.Top, DropEdge.Bottom],
          });
        },
        onDragEnter: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data) as DropEdge | null);
        },
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data) as DropEdge | null);
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [dragData, selectionMode]);

  // Determine which component to render based on view and selection mode
  const isCompact = view === RulesView.Compact;
  let Component: React.ElementType;
  if (selectionMode) {
    Component = SelectableRuleItem;
  } else if (isCompact) {
    Component = CompactRuleItem;
  } else {
    Component = RuleItem;
  }

  return (
    <div style={{ position: 'relative', opacity: isDragging ? 0.4 : 1 }}>
      <div
        ref={interactiveRef}
        className='bg-white dark:bg-gray-900'
        style={{ borderRadius: '0.75rem', overflow: 'hidden' }}
      >
        <Component
          rule={rule}
          warnings={warnings}
          isDragging={isDragging}
          isDropTarget={false}
          selectionMode={selectionMode ?? false}
          isSelected={isSelected ?? false}
          onToggleSelection={onToggleSelection ?? (() => {})}
          {...restProps}
        />
      </div>
      {closestEdge && <CustomDropIndicator edge={closestEdge} isCompact={isCompact} />}
    </div>
  );
};
