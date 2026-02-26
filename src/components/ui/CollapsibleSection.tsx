import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  borderColor?: string;
  bgColor?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  borderColor = 'border-gray-300 dark:border-blue-500',
  bgColor = 'bg-gray-50 dark:bg-blue-500/5',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={clsx('border-l-4 rounded-r-lg', borderColor, bgColor, {
        'pl-4 pr-4 py-4': isOpen,
        'pl-4 pr-4 py-2': !isOpen,
      })}
    >
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 w-full text-left font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer'
      >
        {isOpen ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
        <div className='flex items-center gap-2 flex-1'>{title}</div>
      </button>

      {isOpen && <div className='mt-4 flex flex-col gap-4'>{children}</div>}
    </div>
  );
};
