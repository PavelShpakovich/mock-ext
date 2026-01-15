import React from 'react';

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
  showBorder?: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ title, children, showBorder = false }) => {
  return (
    <div className={`p-3 ${showBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <div className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-2'>{title}</div>
      <div className='space-y-1'>{children}</div>
    </div>
  );
};
