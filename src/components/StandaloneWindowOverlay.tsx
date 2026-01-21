import React from 'react';
import { useI18n } from '../contexts/I18nContext';

const StandaloneWindowOverlay: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className='fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center'>
      <div className='text-center max-w-md p-8 flex flex-col items-center gap-4'>
        <svg
          className='w-16 h-16 text-green-600 dark:text-green-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
          />
        </svg>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>{t('app.standaloneWindowOpen')}</h2>
        <p className='text-gray-600 dark:text-gray-400'>{t('app.standaloneWindowMessage')}</p>
      </div>
    </div>
  );
};

export default StandaloneWindowOverlay;
