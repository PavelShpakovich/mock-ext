import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'font-semibold rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer';

  const variants = {
    primary:
      'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent shadow-lg hover:shadow-xl',
    danger: 'bg-red-900/30 border border-red-900 hover:bg-red-900/50 text-red-400 focus:ring-red-500',
    ghost:
      'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent hover:border-gray-600 focus:ring-gray-500',
    secondary:
      'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-white focus:ring-gray-500',
    outline:
      'bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button className={clsx(baseStyles, variants[variant], sizes[size], widthClass, className)} {...props}>
      {children}
    </button>
  );
};
