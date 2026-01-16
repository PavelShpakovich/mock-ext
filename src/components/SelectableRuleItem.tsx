import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { MockRule } from '../types';
import { ValidationWarning } from '../helpers';
import { IconButton } from './ui/IconButton';
import RuleItem from './RuleItem';
import { IconButtonVariant, IconButtonSize } from '../enums';
import { useI18n } from '../contexts/I18nContext';

interface SelectableRuleItemProps {
  rule: MockRule;
  warnings: ValidationWarning[];
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onResetHits: () => void;
}

export const SelectableRuleItem: React.FC<SelectableRuleItemProps> = ({
  rule,
  warnings,
  selectionMode,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onResetHits,
}) => {
  const { t } = useI18n();

  return (
    <div className='relative'>
      {selectionMode && (
        <IconButton
          onClick={() => onToggleSelection(rule.id)}
          variant={isSelected ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
          size={IconButtonSize.Small}
          title={isSelected ? t('rules.deselectAll') : t('rules.selectAll')}
          className='p-0 border-0 outline-none! focus:ring-0! focus:ring-offset-0! absolute left-2 top-1/2 -translate-y-1/2 z-10'
        >
          {isSelected ? (
            <CheckSquare className='w-6 h-6 text-green-600 dark:text-green-400' />
          ) : (
            <Square className='w-6 h-6 text-gray-400' />
          )}
        </IconButton>
      )}
      <RuleItem
        rule={rule}
        warnings={warnings}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onDuplicate={onDuplicate}
        onResetHits={onResetHits}
        className={selectionMode ? 'pl-12' : ''}
        disabled={selectionMode}
      />
    </div>
  );
};
