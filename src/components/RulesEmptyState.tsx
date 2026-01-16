import React from 'react';
import { Plus, FileText } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useI18n } from '../contexts/I18nContext';

interface RulesEmptyStateProps {
  onCreateRule: () => void;
}

export const RulesEmptyState: React.FC<RulesEmptyStateProps> = ({ onCreateRule }) => {
  const { t } = useI18n();

  return (
    <Card className='flex items-center flex-col text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm'>
      <FileText className='w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600' />
      <div className='text-gray-700 dark:text-gray-300 font-bold text-lg mb-2'>{t('rules.noRules')}</div>
      <div className='text-gray-500 text-sm mb-4'>{t('rules.noRulesDesc')}</div>
      <Button onClick={onCreateRule} className='flex items-center gap-2 cursor-pointer'>
        <Plus className='w-4 h-4' />
        {t('rules.addRule')}
      </Button>
    </Card>
  );
};
