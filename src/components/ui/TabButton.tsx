import React from 'react';
import clsx from 'clsx';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex-1 px-6 py-3 font-semibold text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-inset',
      {
        'text-green-600 dark:text-green-400 bg-white dark:bg-gray-900 border-b-2 border-green-600 dark:border-green-500':
          active,
        'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border-b-2 border-transparent':
          !active,
      }
    )}
  >
    {children}
  </button>
);
