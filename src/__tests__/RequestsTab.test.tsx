import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import RequestsTab from '../components/RequestsTab';
import type { RequestLog } from '../types';

jest.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

jest.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 96,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 96 })),
    measureElement: jest.fn(),
  }),
}));

jest.mock('../components/RequestItem', () => ({
  __esModule: true,
  default: ({ request, onMock, onProxy }: { request: RequestLog; onMock: () => void; onProxy: () => void }) => (
    <div>
      <span>{request.url}</span>
      <button onClick={onMock}>mock {request.url}</button>
      <button onClick={onProxy}>proxy {request.url}</button>
    </div>
  ),
}));

const request = (id: string, url: string, method: string, statusCode: number): RequestLog => ({
  id,
  url,
  method,
  statusCode,
  timestamp: 1,
  matched: false,
});

function renderRequests(overrides: Partial<React.ComponentProps<typeof RequestsTab>> = {}) {
  const props: React.ComponentProps<typeof RequestsTab> = {
    requests: [
      request('one', 'https://api.example.com/users', 'GET', 200),
      request('two', 'https://api.example.com/items', 'POST', 404),
    ],
    searchTerm: '',
    onSearchChange: jest.fn(),
    onClearLog: jest.fn(),
    onMockRequest: jest.fn(),
    onProxyRequest: jest.fn(),
    logRequests: false,
    ...overrides,
  };
  return { ...render(<RequestsTab {...props} />), props };
}

describe('RequestsTab', () => {
  it('renders request rows and forwards mock/proxy actions', () => {
    const { props } = renderRequests();

    expect(screen.getByText('2 requests (recording stopped)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mock https://api.example.com/users' }));
    fireEvent.click(screen.getByRole('button', { name: 'proxy https://api.example.com/items' }));
    expect(props.onMockRequest).toHaveBeenCalledWith(props.requests[0]);
    expect(props.onProxyRequest).toHaveBeenCalledWith(props.requests[1]);
  });

  it('filters by search text and shows the empty filtered state', () => {
    const { rerender, props } = renderRequests();

    fireEvent.change(screen.getByPlaceholderText('requests.search'), { target: { value: 'not-found' } });
    expect(props.onSearchChange).toHaveBeenCalledWith('not-found');
    rerender(<RequestsTab {...props} searchTerm='not-found' />);
    expect(screen.getByText('requests.noRequests')).toBeInTheDocument();
    expect(screen.queryByText('https://api.example.com/users')).not.toBeInTheDocument();
  });

  it('shows distinct empty states for idle and active recording', () => {
    const { rerender, props } = renderRequests({ requests: [] });
    expect(screen.getByText('requests.noRequestsDesc')).toBeInTheDocument();

    rerender(<RequestsTab {...props} logRequests />);
    expect(screen.getByText('header.recording')).toBeInTheDocument();
  });

  it('expands filters and clears the request log', () => {
    const { props } = renderRequests();
    fireEvent.click(screen.getByRole('button', { name: 'requests.clear' }));
    expect(props.onClearLog).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: 'GET' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'POST' })).toBeInTheDocument();
  });
});
