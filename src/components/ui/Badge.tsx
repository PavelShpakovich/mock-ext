import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-700 text-gray-300 border border-gray-600',
    success: 'bg-green-900/30 text-green-400 border border-green-800',
    warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
    error: 'bg-red-900/30 text-red-400 border border-red-800',
    info: 'bg-blue-900/30 text-blue-400 border border-blue-800',
    purple: 'bg-purple-900/30 text-purple-400 border border-purple-800',
    outline: 'bg-transparent border border-gray-600 text-gray-400',
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-md text-xs font-bold shadow-sm', variants[variant], className)}>
      {children}
    </span>
  );
};

export const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const getVariant = (m: string): BadgeProps['variant'] => {
    switch (m.toUpperCase()) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'info';
      case 'PUT':
        return 'warning';
      case 'DELETE':
        return 'error';
      case 'PATCH':
        return 'purple';
      default:
        return 'default';
    }
  };

  return <Badge variant={getVariant(method)}>{method}</Badge>;
};

export const StatusCodeBadge: React.FC<{ code: number }> = ({ code }) => {
  const getColorClass = (c: number) => {
    if (c >= 200 && c < 300) return 'text-green-400';
    if (c >= 300 && c < 400) return 'text-blue-400';
    if (c >= 400 && c < 500) return 'text-orange-400';
    if (c >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <span
      className={clsx('text-sm font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-700', getColorClass(code))}
    >
      {code}
    </span>
  );
};
