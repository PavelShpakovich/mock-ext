import React from 'react';
import clsx from 'clsx';
import { MockRule } from '../types';
import { ValidationWarning } from '../helpers';
import { Card } from './ui/Card';
import { Badge, MethodBadge, StatusCodeBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Clock, Copy, RotateCcw, Edit, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { formatRelativeTime } from '../helpers/time';

interface RuleItemProps {
  rule: MockRule;
  warnings: ValidationWarning[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onResetHits: () => void;
}

const RuleItem: React.FC<RuleItemProps> = ({
  rule,
  warnings,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onResetHits,
}) => {
  const { t } = useI18n();

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className='w-4 h-4' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4' />;
      case 'info':
        return <Info className='w-4 h-4' />;
      default:
        return <Info className='w-4 h-4' />;
    }
  };

  const getWarningColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <Card
      className={clsx({
        'opacity-60 bg-gray-100/50 dark:bg-gray-800/50': !rule.enabled,
      })}
      hoverEffect={true}
    >
      <div className='flex items-start justify-between mb-2'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <h3 className='font-bold text-gray-900 dark:text-white text-base'>{rule.name}</h3>
            {rule.method && <MethodBadge method={rule.method} />}
            <StatusCodeBadge code={rule.statusCode} />
            {(rule.matchCount ?? 0) > 0 && (
              <Badge variant='info' className='flex items-center gap-1'>
                {rule.matchCount}
              </Badge>
            )}
          </div>
          <div className='text-sm text-gray-700 dark:text-gray-300 break-all font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700'>
            {rule.urlPattern}
          </div>
          {rule.delay > 0 && (
            <div className='text-xs text-yellow-700 dark:text-yellow-500/80 mt-2 font-medium flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {t('rules.delayMs', { delay: rule.delay })}
            </div>
          )}
          {rule.lastMatched && (
            <div className='text-xs text-blue-700 dark:text-blue-400/80 mt-2 font-medium flex items-center gap-2'>
              {t('rules.lastMatched')}: {formatRelativeTime(rule.lastMatched, t)}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onResetHits();
                }}
                title={t('rules.resetHits')}
                className='text-blue-600 dark:text-blue-400/60 hover:text-blue-700 dark:hover:text-blue-400 -my-1'
                variant='ghost'
              >
                <RotateCcw className='w-3 h-3' />
              </IconButton>
            </div>
          )}

          {/* Validation Warnings */}
          {warnings.length > 0 && (
            <div className='mt-3 space-y-2'>
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={clsx(
                    'text-xs px-2 py-1.5 rounded border flex items-start gap-2',
                    getWarningColor(warning.severity)
                  )}
                >
                  <span className='shrink-0 mt-0.5'>{getWarningIcon(warning.severity)}</span>
                  <span className='leading-relaxed'>{t(warning.messageKey, warning.messageParams)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2 ml-4 shrink-0'>
          <Toggle checked={rule.enabled} onChange={onToggle} />

          <IconButton onClick={onDuplicate} title={t('rules.duplicate')}>
            <Copy className='w-5 h-5' />
          </IconButton>

          <IconButton onClick={onEdit} title={t('common.edit')}>
            <Edit className='w-5 h-5' />
          </IconButton>

          <IconButton variant='danger' onClick={onDelete} title={t('common.delete')}>
            <Trash2 className='w-5 h-5' />
          </IconButton>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RuleItem);
