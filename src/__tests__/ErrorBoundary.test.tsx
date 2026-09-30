import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

function BrokenChild(): React.ReactElement {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    const storage = (globalThis as unknown as { chrome: { storage: { local: { get: jest.Mock; set: jest.Mock } } } })
      .chrome.storage.local;
    storage.get.mockImplementation((_keys: string[], callback?: (value: object) => void) =>
      callback?.({ errorLog: [] })
    );
    storage.set.mockResolvedValue(undefined);
  });

  it('renders the default fallback with error details and retries the child', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/render failed/)).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Try Again' }));
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Try Again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    unmount();
    consoleError.mockRestore();
  });

  it('uses a provided fallback and logs errors to local storage', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const storage = (globalThis as unknown as { chrome: { storage: { local: { get: jest.Mock; set: jest.Mock } } } })
      .chrome.storage.local;
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <BrokenChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(storage.get).toHaveBeenCalledWith(['errorLog'], expect.any(Function));
    expect(storage.set).toHaveBeenCalledWith({
      errorLog: expect.arrayContaining([expect.objectContaining({ error: 'render failed' })]),
    });
    consoleError.mockRestore();
  });
});
