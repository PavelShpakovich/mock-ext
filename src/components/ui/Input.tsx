import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, fullWidth = true, className = '', id, ...props }) => {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={clsx('flex flex-col gap-2', { 'w-full': fullWidth })}>
      {label && (
        <label htmlFor={inputId} className='block text-sm font-bold text-gray-700 dark:text-gray-300'>
          {label} {props.required && <span className='text-red-500 font-bold'>*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600/50 dark:focus:ring-green-500/50 transition-all text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-semibold',
          className,
          {
            'border-red-500 bg-red-50 dark:bg-red-900/20 placeholder-red-400 dark:placeholder-red-300': error,
            'border-gray-300 dark:border-gray-600 focus:border-green-600 dark:focus:border-green-500 bg-white dark:bg-gray-700':
              !error,
          }
        )}
        {...props}
      />
      {error && <p className='text-xs text-red-400 font-medium'>{error}</p>}
    </div>
  );
};
