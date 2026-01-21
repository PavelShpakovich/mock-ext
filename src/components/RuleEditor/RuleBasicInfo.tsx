import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Folder } from '../../types';
import { useI18n } from '../../contexts/I18nContext';

interface RuleBasicInfoProps {
  name: string;
  folderId: string | undefined;
  folders: Folder[];
  errors: Record<string, string>;
  onNameChange: (name: string) => void;
  onFolderChange: (folderId: string | undefined) => void;
}

/**
 * Basic Rule Information Component
 *
 * Handles the basic metadata for a mock rule including name and folder organization.
 */
export const RuleBasicInfo: React.FC<RuleBasicInfoProps> = ({
  name,
  folderId,
  folders,
  errors,
  onNameChange,
  onFolderChange,
}) => {
  const { t } = useI18n();

  return (
    <>
      <Input
        label={t('editor.ruleName')}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        error={errors.name}
        placeholder={t('editor.ruleNamePlaceholder')}
      />

      <Select
        label={`${t('editor.folder')} (${t('editor.optional')})`}
        value={folderId || ''}
        onChange={(e) => {
          const value = e.target.value;
          onFolderChange(value || undefined);
        }}
      >
        <option value=''>{t('editor.noFolder')}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </Select>
    </>
  );
};
