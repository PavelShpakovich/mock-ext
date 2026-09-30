import { fireEvent, render, screen } from '@testing-library/react';
import { ExpandedEditor } from '../components/RuleEditor/ExpandedEditor';

jest.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) => (params ? `${key}:${params.current}/${params.total}` : key),
  }),
}));
jest.mock('../hooks/useTextareaHistory', () => ({
  useTextareaHistory: () => ({ onKeyDown: jest.fn(), onChangePush: jest.fn() }),
}));

function renderEditor(value = 'one two one') {
  const onChange = jest.fn();
  const onClose = jest.fn();
  const onBeautify = jest.fn();
  const view = render(
    <ExpandedEditor
      title='Expanded JSON'
      value={value}
      placeholder='Enter JSON'
      onChange={onChange}
      onClose={onClose}
      onBeautify={onBeautify}
      error='Invalid JSON'
      validation={{ isValid: false, message: 'Invalid response' }}
    />
  );
  return { ...view, onChange, onClose, onBeautify };
}

describe('ExpandedEditor', () => {
  it('opens search, highlights matches, navigates results, and closes search', () => {
    const { onClose } = renderEditor();
    const textarea = screen.getByPlaceholderText('Enter JSON');
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    const search = screen.getByPlaceholderText('expandedEditor.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'one' } });
    expect(screen.getByText('expandedEditor.matchCount:1/2')).toBeInTheDocument();
    expect(document.querySelectorAll('mark')).toHaveLength(2);

    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByText('expandedEditor.matchCount:2/2')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('expandedEditor.previousShortcut'));
    expect(screen.getByText('expandedEditor.matchCount:1/2')).toBeInTheDocument();
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('expandedEditor.searchPlaceholder')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports whole-word search, no-result state, and clears highlights after editing', () => {
    const { rerender } = renderEditor('one someone one');
    fireEvent.click(screen.getByTitle('expandedEditor.searchShortcut'));
    const search = screen.getByPlaceholderText('expandedEditor.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'one' } });
    expect(screen.getByText('expandedEditor.matchCount:1/2')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByText('expandedEditor.noResults')).toBeInTheDocument();
    expect(screen.getByTitle('expandedEditor.nextShortcut')).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Enter JSON'), { target: { value: 'new value' } });
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    rerender(
      <ExpandedEditor
        title='Expanded JSON'
        value='new value'
        placeholder='Enter JSON'
        onChange={jest.fn()}
        onClose={jest.fn()}
        validation={{ isValid: true, message: 'Valid JSON' }}
      />
    );
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('prefills search from selected text and forwards beautify/close actions', () => {
    const { onClose, onBeautify } = renderEditor('selected phrase here');
    const textarea = screen.getByPlaceholderText('Enter JSON') as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 8);
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    expect(screen.getByPlaceholderText('expandedEditor.searchPlaceholder')).toHaveValue('selected');
    fireEvent.click(screen.getByTitle('expandedEditor.beautify'));
    fireEvent.click(screen.getByTitle('expandedEditor.close'));
    expect(onBeautify).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
