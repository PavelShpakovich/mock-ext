import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number | string;
}

export const StatItem: React.FC<StatItemProps> = ({ icon: Icon, iconColor, label, value }) => {
  return (
    <div className='flex items-center gap-2 text-sm'>
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className='text-gray-700 dark:text-gray-300'>
        {label}: {value}
      </span>
    </div>
  );
};
