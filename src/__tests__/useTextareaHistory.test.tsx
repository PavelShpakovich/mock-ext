import { act, renderHook } from '@testing-library/react';
import { createRef, useState } from 'react';
import type React from 'react';
import { useTextareaHistory } from '../hooks/useTextareaHistory';

function keyboardEvent(
  key: string,
  options: Partial<Pick<React.KeyboardEvent<HTMLTextAreaElement>, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>> = {}
): React.KeyboardEvent<HTMLTextAreaElement> {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...options,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
}

describe('useTextareaHistory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('records debounced edits and supports undo and redo', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'start';
    const ref = createRef<HTMLTextAreaElement | null>();
    ref.current = textarea;
    const onValueChange = jest.fn();
    const { result, unmount } = renderHook(() => useTextareaHistory(ref, onValueChange));

    textarea.value = 'next';
    textarea.selectionStart = 4;
    textarea.selectionEnd = 4;
    act(() => result.current.onChangePush());
    act(() => jest.advanceTimersByTime(500));

    const undo = keyboardEvent('z', { ctrlKey: true });
    act(() => result.current.onKeyDown(undo));
    expect(onValueChange).toHaveBeenLastCalledWith('start');
    expect(undo.preventDefault).toHaveBeenCalledTimes(1);
    expect(undo.stopPropagation).toHaveBeenCalledTimes(1);

    act(() => result.current.onKeyDown(keyboardEvent('y', { ctrlKey: true })));
    expect(onValueChange).toHaveBeenLastCalledWith('next');
    expect(textarea.selectionStart).toBe(4);
    unmount();
  });

  it('inserts configured spaces for Tab and replaces the current selection', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'abcd';
    textarea.selectionStart = 1;
    textarea.selectionEnd = 3;
    const ref = createRef<HTMLTextAreaElement | null>();
    ref.current = textarea;
    const { result } = renderHook(() => {
      const [value, setValue] = useState('abcd');
      textarea.value = value;
      return useTextareaHistory(ref, setValue, 4);
    });
    const event = keyboardEvent('Tab');

    act(() => result.current.onKeyDown(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(textarea.selectionStart).toBe(5);
    expect(textarea.selectionEnd).toBe(5);
  });

  it('flushes a pending edit before undo and clears its timer on unmount', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'before';
    const ref = createRef<HTMLTextAreaElement | null>();
    ref.current = textarea;
    const onValueChange = jest.fn();
    const { result, unmount } = renderHook(() => useTextareaHistory(ref, onValueChange));

    textarea.value = 'pending';
    act(() => result.current.onChangePush());
    act(() => result.current.onKeyDown(keyboardEvent('z', { ctrlKey: true })));

    expect(onValueChange).toHaveBeenCalledWith('before');
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not move the history cursor for undo or redo when no entry exists', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'only';
    const ref = createRef<HTMLTextAreaElement | null>();
    ref.current = textarea;
    const onValueChange = jest.fn();
    const { result } = renderHook(() => useTextareaHistory(ref, onValueChange));

    act(() => result.current.onKeyDown(keyboardEvent('z', { ctrlKey: true })));
    act(() => result.current.onKeyDown(keyboardEvent('z', { ctrlKey: true, shiftKey: true })));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
