import React from 'react';
import { RequestLog } from '../types';
import RequestItem from './RequestItem';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Search, Trash2, Circle } from 'lucide-react';

interface RequestsTabProps {
  requests: RequestLog[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearLog: () => void;
  onMockRequest: (request: RequestLog) => void;
  logRequests: boolean;
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  requests,
  searchTerm,
  onSearchChange,
  onClearLog,
  onMockRequest,
  logRequests,
}) => {
  const filteredRequests = requests.filter(
    (req) =>
      req.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='p-4'>
      <div className='mb-4 flex gap-3 items-start'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
          <Input
            placeholder='Search requests...'
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
            className='pl-10'
          />
        </div>
        {requests.length > 0 && (
          <Button onClick={onClearLog} variant='danger' className='whitespace-nowrap flex items-center gap-2'>
            <Trash2 className='w-4 h-4' />
            Clear All
          </Button>
        )}
      </div>

      {!logRequests && requests.length === 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-700 shadow-sm mb-4'>
          <Circle className='w-12 h-12 mx-auto mb-4 text-gray-600' />
          <div className='text-gray-300 font-bold text-lg mb-2'>Start Recording</div>
          <div className='text-gray-500 text-sm'>Click "Start Recording" in the header to begin logging requests</div>
        </Card>
      )}

      {logRequests && requests.length === 0 && (
        <Card className='text-center py-16 border-2 border-dashed border-gray-700 shadow-sm animate-pulse'>
          <Circle className='w-12 h-12 mx-auto mb-4 text-red-500' fill='currentColor' />
          <div className='text-gray-300 font-bold text-lg mb-2'>Recording Active</div>
          <div className='text-gray-500 text-sm'>Refresh the web page to capture API requests</div>
        </Card>
      )}

      {filteredRequests.length === 0 && requests.length > 0 ? (
        <Card className='text-center py-16 border-2 border-dashed border-gray-700 shadow-sm'>
          <Search className='w-12 h-12 mx-auto mb-4 text-gray-600' />
          <div className='text-gray-300 font-bold text-lg mb-2'>No matching requests</div>
          <div className='text-gray-500 text-sm'>Try a different search term</div>
        </Card>
      ) : (
        filteredRequests.length > 0 && (
          <div className='space-y-2'>
            <div className='text-xs text-gray-500 mb-2'>
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
              {!logRequests && ' (recording stopped)'}
            </div>
            {filteredRequests.map((request) => (
              <RequestItem key={request.id} request={request} onMock={() => onMockRequest(request)} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default RequestsTab;
