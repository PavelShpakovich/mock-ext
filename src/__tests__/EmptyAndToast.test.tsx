import { act, fireEvent, render, screen } from '@testing-library/react';
import { RulesEmptyState } from '../components/RulesEmptyState';
import { Toast } from '../components/ui/Toast';
import { ToastType } from '../enums';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('RulesEmptyState', () => {
  it('shows the empty state and forwards the create action', () => {
    const onCreateRule = jest.fn();
    render(<RulesEmptyState onCreateRule={onCreateRule} />);
    expect(screen.getByText('rules.noRules')).toBeInTheDocument();
    expect(screen.getByText('rules.noRulesDesc')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'rules.addRule' }));
    expect(onCreateRule).toHaveBeenCalledTimes(1);
  });
});

describe('Toast', () => {
  it.each(Object.values(ToastType))('renders %s variant and allows immediate dismissal', (type) => {
    const onClose = jest.fn();
    render(<Toast type={type} message='Notification message' duration={0} onClose={onClose} />);
    expect(screen.getByText('Notification message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after the configured duration and cancels the timer on unmount', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { unmount } = render(<Toast type={ToastType.Info} message='Timed' duration={500} onClose={onClose} />);
    act(() => jest.advanceTimersByTime(500));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    jest.useRealTimers();
  });
});
