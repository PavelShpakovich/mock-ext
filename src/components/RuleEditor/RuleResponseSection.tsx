import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';
import { IconButton } from '../ui/IconButton';
import { HeadersEditor } from '../ui/HeadersEditor';
import ResponseHookSection from '../ResponseHookSection';
import { Maximize2, Wand2 } from 'lucide-react';
import { HeaderEntry } from '../../helpers/headers';
import { JSONValidation } from '../../helpers/ruleValidation';
import { useI18n } from '../../contexts/I18nContext';
import { ResponseMode } from '../../enums';
import clsx from 'clsx';

interface RuleResponseSectionProps {
  statusCode: number;
  contentType: string;
  delay: number;
  headers: HeaderEntry[];
  responseBody: string;
  responseHook: string | undefined;
  responseHookEnabled: boolean;
  responseMode: ResponseMode | undefined;
  jsonValidation: JSONValidation | null;
  errors: Record<string, string>;
  onStatusCodeChange: (value: number) => void;
  onContentTypeChange: (value: string) => void;
  onDelayChange: (value: number) => void;
  onHeadersChange: (headers: HeaderEntry[]) => void;
  onResponseBodyChange: (value: string) => void;
  onResponseHookChange: (value: string) => void;
  onResponseHookEnabledChange: (enabled: boolean) => void;
  onResponseModeChange: (mode: ResponseMode) => void;
  onBeautifyJSON: () => void;
  onBeautifyHook: () => void;
  onExpandBody: () => void;
  onExpandHook: () => void;
}

/**
 * Rule Response Configuration Component
 *
 * Handles all response-related settings including status code, content type,
 * delay, headers, response body, and response hooks.
 */
export const RuleResponseSection: React.FC<RuleResponseSectionProps> = ({
  statusCode,
  contentType,
  delay,
  headers,
  responseBody,
  responseHook,
  responseHookEnabled,
  responseMode,
  jsonValidation,
  errors,
  onStatusCodeChange,
  onContentTypeChange,
  onDelayChange,
  onHeadersChange,
  onResponseBodyChange,
  onResponseHookChange,
  onResponseHookEnabledChange,
  onResponseModeChange,
  onBeautifyJSON,
  onBeautifyHook,
  onExpandBody,
  onExpandHook,
}) => {
  const { t } = useI18n();

  return (
    <div className='border-l-4 border-gray-300 dark:border-green-500 bg-gray-50 dark:bg-green-500/5 rounded-r-lg pl-4 pr-4 py-4 flex flex-col gap-4'>
      <div className='flex items-center gap-4'>
        <Input
          label={t('editor.statusCode')}
          type='number'
          value={statusCode}
          onChange={(e) => onStatusCodeChange(parseInt(e.target.value))}
          min='100'
          max='599'
        />

        <Select
          label={t('editor.contentType')}
          value={contentType}
          onChange={(e) => onContentTypeChange(e.target.value)}
        >
          <option value='application/json'>{t('editor.json')}</option>
          <option value='application/xml'>{t('editor.xml')}</option>
          <option value='text/html'>{t('editor.html')}</option>
          <option value='text/plain'>{t('editor.text')}</option>
          <option value='application/javascript'>JS</option>
        </Select>
      </div>

      <Input
        label={t('editor.delay')}
        type='number'
        value={delay}
        onChange={(e) => onDelayChange(parseInt(e.target.value) || 0)}
        min='0'
        step='100'
        placeholder={t('editor.delayPlaceholder')}
      />

      <HeadersEditor headers={headers} onChange={onHeadersChange} />

      <div className='flex flex-col gap-1'>
        <TextArea
          label={t('editor.responseBody')}
          labelHint={t('editor.variables')}
          value={responseBody}
          onChange={(e) => onResponseBodyChange(e.target.value)}
          rows={8}
          placeholder={t('editor.responseBodyPlaceholder')}
          className='font-mono text-sm custom-scrollbar'
          action={
            <div className='flex items-center gap-3'>
              {contentType === 'application/json' && (
                <IconButton type='button' onClick={onBeautifyJSON} title={t('editor.beautify')}>
                  <Wand2 className='w-4 h-4' />
                </IconButton>
              )}
              <IconButton type='button' onClick={onExpandBody} title={t('common.expandEditor')}>
                <Maximize2 className='w-4 h-4' />
              </IconButton>
            </div>
          }
        />
        {contentType === 'application/json' && jsonValidation && (
          <p
            className={clsx('text-xs', {
              'text-gray-400': jsonValidation.isValid,
              'text-red-400 font-medium': !jsonValidation.isValid,
            })}
          >
            {jsonValidation.message}
          </p>
        )}
        {responseMode === ResponseMode.Passthrough && responseHook?.trim() && responseHookEnabled && (
          <p className='text-xs text-amber-600 dark:text-amber-400 font-medium'>
            ⓘ {t('editor.responseBodyIgnoredInPassthrough')}
          </p>
        )}
      </div>

      <ResponseHookSection
        value={responseHook}
        enabled={responseHookEnabled}
        responseMode={responseMode}
        onChange={onResponseHookChange}
        onEnabledChange={onResponseHookEnabledChange}
        onResponseModeChange={onResponseModeChange}
        error={errors.responseHook}
        onBeautify={onBeautifyHook}
        onExpand={onExpandHook}
      />
    </div>
  );
};
