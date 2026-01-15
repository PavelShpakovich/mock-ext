import React from 'react';
import clsx from 'clsx';
import { MockRule } from '../types';
import { Card } from './ui/Card';
import { Badge, MethodBadge, StatusCodeBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Clock, Copy, RotateCcw, Edit, Trash } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { formatRelativeTime } from '../helpers/time';

interface RuleItemProps {
  rule: MockRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onResetHits: () => void;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onEdit, onDelete, onToggle, onDuplicate, onResetHits }) => {
  const { t } = useI18n();

  return (
    <Card
      className={clsx({
        'opacity-60 bg-gray-800/50': !rule.enabled,
      })}
      hoverEffect={true}
    >
      <div className='flex items-start justify-between mb-2'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <h3 className='font-bold text-white text-base'>{rule.name}</h3>
            {rule.method && <MethodBadge method={rule.method} />}
            <StatusCodeBadge code={rule.statusCode} />
            {(rule.matchCount ?? 0) > 0 && (
              <Badge variant='info' className='flex items-center gap-1'>
                {rule.matchCount}
              </Badge>
            )}
          </div>
          <div className='text-sm text-gray-300 break-all font-mono bg-gray-900 px-2 py-1.5 rounded border border-gray-700'>
            {rule.urlPattern}
          </div>
          {rule.delay > 0 && (
            <div className='text-xs text-yellow-500/80 mt-2 font-medium flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {t('rules.delayMs', { delay: rule.delay })}
            </div>
          )}
          {rule.lastMatched && (
            <div className='text-xs text-blue-400/80 mt-2 font-medium flex items-center gap-2'>
              {t('rules.lastMatched')}: {formatRelativeTime(rule.lastMatched, t)}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onResetHits();
                }}
                title={t('rules.resetHits')}
                className='text-blue-400/60 hover:text-blue-400 -my-1'
                variant='ghost'
              >
                <RotateCcw className='w-3 h-3' />
              </IconButton>
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
            <Trash className='w-5 h-5' />
          </IconButton>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RuleItem);
