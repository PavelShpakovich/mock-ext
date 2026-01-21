import React from 'react';
import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <label
      className={clsx('relative inline-flex items-center gap-3', {
        'cursor-not-allowed opacity-50': disabled,
        'cursor-pointer': !disabled,
      })}
    >
      <input
        type='checkbox'
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className='sr-only peer'
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-600/50 dark:peer-focus:ring-green-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-green-600 dark:peer-checked:bg-green-500 peer-checked:ring-2 peer-checked:ring-green-600/50 dark:peer-checked:ring-green-500/50"></div>
      {label && <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</span>}
    </label>
  );
};
