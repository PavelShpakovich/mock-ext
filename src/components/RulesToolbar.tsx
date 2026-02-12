import React from 'react';
import { Download, Upload, CheckSquare, Square, FolderPlus, PlusCircle, List, LayoutList } from 'lucide-react';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { ButtonVariant, IconButtonVariant, RulesView } from '../enums';
import { useI18n } from '../contexts/I18nContext';

interface RulesToolbarProps {
  selectionMode: boolean;
  selectedCount: number;
  totalFilteredCount: number;
  totalRulesCount: number;
  currentView: RulesView;
  onToggleSelectionMode: () => void;
  onToggleSelectAll: () => void;
  onExportSelected: () => void;
  onExportAll: () => void;
  onImportClick: () => void;
  onCreateFolder: () => void;
  onCreateRule: () => void;
  onViewChange: (view: RulesView) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RulesToolbar: React.FC<RulesToolbarProps> = ({
  selectionMode,
  selectedCount,
  totalFilteredCount,
  totalRulesCount,
  currentView,
  onToggleSelectionMode,
  onToggleSelectAll,
  onExportSelected,
  onExportAll,
  onImportClick,
  onCreateFolder,
  onCreateRule,
  onViewChange,
  fileInputRef,
  onFileChange,
}) => {
  const { t } = useI18n();

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2'>
        {selectionMode ? (
          <>
            <IconButton
              onClick={onToggleSelectAll}
              variant={IconButtonVariant.Ghost}
              title={selectedCount === totalFilteredCount ? t('rules.deselectAll') : t('rules.selectAll')}
            >
              {selectedCount === totalFilteredCount ? (
                <CheckSquare className='w-5 h-5' />
              ) : (
                <Square className='w-5 h-5' />
              )}
            </IconButton>
            <Button
              onClick={onExportSelected}
              variant={ButtonVariant.Primary}
              className='flex items-center gap-2 cursor-pointer'
              disabled={selectedCount === 0}
            >
              <Upload className='w-4 h-4' />
              {t('rules.exportSelected')} ({selectedCount})
            </Button>
            <Button onClick={onToggleSelectionMode} variant={ButtonVariant.Secondary} className='cursor-pointer'>
              {t('common.cancel')}
            </Button>
          </>
        ) : (
          <>
            <IconButton onClick={onImportClick} variant={IconButtonVariant.Ghost} title={t('rules.import')}>
              <Download className='w-5 h-5' />
            </IconButton>
            <IconButton
              onClick={onExportAll}
              variant={IconButtonVariant.Ghost}
              title={t('rules.exportAll')}
              disabled={totalRulesCount === 0}
            >
              <Upload className='w-5 h-5' />
            </IconButton>
            <IconButton
              onClick={onToggleSelectionMode}
              variant={IconButtonVariant.Ghost}
              title={t('rules.selectToExport')}
              disabled={totalRulesCount === 0}
            >
              <CheckSquare className='w-5 h-5' />
            </IconButton>
            <IconButton onClick={onCreateFolder} variant={IconButtonVariant.Ghost} title={t('folders.createFolder')}>
              <FolderPlus className='w-5 h-5' />
            </IconButton>
            <div className='h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2' />
            <IconButton
              onClick={() => onViewChange(RulesView.Detailed)}
              variant={currentView === RulesView.Detailed ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
              title={t('rules.viewDetailed')}
            >
              <List className='w-5 h-5' />
            </IconButton>
            <IconButton
              onClick={() => onViewChange(RulesView.Compact)}
              variant={currentView === RulesView.Compact ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
              title={t('rules.viewCompact')}
            >
              <LayoutList className='w-5 h-5' />
            </IconButton>
          </>
        )}
      </div>

      {!selectionMode && (
        <IconButton onClick={onCreateRule} variant={IconButtonVariant.Primary} title={t('rules.addRule')}>
          <PlusCircle className='w-5 h-5' />
        </IconButton>
      )}

      <input ref={fileInputRef} type='file' accept='.json' onChange={onFileChange} className='hidden' />
    </div>
  );
};
