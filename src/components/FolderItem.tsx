import React, { useState } from 'react';
import clsx from 'clsx';
import { Folder } from '../types';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  FolderOpen,
  Folder as FolderIcon,
  Power,
  PowerOff,
  GripVertical,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { IconButtonVariant } from '../enums';

interface FolderItemProps {
  folder: Folder;
  ruleCount: number;
  enabledCount: number;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  // Visual feedback
  isDragging?: boolean;
  isDropTarget?: boolean;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  ruleCount,
  enabledCount,
  onToggleCollapse,
  onEdit,
  onDelete,
  onEnableAll,
  onDisableAll,
  isDragging = false,
  isDropTarget = false,
}) => {
  const { t } = useI18n();
  const [showActions, setShowActions] = useState(false);
  const allEnabled = enabledCount === ruleCount;

  return (
    <div onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <Card
        className={clsx('cursor-pointer', {
          'opacity-40': isDragging,
          'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800': !folder.collapsed,
          'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900': isDropTarget,
        })}
        hoverEffect={true}
        onClick={onToggleCollapse}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 flex-1'>
            <div
              className='p-1 text-gray-400 dark:text-gray-600 cursor-grab active:cursor-grabbing'
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className='w-4 h-4' />
            </div>
            <div className='p-1'>
              {folder.collapsed ? (
                <ChevronRight className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              )}
            </div>

            {folder.collapsed ? (
              <FolderIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            ) : (
              <FolderOpen className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            )}
            <h3 className='font-bold text-gray-800 dark:text-white text-base flex-1 flex items-center gap-2'>
              {folder.name}
              <span className='text-sm font-normal text-gray-500 dark:text-gray-400'>({ruleCount})</span>
            </h3>
          </div>

          <div
            className={clsx('flex items-center gap-2 transition-opacity', {
              'opacity-100': showActions,
              'opacity-0': !showActions,
            })}
            onClick={(e) => e.stopPropagation()}
            draggable='false'
          >
            {ruleCount > 0 && (
              <IconButton
                onClick={allEnabled ? onDisableAll : onEnableAll}
                variant={allEnabled ? IconButtonVariant.Ghost : IconButtonVariant.Primary}
                title={allEnabled ? t('folders.disableAll') : t('folders.enableAll')}
              >
                {allEnabled ? <PowerOff className='w-4 h-4' /> : <Power className='w-4 h-4' />}
              </IconButton>
            )}
            <IconButton onClick={onEdit} variant={IconButtonVariant.Ghost} title={t('folders.rename')}>
              <Edit className='w-4 h-4' />
            </IconButton>
            <IconButton onClick={onDelete} variant={IconButtonVariant.Danger} title={t('folders.delete')}>
              <Trash2 className='w-4 h-4' />
            </IconButton>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FolderItem;
