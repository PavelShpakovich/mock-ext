import React from 'react';
import { TextArea } from './ui/TextArea';
import { IconButton } from './ui/IconButton';
import { RadioOption } from './ui/RadioOption';
import { Toggle } from './ui/Toggle';
import { Maximize2, Wand2, AlertTriangle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { ResponseMode } from '../enums';

interface ResponseHookSectionProps {
  value: string | undefined;
  enabled: boolean;
  responseMode: ResponseMode | undefined;
  onChange: (value: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onResponseModeChange: (mode: ResponseMode) => void;
  error?: string;
  onBeautify: () => void;
  onExpand: () => void;
}

const ResponseHookSection: React.FC<ResponseHookSectionProps> = ({
  value,
  enabled,
  responseMode,
  onChange,
  onEnabledChange,
  onResponseModeChange,
  error,
  onBeautify,
  onExpand,
}) => {
  const { t } = useI18n();
  const currentMode = responseMode || ResponseMode.Mock;
  const hasHookCode = value && value.trim();

  return (
    <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
      <details className='group'>
        <summary className='cursor-pointer select-none list-none'>
          <div className='flex items-center justify-between hover:opacity-80 transition-opacity'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold text-gray-700 dark:text-gray-300'>{t('editor.responseHook')}</span>
                {hasHookCode && enabled && (
                  <span className='px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded'>
                    {t('editor.responseHookEnabled')}
                  </span>
                )}
                {hasHookCode && !enabled && (
                  <span className='px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded'>
                    {t('editor.responseHookDisabled')}
                  </span>
                )}
              </div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>{t('editor.responseHookDescription')}</p>
            </div>
            <svg
              className='w-5 h-5 text-gray-500 transition-transform group-open:rotate-180'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </summary>

        <div className='flex flex-col gap-2 pt-2'>
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
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            placeholder={t('editor.responseHookPlaceholder')}
            className='font-mono text-xs custom-scrollbar'
            action={
              <div className='flex items-center gap-3'>
                {hasHookCode && <Toggle checked={enabled} onChange={onEnabledChange} />}
                <IconButton type='button' onClick={onBeautify} title={t('editor.beautify')}>
                  <Wand2 className='w-4 h-4' />
                </IconButton>
                <IconButton type='button' onClick={onExpand} title={t('common.expandEditor')}>
                  <Maximize2 className='w-4 h-4' />
                </IconButton>
              </div>
            }
          />

          <div className='min-h-10'>
            {error && (
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2'>
                <p className='text-xs text-red-400 font-medium'>{error}</p>
              </div>
            )}
          </div>

          {hasHookCode && (
            <div className='flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 pt-2'>
              <label className='text-sm font-bold text-gray-700 dark:text-gray-300'>{t('editor.responseMode')}</label>
              <div className='flex flex-col gap-2'>
                <RadioOption
                  name='responseMode'
                  value={ResponseMode.Mock}
                  checked={currentMode === ResponseMode.Mock}
                  onChange={() => onResponseModeChange(ResponseMode.Mock)}
                  title={t('editor.responseModeModify')}
                  description={t('editor.responseModeModifyDesc')}
                  hoverColor='green'
                />
                <RadioOption
                  name='responseMode'
                  value={ResponseMode.Passthrough}
                  checked={currentMode === ResponseMode.Passthrough}
                  onChange={() => onResponseModeChange(ResponseMode.Passthrough)}
                  title={t('editor.responseModePassthrough')}
                  description={t('editor.responseModePassthroughDesc')}
                  hoverColor='blue'
                />
              </div>
            </div>
          )}

          <HookDocumentation />
        </div>
      </details>
    </div>
  );
};

const HookDocumentation: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className='text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1'>
      <p className='font-medium'>{t('editor.responseHookContext')}</p>
      <ul className='list-disc list-inside flex flex-col gap-1 pl-2'>
        <ContextItem name='response' description={t('editor.responseHookContextResponse')} />
        <ContextItem name='request' description={t('editor.responseHookContextRequest')} />
        <HelpersContextItem />
      </ul>
    </div>
  );
};

interface ContextItemProps {
  name: string;
  description: string;
}

const ContextItem: React.FC<ContextItemProps> = ({ name, description }) => (
  <li>
    <code className='bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded'>{name}</code> - {description}
  </li>
);

const HelpersContextItem: React.FC = () => {
  const { t } = useI18n();

  const helperFunctions = [
    t('editor.responseHookHelperRandomId'),
    t('editor.responseHookHelperUuid'),
    t('editor.responseHookHelperTimestamp'),
    t('editor.responseHookHelperRandomNumber'),
    t('editor.responseHookHelperRandomString'),
  ];

  return (
    <li>
      <code className='bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded'>helpers</code> -{' '}
      {t('editor.responseHookContextHelpers')}
      <ul className='list-disc list-inside pl-4 flex flex-col'>
        {helperFunctions.map((helperText, index) => (
          <li key={index}>
            <code>{helperText}</code>
          </li>
        ))}
      </ul>
    </li>
  );
};

export default ResponseHookSection;
