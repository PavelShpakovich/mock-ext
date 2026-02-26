import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';
import { IconButton } from '../ui/IconButton';
import { HeadersEditor } from '../ui/HeadersEditor';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import ResponseHookSection from '../ResponseHookSection';
import { Maximize2, Wand2 } from 'lucide-react';
import { HeaderEntry } from '../../helpers/headers';
import { JSONValidation } from '../../helpers/ruleValidation';
import { useI18n } from '../../contexts/I18nContext';
import { ResponseMode } from '../../enums';
import { EDITOR_SECTIONS_CONFIG } from '../../config/editorSections';
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
    <>
      <CollapsibleSection
        title={t('editor.responseConfigSection')}
        defaultOpen={EDITOR_SECTIONS_CONFIG.responseConfig.defaultOpen}
        borderColor='border-gray-300 dark:border-green-500'
        bgColor='bg-gray-50 dark:bg-green-500/5'
      >
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
            <option value='text/plain'>{t('editor.text')}</option>
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
      </CollapsibleSection>

      <CollapsibleSection
        title={t('editor.responseHeadersSection')}
        defaultOpen={EDITOR_SECTIONS_CONFIG.responseHeaders.defaultOpen}
        borderColor='border-gray-300 dark:border-green-500'
        bgColor='bg-gray-50 dark:bg-green-500/5'
      >
        <HeadersEditor headers={headers} onChange={onHeadersChange} />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('editor.responseBodySection')}
        defaultOpen={EDITOR_SECTIONS_CONFIG.responseBody.defaultOpen}
        borderColor='border-gray-300 dark:border-green-500'
        bgColor='bg-gray-50 dark:bg-green-500/5'
      >
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
      </CollapsibleSection>

      <CollapsibleSection
        title={
          <>
            <span>{t('editor.responseHookSection')}</span>
            {responseHook?.trim() && (
              <span
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded',
                  responseHookEnabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {responseHookEnabled ? t('editor.responseHookEnabled') : t('editor.responseHookDisabled')}
              </span>
            )}
          </>
        }
        defaultOpen={EDITOR_SECTIONS_CONFIG.responseHook.defaultOpen}
        borderColor='border-gray-300 dark:border-green-500'
        bgColor='bg-gray-50 dark:bg-green-500/5'
      >
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
      </CollapsibleSection>
    </>
  );
};
