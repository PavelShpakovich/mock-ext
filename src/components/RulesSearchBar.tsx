import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/Input';
import { useI18n } from '../contexts/I18nContext';

interface RulesSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const RulesSearchBar: React.FC<RulesSearchBarProps> = ({ value, onChange }) => {
  const { t } = useI18n();

  return (
    <div className='relative'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
      <Input
        placeholder={t('rules.search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        className='pl-8'
      />
    </div>
  );
};
