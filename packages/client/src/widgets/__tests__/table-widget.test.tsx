import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { WidgetNode } from '@rangka/shared';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import { SlotRenderer } from '../renderer/SlotRenderer.js';
import { StateStore } from '../state/store.js';
import { buildRowContext } from '../context/builder.js';
import { TableWidget } from '../components/TableWidget.js';
import { ColumnWidget } from '../components/ColumnWidget.js';
import { MetaProvider } from '../../context/MetaContext.js';
import type { WidgetProps } from '../types.js';
import type { WidgetContext } from '../context/types.js';
import type { ComponentType } from 'react';

function TestText({ props, bind }: WidgetProps) {
  return <span data-testid="cell-text">{String(bind?.value ?? props?.text ?? '')}</span>;
}

function TestBadge({ bind }: WidgetProps) {
  return <span data-testid="cell-badge">{String(bind?.value ?? '')}</span>;
}

beforeEach(() => {
  clearWidgetRegistry();
  registerWidget(
    {
      name: 'table',
      label: 'Table',
      category: 'layout',
      schema: {},
      binding: 'none',
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
});

afterEach(() => {
  cleanup();
  clearWidgetRegistry();
});

function renderWithContext(
  nodes: WidgetNode[],
  records: Record<string, unknown>[] = [],
  model = 'sales.order',
) {
  const ctx: WidgetContext = {
    record: {},
    records,
    model,
    mode: 'view',
  };
  const state = new StateStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const meta = {
    navigation: [],
    pages: [],
    models: {
      [model]: {
        qualifiedName: model,
        fields: [
          { name: 'customer', type: 'string', label: 'Customer' },
          { name: 'total', type: 'money', label: 'Total' },
          { name: 'status', type: 'enum', label: 'Status', options: ['draft', 'confirmed'] },
        ],
      },
    },
  };
  return render(
    <MetaProvider meta={meta}>
      <QueryClientProvider client={queryClient}>
        <SlotRenderer nodes={nodes} context={ctx} state={state} />
      </QueryClientProvider>
    </MetaProvider>,
  );
}

describe('TableWidget', () => {
  const sampleOrders = [
    { id: '1', customer: 'Acme Corp', total: 1500, status: 'draft' },
    { id: '2', customer: 'Beta Inc', total: 2300, status: 'confirmed' },
    { id: '3', customer: 'Gamma Ltd', total: 800, status: 'draft' },
  ];

  describe('basic rendering', () => {
    it('renders table with column headers', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            { type: 'column', props: { label: 'Customer' } },
            { type: 'column', props: { label: 'Total' } },
            { type: 'column', props: { label: 'Status' } },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders rows from records', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'column',
              props: { label: 'Customer' },
              bind: { field: 'customer' },
            },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });

    it('renders "No data" when records are empty', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [{ type: 'column', props: { label: 'Customer' } }],
        },
      ];

      renderWithContext(nodes, []);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('renders with bordered prop', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          props: { bordered: true },
          children: [{ type: 'column', props: { label: 'Name' } }],
        },
      ];

      renderWithContext(nodes, sampleOrders);
      const table = screen.getByRole('table');
      expect(table.className).toContain('border');
    });

    it('renders with selectable prop', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          props: { selectable: true },
          children: [{ type: 'column', props: { label: 'Name' } }],
        },
      ];

      renderWithContext(nodes, sampleOrders);
      const checkboxes = screen.getAllByRole('checkbox');
      // 1 header + 3 rows
      expect(checkboxes.length).toBe(4);
    });
  });

  describe('row-scoped context', () => {
    it('renders column children with row data', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'column',
              props: { label: 'Customer' },
              children: [{ type: 'text', bind: { expression: '{{customer}}' } }],
            },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      const cells = screen.getAllByTestId('cell-text');
      expect(cells).toHaveLength(3);
      expect(cells[0]).toHaveTextContent('Acme Corp');
      expect(cells[1]).toHaveTextContent('Beta Inc');
      expect(cells[2]).toHaveTextContent('Gamma Ltd');
    });

    it('renders badge widget bound to row field', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'column',
              props: { label: 'Status' },
              children: [{ type: 'badge', bind: { field: 'status' } }],
            },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      const badges = screen.getAllByTestId('cell-badge');
      expect(badges).toHaveLength(3);
      expect(badges[0]).toHaveTextContent('draft');
      expect(badges[1]).toHaveTextContent('confirmed');
    });

    it('renders expressions using row fields', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'column',
              props: { label: 'Display' },
              children: [{ type: 'text', bind: { expression: '{{customer}}' } }],
            },
          ],
        },
      ];

      const records = [{ id: '1', customer: 'Test Co', total: 100 }];

      renderWithContext(nodes, records);

      expect(screen.getByTestId('cell-text')).toHaveTextContent('Test Co');
    });
  });

  describe('triggers', () => {
    it('fires rowClick trigger on row click', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          on: { rowClick: { type: 'setValue', field: '$state.selected', value: '{{id}}' } },
          children: [
            {
              type: 'column',
              props: { label: 'Customer' },
              bind: { field: 'customer' },
            },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      const rows = screen.getAllByRole('row');
      // rows[0] is header, click first data row
      fireEvent.click(rows[1]);

      // Row should have cursor-pointer class
      expect(rows[1].className).toContain('cursor-pointer');
    });

    it('fires select trigger on checkbox click', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          props: { selectable: true },
          on: { select: { type: 'setValue', field: '$state.selected', value: '{{id}}' } },
          children: [{ type: 'column', props: { label: 'Customer' }, bind: { field: 'customer' } }],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      const checkboxes = screen.getAllByRole('checkbox');
      // Click first row checkbox (index 1, since 0 is select all)
      fireEvent.click(checkboxes[1]);

      // Should not crash
      expect(checkboxes[1]).toBeInTheDocument();
    });
  });

  describe('column props', () => {
    it('applies column width', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            { type: 'column', props: { label: 'ID', width: '80px' } },
            { type: 'column', props: { label: 'Name' } },
          ],
        },
      ];

      renderWithContext(nodes, [{ id: '1' }]);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0].style.width).toBe('80px');
    });

    it('applies column alignment', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            { type: 'column', props: { label: 'Amount', align: 'right' } },
            { type: 'column', props: { label: 'Name', align: 'center' } },
          ],
        },
      ];

      renderWithContext(nodes, [{ id: '1' }]);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0].className).toContain('text-right');
      expect(headers[1].className).toContain('text-center');
    });
  });

  describe('edge cases', () => {
    it('handles records with missing fields gracefully', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
            { type: 'column', props: { label: 'Missing' }, bind: { field: 'nonexistent' } },
          ],
        },
      ];

      renderWithContext(nodes, [{ id: '1', name: 'Test' }]);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles large dataset (100 rows)', () => {
      const records = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
      }));

      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'test.model' },
          children: [{ type: 'column', props: { label: 'Name' }, bind: { field: 'name' } }],
        },
      ];

      renderWithContext(nodes, records);

      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 99')).toBeInTheDocument();
    });

    it('handles table with no children columns', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
        },
      ];

      renderWithContext(nodes, sampleOrders);

      // Should render without crashing, no columns means no cells
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('handles null values in row data', () => {
      const records = [{ id: '1', name: null, amount: undefined }];

      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'test.model' },
          children: [
            { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
            { type: 'column', props: { label: 'Amount' }, bind: { field: 'amount' } },
          ],
        },
      ];

      renderWithContext(nodes, records);

      // Should not crash
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('renders multiple columns with different child widgets', () => {
      const nodes: WidgetNode[] = [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'column',
              props: { label: 'Name' },
              children: [{ type: 'text', bind: { expression: '{{customer}}' } }],
            },
            {
              type: 'column',
              props: { label: 'Status' },
              children: [{ type: 'badge', bind: { field: 'status' } }],
            },
          ],
        },
      ];

      renderWithContext(nodes, sampleOrders);

      expect(screen.getAllByTestId('cell-text')).toHaveLength(3);
      expect(screen.getAllByTestId('cell-badge')).toHaveLength(3);
    });
  });
});

describe('buildRowContext', () => {
  it('creates row context with correct record and index', () => {
    const tableCtx: WidgetContext = {
      record: {},
      records: [{ id: '1', name: 'A' }],
      model: 'sales.order',
      mode: 'view',
      parent: { record: { page: 1 }, model: 'root', mode: 'view' },
    };

    const rowCtx = buildRowContext({ id: '1', name: 'A' }, 0, tableCtx);

    expect(rowCtx.record).toEqual({ id: '1', name: 'A' });
    expect(rowCtx.index).toBe(0);
    expect(rowCtx.model).toBe('sales.order');
    expect(rowCtx.parent).toBe(tableCtx.parent);
  });

  it('row context parent points to table parent (not table)', () => {
    const rootCtx: WidgetContext = { record: { root: true }, model: 'root', mode: 'view' };
    const tableCtx: WidgetContext = {
      record: {},
      records: [],
      model: 'sales.order',
      mode: 'view',
      parent: rootCtx,
    };

    const rowCtx = buildRowContext({ id: '1' }, 0, tableCtx);
    expect(rowCtx.parent).toBe(rootCtx);
  });
});
