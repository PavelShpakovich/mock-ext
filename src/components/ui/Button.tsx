import React from 'react';
import clsx from 'clsx';
import { ButtonVariant, ButtonSize } from '../../enums';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = ButtonVariant.Primary,
  size = ButtonSize.Medium,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'font-semibold rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 cursor-pointer';

  const variants = {
    primary:
      'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:hover:shadow-lg',
    danger:
      'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-900 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-100 dark:disabled:hover:bg-red-900/30',
    ghost:
      'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 dark:disabled:hover:text-gray-400 disabled:hover:bg-transparent disabled:hover:border-transparent',
    secondary:
      'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300',
    outline:
      'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button className={clsx(baseStyles, variants[variant], sizes[size], widthClass, className)} {...props}>
      {children}
    </button>
  );
};
