import React from 'react';
import clsx from 'clsx';
import { MockRule } from '../types';
import { Card } from './ui/Card';
import { MethodBadge, StatusCodeBadge } from './ui/Badge';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { Clock, Copy } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface RuleItemProps {
  rule: MockRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onEdit, onDelete, onToggle, onDuplicate }) => {
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
          {rule.headers && Object.keys(rule.headers).length > 0 && (
            <div className='text-xs text-blue-400/80 mt-2 font-medium flex items-center gap-1'>
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              {Object.keys(rule.headers).length} {Object.keys(rule.headers).length === 1 ? 'header' : 'headers'}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2 ml-4 flex-shrink-0'>
          <Toggle checked={rule.enabled} onChange={onToggle} />

          <Button variant='ghost' size='icon' onClick={onDuplicate} title={t('rules.duplicate')}>
            <Copy className='w-5 h-5' />
          </Button>

          <Button variant='ghost' size='icon' onClick={onEdit} title={t('common.edit')}>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </Button>

          <Button
            variant='ghost'
            size='icon'
            onClick={onDelete}
            title={t('common.delete')}
            className='hover:bg-red-900/50 hover:text-red-400 hover:border-red-900'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RuleItem);
