import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MockRule, HttpMethod, MatchType, RequestLog } from '../types';
import { isValidJSON } from '../helpers/validation';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Card } from './ui/Card';
import { Maximize2, X, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';

interface RuleEditorProps {
  rule: MockRule | null;
  mockRequest?: RequestLog | null;
  onSave: (rule: MockRule) => void;
  onCancel: () => void;
}

// ============================================================================
// Header Utilities
// ============================================================================

function convertHeadersToArray(headers?: Record<string, string>): Array<{ key: string; value: string }> {
  if (!headers) return [];
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function convertArrayToHeaders(headers: Array<{ key: string; value: string }>): Record<string, string> | undefined {
  const filtered = headers.filter((h) => h.key.trim() && h.value.trim());
  if (filtered.length === 0) return undefined;

  return filtered.reduce(
    (acc, { key, value }) => {
      acc[key.trim()] = value.trim();
      return acc;
    },
    {} as Record<string, string>
  );
}

function extractCapturedHeaders(mockRequest?: RequestLog | null): Array<{ key: string; value: string }> {
  if (!mockRequest?.responseHeaders) return [];

  const excludeHeaders = ['content-type', 'x-mockapi'];
  return Object.entries(mockRequest.responseHeaders)
    .filter(([key]) => !excludeHeaders.includes(key.toLowerCase()))
    .map(([key, value]) => ({ key, value }));
}

// ============================================================================
// Form Data Helpers
// ============================================================================

function getInitialFormData(rule: MockRule | null, mockRequest: RequestLog | null | undefined) {
  if (rule) {
    return {
      name: rule.name,
      urlPattern: rule.urlPattern,
      matchType: rule.matchType,
      method: rule.method,
      statusCode: rule.statusCode,
      contentType: rule.contentType,
      responseBody: typeof rule.response === 'string' ? rule.response : JSON.stringify(rule.response, null, 2),
      delay: rule.delay,
      headers: convertHeadersToArray(rule.headers),
    };
  }

  if (mockRequest) {
    return {
      name: `Mock for ${new URL(mockRequest.url).pathname}`,
      urlPattern: mockRequest.url,
      matchType: 'exact' as MatchType,
      method: mockRequest.method as HttpMethod,
      statusCode: mockRequest.statusCode || 200,
      contentType: mockRequest.contentType || 'application/json',
      responseBody: mockRequest.responseBody || '{}',
      delay: 0,
      headers: extractCapturedHeaders(mockRequest),
    };
  }

  return {
    name: '',
    urlPattern: '',
    matchType: 'wildcard' as MatchType,
    method: '' as HttpMethod,
    statusCode: 200,
    contentType: 'application/json',
    responseBody: '',
    delay: 0,
    headers: [] as Array<{ key: string; value: string }>,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateRegexPattern(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function validateFormData(
  formData: any,
  jsonValidation: any,
  t: (key: string, params?: any) => string
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = t('editor.validationError', { error: 'Name is required' });
  }

  if (!formData.urlPattern.trim()) {
    errors.urlPattern = t('editor.validationError', { error: 'URL pattern is required' });
  }

  if (formData.matchType === 'regex' && !validateRegexPattern(formData.urlPattern)) {
    errors.urlPattern = t('editor.validationError', { error: 'Invalid regex pattern' });
  }

  if (formData.contentType === 'application/json' && formData.responseBody.trim()) {
    if (jsonValidation && !jsonValidation.isValid) {
      return errors;
    }
    if (!jsonValidation && !isValidJSON(formData.responseBody)) {
      return errors;
    }
  }

  return errors;
}

function buildMockRule(formData: any, rule: MockRule | null): MockRule {
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
    created: rule?.created || now,
    modified: now,
  };
}

// ============================================================================
// Component
// ============================================================================

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, mockRequest, onSave, onCancel }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState(() => getInitialFormData(rule, mockRequest));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [jsonValidation, setJsonValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const newFormData = getInitialFormData(rule, mockRequest);
    setFormData(newFormData);

    // Validate JSON on load if applicable
    const contentType = rule?.contentType || mockRequest?.contentType;
    if (contentType === 'application/json') {
      validateJSON(newFormData.responseBody);
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
    const newErrors = validateFormData(formData, jsonValidation, t);
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

        <div className='border-l-4 border-blue-500 bg-blue-500/5 rounded-r-lg pl-4 pr-4 py-4 space-y-4'>
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

        <div className='border-l-4 border-green-500 bg-green-500/5 rounded-r-lg pl-4 pr-4 py-4 space-y-4'>
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

          <Input
            label={t('editor.delay')}
            type='number'
            value={formData.delay}
            onChange={(e) => handleChange('delay', parseInt(e.target.value) || 0)}
            min='0'
            step='100'
            placeholder={t('editor.delayPlaceholder')}
          />

          <div>
            <label className='block text-sm font-bold text-gray-300 mb-2'>
              {t('editor.customHeaders')}{' '}
              <span className='text-gray-500 text-xs font-normal'>({t('editor.optional')})</span>
            </label>
            <div className='space-y-2'>
              {formData.headers.map((header, index) => (
                <div key={index} className='flex gap-2 items-center'>
                  <Input
                    value={header.key}
                    onChange={(e) => {
                      const newHeaders = [...formData.headers];
                      newHeaders[index] = { ...newHeaders[index], key: e.target.value };
                      handleChange('headers', newHeaders);
                    }}
                    placeholder={t('editor.headerName')}
                    className='flex-1'
                  />
                  <Input
                    value={header.value}
                    onChange={(e) => {
                      const newHeaders = [...formData.headers];
                      newHeaders[index].value = e.target.value;
                      handleChange('headers', newHeaders);
                    }}
                    placeholder={t('editor.headerValue')}
                    className='flex-1'
                  />
                  <IconButton
                    type='button'
                    variant='danger'
                    onClick={() => {
                      const newHeaders = formData.headers.filter((_, i) => i !== index);
                      handleChange('headers', newHeaders);
                    }}
                    title='Remove header'
                  >
                    <Trash2 className='w-4 h-4' />
                  </IconButton>
                </div>
              ))}

              <Button
                type='button'
                variant='secondary'
                size='sm'
                className='flex items-center'
                onClick={() => {
                  handleChange('headers', [...formData.headers, { key: '', value: '' }]);
                }}
              >
                <Plus className='w-4 h-4 mr-2' />
                {t('editor.addHeader')}
              </Button>
            </div>
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
                    <Button type='button' onClick={formatJSON} size='sm' variant='primary'>
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
            </div>
          </div>
        )}

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
