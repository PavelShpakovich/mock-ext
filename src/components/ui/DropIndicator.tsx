import React from 'react';
import clsx from 'clsx';
import { DropEdge } from '../../enums';

interface DropIndicatorProps {
  edge: DropEdge;
  isCompact?: boolean;
}

export const CustomDropIndicator: React.FC<DropIndicatorProps> = ({ edge, isCompact }) => {
  // Position the indicator in the middle of the gap
  let offsetClass = '';
  if (isCompact) {
    offsetClass = edge === DropEdge.Top ? '-top-[5px]' : '-bottom-[5px]';
  } else {
    offsetClass = edge === DropEdge.Top ? '-top-[9px]' : '-bottom-[9px]';
  }

  return (
    <div className={clsx('absolute left-0 right-0 z-50 pointer-events-none flex items-center', offsetClass)}>
      <div className='w-2 h-2 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-[0_0_4px_rgba(59,130,246,0.5)]' />
      <div className='flex-1 h-0.5 bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]' />
    </div>
  );
};
