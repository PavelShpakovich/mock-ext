import React from 'react';
import { Button } from './Button';
import { X, Filter } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export interface FilterState {
  statusCodes: number[];
  methods: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const STATUS_CODE_OPTIONS = [
  { value: '200', label: '2xx Success' },
  { value: '300', label: '3xx Redirect' },
  { value: '400', label: '4xx Client Error' },
  { value: '500', label: '5xx Server Error' },
];

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onClear, isExpanded, onToggle }) => {
  const { t } = useI18n();

  const hasActiveFilters = filters.statusCodes.length > 0 || filters.methods.length > 0;

  const toggleMethod = (method: string) => {
    const methods = filters.methods.includes(method)
      ? filters.methods.filter((m) => m !== method)
      : [...filters.methods, method];
    onFilterChange({ ...filters, methods });
  };

  const toggleStatusCode = (code: number) => {
    const statusCodes = filters.statusCodes.includes(code)
      ? filters.statusCodes.filter((c) => c !== code)
      : [...filters.statusCodes, code];
    onFilterChange({ ...filters, statusCodes });
  };

  const getStatusCodeRange = (value: string): number => {
    return parseInt(value);
  };

  return (
    <>
      <Button onClick={onToggle} variant='secondary' className='flex items-center gap-2 whitespace-nowrap'>
        <Filter className='w-4 h-4' />
        {t('requests.filters')}
        {hasActiveFilters && (
          <span className='bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
            {(filters.statusCodes.length > 0 ? 1 : 0) + (filters.methods.length > 0 ? 1 : 0)}
          </span>
        )}
      </Button>

      {isExpanded && (
        <div className='absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4 shadow-xl z-10 min-w-[320px]'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>{t('requests.filterByMethod')}</label>
            <div className='flex flex-wrap gap-2'>
              {METHOD_OPTIONS.map((method) => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    filters.methods.includes(method)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>{t('requests.filterByStatus')}</label>
            <div className='flex flex-wrap gap-2'>
              {STATUS_CODE_OPTIONS.map((option) => {
                const code = getStatusCodeRange(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleStatusCode(code)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      filters.statusCodes.includes(code)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={onClear}
              variant='secondary'
              size='sm'
              className='w-full flex items-center justify-center gap-2'
            >
              <X className='w-4 h-4' />
              {t('requests.clearFilters')}
            </Button>
          )}
        </div>
      )}
    </>
  );
};
