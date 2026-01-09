import React from 'react';
import clsx from 'clsx';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  action?: React.ReactNode;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  fullWidth = true,
  action,
  className = '',
  id,
  ...props
}) => {
  const areaId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={clsx({ 'w-full': fullWidth }, className)}>
      <div className='flex items-center justify-between mb-1'>
        {label && (
          <label htmlFor={areaId} className='block text-sm font-bold text-gray-300'>
            {label}
          </label>
        )}
        {action}
      </div>
      <textarea
        id={areaId}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-sm custom-scrollbar bg-gray-700 text-white',
          {
            'border-red-500 placeholder-red-300': error,
            'border-gray-600 focus:border-green-500': !error,
          }
        )}
        {...props}
      />
      {error && <p className='text-red-400 text-sm mt-1'>{error}</p>}
    </div>
  );
};
