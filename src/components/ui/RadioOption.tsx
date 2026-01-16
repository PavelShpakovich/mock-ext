import React from 'react';
import clsx from 'clsx';

interface RadioOptionProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  hoverColor?: 'green' | 'red' | 'blue';
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  hoverColor = 'green',
}) => {
  const hoverClasses = {
    green: 'hover:border-green-500 dark:hover:border-green-500',
    red: 'hover:border-red-500 dark:hover:border-red-500',
    blue: 'hover:border-blue-500 dark:hover:border-blue-500',
  };

  const radioColorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };

  return (
    <label
      className={clsx(
        'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors',
        'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900',
        hoverClasses[hoverColor]
      )}
    >
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={clsx('w-4 h-4 cursor-pointer', radioColorClasses[hoverColor])}
      />
      <div className='flex-1'>
        <div className='font-medium text-gray-900 dark:text-white'>{title}</div>
        <div className='text-sm text-gray-600 dark:text-gray-400'>{description}</div>
      </div>
    </label>
  );
};
