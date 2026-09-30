import { fireEvent, render, screen } from '@testing-library/react';
import RequestItem from '../components/RequestItem';
import type { RequestLog } from '../types';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const request: RequestLog = {
  id: 'req-1',
  url: 'https://api.example.com/users',
  method: 'GET',
  timestamp: 1700000000000,
  matched: true,
  statusCode: 201,
};

describe('RequestItem', () => {
  it('renders request metadata and forwards mock/proxy actions', () => {
    const onMock = jest.fn();
    const onProxy = jest.fn();
    render(<RequestItem request={request} onMock={onMock} onProxy={onProxy} />);

    expect(screen.getByText(request.url)).toBeInTheDocument();
    expect(screen.getByText('requests.mocked')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('requests.mockThis'));
    fireEvent.click(screen.getByTitle('requests.proxyThis'));
    expect(onMock).toHaveBeenCalledTimes(1);
    expect(onProxy).toHaveBeenCalledTimes(1);
  });

  it('omits status and matched badges when a request did not match', () => {
    render(
      <RequestItem
        request={{ ...request, matched: false, statusCode: undefined }}
        onMock={jest.fn()}
        onProxy={jest.fn()}
      />
    );
    expect(screen.queryByText('requests.mocked')).not.toBeInTheDocument();
    expect(screen.queryByText('201')).not.toBeInTheDocument();
  });
});
