import React from 'react';
import clsx from 'clsx';
import { SettingsMenu } from './ui/SettingsMenu';
import { Circle, Square } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language, Theme, ResolvedTheme } from '../enums';
import { isDevTools, openStandaloneWindow } from '../helpers/context';

type LanguageOption = Language;

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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const showOpenWindowButton = isDevTools();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: LanguageOption) => {
    setLanguage(newLanguage);
  };

  const handleOpenWindow = () => {
    openStandaloneWindow(language);
  };

  const iconSrc = resolvedTheme === ResolvedTheme.Light ? '/icons/icon128light.png' : '/icons/icon128.png';

  return (
    <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <img src={iconSrc} alt='Moq' className='w-10 h-10 rounded-lg shrink-0' />
          <h1 className='text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap'>{t('app.name')}</h1>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={() => onToggleEnabled(!enabled)}
            title={enabled ? t('header.disabled') : t('header.enabled')}
            aria-pressed={enabled}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition-colors cursor-pointer select-none',
              enabled
                ? 'bg-green-100 dark:bg-green-500/10 border-green-400 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', enabled ? 'bg-green-500' : 'bg-gray-400')} />
            {enabled ? t('header.enabled') : t('header.disabled')}
          </button>

          <button
            onClick={() => onToggleCors(!corsAutoFix)}
            disabled={!enabled}
            title={t('header.corsAutoFix')}
            aria-pressed={corsAutoFix && enabled}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition-colors cursor-pointer select-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              corsAutoFix && enabled
                ? 'bg-green-100 dark:bg-green-500/10 border-green-400 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0',
                corsAutoFix && enabled ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            {t('header.corsAutoFix')}
          </button>

          <button
            onClick={() => onToggleRecording(!logRequests)}
            disabled={!enabled}
            title={logRequests ? t('header.stop') : t('header.record')}
            aria-pressed={logRequests}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition-colors cursor-pointer select-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              logRequests
                ? 'bg-red-100 dark:bg-red-500/10 border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {logRequests ? (
              <Square className='w-3 h-3 shrink-0' fill='currentColor' />
            ) : (
              <Circle className='w-3 h-3 shrink-0' />
            )}
            {logRequests ? t('header.stop') : t('header.record')}
          </button>

          <SettingsMenu
            theme={theme}
            language={language}
            onThemeChange={handleThemeChange}
            onLanguageChange={(lang) => handleLanguageChange(lang as Language)}
            showOpenWindow={showOpenWindowButton}
            onOpenWindow={handleOpenWindow}
            translations={{
              settings: t('settings.settings'),
              theme: t('settings.theme'),
              themeSystem: t('settings.themeSystem'),
              themeLight: t('settings.themeLight'),
              themeDark: t('settings.themeDark'),
              language: t('settings.language'),
              openWindow: t('header.openWindow'),
            }}
          />
        </div>
      </div>
      {logRequests && activeTabTitle && (
        <div className='flex items-center gap-2 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 rounded-full px-3 py-1 mt-3 w-fit'>
          <Circle className='w-2 h-2 fill-red-500 text-red-500 animate-pulse' />
          <span className='text-xs font-medium text-red-700 dark:text-red-400'>
            {t('header.recording', { tabTitle: activeTabTitle })}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(Header);
