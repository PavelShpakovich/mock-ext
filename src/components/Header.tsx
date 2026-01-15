import React from 'react';
import clsx from 'clsx';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Toggle } from './ui/Toggle';
import { Network, Circle, Square } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface HeaderProps {
  enabled: boolean;
  logRequests: boolean;
  corsAutoFix: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onToggleRecording: (logRequests: boolean) => void;
  onToggleCors: (corsAutoFix: boolean) => void;
  activeTabTitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  enabled,
  logRequests,
  corsAutoFix,
  onToggleEnabled,
  onToggleRecording,
  onToggleCors,
  activeTabTitle,
}) => {
  const { t, language, setLanguage } = useI18n();

  const handleRecordingClick = () => {
    onToggleRecording(!logRequests);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  return (
    <div className='bg-gray-900 border-b border-gray-800 text-white p-4'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-3'>
          <Network className='w-7 h-7 text-green-400 shrink-0' />
          <h1 className='text-xl font-bold text-white whitespace-nowrap'>{t('app.name')}</h1>

          {logRequests && activeTabTitle && (
            <div className='flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1'>
              <Circle className='w-2 h-2 fill-red-500 text-red-500 animate-pulse' />
              <span className='text-xs font-medium text-red-400'>
                {t('header.recording', { tabTitle: activeTabTitle })}
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-4 flex-wrap'>
          <div className='flex items-center gap-2'>
            <IconButton
              onClick={toggleLanguage}
              className='flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700'
              title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
            >
              <span className='text-xs font-medium text-gray-300'>{language === 'en' ? 'EN' : 'RU'}</span>
            </IconButton>

            <div className='w-px h-6 bg-gray-700 mx-1'></div>

            <div className='flex items-center gap-2'>
              <Toggle checked={enabled} onChange={() => onToggleEnabled(!enabled)} />
              <span
                className={clsx('text-xs font-medium', {
                  'text-green-400': enabled,
                  'text-gray-500': !enabled,
                })}
              >
                {enabled ? t('header.enabled') : t('header.disabled')}
              </span>
            </div>

            <div className='flex items-center gap-2' title={t('header.corsAutoFixTooltip')}>
              <Toggle checked={corsAutoFix} onChange={() => onToggleCors(!corsAutoFix)} disabled={!enabled} />
              <span
                className={clsx('text-xs font-medium', {
                  'text-green-400': corsAutoFix && enabled,
                  'text-gray-500': !corsAutoFix || !enabled,
                })}
              >
                {t('header.corsAutoFix')}
              </span>
            </div>

            <div className='w-px h-6 bg-gray-700 mx-1'></div>

            <div className='w-px h-6 bg-gray-700 mx-1'></div>

            <Button
              onClick={handleRecordingClick}
              variant={logRequests ? 'danger' : 'secondary'}
              size='sm'
              className='flex items-center gap-1.5'
              disabled={!enabled}
            >
              {logRequests ? (
                <>
                  <Square className='w-3.5 h-3.5' fill='currentColor' />
                  {t('header.stop')}
                </>
              ) : (
                <>
                  <Circle className='w-3.5 h-3.5' />
                  {t('header.record')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Header);
