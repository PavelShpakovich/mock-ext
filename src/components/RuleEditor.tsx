import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MockRule, RequestLog, Folder, ResponseMode } from '../types';
import { ButtonVariant } from '../enums';
import { isValidJSON } from '../helpers/validation';
import { convertArrayToHeaders, HeaderEntry } from '../helpers/headers';
import { getInitialFormData, RuleFormData } from '../helpers/ruleForm';
import { validateJSONDetailed, JSONValidation, validateRuleForm } from '../helpers/ruleValidation';
import { VALIDATION_DEBOUNCE_MS } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { RuleBasicInfo } from './RuleEditor/RuleBasicInfo';
import { RuleMatchingSection } from './RuleEditor/RuleMatchingSection';
import { RuleResponseSection } from './RuleEditor/RuleResponseSection';
import { ExpandedEditor } from './RuleEditor/ExpandedEditor';
import { useI18n } from '../contexts/I18nContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { X, Check } from 'lucide-react';

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
    responseHook: formData.responseHook,
    responseHookEnabled: formData.responseHookEnabled,
    responseMode: (formData.responseMode as ResponseMode) || ResponseMode.Mock,
  };
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, mockRequest, folders, onSave, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<RuleFormData>(() => getInitialFormData(rule, mockRequest));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHookExpanded, setIsHookExpanded] = useState(false);
  const [jsonValidation, setJsonValidation] = useState<JSONValidation | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);
  const hookValidationTimeoutRef = useRef<number | null>(null);

  useBodyScrollLock(isExpanded || isHookExpanded);

  useEffect(() => {
    const newFormData = getInitialFormData(rule, mockRequest);
    setFormData(newFormData);

    // Clear all errors when loading new rule
    setErrors({});

    const contentType = rule?.contentType || mockRequest?.contentType;
    if (contentType === 'application/json') {
      validateJSONField(newFormData.responseBody);
    }

    // Validate response hook if present
    if (newFormData.responseHook && newFormData.responseHook.trim()) {
      validateResponseHookField(newFormData.responseHook);
    }
  }, [rule, mockRequest]);

  const handleChange = (field: keyof RuleFormData, value: string | number | boolean | HeaderEntry[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'responseBody' && formData.contentType === 'application/json') {
      validateJSONField(value as string);
    }

    if (field === 'responseHook') {
      validateResponseHookField(value as string);
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
    }, VALIDATION_DEBOUNCE_MS);
  };

  const validateResponseHookField = async (hookCode: string) => {
    if (hookValidationTimeoutRef.current) {
      clearTimeout(hookValidationTimeoutRef.current);
    }

    hookValidationTimeoutRef.current = setTimeout(async () => {
      // Lazy load validation
      const { validateResponseHookLazy } = await import('../helpers/lazyValidation');
      const hookError = await validateResponseHookLazy(hookCode);
      if (hookError) {
        setErrors((prev) => ({ ...prev, responseHook: t('editor.validationError', { error: hookError }) }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.responseHook;
          return newErrors;
        });
      }
    }, VALIDATION_DEBOUNCE_MS);
  };

  const validate = async (): Promise<boolean> => {
    const newErrors = await validateRuleForm(formData, jsonValidation, t);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRule = async () => {
    if (!(await validate())) return;

    const savedRule = buildMockRule(formData, rule);
    onSave(savedRule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRule();
  };

  const handleSaveClick = async () => {
    await saveRule();
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

  const beautifyResponseHook = async () => {
    if (formData.responseHook && formData.responseHook.trim()) {
      try {
        // Lazy load Prettier only when beautify is clicked
        const prettier = await import('prettier/standalone');
        const parserBabel = await import('prettier/plugins/babel');
        const prettierPluginEstree = await import('prettier/plugins/estree');

        const formatted = await prettier.format(formData.responseHook, {
          parser: 'babel',
          plugins: [parserBabel.default, prettierPluginEstree.default],
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          printWidth: 80,
        });
        handleChange('responseHook', formatted.trim());
      } catch (error) {
        console.error('Failed to format code:', error);
        // If formatting fails, keep original
      }
    }
  };

  return (
    <Card className='p-8 shadow-2xl flex flex-col gap-6'>
      <div className='flex items-center justify-between pb-3 border-b border-gray-300 dark:border-gray-700'>
        <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>
          {rule ? t('editor.updateRule') : t('editor.createRule')}
        </h2>
        <div className='flex items-center gap-2'>
          <IconButton
            onClick={handleSaveClick}
            title={rule ? t('editor.updateRule') : t('editor.createRule')}
            disabled={formData.responseHookEnabled && !!errors.responseHook}
            className='text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Check className='w-5 h-5' />
          </IconButton>
          <IconButton onClick={onCancel} title={t('common.cancel')}>
            <X className='w-5 h-5' />
          </IconButton>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        <RuleBasicInfo
          name={formData.name}
          folderId={formData.folderId}
          folders={folders}
          errors={errors}
          onNameChange={(value) => handleChange('name', value)}
          onFolderChange={(value) => setFormData((prev) => ({ ...prev, folderId: value }))}
        />

        <RuleMatchingSection
          urlPattern={formData.urlPattern}
          matchType={formData.matchType}
          method={formData.method}
          errors={errors}
          onUrlPatternChange={(value) => handleChange('urlPattern', value)}
          onMatchTypeChange={(value) => handleChange('matchType', value)}
          onMethodChange={(value) => handleChange('method', value)}
        />

        <RuleResponseSection
          statusCode={formData.statusCode}
          contentType={formData.contentType}
          delay={formData.delay}
          headers={formData.headers}
          responseBody={formData.responseBody}
          responseHook={formData.responseHook}
          responseHookEnabled={formData.responseHookEnabled ?? false}
          responseMode={formData.responseMode as ResponseMode | undefined}
          jsonValidation={jsonValidation}
          errors={errors}
          onStatusCodeChange={(value) => handleChange('statusCode', value)}
          onContentTypeChange={(value) => {
            handleChange('contentType', value);
            if (value === 'application/json') {
              validateJSONField(formData.responseBody);
            } else {
              setJsonValidation(null);
            }
          }}
          onDelayChange={(value) => handleChange('delay', value)}
          onHeadersChange={(value) => handleChange('headers', value)}
          onResponseBodyChange={(value) => handleChange('responseBody', value)}
          onResponseHookChange={(value) => handleChange('responseHook', value)}
          onResponseHookEnabledChange={(value) => handleChange('responseHookEnabled', value)}
          onResponseModeChange={(value) => handleChange('responseMode', value)}
          onBeautifyJSON={formatJSON}
          onBeautifyHook={beautifyResponseHook}
          onExpandBody={() => setIsExpanded(true)}
          onExpandHook={() => setIsHookExpanded(true)}
        />

        {isExpanded && (
          <ExpandedEditor
            title={t('editor.responseBody')}
            value={formData.responseBody}
            placeholder={t('editor.responseBodyPlaceholder')}
            onChange={(value) => handleChange('responseBody', value)}
            onClose={() => setIsExpanded(false)}
            onBeautify={formData.contentType === 'application/json' ? formatJSON : undefined}
            validation={formData.contentType === 'application/json' && jsonValidation ? jsonValidation : undefined}
          />
        )}

        {isHookExpanded && (
          <ExpandedEditor
            title={t('editor.responseHook')}
            value={formData.responseHook || ''}
            placeholder={t('editor.responseHookPlaceholder')}
            onChange={(value) => handleChange('responseHook', value)}
            onClose={() => setIsHookExpanded(false)}
            onBeautify={beautifyResponseHook}
            error={errors.responseHook}
          />
        )}

        <div className='flex gap-3 pt-4'>
          <Button
            type='submit'
            className='flex-1 w-full'
            disabled={formData.responseHookEnabled && !!errors.responseHook}
          >
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
