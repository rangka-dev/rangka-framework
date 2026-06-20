import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { WidgetNode } from '@rangka/shared';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { SlotRenderer } from '../renderer/SlotRenderer.js';
import { StateStore } from '../state/store.js';
import { TableWidget } from '../components/TableWidget.js';
import { ColumnWidget } from '../components/ColumnWidget.js';
import { MetaProvider } from '../../context/MetaContext.js';
import type { WidgetContext } from '../context/types.js';

vi.mock('../../api/client.js', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../../api/client.js';
const mockApiClient = vi.mocked(apiClient);

const sampleData = [
  {
    id: '1',
    name: 'Acme Corp',
    email: 'acme@test.com',
    total: 1500,
    status: 'Active',
    date: '2024-01-01',
  },
  {
    id: '2',
    name: 'Beta Inc',
    email: 'beta@test.com',
    total: 2500,
    status: 'Inactive',
    date: '2024-02-01',
  },
];

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function mockApiResponse(data: Record<string, unknown>[], total?: number) {
  mockApiClient.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(total != null ? { data, meta: { total } } : data),
  } as unknown as Response);
}

function tableNode(): WidgetNode[] {
  return [
    {
      type: 'table',
      bind: { model: { name: 'test.model' } },
      props: { pageSize: 20 },
      children: [
        { type: 'column', bind: { field: 'name' }, props: { label: 'Name', filterable: true } },
        { type: 'column', bind: { field: 'email' }, props: { label: 'Email', filterable: true } },
        {
          type: 'column',
          bind: { field: 'total' },
          props: { label: 'Total', filterable: true, align: 'right' },
        },
        { type: 'column', bind: { field: 'status' }, props: { label: 'Status', filterable: true } },
        { type: 'column', bind: { field: 'date' }, props: { label: 'Date', filterable: true } },
      ],
    },
  ];
}

const testMeta = {
  navigation: [],
  pages: [],
  models: {
    'test.model': {
      qualifiedName: 'test.model',
      fields: [
        { name: 'name', type: 'string', label: 'Name' },
        { name: 'email', type: 'string', label: 'Email' },
        { name: 'total', type: 'money', label: 'Total' },
        { name: 'status', type: 'enum', label: 'Status', options: ['Active', 'Inactive'] },
        { name: 'date', type: 'date', label: 'Date' },
      ],
    },
  },
};

function renderTable(options: { state?: StateStore } = {}) {
  const { state = new StateStore() } = options;
  const ctx: WidgetContext = { record: {}, model: 'test.model', mode: 'view' };
  const queryClient = createQueryClient();
  const result = render(
    <MetaProvider meta={testMeta}>
      <QueryClientProvider client={queryClient}>
        <SlotRenderer nodes={tableNode()} context={ctx} state={state} />
      </QueryClientProvider>
    </MetaProvider>,
  );
  return { ...result, state, queryClient };
}

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'table',
      label: 'Table',
      category: 'data',
      schema: {},
      binding: 'model',
      triggers: [],
      container: true,
      accepts: ['column'],
    },
    TableWidget as never,
  );
  registerWidget(
    {
      name: 'column',
      label: 'Column',
      category: 'data',
      schema: {},
      binding: 'field',
      triggers: [],
      container: false,
    },
    ColumnWidget as never,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Table filter popover', () => {
  describe('step 1: field selection', () => {
    it('opens popover with searchable field list', async () => {
      mockApiResponse(sampleData, 2);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('button').find((b) => b.textContent === 'Name')).toBeTruthy();
      expect(screen.getAllByRole('button').find((b) => b.textContent === 'Email')).toBeTruthy();
      expect(screen.getAllByRole('button').find((b) => b.textContent === 'Total')).toBeTruthy();
      expect(screen.getAllByRole('button').find((b) => b.textContent === 'Status')).toBeTruthy();
      expect(screen.getAllByRole('button').find((b) => b.textContent === 'Date')).toBeTruthy();
    });

    it('filters field list by search query', async () => {
      mockApiResponse(sampleData, 2);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search fields...'), {
        target: { value: 'tot' },
      });

      const buttons = screen.getAllByRole('button').filter((b) => b.textContent === 'Total');
      expect(buttons.length).toBe(1);
      expect(screen.queryAllByRole('button').find((b) => b.textContent === 'Name')).toBeUndefined();
    });

    it('shows "No fields found" for non-matching search', async () => {
      mockApiResponse(sampleData, 2);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search fields...'), {
        target: { value: 'zzz' },
      });

      expect(screen.getByText('No fields found')).toBeInTheDocument();
    });
  });

  describe('step 2: operator and value', () => {
    async function openFilterForField(field: string, state?: StateStore) {
      mockApiResponse(sampleData, 2);
      const result = renderTable(state ? { state } : undefined);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      const btn = screen.getAllByRole('button').find((b) => b.textContent === field)!;
      fireEvent.click(btn);

      return result;
    }

    it('shows operator dropdown with string operators for string field', async () => {
      await openFilterForField('Name');

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.text);
      expect(options).toContain('Contains');
      expect(options).toContain('Equals');
      expect(options).toContain('Not equals');
      expect(options).toContain('Empty');
      expect(options).toContain('Not empty');
    });

    it('defaults to "Contains" for string fields', async () => {
      await openFilterForField('Name');

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('like');
    });

    it('shows numeric operators for money field', async () => {
      await openFilterForField('Total');

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.text);
      expect(options).toContain('Equals');
      expect(options).toContain('Greater than');
      expect(options).toContain('Greater or equal');
      expect(options).toContain('Less than');
      expect(options).toContain('Less or equal');
    });

    it('defaults to "Equals" for money fields', async () => {
      await openFilterForField('Total');

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('eq');
    });

    it('shows date operators for date field', async () => {
      await openFilterForField('Date');

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.text);
      expect(options).toContain('After');
      expect(options).toContain('Before');
      expect(options).toContain('On or after');
      expect(options).toContain('On or before');
    });

    it('hides value input for "Empty" operator', async () => {
      await openFilterForField('Name');

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'empty' } });

      expect(screen.queryByPlaceholderText('Value...')).not.toBeInTheDocument();
    });

    it('shows value input for operators that need a value', async () => {
      await openFilterForField('Name');

      expect(screen.getByPlaceholderText('Value...')).toBeInTheDocument();
    });

    it('back button returns to field list', async () => {
      await openFilterForField('Name');

      fireEvent.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });
    });
  });

  describe('applying filters', () => {
    async function applyFilter(field: string, operator: string, value?: string) {
      mockApiResponse(sampleData, 2);
      const state = new StateStore();
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      const btn = screen.getAllByRole('button').find((b) => b.textContent === field)!;
      fireEvent.click(btn);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: operator } });

      if (value) {
        const input = screen.getByPlaceholderText('Value...');
        fireEvent.change(input, { target: { value } });
      }

      fireEvent.click(screen.getByText('Apply'));
      return state;
    }

    it('stores eq filter without suffix', async () => {
      const state = await applyFilter('Total', 'eq', '1000');
      expect(state.get('$filter.test.model.total')).toBe('1000');
    });

    it('stores like filter with __like suffix', async () => {
      const state = await applyFilter('Name', 'like', 'Acme');
      expect(state.get('$filter.test.model.name__like')).toBe('Acme');
    });

    it('stores gt filter with __gt suffix', async () => {
      const state = await applyFilter('Total', 'gt', '500');
      expect(state.get('$filter.test.model.total__gt')).toBe('500');
    });

    it('stores gte filter with __gte suffix', async () => {
      const state = await applyFilter('Total', 'gte', '1000');
      expect(state.get('$filter.test.model.total__gte')).toBe('1000');
    });

    it('stores empty filter correctly', async () => {
      const state = await applyFilter('Name', 'empty');
      expect(state.get('$filter.test.model.name__empty')).toBe('true');
    });

    it('stores not_empty filter correctly', async () => {
      const state = await applyFilter('Name', 'not_empty');
      expect(state.get('$filter.test.model.name__not_empty')).toBe('true');
    });

    it('resets page to 1 on apply', async () => {
      mockApiResponse(sampleData, 2);
      const state = new StateStore();
      state.set('$page.test.model', 3);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      const btn = screen.getAllByRole('button').find((b) => b.textContent === 'Name')!;
      fireEvent.click(btn);

      const input = screen.getByPlaceholderText('Value...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(screen.getByText('Apply'));

      expect(state.get('$page.test.model')).toBe(1);
    });

    it('disables Apply when value is required but empty', async () => {
      mockApiResponse(sampleData, 2);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      const btn = screen.getAllByRole('button').find((b) => b.textContent === 'Name')!;
      fireEvent.click(btn);

      const applyBtn = screen.getByText('Apply');
      expect(applyBtn).toBeDisabled();
    });

    it('enables Apply for no-value operators like Empty', async () => {
      mockApiResponse(sampleData, 2);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      const btn = screen.getAllByRole('button').find((b) => b.textContent === 'Name')!;
      fireEvent.click(btn);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'empty' } });

      const applyBtn = screen.getByText('Apply');
      expect(applyBtn).not.toBeDisabled();
    });
  });

  describe('active filter badges', () => {
    it('displays badge with operator symbol', async () => {
      const state = new StateStore();
      state.set('$filter.test.model.total__gte', '1000');
      mockApiResponse(sampleData, 2);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText(/Total ≥ 1000/)).toBeInTheDocument();
    });

    it('displays eq badge with = symbol', async () => {
      const state = new StateStore();
      state.set('$filter.test.model.status', 'Active');
      mockApiResponse(sampleData, 2);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText(/Status = Active/)).toBeInTheDocument();
    });

    it('displays empty operator badge without value', async () => {
      const state = new StateStore();
      state.set('$filter.test.model.name__empty', 'true');
      mockApiResponse(sampleData, 2);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText(/Name is empty/)).toBeInTheDocument();
    });

    it('removing badge clears filter from store', async () => {
      const state = new StateStore();
      state.set('$filter.test.model.total__gte', '1000');
      mockApiResponse(sampleData, 2);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Remove Total filter'));
      expect(state.get('$filter.test.model.total__gte')).toBeNull();
    });
  });
});
