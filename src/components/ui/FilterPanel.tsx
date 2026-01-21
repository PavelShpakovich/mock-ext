import React, { useRef } from 'react';
import { Button } from './Button';
import { X, Filter } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { FilterSection } from './FilterSection';
import { FilterButton } from './FilterButton';
import { ButtonVariant, ButtonSize } from '../../enums';

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
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, onToggle, isExpanded);

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
    <div ref={panelRef} className='relative'>
      <Button
        onClick={onToggle}
        variant={ButtonVariant.Secondary}
        className='flex items-center gap-2 whitespace-nowrap'
      >
        <Filter className='w-4 h-4' />
        {t('requests.filters')}
        {hasActiveFilters && (
          <span className='bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
            {(filters.statusCodes.length > 0 ? 1 : 0) + (filters.methods.length > 0 ? 1 : 0)}
          </span>
        )}
      </Button>

      {isExpanded && (
        <div className='absolute top-full right-0 translate-y-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-4 shadow-xl z-10 min-w-[320px]'>
          <FilterSection title={t('requests.filterByMethod')}>
            {METHOD_OPTIONS.map((method) => (
              <FilterButton
                key={method}
                label={method}
                isActive={filters.methods.includes(method)}
                onClick={() => toggleMethod(method)}
              />
            ))}
          </FilterSection>

          <FilterSection title={t('requests.filterByStatus')}>
            {STATUS_CODE_OPTIONS.map((option) => (
              <FilterButton
                key={option.value}
                label={option.label}
                isActive={filters.statusCodes.includes(getStatusCodeRange(option.value))}
                onClick={() => toggleStatusCode(getStatusCodeRange(option.value))}
              />
            ))}
          </FilterSection>

          {hasActiveFilters && (
            <Button
              onClick={onClear}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Small}
              className='w-full flex items-center justify-center gap-2'
            >
              <X className='w-4 h-4' />
              {t('requests.clearFilters')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
