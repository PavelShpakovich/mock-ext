import { fireEvent, render, screen } from '@testing-library/react';
import RuleItem from '../components/RuleItem';
import { HttpMethod, MatchType, ValidationSeverity, ValidationWarningType } from '../enums';
import type { MockRule } from '../types';
import type { ValidationWarning } from '../helpers';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const rule: MockRule = {
  id: 'rule-one',
  name: 'Users API',
  enabled: true,
  urlPattern: 'https://api.example.com/users',
  matchType: MatchType.Exact,
  method: HttpMethod.GET,
  statusCode: 200,
  response: '{}',
  contentType: 'application/json',
  delay: 250,
  created: 1,
  modified: 1,
  matchCount: 5,
  lastMatched: Date.now() - 60_000,
};

const warnings: ValidationWarning[] = [
  { type: ValidationWarningType.InvalidJson, severity: ValidationSeverity.Error, messageKey: 'warning.error' },
  { type: ValidationWarningType.Unused, severity: ValidationSeverity.Warning, messageKey: 'warning.warning' },
  { type: ValidationWarningType.Overlapping, severity: ValidationSeverity.Info, messageKey: 'warning.info' },
];

describe('RuleItem', () => {
  it('renders rule metadata, warnings, hit count, and forwards actions', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggle = jest.fn();
    const onDuplicate = jest.fn();
    const onResetHits = jest.fn();
    render(
      <RuleItem
        rule={rule}
        warnings={warnings}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onDuplicate={onDuplicate}
        onResetHits={onResetHits}
      />
    );

    expect(screen.getByText('Users API')).toBeInTheDocument();
    expect(screen.getByText('rules.delayMs')).toBeInTheDocument();
    expect(screen.getByText(/rules.lastMatched/)).toBeInTheDocument();
    expect(screen.getByText('warning.error')).toBeInTheDocument();
    expect(screen.getByText('warning.warning')).toBeInTheDocument();
    expect(screen.getByText('warning.info')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('rules.duplicate'));
    fireEvent.click(screen.getByTitle('common.edit'));
    fireEvent.click(screen.getByTitle('common.delete'));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByTitle('rules.resetHits'));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onResetHits).toHaveBeenCalledTimes(1);
  });

  it('respects disabled and drag visual states and omits optional metadata', () => {
    const { rerender, container } = render(
      <RuleItem
        rule={{ ...rule, enabled: false, delay: 0, lastMatched: undefined, matchCount: 0, method: HttpMethod.Any }}
        warnings={[]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
        disabled
      />
    );
    expect(screen.getByTitle('common.edit')).toBeInTheDocument();
    expect(screen.queryByText('rules.delayMs')).not.toBeInTheDocument();
    expect(screen.queryByText('rules.lastMatched')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('pointer-events-none');

    rerender(
      <RuleItem
        rule={rule}
        warnings={[]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggle={jest.fn()}
        onDuplicate={jest.fn()}
        isDragging
        isDropTarget
      />
    );
    expect(container.firstChild).toHaveClass('opacity-40');
    expect(container.firstChild).toHaveClass('ring-2');
  });
});
