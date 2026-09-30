import { fireEvent, render, screen } from '@testing-library/react';
import FolderEditor from '../components/FolderEditor';
import type { Folder } from '../types';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const existing: Folder[] = [{ id: 'one', name: 'Existing', collapsed: false, created: 1 }];

describe('FolderEditor', () => {
  it('validates and trims a new folder name before saving', () => {
    const onSave = jest.fn();
    render(<FolderEditor folder={null} existingFolders={existing} onSave={onSave} onCancel={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'folders.create' }));
    expect(screen.getByText('validation.folderNameEmpty')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('folders.folderNamePlaceholder'), {
      target: { value: ' New folder ' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText('folders.folderNamePlaceholder'), { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('New folder');
  });

  it('rejects duplicate names, resets errors on edit, and handles Escape/backdrop cancel', () => {
    const onCancel = jest.fn();
    const onSave = jest.fn();
    const { rerender } = render(
      <FolderEditor folder={null} existingFolders={existing} onSave={onSave} onCancel={onCancel} />
    );
    const input = screen.getByPlaceholderText('folders.folderNamePlaceholder');
    fireEvent.change(input, { target: { value: 'Existing' } });
    fireEvent.click(screen.getByRole('button', { name: 'folders.create' }));
    expect(screen.getByText('validation.folderNameDuplicate')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('.fixed.inset-0') as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(2);

    const folder = { ...existing[0], name: 'Renamed' };
    rerender(<FolderEditor folder={folder} existingFolders={existing} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByDisplayValue('Renamed')).toBeInTheDocument();
    expect(screen.queryByText('validation.folderNameDuplicate')).not.toBeInTheDocument();
  });
});
