import React from 'react';
import { IconButton } from './IconButton';
import { X } from 'lucide-react';

interface DialogHeaderProps {
  title: string;
  onClose: () => void;
  closeLabel?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title, onClose, closeLabel }) => {
  return (
    <div className='flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700'>
      <h2 className='text-xl font-bold text-gray-900 dark:text-white'>{title}</h2>
      <IconButton onClick={onClose} title={closeLabel}>
        <X className='w-5 h-5' />
      </IconButton>
    </div>
  );
};
