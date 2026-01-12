import React, { useState, useEffect, useRef } from 'react';
import { MockRule, HttpMethod, MatchType, RequestLog } from '../types';
import { generateUUID, isValidJSON } from '../utils';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { HeadersInput } from './ui/HeadersInput';
import { Maximize2, X } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';

interface RuleEditorProps {
  rule: MockRule | null;
  mockRequest?: RequestLog | null;
  onSave: (rule: MockRule) => void;
  onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, mockRequest, onSave, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    urlPattern: '',
    matchType: 'wildcard' as MatchType,
    method: '' as HttpMethod,
    statusCode: 200,
    contentType: 'application/json',
    responseBody: '',
    headers: {} as Record<string, string>,
    delay: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [jsonValidation, setJsonValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (rule) {
      const responseBody = typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response, null, 2);
      setFormData({
        name: rule.name,
        urlPattern: rule.urlPattern,
        matchType: rule.matchType,
        method: rule.method,
        statusCode: rule.statusCode,
        contentType: rule.contentType,
        responseBody,
        headers: rule.headers || {},
        delay: rule.delay,
      });
      // Validate JSON on load
      if (rule.contentType === 'application/json') {
        validateJSON(responseBody);
      }
    } else if (mockRequest) {
      const responseBody = mockRequest.responseBody || '{}';
      setFormData({
        name: `Mock for ${new URL(mockRequest.url).pathname}`,
        urlPattern: mockRequest.url,
        matchType: 'exact',
        method: mockRequest.method as HttpMethod,
        statusCode: 200,
        contentType: mockRequest.contentType || 'application/json',
        responseBody,
        headers: {},
        delay: 0,
      });
      // Validate JSON on load
      if ((mockRequest.contentType || 'application/json') === 'application/json') {
        validateJSON(responseBody);
      }
    }
  }, [rule, mockRequest]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time JSON validation for response body
    if (field === 'responseBody' && formData.contentType === 'application/json') {
      validateJSON(value);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateJSON = (jsonString: string) => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Throttle validation with 500ms delay
    validationTimeoutRef.current = setTimeout(() => {
      if (!jsonString.trim()) {
        setJsonValidation({ isValid: true, message: 'Empty JSON is valid' });
        return;
      }

      try {
        JSON.parse(jsonString);
        setJsonValidation({ isValid: true, message: 'Valid JSON ✓' });
      } catch (e) {
        const error = e as Error;
        setJsonValidation({
          isValid: false,
          message: `Invalid JSON: ${error.message}`,
        });
      }
    }, 500);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('editor.validationError', { error: 'Name is required' });
    }

    if (!formData.urlPattern.trim()) {
      newErrors.urlPattern = t('editor.validationError', { error: 'URL pattern is required' });
    }

    if (formData.matchType === 'regex') {
      try {
        new RegExp(formData.urlPattern);
      } catch (e) {
        newErrors.urlPattern = t('editor.validationError', { error: 'Invalid regex pattern' });
      }
    }

    if (formData.contentType === 'application/json' && formData.responseBody.trim()) {
      // Use real-time validation state if available, otherwise fall back to isValidJSON
      if (jsonValidation && !jsonValidation.isValid) {
        newErrors.responseBody = jsonValidation.message;
      } else if (!jsonValidation && !isValidJSON(formData.responseBody)) {
        newErrors.responseBody = t('editor.validationError', { error: 'Invalid JSON' });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    let response: string | object = formData.responseBody;
    if (formData.contentType === 'application/json' && formData.responseBody.trim()) {
      try {
        response = JSON.parse(formData.responseBody);
      } catch (e) {
        response = formData.responseBody;
      }
    }

    const now = Date.now();
    const savedRule: MockRule = {
      id: rule?.id || generateUUID(),
      name: formData.name,
      enabled: rule?.enabled ?? true,
      urlPattern: formData.urlPattern,
      matchType: formData.matchType,
      method: formData.method,
      statusCode: formData.statusCode,
      response,
      contentType: formData.contentType,
      headers: Object.keys(formData.headers).length > 0 ? formData.headers : undefined,
      delay: formData.delay,
      created: rule?.created || now,
      modified: now,
    };

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

  // Keyboard shortcuts for editor
  useKeyboardShortcuts([
    {
      key: 's',
      ctrlOrCmd: true,
      handler: (e) => {
        e.preventDefault();
        handleSubmit(e as any);
      },
    },
    {
      key: 'Escape',
      handler: onCancel,
    },
  ]);

  return (
    <Card className='p-8 shadow-2xl'>
      <h2 className='text-2xl font-bold text-white mb-6 pb-3 border-b border-gray-700'>
        {rule ? t('editor.updateRule') : t('editor.createRule')}
      </h2>

      <form onSubmit={handleSubmit} className='space-y-5'>
        <Input
          label={t('editor.ruleName')}
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder={t('editor.ruleNamePlaceholder')}
        />

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
              // Re-validate when content type changes
              if (newContentType === 'application/json') {
                validateJSON(formData.responseBody);
              } else {
                setJsonValidation(null);
              }
            }}
          >
            <option value='application/json'>{t('editor.json')}</option>
            <option value='text/plain'>{t('editor.text')}</option>
          </Select>
        </div>

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
                  <button
                    type='button'
                    onClick={formatJSON}
                    className='px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded font-medium cursor-pointer transition-colors'
                  >
                    {t('editor.beautify')}
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => setIsExpanded(true)}
                  className='text-sm text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer'
                  title={t('common.expandEditor')}
                >
                  <Maximize2 className='w-4 h-4' />
                </button>
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
          {errors.responseBody && <p className='text-red-400 text-sm mt-1'>{errors.responseBody}</p>}
        </div>

        <HeadersInput headers={formData.headers} onChange={(headers) => handleChange('headers', headers)} />

        {isExpanded && (
          <div className='fixed inset-0 z-50 bg-black/95 flex flex-col' onClick={() => setIsExpanded(false)}>
            <div className='w-full h-full flex flex-col bg-gray-900' onClick={(e) => e.stopPropagation()}>
              <div className='flex items-center justify-between p-4 border-b border-gray-700 shrink-0'>
                <h3 className='text-lg font-bold text-white'>{t('editor.responseBody')}</h3>
                <div className='flex items-center gap-3'>
                  {formData.contentType === 'application/json' && (
                    <Button type='button' onClick={formatJSON} size='sm' variant='primary'>
                      {t('editor.beautify')}
                    </Button>
                  )}
                  <button
                    type='button'
                    onClick={() => setIsExpanded(false)}
                    className='text-gray-400 hover:text-white p-2 cursor-pointer'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
              </div>
              <div className='flex-1 p-6 overflow-hidden'>
                <textarea
                  value={formData.responseBody}
                  onChange={(e) => handleChange('responseBody', e.target.value)}
                  placeholder={t('editor.responseBodyPlaceholder')}
                  className='w-full h-full bg-gray-950 text-white border border-gray-700 rounded px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none custom-scrollbar'
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
              {errors.responseBody && (
                <div className='px-6 pb-4 shrink-0'>
                  <p className='text-red-400 text-sm'>{errors.responseBody}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Input
          label='Delay (ms)'
          type='number'
          value={formData.delay}
          onChange={(e) => handleChange('delay', parseInt(e.target.value) || 0)}
          min='0'
          step='100'
        />

        <div className='flex gap-3 pt-4'>
          <Button type='submit' className='flex-1 w-full'>
            {rule ? t('editor.updateRule') : t('editor.createRule')}
          </Button>
          <Button type='button' variant='secondary' onClick={onCancel} className='flex-1 w-full'>
            {t('editor.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RuleEditor;
