import React from 'react';
import clsx from 'clsx';
import { MockRule } from '../types';
import { Card } from './ui/Card';
import { Badge, MethodBadge, StatusCodeBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { Clock, Copy, TrendingUp, RotateCcw } from 'lucide-react';
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
                <TrendingUp className='w-3 h-3' />
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
              Delay: {rule.delay}ms
            </div>
          )}
          {rule.lastMatched && (
            <div className='text-xs text-blue-400/80 mt-2 font-medium flex items-center gap-2'>
              <div className='flex items-center gap-1'>
                <TrendingUp className='w-3 h-3' />
                {t('rules.lastMatched')}: {formatRelativeTime(rule.lastMatched, t)}
              </div>
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
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </IconButton>

          <IconButton variant='danger' onClick={onDelete} title={t('common.delete')}>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </IconButton>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RuleItem);
