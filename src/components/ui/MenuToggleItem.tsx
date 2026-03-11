import React from 'react';
import clsx from 'clsx';
import { Toggle } from './Toggle';

interface MenuToggleItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  statusText?: string;
  statusActive?: boolean;
}

export const MenuToggleItem: React.FC<MenuToggleItemProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  statusText,
  statusActive,
}) => {
  return (
    <div
      className={clsx('flex items-center justify-between gap-3 px-3 py-2 rounded', {
        'opacity-50': disabled,
      })}
    >
      <div className='flex flex-col min-w-0'>
        <span className='text-sm text-gray-800 dark:text-white'>{label}</span>
        {statusText && (
          <span
            className={clsx('text-xs font-medium', {
              'text-green-600 dark:text-green-400': statusActive,
              'text-gray-500 dark:text-gray-500': !statusActive,
            })}
          >
            {statusText}
          </span>
        )}
        {description && !statusText && (
          <span className='text-xs text-gray-500 dark:text-gray-400 leading-tight'>{description}</span>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
};
