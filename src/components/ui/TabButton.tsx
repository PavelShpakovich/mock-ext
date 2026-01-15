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
      'flex-1 px-6 py-4 font-bold text-sm transition-all duration-200 border-b-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600/30 dark:focus:ring-green-500/30',
      {
        'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-green-600 dark:border-green-500 shadow-inner':
          active,
        'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/60 dark:hover:bg-gray-900/60 border-transparent hover:border-gray-300 dark:hover:border-gray-700':
          !active,
      }
    )}
  >
    {children}
  </button>
);
