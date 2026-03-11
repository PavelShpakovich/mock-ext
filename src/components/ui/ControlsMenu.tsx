import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { SlidersHorizontal, Circle, Square } from 'lucide-react';
import { IconButton } from './IconButton';
import { MenuToggleItem } from './MenuToggleItem';
import { useClickOutside } from '../../hooks/useClickOutside';

interface ControlsMenuProps {
  enabled: boolean;
  logRequests: boolean;
  corsAutoFix: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onToggleRecording: (logRequests: boolean) => void;
  onToggleCors: (corsAutoFix: boolean) => void;
  translations: {
    controls: string;
    appName: string;
    enabled: string;
    disabled: string;
    corsAutoFix: string;
    record: string;
    stop: string;
  };
}

export const ControlsMenu: React.FC<ControlsMenuProps> = ({
  enabled,
  logRequests,
  corsAutoFix,
  onToggleEnabled,
  onToggleRecording,
  onToggleCors,
  translations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

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
            'border-red-500 dark:border-red-500': logRequests,
            'border-green-500/60 dark:border-green-500/60': enabled && !logRequests,
          }
        )}
        title={translations.controls}
      >
        <SlidersHorizontal className='w-4 h-4' />
      </IconButton>

      {isOpen && (
        <div className='absolute right-0 top-full translate-y-2 w-60 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-50'>
          <div className='p-2 flex flex-col gap-0.5'>
            <MenuToggleItem
              label={translations.appName}
              checked={enabled}
              onChange={onToggleEnabled}
              statusText={enabled ? translations.enabled : translations.disabled}
              statusActive={enabled}
            />
            <MenuToggleItem
              label={translations.corsAutoFix}
              checked={corsAutoFix}
              onChange={onToggleCors}
              disabled={!enabled}
              statusText={corsAutoFix && enabled ? translations.enabled : translations.disabled}
              statusActive={corsAutoFix && enabled}
            />
          </div>

          <div className='border-t border-gray-200 dark:border-gray-700 p-2'>
            <button
              onClick={() => onToggleRecording(!logRequests)}
              disabled={!enabled}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                {
                  'text-red-600 dark:text-red-400 hover:bg-red-500/10': logRequests,
                  'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !logRequests,
                }
              )}
            >
              {logRequests ? (
                <>
                  <Square className='w-3.5 h-3.5' fill='currentColor' />
                  {translations.stop}
                </>
              ) : (
                <>
                  <Circle className='w-3.5 h-3.5' />
                  {translations.record}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
