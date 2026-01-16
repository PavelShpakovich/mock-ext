import React, { useEffect, useState } from 'react';
import { MockRule } from '../types';
import { ValidationWarning } from '../helpers';
import { ButtonVariant } from '../enums';
import RuleItem from './RuleItem';
import RuleEditor from './RuleEditor';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Search, Plus, FileText, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface RulesTabProps {
  rules: MockRule[];
  ruleWarnings: Map<string, ValidationWarning[]>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  editingRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: MockRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
  onResetRuleHits: (id: string) => void;
  onCancelEdit: () => void;
  onExportRules: (selectedIds?: string[]) => void;
  onImportRules: (file: File) => void;
}

const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  ruleWarnings,
  searchTerm,
  onSearchChange,
  editingRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
  onResetRuleHits,
  onCancelEdit,
  onExportRules,
  onImportRules,
}) => {
  const { t } = useI18n();
  const [mockRequest, setMockRequest] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredRules = rules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rule.name.toLowerCase().includes(searchLower) ||
      rule.urlPattern.toLowerCase().includes(searchLower) ||
      rule.method.toLowerCase().includes(searchLower)
    );
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportRules(file);
      e.target.value = '';
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const handleToggleSelection = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredRules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRules.map((r) => r.id)));
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size > 0) {
      onExportRules(Array.from(selectedIds));
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  useEffect(() => {
    const requestData = sessionStorage.getItem('mockRequest');
    if (requestData && editingRuleId === 'new') {
      setMockRequest(JSON.parse(requestData));
      sessionStorage.removeItem('mockRequest');
    } else if (!editingRuleId) {
      setMockRequest(null);
    }
  }, [editingRuleId]);

  return (
    <div className='p-6'>
      {editingRuleId ? (
        <RuleEditor
          rule={editingRuleId === 'new' ? null : rules.find((r) => r.id === editingRuleId) || null}
          onSave={onSaveRule}
          onCancel={onCancelEdit}
          mockRequest={mockRequest}
        />
      ) : (
        <>
          <div className='mb-3 relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
            <Input
              placeholder={t('rules.search')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              fullWidth
              className='pl-10'
            />
          </div>
          <div className='mb-4 flex justify-center flex-wrap gap-3'>
            {selectionMode ? (
              <>
                <Button
                  onClick={handleToggleSelectAll}
                  variant={ButtonVariant.Secondary}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                >
                  {selectedIds.size === filteredRules.length ? (
                    <CheckSquare className='w-4 h-4' />
                  ) : (
                    <Square className='w-4 h-4' />
                  )}
                  {selectedIds.size === filteredRules.length ? t('rules.deselectAll') : t('rules.selectAll')}
                </Button>
                <Button
                  onClick={handleExportSelected}
                  variant={ButtonVariant.Primary}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                  disabled={selectedIds.size === 0}
                >
                  <Upload className='w-4 h-4' />
                  {t('rules.exportSelected')} ({selectedIds.size})
                </Button>
                <Button
                  onClick={handleToggleSelectionMode}
                  variant={ButtonVariant.Secondary}
                  className='whitespace-nowrap cursor-pointer'
                >
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleImportClick}
                  variant={ButtonVariant.Secondary}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                >
                  <Download className='w-4 h-4' />
                  {t('rules.import')}
                </Button>
                <Button
                  onClick={() => onExportRules()}
                  variant={ButtonVariant.Secondary}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                  disabled={rules.length === 0}
                >
                  <Upload className='w-4 h-4' />
                  {t('rules.exportAll')}
                </Button>
                <Button
                  onClick={handleToggleSelectionMode}
                  variant={ButtonVariant.Secondary}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                  disabled={rules.length === 0}
                >
                  <CheckSquare className='w-4 h-4' />
                  {t('rules.selectToExport')}
                </Button>
                <Button
                  onClick={() => onEditRule('new')}
                  className='whitespace-nowrap flex items-center gap-2 cursor-pointer'
                >
                  <Plus className='w-4 h-4' />
                  {t('rules.addRule')}
                </Button>
              </>
            )}
            <input ref={fileInputRef} type='file' accept='.json' onChange={handleFileChange} className='hidden' />
          </div>

          {filteredRules.length === 0 ? (
            <Card className='flex items-center flex-col text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm'>
              <FileText className='w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600' />
              <div className='text-gray-700 dark:text-gray-300 font-bold text-lg mb-2'>{t('rules.noRules')}</div>
              <div className='text-gray-500 text-sm mb-4'>{t('rules.noRulesDesc')}</div>
              <Button onClick={() => onEditRule('new')} className='flex items-center gap-2 cursor-pointer'>
                <Plus className='w-4 h-4' />
                {t('rules.addRule')}
              </Button>
            </Card>
          ) : (
            <div className='space-y-2'>
              {filteredRules.map((rule) => (
                <div key={rule.id} className='relative'>
                  {selectionMode && (
                    <div className='absolute left-2 top-1/2 -translate-y-1/2 z-10'>
                      <button
                        onClick={() => handleToggleSelection(rule.id)}
                        className='flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors'
                      >
                        {selectedIds.has(rule.id) ? (
                          <CheckSquare className='w-5 h-5 text-green-600 dark:text-green-400' />
                        ) : (
                          <Square className='w-5 h-5 text-gray-400' />
                        )}
                      </button>
                    </div>
                  )}
                  <RuleItem
                    rule={rule}
                    warnings={ruleWarnings.get(rule.id) || []}
                    onEdit={() => onEditRule(rule.id)}
                    onDelete={() => onDeleteRule(rule.id)}
                    onToggle={() => onToggleRule(rule.id)}
                    onDuplicate={() => onDuplicateRule(rule.id)}
                    onResetHits={() => onResetRuleHits(rule.id)}
                    className={selectionMode ? 'pl-12' : ''}
                    disabled={selectionMode}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RulesTab;
