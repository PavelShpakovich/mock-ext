import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { MatchType, HttpMethod } from '../../enums';
import { useI18n } from '../../contexts/I18nContext';
import { EDITOR_SECTIONS_CONFIG } from '../../config/editorSections';

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
    <CollapsibleSection
      title={t('editor.matchingSection')}
      defaultOpen={EDITOR_SECTIONS_CONFIG.matching.defaultOpen}
      borderColor='border-gray-300 dark:border-blue-500'
      bgColor='bg-gray-50 dark:bg-blue-500/5'
    >
      <Input
        label={t('editor.urlPattern')}
        value={urlPattern}
        onChange={(e) => onUrlPatternChange(e.target.value)}
        error={errors.urlPattern}
        placeholder={t('editor.urlPatternPlaceholder')}
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
    </CollapsibleSection>
  );
};
