import React from 'react';
import { RequestLog } from '../types';
import { MethodBadge, StatusCodeBadge, Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Clock, Network, Copy, Check } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface RequestItemProps {
  request: RequestLog;
  onMock: () => void;
}

const RequestItem: React.FC<RequestItemProps> = ({ request, onMock }) => {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(request.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Card hoverEffect={true}>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <MethodBadge method={request.method} />
            {request.matched && <Badge variant='success'>Mocked</Badge>}
            {request.statusCode && <StatusCodeBadge code={request.statusCode} />}
            <span className='text-xs font-medium text-gray-500 flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {formatTime(request.timestamp)}
            </span>
          </div>
          <div className='text-sm text-white break-all font-mono bg-gray-900 px-2 py-1.5 rounded border border-gray-700'>
            {request.url}
          </div>
        </div>

        <div className='flex items-center gap-2 ml-4 flex-shrink-0'>
          <Button
            size='sm'
            variant='secondary'
            onClick={handleCopyURL}
            className='whitespace-nowrap flex items-center gap-2'
            title={t('requests.copyURL')}
          >
            {copied ? <Check className='w-4 h-4 text-green-500' /> : <Copy className='w-4 h-4' />}
            {copied ? t('requests.copied') : t('requests.copy')}
          </Button>
          <Button
            size='sm'
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
