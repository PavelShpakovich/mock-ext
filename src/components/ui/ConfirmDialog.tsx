import React from 'react';
import { Button } from './Button';
import { DialogHeader } from './DialogHeader';
import { ButtonVariant, ConfirmDialogVariant } from '../../enums';
import { useI18n } from '../../contexts/I18nContext';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  variant = ConfirmDialogVariant.Primary,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' onClick={onCancel}>
      <div
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col gap-6'
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader title={title} onClose={onCancel} />

        {variant === ConfirmDialogVariant.Danger && (
          <div className='flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg'>
            <AlertTriangle className='w-5 h-5 text-red-600 dark:text-red-400 shrink-0' />
            <p className='text-sm text-red-700 dark:text-red-300'>{message}</p>
          </div>
        )}
        {variant === ConfirmDialogVariant.Primary && (
          <p className='text-gray-700 dark:text-gray-300 text-sm'>{message}</p>
        )}

        <div className='flex justify-end gap-2'>
          <Button onClick={onCancel} variant={ButtonVariant.Secondary} className='cursor-pointer'>
            {cancelText || t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant === ConfirmDialogVariant.Danger ? ButtonVariant.Danger : ButtonVariant.Primary}
            className='cursor-pointer'
          >
            {confirmText || t('common.ok')}
          </Button>
        </div>
      </div>
    </div>
  );
};
