import React from 'react';
import { ControlsMenu } from './ui/ControlsMenu';
import { SettingsMenu } from './ui/SettingsMenu';
import { Circle } from 'lucide-react';
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
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-3'>
          <img src={iconSrc} alt='Moq' className='w-10 h-10 rounded-lg shrink-0' />
          <h1 className='text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap'>{t('app.name')}</h1>

          {logRequests && activeTabTitle && (
            <div className='flex items-center gap-2 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 rounded-full px-3 py-1'>
              <Circle className='w-2 h-2 fill-red-500 text-red-500 animate-pulse' />
              <span className='text-xs font-medium text-red-700 dark:text-red-400'>
                {t('header.recording', { tabTitle: activeTabTitle })}
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <ControlsMenu
            enabled={enabled}
            logRequests={logRequests}
            corsAutoFix={corsAutoFix}
            onToggleEnabled={onToggleEnabled}
            onToggleRecording={onToggleRecording}
            onToggleCors={onToggleCors}
            translations={{
              controls: t('header.controls'),
              appName: t('app.name'),
              enabled: t('header.enabled'),
              disabled: t('header.disabled'),
              corsAutoFix: t('header.corsAutoFix'),
              record: t('header.record'),
              stop: t('header.stop'),
            }}
          />

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
    </div>
  );
};

export default React.memo(Header);
