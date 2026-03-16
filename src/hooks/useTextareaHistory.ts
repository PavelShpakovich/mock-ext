import { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import type React from 'react';

interface HistoryEntry {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const DEBOUNCE_MS = 500;
const MAX_HISTORY = 200;
const EDIT_KEYS = new Set(['Backspace', 'Delete', 'Enter', 'Tab']);

/**
 * Provides undo/redo history and Tab-to-spaces for a controlled React <textarea>.
 *
 * The hook takes an `onValueChange` callback that should update the parent's
 * state directly (bypassing React's synthetic event system). This avoids the
 * fragile nativeValueSetter + dispatchEvent hack and guarantees React
 * re-renders, after which `useLayoutEffect` restores the cursor.
 *
 * Usage:
 *   const { onKeyDown, onChangePush } = useTextareaHistory(ref, onValueChange, tabSize);
 *   // attach onKeyDown to the <textarea>
 *   // call onChangePush() at the top of your onChange handler
 */
export function useTextareaHistory(
  ref: React.RefObject<HTMLTextAreaElement>,
  onValueChange: (value: string) => void,
  tabSize = 2
) {
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cursor position captured eagerly during onChange (before React re-renders
  // and resets the cursor). The debounced history push uses this value.
  const lastCursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  // Target cursor position to restore after React's DOM commit.
  const pendingCursorRef = useRef<{ start: number; end: number } | null>(null);

  // ── Initialise history on mount ──────────────────────────────────────────
  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      historyRef.current = [{ value: textarea.value, selectionStart: 0, selectionEnd: 0 }];
      historyIndexRef.current = 0;
    }
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restore cursor after React's DOM commit (before paint) ───────────────
  // useLayoutEffect runs synchronously after React commits DOM mutations,
  // before the browser paints. This guarantees the cursor is set after React
  // resets it and the user never sees it jump.
  useLayoutEffect(() => {
    if (!pendingCursorRef.current) return;
    const { start, end } = pendingCursorRef.current;
    pendingCursorRef.current = null;
    ref.current?.setSelectionRange(start, end);
  });

  // ── Core helpers ─────────────────────────────────────────────────────────
  const pushEntry = useCallback((entry: HistoryEntry) => {
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    // Discard any forward (re-do) entries beyond current position
    const next = history.slice(0, idx + 1);
    next.push(entry);
    if (next.length > MAX_HISTORY) {
      next.shift();
      historyIndexRef.current = MAX_HISTORY - 1;
    } else {
      historyIndexRef.current = next.length - 1;
    }
    historyRef.current = next;
  }, []);

  const syncCurrentEntrySelection = useCallback((selectionStart: number, selectionEnd: number) => {
    const currentEntry = historyRef.current[historyIndexRef.current];
    if (!currentEntry) return;
    currentEntry.selectionStart = selectionStart;
    currentEntry.selectionEnd = selectionEnd;
  }, []);

  /** Cancel pending debounce and flush it synchronously if one is outstanding. */
  const flushDebounce = useCallback(() => {
    if (debounceTimerRef.current === null) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    const textarea = ref.current;
    if (textarea) {
      pushEntry({
        value: textarea.value,
        selectionStart: lastCursorRef.current.start,
        selectionEnd: lastCursorRef.current.end,
      });
    }
  }, [ref, pushEntry]);

  /** Apply a history entry by calling the parent's state setter directly. */
  const applyEntry = useCallback(
    (entry: HistoryEntry) => {
      pendingCursorRef.current = { start: entry.selectionStart, end: entry.selectionEnd };
      onValueChange(entry.value);
      // Fallback: if value is identical React won't re-render and
      // useLayoutEffect won't fire. Set cursor directly for that case.
      ref.current?.setSelectionRange(entry.selectionStart, entry.selectionEnd);
    },
    [ref, onValueChange]
  );

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Call this at the top of the textarea's onChange handler.
   * Captures cursor position eagerly (before React re-renders) and debounces
   * history pushes so rapid keystrokes form a single undo unit.
   */
  const onChangePush = useCallback(() => {
    // Capture cursor eagerly — this runs during the synchronous onChange
    // handler, before React re-renders and resets the cursor position.
    const textarea = ref.current;
    if (textarea) {
      lastCursorRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
    }
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const textarea = ref.current;
      if (textarea) {
        pushEntry({
          value: textarea.value,
          selectionStart: lastCursorRef.current.start,
          selectionEnd: lastCursorRef.current.end,
        });
      }
    }, DEBOUNCE_MS);
  }, [ref, pushEntry]);

  /** Attach this to the textarea's onKeyDown prop. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMac = navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS');
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const textarea = ref.current;

      const isTextInsertion = e.key.length === 1 && !modKey && !e.altKey;
      const isEditShortcut = modKey && ['v', 'x'].includes(e.key.toLowerCase());
      const isEditKey = EDIT_KEYS.has(e.key);

      if (textarea && (isTextInsertion || isEditShortcut || isEditKey)) {
        syncCurrentEntrySelection(textarea.selectionStart, textarea.selectionEnd);
      }

      // ── Undo: Cmd+Z / Ctrl+Z ─────────────────────────────────────────
      if (modKey && e.key === 'z' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        flushDebounce();
        const idx = historyIndexRef.current;
        if (idx > 0) {
          historyIndexRef.current = idx - 1;
          applyEntry(historyRef.current[historyIndexRef.current]);
        }
        return;
      }

      // ── Redo: Cmd+Shift+Z / Ctrl+Y ───────────────────────────────────
      if ((modKey && e.key === 'z' && e.shiftKey) || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        e.stopPropagation();
        const idx = historyIndexRef.current;
        if (idx < historyRef.current.length - 1) {
          historyIndexRef.current = idx + 1;
          applyEntry(historyRef.current[historyIndexRef.current]);
        }
        return;
      }

      // ── Tab: insert spaces instead of moving focus ───────────────────
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!textarea) return;

        const { selectionStart, selectionEnd, value } = textarea;
        const spaces = ' '.repeat(tabSize);
        const newValue = value.slice(0, selectionStart) + spaces + value.slice(selectionEnd);
        const newCursor = selectionStart + spaces.length;

        flushDebounce();
        pushEntry({ value: newValue, selectionStart: newCursor, selectionEnd: newCursor });
        pendingCursorRef.current = { start: newCursor, end: newCursor };
        onValueChange(newValue);
        ref.current?.setSelectionRange(newCursor, newCursor);
      }
    },
    [ref, tabSize, flushDebounce, applyEntry, pushEntry, onValueChange, syncCurrentEntrySelection]
  );

  return { onKeyDown, onChangePush };
}
