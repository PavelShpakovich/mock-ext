import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MockRule, RequestLog, Folder } from '../types';
import { ButtonVariant, ButtonSize } from '../enums';
import { isValidJSON } from '../helpers/validation';
import { convertArrayToHeaders, HeaderEntry } from '../helpers/headers';
import { getInitialFormData, RuleFormData } from '../helpers/ruleForm';
import { validateRuleForm, validateJSONDetailed, JSONValidation } from '../helpers/ruleValidation';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Card } from './ui/Card';
import { HeadersEditor } from './ui/HeadersEditor';
import { Maximize2, X } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface RuleEditorProps {
  rule: MockRule | null;
  mockRequest?: RequestLog | null;
  folders: Folder[];
  onSave: (rule: MockRule) => void;
  onCancel: () => void;
}

function buildMockRule(formData: RuleFormData, rule: MockRule | null): MockRule {
  let response: string | object = formData.responseBody;
  if (formData.contentType === 'application/json' && formData.responseBody.trim()) {
    try {
      response = JSON.parse(formData.responseBody);
    } catch {
      response = formData.responseBody;
    }
  }

  const now = Date.now();
  return {
    id: rule?.id || uuidv4(),
    name: formData.name,
    enabled: rule?.enabled ?? true,
    urlPattern: formData.urlPattern,
    matchType: formData.matchType,
    method: formData.method,
    statusCode: formData.statusCode,
    response,
    contentType: formData.contentType,
    delay: formData.delay,
    headers: convertArrayToHeaders(formData.headers),
    folderId: formData.folderId,
    created: rule?.created || now,
    modified: now,
    matchCount: rule?.matchCount,
    lastMatched: rule?.lastMatched,
  };
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, mockRequest, folders, onSave, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<RuleFormData>(() => getInitialFormData(rule, mockRequest));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [jsonValidation, setJsonValidation] = useState<JSONValidation | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);

  useBodyScrollLock(isExpanded);

  useEffect(() => {
    const newFormData = getInitialFormData(rule, mockRequest);
    setFormData(newFormData);

    const contentType = rule?.contentType || mockRequest?.contentType;
    if (contentType === 'application/json') {
      validateJSONField(newFormData.responseBody);
    }
  }, [rule, mockRequest]);

  const handleChange = (field: keyof RuleFormData, value: string | number | HeaderEntry[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'responseBody' && formData.contentType === 'application/json') {
      validateJSONField(value as string);
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateJSONField = (jsonString: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      setJsonValidation(validateJSONDetailed(jsonString));
    }, 500);
  };

  const validate = (): boolean => {
    const newErrors = validateRuleForm(formData, jsonValidation, t);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const savedRule = buildMockRule(formData, rule);
    onSave(savedRule);
  };

  const formatJSON = () => {
    if (formData.contentType === 'application/json' && isValidJSON(formData.responseBody)) {
      try {
        const formatted = JSON.stringify(JSON.parse(formData.responseBody), null, 2);
        handleChange('responseBody', formatted);
      } catch {
        // JSON parsing already validated by isValidJSON
      }
    }
  };

  return (
    <Card className='p-8 shadow-2xl'>
      <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-300 dark:border-gray-700'>
        {rule ? t('editor.updateRule') : t('editor.createRule')}
      </h2>

      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        <Input
          label={t('editor.ruleName')}
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder={t('editor.ruleNamePlaceholder')}
        />

        <Select
          label={`${t('editor.folder')} (${t('editor.optional')})`}
          value={formData.folderId || ''}
          onChange={(e) => {
            const value = e.target.value;
            setFormData((prev) => ({ ...prev, folderId: value || undefined }));
          }}
        >
          <option value=''>{t('editor.noFolder')}</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </Select>

        <div className='border-l-4 border-gray-300 dark:border-blue-500 bg-gray-50 dark:bg-blue-500/5 rounded-r-lg pl-4 pr-4 py-4 flex flex-col gap-4'>
          <Input
            label={t('editor.urlPattern')}
            required
            value={formData.urlPattern}
            onChange={(e) => handleChange('urlPattern', e.target.value)}
            error={errors.urlPattern}
            placeholder={t('editor.urlPatternPlaceholder')}
            className='font-mono text-sm'
          />

          <div className='grid grid-cols-2 gap-4'>
            <Select
              label={t('editor.matchType')}
              value={formData.matchType}
              onChange={(e) => handleChange('matchType', e.target.value)}
              description={
                formData.matchType === 'wildcard'
                  ? t('editor.wildcardDesc')
                  : formData.matchType === 'exact'
                    ? t('editor.exactDesc')
                    : t('editor.regexDesc')
              }
            >
              <option value='wildcard'>{t('editor.wildcard')}</option>
              <option value='exact'>{t('editor.exact')}</option>
              <option value='regex'>{t('editor.regex')}</option>
            </Select>

            <Select
              label={t('editor.method')}
              value={formData.method}
              onChange={(e) => handleChange('method', e.target.value)}
            >
              <option value=''>{t('editor.anyMethod')}</option>
              <option value='GET'>GET</option>
              <option value='POST'>POST</option>
              <option value='PUT'>PUT</option>
              <option value='DELETE'>DELETE</option>
              <option value='PATCH'>PATCH</option>
              <option value='OPTIONS'>OPTIONS</option>
              <option value='HEAD'>HEAD</option>
            </Select>
          </div>
        </div>

        <div className='border-l-4 border-gray-300 dark:border-green-500 bg-gray-50 dark:bg-green-500/5 rounded-r-lg pl-4 pr-4 py-4 flex flex-col gap-4'>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label={t('editor.statusCode')}
              type='number'
              value={formData.statusCode}
              onChange={(e) => handleChange('statusCode', parseInt(e.target.value))}
              min='100'
              max='599'
            />

            <Select
              label={t('editor.contentType')}
              value={formData.contentType}
              onChange={(e) => {
                const newContentType = e.target.value;
                handleChange('contentType', newContentType);
                if (newContentType === 'application/json') {
                  validateJSONField(formData.responseBody);
                } else {
                  setJsonValidation(null);
                }
              }}
            >
              <option value='application/json'>{t('editor.json')}</option>
              <option value='text/plain'>{t('editor.text')}</option>
            </Select>
          </div>

          <Input
            label={t('editor.delay')}
            type='number'
            value={formData.delay}
            onChange={(e) => handleChange('delay', parseInt(e.target.value) || 0)}
            min='0'
            step='100'
            placeholder={t('editor.delayPlaceholder')}
          />

          <HeadersEditor headers={formData.headers} onChange={(headers) => handleChange('headers', headers)} />

          <div>
            <TextArea
              label={t('editor.responseBody')}
              value={formData.responseBody}
              onChange={(e) => handleChange('responseBody', e.target.value)}
              rows={8}
              placeholder={t('editor.responseBodyPlaceholder')}
              className='font-mono text-sm custom-scrollbar'
              action={
                <div className='flex items-center gap-3'>
                  {formData.contentType === 'application/json' && (
                    <Button type='button' onClick={formatJSON} size={ButtonSize.Small} variant={ButtonVariant.Primary}>
                      {t('editor.beautify')}
                    </Button>
                  )}
                  <IconButton type='button' onClick={() => setIsExpanded(true)} title={t('common.expandEditor')}>
                    <Maximize2 className='w-4 h-4' />
                  </IconButton>
                </div>
              }
            />
            {formData.contentType === 'application/json' && jsonValidation && (
              <p
                className={clsx('text-xs mt-1 italic', {
                  'text-gray-400': jsonValidation.isValid,
                  'text-red-400 font-medium': !jsonValidation.isValid,
                })}
              >
                {jsonValidation.message}
              </p>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className='fixed inset-0 z-50 bg-white/95 dark:bg-black/95 flex flex-col m-0'>
            <div className='flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 shrink-0'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white'>{t('editor.responseBody')}</h3>
              <div className='flex items-center gap-3'>
                {formData.contentType === 'application/json' && (
                  <Button type='button' onClick={formatJSON} size={ButtonSize.Small} variant={ButtonVariant.Primary}>
                    {t('editor.beautify')}
                  </Button>
                )}
                <IconButton type='button' onClick={() => setIsExpanded(false)}>
                  <X className='w-5 h-5' />
                </IconButton>
              </div>
            </div>
            <div className='flex-1 p-6 overflow-hidden'>
              <textarea
                value={formData.responseBody}
                onChange={(e) => handleChange('responseBody', e.target.value)}
                placeholder={t('editor.responseBodyPlaceholder')}
                className='w-full h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 resize-none custom-scrollbar'
              />
            </div>
            {formData.contentType === 'application/json' && jsonValidation && (
              <div className='px-6 pb-2 shrink-0'>
                <p
                  className={clsx('text-xs italic', {
                    'text-gray-400': jsonValidation.isValid,
                    'text-red-400 font-medium': !jsonValidation.isValid,
                  })}
                >
                  {jsonValidation.message}
                </p>
              </div>
            )}
          </div>
        )}

        <div className='flex gap-3 pt-4'>
          <Button type='submit' className='flex-1 w-full'>
            {rule ? t('editor.updateRule') : t('editor.createRule')}
          </Button>
          <Button type='button' variant={ButtonVariant.Secondary} onClick={onCancel} className='flex-1 w-full'>
            {t('editor.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RuleEditor;
