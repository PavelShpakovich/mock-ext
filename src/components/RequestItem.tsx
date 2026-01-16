import React from 'react';
import { RequestLog } from '../types';
import { MethodBadge, StatusCodeBadge, Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Clock, Network } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { formatTime } from '../helpers/formatting';
import { BadgeVariant, ButtonSize } from '../enums';

interface RequestItemProps {
  request: RequestLog;
  onMock: () => void;
}

const RequestItem: React.FC<RequestItemProps> = ({ request, onMock }) => {
  const { t } = useI18n();

  return (
    <Card hoverEffect={true}>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <MethodBadge method={request.method} />
            {request.matched && <Badge variant={BadgeVariant.Success}>{t('requests.mocked')}</Badge>}
            {request.statusCode && <StatusCodeBadge code={request.statusCode} />}
            <span className='text-xs font-medium text-gray-600 dark:text-gray-500 flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {formatTime(request.timestamp)}
            </span>
          </div>
          <div className='text-sm text-gray-900 dark:text-white break-all font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700'>
            {request.url}
          </div>
        </div>

        <div className='flex items-center gap-2 ml-4 shrink-0'>
          <Button
            size={ButtonSize.Small}
            onClick={onMock}
            className='whitespace-nowrap flex items-center gap-2'
            title={t('common.mockThisTooltip')}
          >
            <Network className='w-4 h-4' />
            {t('requests.mockThis')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RequestItem);
