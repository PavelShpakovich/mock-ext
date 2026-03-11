import React from 'react';
import clsx from 'clsx';
import { ProxyRule } from '../types';
import { Card } from './ui/Card';
import { MethodBadge, ProxyBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Copy, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { IconButtonVariant, IconButtonSize } from '../enums';
import { useI18n } from '../contexts/I18nContext';

interface CompactProxyRuleItemProps {
  rule: ProxyRule;
  hasConflict?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

export const CompactProxyRuleItem: React.FC<CompactProxyRuleItemProps> = ({
  rule,
  hasConflict,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}) => {
  const { t } = useI18n();

  return (
    <Card
      className={clsx('py-2 px-3', {
        'opacity-60 bg-gray-100/50 dark:bg-gray-800/50': !rule.enabled,
        'border-green-600 dark:border-green-500/40': rule.enabled,
      })}
      hoverEffect={true}
    >
      <div className='flex items-center gap-2'>
        <div className='flex-1 min-w-0 flex items-center gap-1.5'>
          <span className='font-semibold text-gray-800 dark:text-white text-xs truncate' title={rule.name}>
            {rule.name}
          </span>
          {(rule.matchCount ?? 0) > 0 && (
            <span className='text-xs text-gray-500 dark:text-gray-400 shrink-0'>({rule.matchCount})</span>
          )}
          {rule.method && <MethodBadge method={rule.method} />}
          <ProxyBadge />
          {hasConflict && (
            <span title={t('proxy.conflictWarning', { name: '' })}>
              <AlertTriangle className='w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0' />
            </span>
          )}
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          <IconButton
            onClick={onDuplicate}
            title={t('rules.duplicate')}
            variant={IconButtonVariant.Ghost}
            size={IconButtonSize.Small}
          >
            <Copy className='w-3.5 h-3.5' />
          </IconButton>
          <IconButton
            onClick={onEdit}
            title={t('common.edit')}
            variant={IconButtonVariant.Ghost}
            size={IconButtonSize.Small}
          >
            <Edit className='w-3.5 h-3.5' />
          </IconButton>
          <IconButton
            variant={IconButtonVariant.Danger}
            onClick={onDelete}
            title={t('common.delete')}
            size={IconButtonSize.Small}
          >
            <Trash2 className='w-3.5 h-3.5' />
          </IconButton>
          <Toggle checked={rule.enabled} onChange={onToggle} />
        </div>
      </div>
    </Card>
  );
};
