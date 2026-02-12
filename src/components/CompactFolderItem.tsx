import React, { useState } from 'react';
import clsx from 'clsx';
import { Folder } from '../types';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { ChevronDown, ChevronRight, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { IconButtonVariant } from '../enums';

interface CompactFolderItemProps {
  folder: Folder;
  ruleCount: number;
  enabledCount: number;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
}

export const CompactFolderItem: React.FC<CompactFolderItemProps> = ({
  folder,
  ruleCount,
  enabledCount,
  onToggleCollapse,
  onEdit,
  onDelete,
  onEnableAll,
  onDisableAll,
}) => {
  const { t } = useI18n();
  const [showActions, setShowActions] = useState(false);
  const allEnabled = enabledCount === ruleCount;

  return (
    <div onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <Card
        className={clsx('cursor-pointer py-1.5 px-3', {
          'bg-gray-50 dark:bg-gray-900/30': folder.collapsed,
          'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800': !folder.collapsed,
        })}
        hoverEffect={true}
        onClick={onToggleCollapse}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <div className='shrink-0'>
              {folder.collapsed ? (
                <ChevronRight className='w-3.5 h-3.5 text-gray-600 dark:text-gray-400' />
              ) : (
                <ChevronDown className='w-3.5 h-3.5 text-gray-600 dark:text-gray-400' />
              )}
            </div>
            <h3 className='font-semibold text-gray-900 dark:text-white text-xs truncate'>{folder.name}</h3>
            <span className='text-xs text-gray-500 dark:text-gray-400 shrink-0'>({ruleCount})</span>
          </div>
          <div
            className={clsx('flex items-center gap-0.5 shrink-0 transition-opacity', {
              'opacity-100': showActions,
              'opacity-0': !showActions,
            })}
            onClick={(e) => e.stopPropagation()}
          >
            {ruleCount > 0 && (
              <IconButton
                onClick={allEnabled ? onDisableAll : onEnableAll}
                variant={allEnabled ? IconButtonVariant.Ghost : IconButtonVariant.Primary}
                title={allEnabled ? t('folders.disableAll') : t('folders.enableAll')}
              >
                {allEnabled ? <PowerOff className='w-3.5 h-3.5' /> : <Power className='w-3.5 h-3.5' />}
              </IconButton>
            )}
            <IconButton onClick={onEdit} variant={IconButtonVariant.Ghost} title={t('common.edit')}>
              <Edit className='w-3.5 h-3.5' />
            </IconButton>
            <IconButton onClick={onDelete} variant={IconButtonVariant.Danger} title={t('common.delete')}>
              <Trash2 className='w-3.5 h-3.5' />
            </IconButton>
          </div>
        </div>
      </Card>
    </div>
  );
};
