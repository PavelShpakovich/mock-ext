import React from 'react';
import clsx from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'danger' | 'ghost' | 'primary';
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:ring-red-500',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-700/50 focus:ring-gray-500',
    primary: 'text-green-400 hover:text-green-300 hover:bg-green-500/10 focus:ring-green-500',
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
