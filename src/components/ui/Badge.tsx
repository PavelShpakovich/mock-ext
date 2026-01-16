import React from 'react';
import clsx from 'clsx';
import { BadgeVariant } from '../../enums';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = BadgeVariant.Default, className = '' }) => {
  const variants = {
    default:
      'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    success:
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-400 dark:border-green-800',
    warning:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800',
    purple:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-md text-xs font-bold shadow-sm', variants[variant], className)}>
      {children}
    </span>
  );
};

export const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const getVariant = (m: string): BadgeVariant => {
    switch (m.toUpperCase()) {
      case 'GET':
        return BadgeVariant.Success;
      case 'POST':
        return BadgeVariant.Info;
      case 'PUT':
        return BadgeVariant.Warning;
      case 'DELETE':
        return BadgeVariant.Error;
      case 'PATCH':
        return BadgeVariant.Purple;
      default:
        return BadgeVariant.Default;
    }
  };

  return <Badge variant={getVariant(method)}>{method}</Badge>;
};

export const StatusCodeBadge: React.FC<{ code: number }> = ({ code }) => {
  const getColorClass = (c: number) => {
    if (c >= 200 && c < 300) return 'text-green-700 dark:text-green-400';
    if (c >= 300 && c < 400) return 'text-blue-400';
    if (c >= 400 && c < 500) return 'text-orange-400';
    if (c >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <span
      className={clsx(
        'text-sm font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700',
        getColorClass(code)
      )}
    >
      {code}
    </span>
  );
};
