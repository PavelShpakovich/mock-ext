import React from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { useI18n } from '../../contexts/I18nContext';

interface HeadersInputProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export const HeadersInput: React.FC<HeadersInputProps> = ({ headers, onChange }) => {
  const { t } = useI18n();
  const headerEntries = Object.entries(headers || {});

  const addHeader = () => {
    // Use a temporary unique key to allow multiple empty headers
    const tempKey = `_temp_${Date.now()}`;
    onChange({ ...headers, [tempKey]: '' });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...headers };
    // Remove old key if it changed
    if (oldKey !== newKey && oldKey in newHeaders) {
      delete newHeaders[oldKey];
    }
    // Only add if key has value, or if it's a temp key (allow empty for editing)
    if (newKey.trim() || oldKey.startsWith('_temp_')) {
      newHeaders[newKey.trim() || oldKey] = value;
    }
    onChange(newHeaders);
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    onChange(newHeaders);
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>{t('headers')}</label>
        <Button onClick={addHeader} variant='secondary' size='sm'>
          <Plus className='w-4 h-4 mr-1' />
          {t('addHeader')}
        </Button>
      </div>

      {headerEntries.length === 0 ? (
        <p className='text-sm text-gray-500 dark:text-gray-400 italic'>{t('noHeaders')}</p>
      ) : (
        <div className='flex flex-col gap-2'>
          {headerEntries.map(([key, value], index) => (
            <div key={index} className='flex items-center gap-2'>
              <Input
                value={key}
                onChange={(e) => updateHeader(key, e.target.value, value)}
                placeholder={t('headerKey')}
                className='flex-1'
              />
              <Input
                value={value}
                onChange={(e) => updateHeader(key, key, e.target.value)}
                placeholder={t('headerValue')}
                className='flex-1'
              />
              <Button onClick={() => removeHeader(key)} variant='secondary' size='sm' className='flex-shrink-0'>
                <X className='w-4 h-4' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
