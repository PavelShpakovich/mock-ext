import { fireEvent, render, screen } from '@testing-library/react';
import { HeadersEditor } from '../components/ui/HeadersEditor';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('HeadersEditor', () => {
  it('adds, edits and removes header rows', () => {
    const onChange = jest.fn();
    const headers = [{ key: 'X-Test', value: 'first' }];
    const { rerender } = render(<HeadersEditor headers={headers} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('editor.headerName'), { target: { value: 'X-Changed' } });
    expect(onChange).toHaveBeenCalledWith([{ key: 'X-Changed', value: 'first' }]);
    fireEvent.change(screen.getByPlaceholderText('editor.headerValue'), { target: { value: 'second' } });
    expect(onChange).toHaveBeenCalledWith([{ key: 'X-Test', value: 'second' }]);

    fireEvent.click(screen.getByRole('button', { name: 'editor.addHeader' }));
    expect(onChange).toHaveBeenCalledWith([...headers, { key: '', value: '' }]);
    rerender(<HeadersEditor headers={headers} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('editor.removeHeader'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
