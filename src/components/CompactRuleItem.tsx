import React from 'react';
import { MockRule } from '../types';
import { ValidationWarning } from '../helpers';
import { Copy, Trash2, Edit, AlertCircle, AlertTriangle, CheckSquare, Square, GripVertical } from 'lucide-react';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Card } from './ui/Card';
import { IconButtonVariant, IconButtonSize, ValidationSeverity } from '../enums';
import { useI18n } from '../contexts/I18nContext';
import clsx from 'clsx';

interface CompactRuleItemProps {
  rule: MockRule;
  warnings: ValidationWarning[];
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  // Visual feedback
  isDragging?: boolean;
  isDropTarget?: boolean;
}

export const CompactRuleItem: React.FC<CompactRuleItemProps> = ({
  rule,
  warnings,
  selectionMode,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  isDragging = false,
  isDropTarget = false,
}) => {
  const { t } = useI18n();

  const hasError = warnings.some((w) => w.severity === ValidationSeverity.Error);
  const hasWarning = warnings.some((w) => w.severity === ValidationSeverity.Warning);

  return (
    <div className='relative'>
      {selectionMode && (
        <IconButton
          onClick={() => onToggleSelection(rule.id)}
          variant={isSelected ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
          size={IconButtonSize.Small}
          title={isSelected ? t('rules.deselectAll') : t('rules.selectAll')}
          className='absolute left-2 top-1/2 -translate-y-1/2 z-10'
        >
          {isSelected ? (
            <CheckSquare className='w-4 h-4 text-green-600 dark:text-green-400' />
          ) : (
            <Square className='w-4 h-4 text-gray-400' />
          )}
        </IconButton>
      )}
      <Card
        className={clsx('py-2 px-3', {
          'opacity-40': isDragging,
          'ring-2 ring-blue-500 ring-offset-1': isDropTarget,
          'opacity-60 bg-gray-100/50 dark:bg-gray-800/50': !rule.enabled && !isDragging,
          'border-green-600 dark:border-green-500/40': rule.enabled,
          'pl-10': selectionMode,
          'cursor-grab active:cursor-grabbing': !selectionMode,
        })}
        hoverEffect={!selectionMode}
      >
        <div className='flex items-center gap-2'>
          {!selectionMode && (
            <div className='text-gray-400 dark:text-gray-600 shrink-0 cursor-grab active:cursor-grabbing'>
              <GripVertical className='w-3.5 h-3.5' />
            </div>
          )}
          <div className='flex-1 min-w-0 flex items-center gap-1.5'>
            <span className='font-semibold text-gray-800 dark:text-white text-xs truncate' title={rule.name}>
              {rule.name}
            </span>
            {(rule.matchCount ?? 0) > 0 && (
              <span className='text-xs text-gray-500 dark:text-gray-400 shrink-0'>({rule.matchCount})</span>
            )}
            {hasError && <AlertCircle className='w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0' />}
            {hasWarning && !hasError && (
              <AlertTriangle className='w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0' />
            )}
          </div>

          <div className='flex items-center gap-1 shrink-0' draggable='false'>
            <IconButton onClick={onDuplicate} title={t('rules.duplicate')} variant={IconButtonVariant.Ghost}>
              <Copy className='w-3.5 h-3.5' />
            </IconButton>

            <IconButton onClick={onEdit} title={t('common.edit')} variant={IconButtonVariant.Ghost}>
              <Edit className='w-3.5 h-3.5' />
            </IconButton>

            <IconButton variant={IconButtonVariant.Danger} onClick={onDelete} title={t('common.delete')}>
              <Trash2 className='w-3.5 h-3.5' />
            </IconButton>

            <Toggle checked={rule.enabled} onChange={onToggle} />
          </div>
        </div>
      </Card>
    </div>
  );
};
