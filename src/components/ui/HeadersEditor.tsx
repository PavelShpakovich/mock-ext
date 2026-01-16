import React from 'react';
import { HeaderEntry } from '../../helpers/headers';
import { Input } from './Input';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { IconButtonVariant, ButtonVariant, ButtonSize } from '../../enums';

interface HeadersEditorProps {
  headers: HeaderEntry[];
  onChange: (headers: HeaderEntry[]) => void;
}

export const HeadersEditor: React.FC<HeadersEditorProps> = ({ headers, onChange }) => {
  const { t } = useI18n();

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    onChange(newHeaders);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    onChange(newHeaders);
  };

  const handleAddHeader = () => {
    onChange([...headers, { key: '', value: '' }]);
  };

  return (
    <div>
      <label className='block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2'>
        {t('editor.customHeaders')}{' '}
        <span className='text-gray-500 dark:text-gray-500 text-xs font-normal'>({t('editor.optional')})</span>
      </label>
      <div className='flex flex-col gap-2'>
        {headers.map((header, index) => (
          <div key={index} className='flex gap-2 items-center'>
            <Input
              value={header.key}
              onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
              placeholder={t('editor.headerName')}
              className='flex-1'
            />
            <Input
              value={header.value}
              onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
              placeholder={t('editor.headerValue')}
              className='flex-1'
            />
            <IconButton
              type='button'
              variant={IconButtonVariant.Danger}
              onClick={() => handleRemoveHeader(index)}
              title={t('editor.removeHeader')}
            >
              <Trash2 className='w-4 h-4' />
            </IconButton>
          </div>
        ))}

        <Button
          type='button'
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Small}
          className='flex items-center w-fit'
          onClick={handleAddHeader}
        >
          <Plus className='w-4 h-4 mr-2' />
          {t('editor.addHeader')}
        </Button>
      </div>
    </div>
  );
};
