import React from 'react';
import { IconButton } from '../ui/IconButton';
import { X, Wand2 } from 'lucide-react';
import clsx from 'clsx';

interface ExpandedEditorProps {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onBeautify?: () => void;
  error?: string;
  validation?: {
    isValid: boolean;
    message: string;
  };
}

/**
 * Expanded Editor Component
 *
 * Full-screen editor for response body or response hook code.
 * Provides a distraction-free editing experience with beautify option.
 */
export const ExpandedEditor: React.FC<ExpandedEditorProps> = ({
  title,
  value,
  placeholder,
  onChange,
  onClose,
  onBeautify,
  error,
  validation,
}) => {
  return (
    <div className='fixed inset-0 z-50 bg-white/95 dark:bg-black/95 flex flex-col m-0'>
      <div className='flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 shrink-0'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white'>{title}</h3>
        <div className='flex items-center gap-3'>
          {onBeautify && (
            <IconButton type='button' onClick={onBeautify} title='Beautify'>
              <Wand2 className='w-5 h-5' />
            </IconButton>
          )}
          <IconButton type='button' onClick={onClose}>
            <X className='w-5 h-5' />
          </IconButton>
        </div>
      </div>

      <div className='flex-1 p-6 overflow-hidden'>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='w-full h-full bg-white dark:bg-gray-950 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 resize-none custom-scrollbar'
        />
      </div>

      {(error || validation) && (
        <div className='px-6 pb-2 shrink-0'>
          {error && <p className='text-xs text-red-400 font-medium'>{error}</p>}
          {validation && (
            <p
              className={clsx('text-xs', {
                'text-gray-400': validation.isValid,
                'text-red-400 font-medium': !validation.isValid,
              })}
            >
              {validation.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
