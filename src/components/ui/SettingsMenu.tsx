import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { Settings } from 'lucide-react';
import { IconButton } from './IconButton';
import { MenuSection } from './MenuSection';
import { MenuOption } from './MenuOption';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Theme, Language } from '../../enums';

interface SettingsMenuProps {
  theme: Theme;
  language: Language;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange: (language: Language) => void;
  showOpenWindow?: boolean;
  onOpenWindow?: () => void;
  translations: {
    settings: string;
    theme: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
    language: string;
    openWindow?: string;
  };
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  theme,
  language,
  onThemeChange,
  onLanguageChange,
  showOpenWindow,
  onOpenWindow,
  translations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  const themeOptions: { value: Theme; label: string }[] = [
    { value: Theme.System, label: translations.themeSystem },
    { value: Theme.Light, label: translations.themeLight },
    { value: Theme.Dark, label: translations.themeDark },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: Language.English, label: 'English' },
    { value: Language.Russian, label: 'Русский' },
  ];

  return (
    <div className='relative' ref={menuRef}>
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-2 border',
          'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
          'text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white',
          'hover:bg-gray-300 dark:hover:bg-gray-600',
          {
            'bg-gray-300 dark:bg-gray-600': isOpen,
          }
        )}
        title={translations.settings}
      >
        <Settings
          className={clsx('w-4 h-4 transition-transform duration-300', {
            'rotate-90': isOpen,
          })}
        />
      </IconButton>

      {isOpen && (
        <div className='absolute right-0 top-full translate-y-2 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-50'>
          <MenuSection title={translations.theme} showBorder>
            {themeOptions.map((option) => (
              <MenuOption
                key={option.value}
                value={option.value}
                label={option.label}
                isActive={theme === option.value}
                onClick={() => onThemeChange(option.value)}
              />
            ))}
          </MenuSection>

          <MenuSection title={translations.language} showBorder={showOpenWindow}>
            {languageOptions.map((option) => (
              <MenuOption
                key={option.value}
                value={option.value}
                label={option.label}
                isActive={language === option.value}
                onClick={() => onLanguageChange(option.value)}
              />
            ))}
          </MenuSection>

          {showOpenWindow && onOpenWindow && translations.openWindow && (
            <div className='p-2'>
              <button
                onClick={() => {
                  onOpenWindow();
                  setIsOpen(false);
                }}
                className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer'
              >
                {translations.openWindow}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
