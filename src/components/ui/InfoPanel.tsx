import React from 'react';
import clsx from 'clsx';

interface InfoPanelProps {
  variant?: 'info' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ variant = 'info', children, className = '' }) => {
  const variantClasses = {
    info: 'bg-gray-50 dark:bg-gray-900',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50',
    danger: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50',
  };

  return <div className={clsx('space-y-3 rounded-lg p-4', variantClasses[variant], className)}>{children}</div>;
};
