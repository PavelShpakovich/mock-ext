import React from 'react';
import clsx from 'clsx';
import { MockRule } from '../types';
import { ValidationWarning } from '../helpers';
import { ValidationSeverity } from '../enums';
import { Card } from './ui/Card';
import { MethodBadge, StatusCodeBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Clock, Copy, Edit, Trash2, AlertCircle, AlertTriangle, Info, GripVertical } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { formatRelativeTime } from '../helpers/time';
import { IconButtonVariant } from '../enums';

interface RuleItemProps {
  rule: MockRule;
  warnings: ValidationWarning[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onResetHits?: () => void;
  className?: string;
  disabled?: boolean;
  // Visual feedback for drag state
  isDragging?: boolean;
  isDropTarget?: boolean;
}

const RuleItem: React.FC<RuleItemProps> = ({
  rule,
  warnings,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onResetHits,
  className = '',
  disabled = false,
  isDragging = false,
  isDropTarget = false,
}) => {
  const { t } = useI18n();

  const getWarningIcon = (severity: ValidationSeverity) => {
    switch (severity) {
      case ValidationSeverity.Error:
        return <AlertCircle className='w-4 h-4' />;
      case ValidationSeverity.Warning:
        return <AlertTriangle className='w-4 h-4' />;
      case ValidationSeverity.Info:
        return <Info className='w-4 h-4' />;
      default:
        return <Info className='w-4 h-4' />;
    }
  };

  const getWarningColor = (severity: ValidationSeverity) => {
    switch (severity) {
      case ValidationSeverity.Error:
        return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
      case ValidationSeverity.Warning:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case ValidationSeverity.Info:
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <Card
      className={clsx(
        'relative',
        {
          'opacity-40': isDragging,
          'ring-2 ring-blue-500 ring-offset-1': isDropTarget,
          'opacity-60 bg-gray-100/50 dark:bg-gray-800/50': !rule.enabled && !isDragging,
          'border-green-600 dark:border-green-500/40': rule.enabled,
          'pointer-events-none': disabled,
          'cursor-grab active:cursor-grabbing': !disabled,
        },
        className
      )}
      hoverEffect={!disabled}
    >
      <div className='flex items-start justify-between'>
        {!disabled && (
          <div className='flex items-center pr-2 text-gray-400 dark:text-gray-600 shrink-0 self-center'>
            <GripVertical className='w-4 h-4' />
          </div>
        )}
        <div className='flex-1 min-w-0 flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <h3 className='font-bold text-gray-800 dark:text-white text-base line-clamp-2'>{rule.name}</h3>
            <div className='flex items-center gap-2'>
              {rule.method && <MethodBadge method={rule.method} />}
              <StatusCodeBadge code={rule.statusCode} />
            </div>
          </div>
          <div className='bg-gray-100 dark:bg-gray-900 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 overflow-hidden'>
            <div className='text-sm text-gray-700 dark:text-gray-300 wrap-break-word font-mono line-clamp-3'>
              {rule.urlPattern}
            </div>
          </div>
          {rule.delay > 0 && (
            <div className='text-xs text-yellow-700 dark:text-yellow-500/80 font-medium flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {t('rules.delayMs', { delay: rule.delay })}
            </div>
          )}
          {rule.lastMatched && (
            <span className='text-xs text-blue-700 dark:text-blue-400/80 font-medium flex items-center gap-2'>
              {t('rules.lastMatched')}: {formatRelativeTime(rule.lastMatched, t)}
            </span>
          )}

          {warnings.length > 0 && (
            <div className='flex flex-col gap-2'>
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={clsx(
                    'text-xs px-2 py-1.5 rounded border flex items-start gap-2 w-fit',
                    getWarningColor(warning.severity)
                  )}
                >
                  <span className='shrink-0'>{getWarningIcon(warning.severity)}</span>
                  <span className='leading-relaxed'>{t(warning.messageKey, warning.messageParams)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col items-end gap-2 pl-4 shrink-0' draggable='false'>
          <div className='flex items-center gap-2'>
            <IconButton onClick={onDuplicate} title={t('rules.duplicate')}>
              <Copy className='w-5 h-5' />
            </IconButton>

            <IconButton onClick={onEdit} title={t('common.edit')}>
              <Edit className='w-5 h-5' />
            </IconButton>

            <IconButton variant={IconButtonVariant.Danger} onClick={onDelete} title={t('common.delete')}>
              <Trash2 className='w-5 h-5' />
            </IconButton>
          </div>

          <Toggle checked={rule.enabled} onChange={onToggle} />
        </div>
      </div>
      {(rule.matchCount ?? 0) > 0 && (
        <span
          className='absolute bottom-3 right-3 min-w-[1.375rem] h-[1.375rem] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center px-1 cursor-pointer hover:bg-red-200 dark:hover:bg-red-700/50 hover:text-red-700 dark:hover:text-red-300 transition-colors'
          title={t('rules.resetHits')}
          onClick={onResetHits}
        >
          {rule.matchCount}
        </span>
      )}
    </Card>
  );
};

export default React.memo(RuleItem);
