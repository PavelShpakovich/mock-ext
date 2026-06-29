import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import { AlertCircle } from 'lucide-react';

interface DisabledBannerProps {
  onEnable: () => void;
}

const DisabledBanner: React.FC<DisabledBannerProps> = ({ onEnable }) => {
  const { t } = useI18n();

  return (
    <div className='sticky top-0 z-40 flex items-center justify-between gap-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 px-4 py-2'>
      <div className='flex items-center gap-2 min-w-0'>
        <AlertCircle className='w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0' />
        <span className='text-sm font-medium text-gray-600 dark:text-gray-300 truncate'>
          {t('app.disabledBannerMessage')}
        </span>
      </div>
      <button
        onClick={onEnable}
        className='shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition-colors cursor-pointer select-none bg-green-100 dark:bg-green-500/10 border-green-400 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'
      >
        <span className='w-1.5 h-1.5 rounded-full shrink-0 bg-green-500' />
        {t('app.enableExtension')}
      </button>
    </div>
  );
};

export default DisabledBanner;
