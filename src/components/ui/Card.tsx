import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm transition-all',
        hoverEffect && 'hover:shadow-lg hover:border-green-600 dark:hover:border-green-500/40 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
