import React, { useState, useEffect } from 'react';
import { Folder } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { validateFolderName } from '../helpers';
import { useI18n } from '../contexts/I18nContext';
import { ButtonVariant } from '../enums';

interface FolderEditorProps {
  folder: Folder | null;
  existingFolders: Folder[];
  onSave: (name: string) => void;
  onCancel: () => void;
}

const FolderEditor: React.FC<FolderEditorProps> = ({ folder, existingFolders, onSave, onCancel }) => {
  const { t } = useI18n();
  const [name, setName] = useState(folder?.name || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(folder?.name || '');
    setError(null);
  }, [folder]);

  const handleSave = () => {
    const validationErrorKey = validateFolderName(name, existingFolders, folder?.id);
    if (validationErrorKey) {
      setError(t(validationErrorKey));
      return;
    }

    onSave(name.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50' onClick={onCancel}>
      <div
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>
          {folder ? t('folders.renameFolder') : t('folders.createFolder')}
        </h2>

        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            {t('folders.folderName')}
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyPress}
            placeholder={t('folders.folderNamePlaceholder')}
            fullWidth
            autoFocus
          />
          {error && <div className='text-red-600 dark:text-red-400 text-sm mt-1'>{error}</div>}
        </div>

        <div className='flex justify-end gap-2'>
          <Button onClick={onCancel} variant={ButtonVariant.Secondary} className='cursor-pointer'>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} className='cursor-pointer'>
            {folder ? t('common.save') : t('folders.create')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FolderEditor;
