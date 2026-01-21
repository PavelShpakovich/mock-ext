import React, { useState } from 'react';
import { RequestLog } from '../types';
import RequestItem from './RequestItem';
import { matchesStatusCodeFilter } from '../helpers/filtering';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { FilterPanel, FilterState } from './ui/FilterPanel';
import { Search, Trash2, Circle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { ButtonVariant } from '../enums';

interface RequestsTabProps {
  requests: RequestLog[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearLog: () => void;
  onMockRequest: (request: RequestLog) => void;
  logRequests: boolean;
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  requests,
  searchTerm,
  onSearchChange,
  onClearLog,
  onMockRequest,
  logRequests,
}) => {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterState>({
    statusCodes: [],
    methods: [],
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const filteredRequests = requests.filter((req) => {
    // Text search filter
    const matchesSearch =
      req.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.method.toLowerCase().includes(searchTerm.toLowerCase());

    // Method filter
    const matchesMethod = filters.methods.length === 0 || filters.methods.includes(req.method.toUpperCase());

    // Status code filter
    const matchesStatus = matchesStatusCodeFilter(req.statusCode, filters.statusCodes);

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className='p-6 flex flex-col gap-3'>
      <div className='flex gap-3 items-start'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
          <Input
            placeholder={t('requests.search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
            className='pl-8'
          />
        </div>
        {requests.length > 0 && (
          <>
            <div className='relative'>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClear={() =>
                  setFilters({
                    statusCodes: [],
                    methods: [],
                  })
                }
                isExpanded={isFilterExpanded}
                onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
              />
            </div>
            <Button
              onClick={onClearLog}
              variant={ButtonVariant.Danger}
              className='whitespace-nowrap flex items-center gap-2'
            >
              <Trash2 className='w-4 h-4' />
              {t('requests.clear')}
            </Button>
          </>
        )}
      </div>

      {!logRequests && requests.length === 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4'>
          <Circle className='w-12 h-12 text-gray-400 dark:text-gray-600' />
          <div className='flex flex-col gap-2'>
            <div className='text-gray-700 dark:text-gray-300 font-bold text-lg'>{t('requests.noRequests')}</div>
            <div className='text-gray-500 dark:text-gray-500 text-sm'>{t('requests.noRequestsDesc')}</div>
          </div>
        </Card>
      )}

      {logRequests && requests.length === 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm animate-pulse flex flex-col items-center gap-4'>
          <Circle className='w-12 h-12 text-red-500' fill='currentColor' />
          <div className='flex flex-col gap-2'>
            <div className='text-gray-700 dark:text-gray-300 font-bold text-lg'>
              {t('header.recording', { tabTitle: '' })}
            </div>
            <div className='text-gray-500 dark:text-gray-500 text-sm'>{t('requests.noRequestsDesc')}</div>
          </div>
        </Card>
      )}

      {filteredRequests.length === 0 && requests.length > 0 ? (
        <Card className='text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4'>
          <Search className='w-12 h-12 text-gray-400 dark:text-gray-600' />
          <div className='flex flex-col gap-2'>
            <div className='text-gray-700 dark:text-gray-300 font-bold text-lg'>{t('requests.noRequests')}</div>
            <div className='text-gray-500 dark:text-gray-500 text-sm'>{t('requests.search')}</div>
          </div>
        </Card>
      ) : (
        filteredRequests.length > 0 && (
          <div className='flex flex-col gap-2'>
            <div className='text-xs text-gray-600 dark:text-gray-500'>
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
              {!logRequests && ' (recording stopped)'}
            </div>
            {filteredRequests.map((request) => (
              <RequestItem key={request.id} request={request} onMock={() => onMockRequest(request)} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default RequestsTab;
