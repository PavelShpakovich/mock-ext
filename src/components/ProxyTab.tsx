import React, { useState, useRef, useEffect } from 'react';
import { ProxyRule, MockRule, RequestLog } from '../types';
import { EditMode, RulesView, IconButtonVariant } from '../enums';
import { findConflictingRules } from '../helpers/ruleValidation';
import ProxyEditor from './ProxyEditor';
import ProxyRuleItem from './ProxyRuleItem';
import { CompactProxyRuleItem } from './CompactProxyRuleItem';
import { Input } from './ui/Input';
import { IconButton } from './ui/IconButton';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Search, PlusCircle, Plus, ArrowRightLeft, Download, Upload, List, LayoutList } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface ProxyTabProps {
  proxyRules: ProxyRule[];
  mockRules: MockRule[];
  editingRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: ProxyRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onDuplicateRule: (id: string) => void;
  onCancelEdit: () => void;
  onExportRules: () => void;
  onImportRules: (file: File) => void;
}

const ProxyTab: React.FC<ProxyTabProps> = ({
  proxyRules,
  mockRules,
  editingRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
  onCancelEdit,
  onExportRules,
  onImportRules,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [mockRequest, setMockRequest] = useState<RequestLog | null>(null);
  const [view, setView] = useState<RulesView>(RulesView.Detailed);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRules = proxyRules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rule.name.toLowerCase().includes(searchLower) ||
      rule.urlPattern.toLowerCase().includes(searchLower) ||
      rule.proxyTarget.toLowerCase().includes(searchLower) ||
      (rule.method || '').toLowerCase().includes(searchLower)
    );
  });

  const conflicts = findConflictingRules(proxyRules, mockRules);

  useEffect(() => {
    const requestData = sessionStorage.getItem('proxyRequest');
    if (requestData && editingRuleId === EditMode.New) {
      setMockRequest(JSON.parse(requestData));
      sessionStorage.removeItem('proxyRequest');
    } else if (!editingRuleId) {
      setMockRequest(null);
    }
  }, [editingRuleId]);

  if (editingRuleId) {
    return (
      <div className='p-6'>
        <ProxyEditor
          rule={editingRuleId === EditMode.New ? null : proxyRules.find((r) => r.id === editingRuleId) || null}
          mockRequest={mockRequest}
          onSave={onSaveRule}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className='p-6 flex flex-col gap-3'>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
        <Input
          placeholder={t('proxy.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          className='pl-8'
        />
      </div>

      {/* Toolbar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1'>
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            variant={IconButtonVariant.Ghost}
            title={t('rules.import')}
          >
            <Download className='w-5 h-5' />
          </IconButton>
          <IconButton
            onClick={onExportRules}
            variant={IconButtonVariant.Ghost}
            title={t('rules.exportAll')}
            disabled={proxyRules.length === 0}
          >
            <Upload className='w-5 h-5' />
          </IconButton>
          <div className='h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2' />
          <IconButton
            onClick={() => setView(RulesView.Detailed)}
            variant={view === RulesView.Detailed ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
            title={t('rules.viewDetailed')}
          >
            <List className='w-5 h-5' />
          </IconButton>
          <IconButton
            onClick={() => setView(RulesView.Compact)}
            variant={view === RulesView.Compact ? IconButtonVariant.Primary : IconButtonVariant.Ghost}
            title={t('rules.viewCompact')}
          >
            <LayoutList className='w-5 h-5' />
          </IconButton>
        </div>
        <IconButton
          onClick={() => onEditRule(EditMode.New)}
          variant={IconButtonVariant.Primary}
          title={t('proxy.createNew')}
        >
          <PlusCircle className='w-5 h-5' />
        </IconButton>
      </div>
      <input
        ref={fileInputRef}
        type='file'
        accept='.json'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImportRules(file);
            e.target.value = '';
          }
        }}
      />

      {/* Empty state */}
      {proxyRules.length === 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4'>
          <ArrowRightLeft className='w-12 h-12 text-gray-400 dark:text-gray-600' />
          <div className='flex flex-col gap-2'>
            <div className='text-gray-700 dark:text-gray-300 font-bold text-lg'>{t('proxy.empty')}</div>
            <div className='text-gray-500 dark:text-gray-500 text-sm'>{t('proxy.emptyDesc')}</div>
          </div>
          <Button onClick={() => onEditRule(EditMode.New)} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            {t('proxy.createNew')}
          </Button>
        </Card>
      )}

      {/* No search results */}
      {filteredRules.length === 0 && proxyRules.length > 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4'>
          <Search className='w-12 h-12 text-gray-400 dark:text-gray-600' />
          <div className='text-gray-700 dark:text-gray-300 font-bold text-lg'>{t('proxy.empty')}</div>
        </Card>
      )}

      {/* Rules list */}
      {filteredRules.length > 0 && (
        <div className='flex flex-col gap-2'>
          {filteredRules.map((rule) =>
            view === RulesView.Compact ? (
              <CompactProxyRuleItem
                key={rule.id}
                rule={rule}
                hasConflict={(conflicts.get(rule.id)?.length ?? 0) > 0}
                onEdit={() => onEditRule(rule.id)}
                onDelete={() => onDeleteRule(rule.id)}
                onToggle={() => onToggleRule(rule.id)}
                onDuplicate={() => onDuplicateRule(rule.id)}
              />
            ) : (
              <ProxyRuleItem
                key={rule.id}
                rule={rule}
                conflictingMockNames={conflicts.get(rule.id)}
                onEdit={() => onEditRule(rule.id)}
                onDelete={() => onDeleteRule(rule.id)}
                onToggle={() => onToggleRule(rule.id)}
                onDuplicate={() => onDuplicateRule(rule.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ProxyTab;
