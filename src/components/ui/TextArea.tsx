import React from 'react';
import clsx from 'clsx';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelHint?: string;
  error?: string;
  fullWidth?: boolean;
  action?: React.ReactNode;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  labelHint,
  error,
  fullWidth = true,
  action,
  className = '',
  id,
  ...props
}) => {
  const areaId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={clsx('flex flex-col gap-1', { 'w-full': fullWidth }, className)}>
      <div className='flex items-center justify-between'>
        {label ? (
          <label
            htmlFor={areaId}
            className='text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 group'
          >
            {label}
            {labelHint && (
              <span className='relative inline-block'>
                <span className='text-gray-400 dark:text-gray-500 text-xs cursor-help'>ⓘ</span>
                <span className='absolute left-0 top-full translate-y-1 w-64 px-2 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none z-10 whitespace-normal'>
                  {labelHint}
                </span>
              </span>
            )}
          </label>
        ) : (
          <div />
        )}
        {action}
      </div>
      <textarea
        id={areaId}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600/50 dark:focus:ring-green-500/50 font-mono text-sm custom-scrollbar bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          {
            'border-red-500 placeholder-red-400 dark:placeholder-red-300': error,
            'border-gray-300 dark:border-gray-600 focus:border-green-600 dark:focus:border-green-500': !error,
          }
        )}
        {...props}
      />
      {error && <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>}
    </div>
  );
};
