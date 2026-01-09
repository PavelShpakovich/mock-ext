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
    <div className={clsx({ 'w-full': fullWidth }, className)}>
      {label && (
        <label htmlFor={inputId} className='block text-sm font-bold text-gray-300 mb-2'>
          {label} {props.required && <span className='text-red-500 font-bold'>*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-white placeholder-gray-500 font-semibold',
          {
            'border-red-500 bg-red-900/20 placeholder-red-300': error,
            'border-gray-600 focus:border-green-500 bg-gray-700': !error,
          }
        )}
        {...props}
      />
      {error && <p className='text-red-400 text-sm mt-2 font-semibold'>⚠️ {error}</p>}
    </div>
  );
};
