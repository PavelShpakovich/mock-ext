import React from 'react';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => {
  return (
    <div className='flex flex-col gap-2'>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>{title}</label>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </div>
  );
};
