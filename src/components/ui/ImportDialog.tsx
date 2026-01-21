import React from 'react';
import { MockRule } from '../../types';
import { ImportMode, ButtonVariant } from '../../enums';
import { getNewAndDuplicateRules, calculateAllImportStats, ImportPreview } from '../../helpers/importExport';
import { Button } from './Button';
import { Card } from './Card';
import { DialogHeader } from './DialogHeader';
import { RadioOption } from './RadioOption';
import { StatItem } from './StatItem';
import { InfoPanel } from './InfoPanel';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface ImportDialogProps {
  importedRules: MockRule[];
  existingRules: MockRule[];
  onConfirm: (mode: ImportMode) => void;
  onCancel: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ importedRules, existingRules, onConfirm, onCancel }) => {
  const { t } = useI18n();
  const [mode, setMode] = React.useState<ImportMode>(ImportMode.Merge);

  const { newRules, duplicateRules } = getNewAndDuplicateRules(existingRules, importedRules);
  const preview: ImportPreview = calculateAllImportStats(existingRules, importedRules);
  const currentStats = mode === ImportMode.Merge ? preview.merge : preview.replace;

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl max-h-[80vh] flex flex-col'>
        <DialogHeader title={t('import.previewTitle')} onClose={onCancel} closeLabel={t('common.cancel')} />

        <div className='p-6 flex-1 overflow-y-auto flex flex-col gap-6'>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
              <FileText className='w-5 h-5 text-blue-500' />
              <span className='font-medium'>
                {t('import.foundRules')}: {importedRules.length}
              </span>
            </div>

            <div className='flex flex-col gap-2'>
              <RadioOption
                name='import-mode'
                value={ImportMode.Merge}
                checked={mode === ImportMode.Merge}
                onChange={() => setMode(ImportMode.Merge)}
                title={t('import.mergeMode')}
                description={t('import.mergeModeDesc')}
                hoverColor='green'
              />

              <RadioOption
                name='import-mode'
                value={ImportMode.Replace}
                checked={mode === ImportMode.Replace}
                onChange={() => setMode(ImportMode.Replace)}
                title={t('import.replaceMode')}
                description={t('import.replaceModeDesc')}
                hoverColor='red'
              />
            </div>
          </div>

          {mode === ImportMode.Merge && (
            <InfoPanel variant='info'>
              <div className='flex flex-col gap-3'>
                <div className='font-medium text-gray-800 dark:text-white'>{t('import.mergePreview')}</div>
                <div className='flex flex-col gap-2'>
                  <StatItem
                    icon={CheckCircle}
                    iconColor='text-green-500'
                    label={t('import.newRules')}
                    value={newRules.length}
                  />
                  {duplicateRules.length > 0 && (
                    <StatItem
                      icon={AlertCircle}
                      iconColor='text-yellow-500'
                      label={t('import.duplicatesSkipped')}
                      value={duplicateRules.length}
                    />
                  )}
                </div>
                <div className='pt-2 border-t border-gray-300 dark:border-gray-700'>
                  <span className='font-medium text-gray-800 dark:text-white'>
                    {t('import.totalAfterMerge')}: {currentStats.total}
                  </span>
                </div>
              </div>
            </InfoPanel>
          )}

          {mode === ImportMode.Replace && (
            <InfoPanel variant='danger'>
              <div className='flex flex-col gap-3'>
                <div className='font-medium text-red-900 dark:text-red-400 flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5' />
                  {t('import.replaceWarning')}
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2 text-sm text-red-800 dark:text-red-300'>
                    <span>
                      {t('import.willRemove')}: {mode === ImportMode.Replace ? preview.replace.removed : 0}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-red-800 dark:text-red-300'>
                    <span>
                      {t('import.willAdd')}: {importedRules.length}
                    </span>
                  </div>
                </div>
              </div>
            </InfoPanel>
          )}
        </div>

        <div className='flex gap-3 p-6 border-t border-gray-300 dark:border-gray-700'>
          <Button
            onClick={() => onConfirm(mode)}
            className='flex-1'
            variant={mode === ImportMode.Replace ? ButtonVariant.Danger : ButtonVariant.Primary}
          >
            {mode === ImportMode.Merge ? t('import.confirmMerge') : t('import.confirmReplace')}
          </Button>
          <Button onClick={onCancel} variant={ButtonVariant.Secondary} className='flex-1'>
            {t('common.cancel')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
