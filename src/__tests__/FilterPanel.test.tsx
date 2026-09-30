import { fireEvent, render, screen } from '@testing-library/react';
import { FilterPanel } from '../components/ui/FilterPanel';

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('FilterPanel', () => {
  it('toggles method and status filters and shows active filter count', () => {
    const onFilterChange = jest.fn();
    const filters = { methods: ['GET'], statusCodes: [400] };
    render(
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={jest.fn()}
        isExpanded
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'GET' }));
    expect(onFilterChange).toHaveBeenCalledWith({ methods: [], statusCodes: [400] });
    fireEvent.click(screen.getByRole('button', { name: '2xx Success' }));
    expect(onFilterChange).toHaveBeenCalledWith({ methods: ['GET'], statusCodes: [400, 200] });
  });

  it('clears active filters and hides options while collapsed', () => {
    const onClear = jest.fn();
    const onToggle = jest.fn();
    const { rerender } = render(
      <FilterPanel
        filters={{ methods: [], statusCodes: [] }}
        onFilterChange={jest.fn()}
        onClear={onClear}
        isExpanded
        onToggle={onToggle}
      />
    );
    expect(screen.getByRole('button', { name: 'GET' })).toBeInTheDocument();
    rerender(
      <FilterPanel
        filters={{ methods: ['POST'], statusCodes: [] }}
        onFilterChange={jest.fn()}
        onClear={onClear}
        isExpanded
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'requests.clearFilters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(
      <FilterPanel
        filters={{ methods: [], statusCodes: [] }}
        onFilterChange={jest.fn()}
        onClear={onClear}
        isExpanded={false}
        onToggle={onToggle}
      />
    );
    expect(screen.queryByRole('button', { name: 'GET' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'requests.filters' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
