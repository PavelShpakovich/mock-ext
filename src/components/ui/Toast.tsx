import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { ToastType } from '../../enums';

export type { ToastType };

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const icons = {
    [ToastType.Success]: <CheckCircle className='w-5 h-5' />,
    [ToastType.Error]: <XCircle className='w-5 h-5' />,
    [ToastType.Info]: <Info className='w-5 h-5' />,
    [ToastType.Warning]: <AlertCircle className='w-5 h-5' />,
  };

  const styles = {
    [ToastType.Success]: 'bg-white dark:bg-gray-800 border-green-500 text-green-700 dark:text-green-300',
    [ToastType.Error]: 'bg-white dark:bg-gray-800 border-red-500 text-red-700 dark:text-red-300',
    [ToastType.Info]: 'bg-white dark:bg-gray-800 border-blue-500 text-blue-700 dark:text-blue-300',
    [ToastType.Warning]: 'bg-white dark:bg-gray-800 border-yellow-500 text-yellow-700 dark:text-yellow-300',
  };

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-2 flex items-start gap-3 animate-slide-in-from-right',
        styles[type]
      )}
    >
      <div className='shrink-0 mt-0.5'>{icons[type]}</div>
      <p className='flex-1 text-sm font-medium'>{message}</p>
      <button
        onClick={onClose}
        className='shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
};
