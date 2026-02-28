import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { CustomDropIndicator } from './ui/DropIndicator';
import { Folder, DragDropData } from '../types';
import { DragDropItemType, DropEdge } from '../enums';
import { addFirefoxDragSupport } from '../helpers';
import { setRoundedCardDragPreview } from '../helpers/dragPreview';
import FolderItem from './FolderItem';
import CompactFolderItem from './CompactFolderItem';

interface SortableFolderItemProps {
  folder: Folder;
  index: number;
  parentFolderId: string | undefined;
  isCompact: boolean;
  ruleCount: number;
  enabledCount: number;
  onToggleCollapse: (folderId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
}

export const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
  folder,
  index,
  parentFolderId,
  isCompact,
  ruleCount,
  enabledCount,
  onToggleCollapse,
  onEdit,
  onDelete,
  onEnableAll,
  onDisableAll,
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [closestEdge, setClosestEdge] = useState<DropEdge | null>(null);

  // Sortable data for reordering folders in the list
  const sortableData: DragDropData = React.useMemo(
    () => ({
      itemType: DragDropItemType.Folder,
      itemId: folder.id,
      sourceParentId: parentFolderId,
      sourceIndex: index,
      isSortable: true,
    }),
    [folder.id, parentFolderId, index]
  );

  // Droppable data for accepting items INTO the folder
  const droppableData: DragDropData = React.useMemo(
    () => ({
      itemType: DragDropItemType.Folder,
      itemId: folder.id,
      sourceParentId: parentFolderId,
      sourceIndex: index,
      acceptsDrop: true,
      isSortable: false,
    }),
    [folder.id, parentFolderId, index]
  );

  useEffect(() => {
    const el = interactiveRef.current;
    if (!el) return;

    // Add Firefox-specific drag support
    const firefoxCleanup = addFirefoxDragSupport(el);

    const pragmaticCleanup = combine(
      draggable({
        element: el,
        getInitialData: () => sortableData as unknown as Record<string, unknown>,
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
          const rect = el.getBoundingClientRect();
          const y = input.clientY - rect.top;
          const height = rect.height;

          // Top 25% -> reorder above
          // Bottom 25% -> reorder below
          // Middle 50% -> drop into

          if (y < height * 0.25) {
            return attachClosestEdge(sortableData as unknown as Record<string, unknown>, {
              element: el,
              input,
              allowedEdges: [DropEdge.Top],
            });
          } else if (y > height * 0.75) {
            return attachClosestEdge(sortableData as unknown as Record<string, unknown>, {
              element: el,
              input,
              allowedEdges: [DropEdge.Bottom],
            });
          }

          return droppableData as unknown as Record<string, unknown>;
        },
        onDragEnter: ({ self, source }) => {
          const dragData = source.data as unknown as DragDropData;
          if (dragData.itemType === DragDropItemType.Rule) {
            setClosestEdge(null);
            setIsDropTarget(true);
            return;
          }
          const edge = extractClosestEdge(self.data) as DropEdge | null;
          setClosestEdge(edge);
          setIsDropTarget(!edge); // If no edge, we are dropping INTO
        },
        onDrag: ({ self, source }) => {
          const dragData = source.data as unknown as DragDropData;
          if (dragData.itemType === DragDropItemType.Rule) {
            setClosestEdge(null);
            setIsDropTarget(true);
            return;
          }
          const edge = extractClosestEdge(self.data) as DropEdge | null;
          setClosestEdge(edge);
          setIsDropTarget(!edge);
        },
        onDragLeave: () => {
          setClosestEdge(null);
          setIsDropTarget(false);
        },
        onDrop: () => {
          setClosestEdge(null);
          setIsDropTarget(false);
        },
      })
    );

    return () => {
      firefoxCleanup();
      pragmaticCleanup();
    };
  }, [sortableData, droppableData]);

  const Component = isCompact ? CompactFolderItem : FolderItem;

  return (
    <div style={{ position: 'relative', opacity: isDragging ? 0.4 : 1 }}>
      <div ref={interactiveRef} className='bg-white dark:bg-gray-900' style={{ borderRadius: '0.75rem' }}>
        <Component
          folder={folder}
          ruleCount={ruleCount}
          enabledCount={enabledCount}
          onToggleCollapse={() => onToggleCollapse(folder.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onEnableAll={onEnableAll}
          onDisableAll={onDisableAll}
          isDragging={isDragging}
          isDropTarget={isDropTarget}
        />
      </div>
      {closestEdge && <CustomDropIndicator edge={closestEdge} isCompact={isCompact} />}
    </div>
  );
};
