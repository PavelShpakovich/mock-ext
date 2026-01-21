import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface MenuOptionProps {
  value: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const MenuOption: React.FC<MenuOptionProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer',
        {
          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white': isActive,
          'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50': !isActive,
        }
      )}
    >
      <span>{label}</span>
      {isActive && <Check className='w-4 h-4 text-green-600 dark:text-green-400' />}
    </button>
  );
};
