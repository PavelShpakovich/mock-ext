import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MatchType, HttpMethod } from '../../enums';
import { useI18n } from '../../contexts/I18nContext';

interface RuleMatchingSectionProps {
  urlPattern: string;
  matchType: MatchType;
  method: HttpMethod;
  errors: Record<string, string>;
  onUrlPatternChange: (value: string) => void;
  onMatchTypeChange: (value: string) => void;
  onMethodChange: (value: string) => void;
}

/**
 * Rule Matching Configuration Component
 *
 * Handles URL pattern, match type, and HTTP method configuration
 * for determining which requests the rule should intercept.
 */
export const RuleMatchingSection: React.FC<RuleMatchingSectionProps> = ({
  urlPattern,
  matchType,
  method,
  errors,
  onUrlPatternChange,
  onMatchTypeChange,
  onMethodChange,
}) => {
  const { t } = useI18n();

  const getMatchTypeDescription = () => {
    switch (matchType) {
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
    <div className='border-l-4 border-gray-300 dark:border-blue-500 bg-gray-50 dark:bg-blue-500/5 rounded-r-lg pl-4 pr-4 py-4 flex flex-col gap-4'>
      <Input
        label={t('editor.urlPattern')}
        required
        value={urlPattern}
        onChange={(e) => onUrlPatternChange(e.target.value)}
        error={errors.urlPattern}
        placeholder={t('editor.urlPatternPlaceholder')}
        className='font-mono text-sm'
      />

      <div className='grid grid-cols-2 gap-4'>
        <Select
          label={t('editor.matchType')}
          value={matchType}
          onChange={(e) => onMatchTypeChange(e.target.value)}
          description={getMatchTypeDescription()}
        >
          <option value='wildcard'>{t('editor.wildcard')}</option>
          <option value='exact'>{t('editor.exact')}</option>
          <option value='regex'>{t('editor.regex')}</option>
        </Select>

        <Select label={t('editor.method')} value={method} onChange={(e) => onMethodChange(e.target.value)}>
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
  );
};
