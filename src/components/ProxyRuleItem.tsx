import React from 'react';
import clsx from 'clsx';
import { ProxyRule } from '../types';
import { Card } from './ui/Card';
import { MethodBadge, ProxyBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Clock, Copy, Edit, Trash2, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { IconButtonVariant } from '../enums';

interface ProxyRuleItemProps {
  rule: ProxyRule;
  conflictingMockNames?: string[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

const ProxyRuleItem: React.FC<ProxyRuleItemProps> = ({
  rule,
  conflictingMockNames,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}) => {
  const { t } = useI18n();

  return (
    <Card
      className={clsx('relative', {
        'opacity-60 bg-gray-100/50 dark:bg-gray-800/50': !rule.enabled,
        'border-green-600 dark:border-green-500/40': rule.enabled,
      })}
      hoverEffect={true}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0 flex flex-col gap-2'>
          {/* Name row */}
          <div className='flex items-center justify-between'>
            <h3 className='font-bold text-gray-800 dark:text-white text-base line-clamp-2'>{rule.name}</h3>
            <div className='flex items-center gap-2'>
              {rule.method && <MethodBadge method={rule.method} />}
              <ProxyBadge />
            </div>
          </div>

          {/* URL pattern code-box */}
          <div className='bg-gray-100 dark:bg-gray-900 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 overflow-hidden'>
            <div className='text-sm text-gray-700 dark:text-gray-300 wrap-break-word font-mono line-clamp-3'>
              {rule.urlPattern}
            </div>
          </div>

          {/* Proxy target */}
          <div className='text-sm text-purple-700 dark:text-purple-400 font-mono flex items-center gap-1.5'>
            <ArrowRightLeft className='w-3.5 h-3.5 shrink-0' />
            <span className='truncate'>
              {rule.proxyTarget}
              {rule.pathRewriteFrom ? `  (${rule.pathRewriteFrom} → ${rule.pathRewriteTo || ''})` : ''}
            </span>
          </div>

          {/* Delay */}
          {rule.delay > 0 && (
            <div className='text-xs text-yellow-700 dark:text-yellow-500/80 font-medium flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {t('rules.delayMs', { delay: rule.delay })}
            </div>
          )}

          {/* Conflict warnings */}
          {conflictingMockNames && conflictingMockNames.length > 0 && (
            <div className='flex flex-col gap-2'>
              {conflictingMockNames.map((name) => (
                <div
                  key={name}
                  className='text-xs px-2 py-1.5 rounded border flex items-start gap-2 w-fit text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                >
                  <AlertTriangle className='w-4 h-4 shrink-0' />
                  <span className='leading-relaxed'>{t('proxy.conflictWarning', { name })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions + toggle */}
        <div className='flex flex-col items-end gap-2 pl-4 shrink-0'>
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
        <span className='absolute bottom-3 right-3 min-w-[1.375rem] h-[1.375rem] rounded-full bg-purple-200 dark:bg-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center px-1'>
          {rule.matchCount}
        </span>
      )}
    </Card>
  );
};

export default React.memo(ProxyRuleItem);
