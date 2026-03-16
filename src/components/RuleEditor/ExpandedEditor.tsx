import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { IconButton } from '../ui/IconButton';
import { X, Wand2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../../contexts/I18nContext';
import { useTextareaHistory } from '../../hooks/useTextareaHistory';

const WORD_CHAR_REGEX = /[a-zA-Z0-9_]/;
const WHOLE_WORD_PATTERN = /^\w+$/;
const DEFAULT_LINE_HEIGHT = 20;
const NO_MATCH_INDEX = -1;
const FIRST_MATCH_INDEX = 0;
const VIEWPORT_CENTER_DIVISOR = 2;
const MATCH_INCREMENT = 1;
const PREV_CHAR_OFFSET = -1;
const INITIAL_SEARCH_INDEX = 0;
const MIN_VALID_INDEX = 0;
const MIN_VALID_LENGTH = 0;
const TEXT_START_INDEX = 0;
const LENGTH_TO_INDEX_OFFSET = 1;
const UNFOCUSABLE_TAB_INDEX = -1;

const KEYBOARD_KEYS = {
  FIND: 'f',
  GO_TO_MATCH: 'g',
  FIND_NEXT: 'F3',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
} as const;

const isWordChar = (char: string | undefined): boolean => {
  if (!char) return false;
  return WORD_CHAR_REGEX.test(char);
};

// Supports whole-word matching when query contains only word characters
const findMatchIndices = (query: string, source: string): number[] => {
  if (!query || !source) return [];

  const lowerSource = source.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const requireWholeWord = WHOLE_WORD_PATTERN.test(query);
  const indices: number[] = [];

  let startIndex = INITIAL_SEARCH_INDEX;
  while ((startIndex = lowerSource.indexOf(lowerQuery, startIndex)) > NO_MATCH_INDEX) {
    if (requireWholeWord) {
      const prevChar = source[startIndex + PREV_CHAR_OFFSET];
      const nextChar = source[startIndex + query.length];
      const hasWordBoundaryBefore = !isWordChar(prevChar);
      const hasWordBoundaryAfter = !isWordChar(nextChar);

      if (hasWordBoundaryBefore && hasWordBoundaryAfter) {
        indices.push(startIndex);
      }
    } else {
      indices.push(startIndex);
    }

    startIndex += lowerQuery.length;
  }

  return indices;
};

// ============================================================================
// Types
// ============================================================================

interface ExpandedEditorProps {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onBeautify?: () => void;
  error?: string;
  validation?: {
    isValid: boolean;
    message: string;
  };
}

/**
 * Full-screen editor with built-in search functionality.
 * Features: whole-word matching, keyboard shortcuts (Cmd/Ctrl+F, Enter, Shift+Enter, F3, Esc),
 * auto-scroll to matches, and selected text prefill.
 */
export const ExpandedEditor: React.FC<ExpandedEditorProps> = ({
  title,
  value,
  placeholder,
  onChange,
  onClose,
  onBeautify,
  error,
  validation,
}) => {
  const { t } = useI18n();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(NO_MATCH_INDEX);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { onKeyDown: historyKeyDown, onChangePush } = useTextareaHistory(textareaRef, onChange, 2);

  const matchIndices = useMemo(() => {
    return findMatchIndices(searchQuery, value);
  }, [searchQuery, value]);

  const selectMatchByRange = useCallback(
    (start: number, matchLength: number) => {
      const textarea = textareaRef.current;
      if (!textarea || start < MIN_VALID_INDEX || matchLength <= MIN_VALID_LENGTH) return;

      const end = start + matchLength;
      const textBeforeMatch = value.slice(TEXT_START_INDEX, start);
      const lineNumber = textBeforeMatch.split('\n').length - LENGTH_TO_INDEX_OFFSET;
      const computed = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(computed.lineHeight) || DEFAULT_LINE_HEIGHT;

      textarea.focus();
      textarea.setSelectionRange(start, end);

      // Scroll to center the match in viewport
      const targetScrollTop = Math.max(
        FIRST_MATCH_INDEX,
        lineNumber * lineHeight - textarea.clientHeight / VIEWPORT_CENTER_DIVISOR + lineHeight
      );
      textarea.scrollTop = targetScrollTop;
    },
    [value]
  );

  const openSearch = useCallback(
    (useSelection = false) => {
      let prefillQuery = '';

      if (useSelection && textareaRef.current) {
        const { selectionStart, selectionEnd, value: textValue } = textareaRef.current;
        if (selectionStart !== selectionEnd) {
          const selectedText = textValue.slice(selectionStart, selectionEnd).trim();
          if (selectedText) {
            prefillQuery = selectedText;
          }
        }
      }

      setIsSearchOpen(true);

      if (prefillQuery) {
        setSearchQuery(prefillQuery);
        const matches = findMatchIndices(prefillQuery, value);
        setCurrentMatchIndex(matches.length > FIRST_MATCH_INDEX ? FIRST_MATCH_INDEX : NO_MATCH_INDEX);
        // Keep textarea focused to show selection highlight
      } else {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      }
    },
    [value]
  );

  const handleNext = useCallback(() => {
    if (matchIndices.length === FIRST_MATCH_INDEX) return;
    setCurrentMatchIndex((prev) => (prev + MATCH_INCREMENT) % matchIndices.length);
  }, [matchIndices.length]);

  const handlePrev = useCallback(() => {
    if (matchIndices.length === FIRST_MATCH_INDEX) return;
    setCurrentMatchIndex((prev) => (prev - MATCH_INCREMENT + matchIndices.length) % matchIndices.length);
  }, [matchIndices.length]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Intercept Cmd/Ctrl+F to prevent browser's native find dialog
  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === KEYBOARD_KEYS.FIND) {
        event.preventDefault();
        event.stopPropagation();
        openSearch(true);
      }
    };

    window.addEventListener('keydown', onWindowKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown, { capture: true });
    };
  }, [openSearch]);

  useEffect(() => {
    if (currentMatchIndex < FIRST_MATCH_INDEX || currentMatchIndex >= matchIndices.length) return;

    const start = matchIndices[currentMatchIndex];
    selectMatchByRange(start, searchQuery.length);
  }, [currentMatchIndex, matchIndices, searchQuery, selectMatchByRange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === KEYBOARD_KEYS.FIND) {
      e.preventDefault();
      openSearch(true);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === KEYBOARD_KEYS.GO_TO_MATCH) {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === KEYBOARD_KEYS.FIND_NEXT) {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === KEYBOARD_KEYS.ESCAPE) {
      if (isSearchOpen) {
        e.preventDefault();
        closeSearch();
      } else {
        onClose();
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === KEYBOARD_KEYS.ENTER) {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === KEYBOARD_KEYS.ESCAPE) {
      e.preventDefault();
      closeSearch();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      setCurrentMatchIndex(NO_MATCH_INDEX);
      return;
    }

    const matches = findMatchIndices(query, value);
    setCurrentMatchIndex(matches.length > FIRST_MATCH_INDEX ? FIRST_MATCH_INDEX : NO_MATCH_INDEX);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangePush();
    onChange(e.target.value);
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-white/95 dark:bg-black/95 flex flex-col m-0'
      onKeyDown={handleKeyDown}
      tabIndex={UNFOCUSABLE_TAB_INDEX}
    >
      <div className='flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 shrink-0'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white'>{title}</h3>
        <div className='flex items-center gap-3'>
          <IconButton type='button' onClick={() => openSearch(false)} title={t('expandedEditor.searchShortcut')}>
            <Search className='w-5 h-5' />
          </IconButton>
          {onBeautify && (
            <IconButton type='button' onClick={onBeautify} title={t('expandedEditor.beautify')}>
              <Wand2 className='w-5 h-5' />
            </IconButton>
          )}
          <IconButton type='button' onClick={onClose} title={t('expandedEditor.close')}>
            <X className='w-5 h-5' />
          </IconButton>
        </div>
      </div>

      {isSearchOpen && (
        <div className='flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 shrink-0'>
          <Search className='w-4 h-4 text-gray-500' />
          <input
            ref={searchInputRef}
            type='text'
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('expandedEditor.searchPlaceholder')}
            className='flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 dark:text-white'
          />
          {searchQuery && (
            <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
              {matchIndices.length > FIRST_MATCH_INDEX
                ? t('expandedEditor.matchCount', {
                    current: (currentMatchIndex + MATCH_INCREMENT).toString(),
                    total: matchIndices.length.toString(),
                  })
                : t('expandedEditor.noResults')}
            </span>
          )}
          <div className='flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-2 ml-2'>
            <IconButton
              type='button'
              onClick={handlePrev}
              disabled={matchIndices.length === FIRST_MATCH_INDEX}
              title={t('expandedEditor.previousShortcut')}
            >
              <ChevronUp className='w-4 h-4' />
            </IconButton>
            <IconButton
              type='button'
              onClick={handleNext}
              disabled={matchIndices.length === FIRST_MATCH_INDEX}
              title={t('expandedEditor.nextShortcut')}
            >
              <ChevronDown className='w-4 h-4' />
            </IconButton>
            <IconButton type='button' onClick={closeSearch} title={t('expandedEditor.closeSearch')}>
              <X className='w-4 h-4' />
            </IconButton>
          </div>
        </div>
      )}

      <div className='flex-1 flex flex-col p-6 gap-2 overflow-hidden'>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={historyKeyDown}
          placeholder={placeholder}
          className='flex-1 w-full bg-white dark:bg-gray-950 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 resize-none custom-scrollbar'
        />

        {(error || validation) && (
          <div className='shrink-0'>
            {error && <p className='text-xs text-red-400 font-medium'>{error}</p>}
            {validation && (
              <p
                className={clsx('text-xs', {
                  'text-gray-400': validation.isValid,
                  'text-red-400 font-medium': !validation.isValid,
                })}
              >
                {validation.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
