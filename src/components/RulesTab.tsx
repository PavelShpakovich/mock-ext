import React, { useEffect, useState } from 'react';
import { MockRule } from '../types';
import RuleItem from './RuleItem';
import RuleEditor from './RuleEditor';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Search, Plus, FileText } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface RulesTabProps {
  rules: MockRule[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  editingRuleId: string | null;
  onEditRule: (id: string | null) => void;
  onSaveRule: (rule: MockRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onCancelEdit: () => void;
}

const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  searchTerm,
  onSearchChange,
  editingRuleId,
  onEditRule,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onCancelEdit,
}) => {
  const { t } = useI18n();
  const [mockRequest, setMockRequest] = useState<any>(null);

  useEffect(() => {
    const requestData = sessionStorage.getItem('mockRequest');
    if (requestData && editingRuleId === 'new') {
      setMockRequest(JSON.parse(requestData));
      sessionStorage.removeItem('mockRequest');
    }
  }, [editingRuleId]);

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.urlPattern.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='p-4'>
      {editingRuleId ? (
        <RuleEditor
          rule={editingRuleId === 'new' ? null : rules.find((r) => r.id === editingRuleId) || null}
          mockRequest={mockRequest}
          onSave={onSaveRule}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <div className='mb-4 flex gap-3 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
              <Input
                placeholder={t('rules.search')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                fullWidth
                className='pl-10'
              />
            </div>
            <Button onClick={() => onEditRule('new')} className='whitespace-nowrap flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              {t('rules.addRule')}
            </Button>
          </div>

          {filteredRules.length === 0 ? (
            <Card className='flex items-center flex-col text-center py-16 border-2 border-dashed border-gray-700 shadow-sm'>
              <FileText className='w-12 h-12 mx-auto mb-4 text-gray-600' />
              <div className='text-gray-300 font-bold text-lg mb-2'>{t('rules.noRules')}</div>
              <div className='text-gray-500 text-sm mb-4'>{t('rules.noRulesDesc')}</div>
              <Button onClick={() => onEditRule('new')} className='flex items-center gap-2'>
                <Plus className='w-4 h-4' />
                {t('rules.addRule')}
              </Button>
            </Card>
          ) : (
            <div className='space-y-2'>
              {filteredRules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  onEdit={() => onEditRule(rule.id)}
                  onDelete={() => onDeleteRule(rule.id)}
                  onToggle={() => onToggleRule(rule.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RulesTab;
