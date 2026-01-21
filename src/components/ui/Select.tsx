import React from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  description,
  fullWidth = true,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={clsx('flex flex-col gap-2', { 'w-full': fullWidth }, className)}>
      {label && (
        <label htmlFor={selectId} className='block text-sm font-bold text-gray-700 dark:text-gray-300'>
          {label}
        </label>
      )}
      <div className='relative'>
        <select
          id={selectId}
          className={clsx(
            'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600/50 dark:focus:ring-green-500/50 focus:border-green-600 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold cursor-pointer transition-all shadow-sm appearance-none',
            {
              'border-red-500': error,
              'border-gray-300 dark:border-gray-600': !error,
            }
          )}
          {...props}
        >
          {children}
        </select>
        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400'>
          <svg className='fill-current h-4 w-4' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'>
            <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
          </svg>
        </div>
      </div>
      {description && <p className='text-gray-500 dark:text-gray-400 text-xs'>{description}</p>}
      {error && <p className='text-red-400 text-sm'>{error}</p>}
    </div>
  );
};
