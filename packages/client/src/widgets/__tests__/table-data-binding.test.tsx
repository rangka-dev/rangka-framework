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
import type { WidgetProps } from '../types.js';
import type { WidgetContext } from '../context/types.js';
import type { ComponentType } from 'react';

vi.mock('../../api/client.js', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../../api/client.js';
const mockApiClient = vi.mocked(apiClient);

function TestText({ bind }: WidgetProps) {
  return <span data-testid="cell-text">{String(bind?.value ?? '')}</span>;
}

function TestBadge({ bind }: WidgetProps) {
  return <span data-testid="cell-badge">{String(bind?.value ?? '')}</span>;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function mockApiResponse(data: Record<string, unknown>[], total?: number) {
  const body = total != null ? { data, total } : data;
  mockApiClient.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function renderTable(
  nodes: WidgetNode[],
  options: {
    records?: Record<string, unknown>[];
    model?: string;
    state?: StateStore;
  } = {},
) {
  const { records, model = 'sales.order', state = new StateStore() } = options;
  const ctx: WidgetContext = {
    record: {},
    records,
    model,
    mode: 'view',
  };
  const queryClient = createQueryClient();
  const meta = {
    navigation: [],
    pages: [],
    models: {
      [model]: {
        qualifiedName: model,
        fields: [
          { name: 'customer', type: 'string', label: 'Customer' },
          { name: 'date', type: 'date', label: 'Date' },
          {
            name: 'status',
            type: 'enum',
            label: 'Status',
            options: ['Draft', 'Confirmed', 'Shipped'],
          },
          { name: 'total', type: 'money', label: 'Total' },
        ],
      },
    },
  };
  const result = render(
    <MetaProvider meta={meta}>
      <QueryClientProvider client={queryClient}>
        <SlotRenderer nodes={nodes} context={ctx} state={state} />
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
      triggers: ['rowClick', 'select', 'pageChange'],
      container: true,
      accepts: ['column'],
    },
    TableWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    {
      name: 'column',
      label: 'Column',
      category: 'layout',
      schema: {},
      binding: 'none',
      triggers: [],
      container: true,
    },
    ColumnWidget as unknown as ComponentType<WidgetProps>,
  );
  registerWidget(
    {
      name: 'text',
      label: 'Text',
      category: 'display',
      schema: {},
      binding: 'expression',
      triggers: [],
      container: false,
    },
    TestText,
  );
  registerWidget(
    {
      name: 'badge',
      label: 'Badge',
      category: 'display',
      schema: {},
      binding: 'field',
      triggers: [],
      container: false,
    },
    TestBadge,
  );
  mockApiClient.mockReset();
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

const sampleData = [
  { id: '1', customer: 'Acme Corp', total: 1500, status: 'paid' },
  { id: '2', customer: 'Beta Inc', total: 2300, status: 'draft' },
  { id: '3', customer: 'Gamma Ltd', total: 800, status: 'paid' },
];

function tableWithColumns(props: Record<string, unknown> = {}): WidgetNode[] {
  return [
    {
      type: 'table',
      bind: { model: { name: 'sales.order' } },
      props: { pageSize: 20, ...props },
      children: [
        {
          type: 'column',
          props: { label: 'Customer', sortable: true, filterable: true },
          bind: { field: 'customer' },
        },
        {
          type: 'column',
          props: { label: 'Total', align: 'right', sortable: true },
          bind: { field: 'total' },
        },
        { type: 'column', props: { label: 'Status', filterable: true }, bind: { field: 'status' } },
      ],
    },
  ];
}

describe('Table data binding (smart mode)', () => {
  describe('data fetching', () => {
    it('fetches data on mount when bind.model and pageSize are set', async () => {
      mockApiResponse(sampleData, 3);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledTimes(1);
      });

      const callUrl = mockApiClient.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/sales/order');
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=20');
    });

    it('renders fetched data as rows', async () => {
      mockApiResponse(sampleData, 3);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      mockApiClient.mockReturnValue(new Promise(() => {}));
      renderTable(tableWithColumns());
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    });
  });

  describe('sorting', () => {
    it('clicking sortable header updates $sort in store', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer'));
      expect(state.get('$sort.sales.order')).toBe('customer');
    });

    it('sort cycles asc → desc → clear', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const header = screen.getByText('Customer');

      fireEvent.click(header);
      expect(state.get('$sort.sales.order')).toBe('customer');

      mockApiResponse(sampleData, 3);
      fireEvent.click(header);
      expect(state.get('$sort.sales.order')).toBe('-customer');

      mockApiResponse(sampleData, 3);
      fireEvent.click(header);
      expect(state.get('$sort.sales.order')).toBeNull();
    });

    it('clicking sort resets page to 1', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      state.set('$page.sales.order', 3);
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Customer'));
      expect(state.get('$page.sales.order')).toBe(1);
    });

    it('non-sortable column header is not clickable', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Status'));
      expect(state.get('$sort.sales.order')).toBeUndefined();
    });
  });

  describe('pagination', () => {
    it('renders pagination info with total', async () => {
      mockApiResponse(sampleData, 42);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText(/Showing 1–20 of 42/)).toBeInTheDocument();
    });

    it('next button increments page', async () => {
      mockApiResponse(sampleData, 42);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const nextBtn = screen.getByLabelText('Next page');
      fireEvent.click(nextBtn);
      expect(state.get('$page.sales.order')).toBe(2);
    });

    it('prev button is disabled on page 1', async () => {
      mockApiResponse(sampleData, 42);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const prevBtn = screen.getByLabelText('Previous page');
      expect(prevBtn).toBeDisabled();
    });

    it('next button is disabled on last page', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const nextBtn = screen.getByLabelText('Next page');
      expect(nextBtn).toBeDisabled();
    });
  });

  describe('filter bar', () => {
    it('renders filter button when filterable columns exist', async () => {
      mockApiResponse(sampleData, 3);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('clicking filter shows searchable field list', async () => {
      mockApiResponse(sampleData, 3);
      renderTable(tableWithColumns());

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });
    });

    it('applying a filter updates store with operator', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      });

      // Click the Status field in the popover field list
      const statusBtn = screen.getAllByRole('button').find((btn) => btn.textContent === 'Status')!;
      fireEvent.click(statusBtn);

      // Should show operator select and value input
      const input = screen.getByPlaceholderText('Value...');
      fireEvent.change(input, { target: { value: 'paid' } });
      fireEvent.click(screen.getByText('Apply'));

      // enum defaults to 'eq' operator, stored without suffix
      expect(state.get('$filter.sales.order.status')).toBe('paid');
      expect(state.get('$page.sales.order')).toBe(1);
    });

    it('removing a filter chip clears it from store', async () => {
      const state = new StateStore();
      state.set('$filter.sales.order.status', 'paid');
      mockApiResponse(sampleData, 3);
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const removeBtn = screen.getByLabelText('Remove Status filter');
      fireEvent.click(removeBtn);

      expect(state.get('$filter.sales.order.status')).toBeNull();
    });
  });

  describe('external reactivity', () => {
    it('refetches when $filter changes externally', async () => {
      mockApiResponse(sampleData, 3);
      const state = new StateStore();
      renderTable(tableWithColumns(), { state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const filteredData = [{ id: '1', customer: 'Acme Corp', total: 1500, status: 'paid' }];
      mockApiResponse(filteredData, 1);

      state.set('$filter.sales.order.status', 'paid');

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledTimes(2);
      });

      const secondCall = mockApiClient.mock.calls[1][0] as string;
      expect(secondCall).toContain('filter%5Bstatus%5D=paid');
    });
  });

  describe('dumb mode (no pageSize)', () => {
    it('renders records from context without fetching', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          bind: { model: { name: 'sales.order' } },
          children: [{ type: 'column', props: { label: 'Customer' }, bind: { field: 'customer' } }],
        },
      ];

      renderTable(nodes, { records: sampleData });

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(mockApiClient).not.toHaveBeenCalled();
    });

    it('does not render pagination in dumb mode', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          bind: { model: { name: 'sales.order' } },
          children: [{ type: 'column', props: { label: 'Customer' }, bind: { field: 'customer' } }],
        },
      ];

      renderTable(nodes, { records: sampleData });

      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    });

    it('does not render filter bar in dumb mode', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          bind: { model: { name: 'sales.order' } },
          children: [
            {
              type: 'column',
              props: { label: 'Customer', filterable: true },
              bind: { field: 'customer' },
            },
          ],
        },
      ];

      renderTable(nodes, { records: sampleData });

      expect(screen.queryByText('Filter')).not.toBeInTheDocument();
    });
  });
});
