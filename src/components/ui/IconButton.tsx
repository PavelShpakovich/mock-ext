import React from 'react';
import clsx from 'clsx';
import { IconButtonVariant, IconButtonSize } from '../../enums';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = IconButtonVariant.Ghost,
  size = IconButtonSize.Medium,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    danger:
      'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 focus-visible:ring-red-500',
    ghost:
      'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 focus-visible:ring-gray-500',
    primary:
      'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-500/10 focus-visible:ring-green-500',
  };

  const sizes = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
  };

  return (
    <button className={clsx(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};
