import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProxyRule, RequestLog } from '../types';
import { ButtonVariant, HttpMethod } from '../enums';
import { validateProxyRuleForm } from '../helpers/ruleValidation';
import { VALIDATION_DEBOUNCE_MS } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';
import { IconButton } from './ui/IconButton';
import { Toggle } from './ui/Toggle';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { PROXY_EDITOR_SECTIONS_CONFIG } from '../config/editorSections';
import { ExpandedEditor } from './RuleEditor/ExpandedEditor';
import { useI18n } from '../contexts/I18nContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { X, Check, Maximize2, Wand2, AlertTriangle } from 'lucide-react';

interface ProxyEditorProps {
  rule: ProxyRule | null;
  mockRequest?: RequestLog | null;
  onSave: (rule: ProxyRule) => void | Promise<void>;
  onCancel: () => void;
}

interface ProxyFormData {
  name: string;
  urlPattern: string;
  matchType: string;
  method: string;
  proxyTarget: string;
  pathRewriteFrom: string;
  pathRewriteTo: string;
  delay: number;
  responseHook: string;
  responseHookEnabled: boolean;
}

function getInitialFormData(rule: ProxyRule | null, mockRequest?: RequestLog | null): ProxyFormData {
  if (rule) {
    return {
      name: rule.name,
      urlPattern: rule.urlPattern,
      matchType: rule.matchType,
      method: rule.method,
      proxyTarget: rule.proxyTarget,
      pathRewriteFrom: rule.pathRewriteFrom || '',
      pathRewriteTo: rule.pathRewriteTo || '',
      delay: rule.delay || 0,
      responseHook: rule.responseHook || '',
      responseHookEnabled: rule.responseHookEnabled ?? false,
    };
  }

  if (mockRequest) {
    return {
      name: `Proxy: ${mockRequest.method} ${new URL(mockRequest.url).pathname}`,
      urlPattern: mockRequest.url.replace(/[?#].*$/, '*'),
      matchType: 'wildcard',
      method: mockRequest.method,
      proxyTarget: '',
      pathRewriteFrom: '',
      pathRewriteTo: '',
      delay: 0,
      responseHook: '',
      responseHookEnabled: false,
    };
  }

  return {
    name: '',
    urlPattern: '',
    matchType: 'wildcard',
    method: '',
    proxyTarget: '',
    pathRewriteFrom: '',
    pathRewriteTo: '',
    delay: 0,
    responseHook: '',
    responseHookEnabled: false,
  };
}

function buildProxyRule(formData: ProxyFormData, rule: ProxyRule | null): ProxyRule {
  const now = Date.now();
  return {
    id: rule?.id || uuidv4(),
    name: formData.name,
    enabled: rule?.enabled ?? true,
    urlPattern: formData.urlPattern,
    matchType: formData.matchType as ProxyRule['matchType'],
    method: formData.method as HttpMethod,
    proxyTarget: formData.proxyTarget,
    pathRewriteFrom: formData.pathRewriteFrom || undefined,
    pathRewriteTo: formData.pathRewriteTo || undefined,
    delay: formData.delay,
    created: rule?.created || now,
    modified: now,
    matchCount: rule?.matchCount,
    lastMatched: rule?.lastMatched,
    responseHook: formData.responseHook || undefined,
    responseHookEnabled: formData.responseHookEnabled,
  };
}

const ProxyEditor: React.FC<ProxyEditorProps> = ({ rule, mockRequest, onSave, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ProxyFormData>(() => getInitialFormData(rule, mockRequest));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isHookExpanded, setIsHookExpanded] = useState(false);
  const hookValidationTimeoutRef = useRef<number | null>(null);

  useBodyScrollLock(isHookExpanded);

  const validateResponseHookField = useCallback(
    async (hookCode: string) => {
      if (hookValidationTimeoutRef.current) {
        clearTimeout(hookValidationTimeoutRef.current);
      }

      hookValidationTimeoutRef.current = window.setTimeout(async () => {
        const { validateResponseHookLazy } = await import('../helpers/lazyValidation');
        const hookError = await validateResponseHookLazy(hookCode, t);
        if (hookError) {
          setErrors((prev) => ({ ...prev, responseHook: hookError }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.responseHook;
            return newErrors;
          });
        }
      }, VALIDATION_DEBOUNCE_MS);
    },
    [t]
  );

  useEffect(() => {
    const newFormData = getInitialFormData(rule, mockRequest);
    setFormData(newFormData);
    setErrors({});

    if (newFormData.responseHook && newFormData.responseHook.trim()) {
      validateResponseHookField(newFormData.responseHook);
    }
  }, [rule, mockRequest, validateResponseHookField]);

  const handleChange = (field: keyof ProxyFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

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

  const validate = async (): Promise<boolean> => {
    const newErrors = await validateProxyRuleForm(formData, t);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRule = async () => {
    if (!(await validate())) return;
    const savedRule = buildProxyRule(formData, rule);
    await onSave(savedRule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRule();
  };

  const beautifyResponseHook = async () => {
    if (formData.responseHook && formData.responseHook.trim()) {
      try {
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
      }
    }
  };

  const getMatchTypeDescription = () => {
    switch (formData.matchType) {
      case 'wildcard':
        return t('editor.wildcardDesc');
      case 'exact':
        return t('editor.exactDesc');
      case 'regex':
        return t('editor.regexDesc');
      default:
        return '';
    }
  };

  return (
    <Card className='p-8 shadow-2xl flex flex-col gap-6'>
      <div className='flex items-center justify-between pb-3 border-b border-gray-300 dark:border-gray-700'>
        <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>
          {rule ? t('proxy.updateRule') : t('proxy.createRule')}
        </h2>
        <div className='flex items-center gap-2'>
          <IconButton
            onClick={saveRule}
            title={rule ? t('proxy.updateRule') : t('proxy.createRule')}
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
        {/* Name */}
        <Input
          label={t('editor.ruleName')}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder={t('editor.ruleNamePlaceholder')}
        />

        {/* Matching Section */}
        <CollapsibleSection
          title={t('proxy.matchingSection')}
          defaultOpen={PROXY_EDITOR_SECTIONS_CONFIG.matching.defaultOpen}
          borderColor='border-gray-300 dark:border-blue-500'
          bgColor='bg-gray-50 dark:bg-blue-500/5'
        >
          <Input
            label={t('editor.urlPattern')}
            value={formData.urlPattern}
            onChange={(e) => handleChange('urlPattern', e.target.value)}
            error={errors.urlPattern}
            placeholder={t('editor.urlPatternPlaceholder')}
          />

          <div className='grid grid-cols-2 gap-4'>
            <Select
              label={t('editor.matchType')}
              value={formData.matchType}
              onChange={(e) => handleChange('matchType', e.target.value)}
              description={getMatchTypeDescription()}
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
        </CollapsibleSection>

        {/* Proxy Configuration Section */}
        <CollapsibleSection
          title={t('proxy.proxyConfigSection')}
          defaultOpen={PROXY_EDITOR_SECTIONS_CONFIG.proxyConfig.defaultOpen}
          borderColor='border-gray-300 dark:border-purple-500'
          bgColor='bg-gray-50 dark:bg-purple-500/5'
        >
          <Input
            label={t('proxy.targetLabel')}
            value={formData.proxyTarget}
            onChange={(e) => handleChange('proxyTarget', e.target.value)}
            error={errors.proxyTarget}
            placeholder={t('proxy.targetPlaceholder')}
          />

          <div className='grid grid-cols-2 gap-4'>
            <Input
              label={t('proxy.pathRewriteFrom')}
              value={formData.pathRewriteFrom}
              onChange={(e) => handleChange('pathRewriteFrom', e.target.value)}
              placeholder={t('proxy.pathRewriteFromPlaceholder')}
            />
            <Input
              label={t('proxy.pathRewriteTo')}
              value={formData.pathRewriteTo}
              onChange={(e) => handleChange('pathRewriteTo', e.target.value)}
              placeholder={t('proxy.pathRewriteToPlaceholder')}
            />
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
        </CollapsibleSection>

        {/* Response Hook Section */}
        <CollapsibleSection
          title={
            <>
              <span>{t('proxy.hookSection')}</span>
              {formData.responseHook?.trim() && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    formData.responseHookEnabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {formData.responseHookEnabled ? t('editor.responseHookEnabled') : t('editor.responseHookDisabled')}
                </span>
              )}
            </>
          }
          defaultOpen={PROXY_EDITOR_SECTIONS_CONFIG.responseHook.defaultOpen}
          borderColor='border-gray-300 dark:border-purple-500'
          bgColor='bg-gray-50 dark:bg-purple-500/5'
        >
          <div className='flex flex-col gap-2'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{t('editor.responseHookDescription')}</p>

            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1'>
                  {t('editor.securityWarning') || 'Security Warning'}
                </p>
                <p className='text-xs text-amber-800 dark:text-amber-300'>{t('editor.securityWarningMessage')}</p>
              </div>
            </div>

            <TextArea
              label=''
              value={formData.responseHook}
              onChange={(e) => handleChange('responseHook', e.target.value)}
              rows={6}
              placeholder={t('editor.responseHookPlaceholder')}
              className='font-mono text-xs custom-scrollbar'
              action={
                <div className='flex items-center gap-3'>
                  {formData.responseHook?.trim() && (
                    <Toggle
                      checked={formData.responseHookEnabled}
                      onChange={(val) => handleChange('responseHookEnabled', val)}
                    />
                  )}
                  <IconButton type='button' onClick={beautifyResponseHook} title={t('editor.beautify')}>
                    <Wand2 className='w-4 h-4' />
                  </IconButton>
                  <IconButton type='button' onClick={() => setIsHookExpanded(true)} title={t('common.expandEditor')}>
                    <Maximize2 className='w-4 h-4' />
                  </IconButton>
                </div>
              }
            />

            {errors.responseHook && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2'>
                <p className='text-xs text-red-400 font-medium'>{errors.responseHook}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {isHookExpanded && (
          <ExpandedEditor
            title={t('editor.responseHook')}
            value={formData.responseHook}
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
            {rule ? t('proxy.updateRule') : t('proxy.createRule')}
          </Button>
          <Button type='button' variant={ButtonVariant.Secondary} onClick={onCancel} className='flex-1 w-full'>
            {t('editor.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProxyEditor;
