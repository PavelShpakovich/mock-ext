import React from 'react';
import clsx from 'clsx';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { Network, Circle, Square } from 'lucide-react';

interface HeaderProps {
  enabled: boolean;
  logRequests: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onToggleRecording: (logRequests: boolean) => void;
  activeRulesCount: number;
  totalRulesCount: number;
  requestsCount: number;
  activeTabTitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  enabled,
  logRequests,
  onToggleEnabled,
  onToggleRecording,
  activeRulesCount,
  totalRulesCount,
  requestsCount,
  activeTabTitle,
}) => {
  const handleRecordingClick = () => {
    onToggleRecording(!logRequests);
  };

  return (
    <div className='bg-gray-900 border-b border-gray-800 text-white p-4'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-3'>
          <Network className='w-7 h-7 text-green-400 shrink-0' />
          <h1 className='text-xl font-bold text-white whitespace-nowrap'>MockAPI</h1>

          {logRequests && activeTabTitle && (
            <div className='flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1'>
              <Circle className='w-2 h-2 fill-red-500 text-red-500 animate-pulse' />
              <span className='text-xs font-medium text-red-400'>Recording: {activeTabTitle}</span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-4 flex-wrap'>
          <div className='flex items-center gap-3 text-xs'>
            <div className='flex items-center gap-1.5'>
              <span className='text-gray-400'>Rules</span>
              <span className='font-bold text-white'>
                {activeRulesCount}/{totalRulesCount}
              </span>
            </div>
            <div className='w-px h-4 bg-gray-700'></div>
            <div className='flex items-center gap-1.5'>
              <span className='text-gray-400'>Requests</span>
              <span className='font-bold text-white'>{requestsCount}</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2'>
              <Toggle checked={enabled} onChange={() => onToggleEnabled(!enabled)} />
              <span
                className={clsx('text-xs font-medium', {
                  'text-green-400': enabled,
                  'text-gray-500': !enabled,
                })}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className='w-px h-6 bg-gray-700 mx-1'></div>

            <Button
              onClick={handleRecordingClick}
              variant={logRequests ? 'danger' : 'secondary'}
              size='sm'
              className='flex items-center gap-1.5'
            >
              {logRequests ? (
                <>
                  <Square className='w-3.5 h-3.5' fill='currentColor' />
                  Stop
                </>
              ) : (
                <>
                  <Circle className='w-3.5 h-3.5' />
                  Record
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Header);
