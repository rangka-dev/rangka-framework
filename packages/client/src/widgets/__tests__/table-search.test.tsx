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
  { id: '1', name: 'Acme Corp', email: 'acme@test.com', total: 1500 },
  { id: '2', name: 'Beta Inc', email: 'beta@test.com', total: 2500 },
];

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function mockApiResponse(data: Record<string, unknown>[], total?: number) {
  mockApiClient.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data, meta: { total: total ?? data.length } }),
  } as unknown as Response);
}

function tableNode(): WidgetNode[] {
  return [
    {
      type: 'table',
      source: { model: 'test.model' },
      props: { pageSize: 20 },
      children: [
        { type: 'column', bind: { field: 'name' }, props: { label: 'Name', filterable: true } },
        { type: 'column', bind: { field: 'email' }, props: { label: 'Email', filterable: true } },
        { type: 'column', bind: { field: 'total' }, props: { label: 'Total', align: 'right' } },
      ],
    },
  ];
}

const metaWithSearch = {
  navigation: [],
  pages: [],
  models: {
    'test.model': {
      qualifiedName: 'test.model',
      fields: [
        { name: 'name', type: 'string', label: 'Name', searchable: true },
        { name: 'email', type: 'string', label: 'Email', searchable: true },
        { name: 'total', type: 'money', label: 'Total' },
      ],
    },
  },
};

const metaWithoutSearch = {
  navigation: [],
  pages: [],
  models: {
    'test.model': {
      qualifiedName: 'test.model',
      fields: [
        { name: 'name', type: 'string', label: 'Name' },
        { name: 'email', type: 'string', label: 'Email' },
        { name: 'total', type: 'money', label: 'Total' },
      ],
    },
  },
};

function renderTable(options: { state?: StateStore; meta?: Record<string, unknown> } = {}) {
  const { state = new StateStore(), meta = metaWithSearch } = options;
  const ctx: WidgetContext = { record: {}, model: 'test.model', mode: 'view' };
  const queryClient = createQueryClient();
  const result = render(
    <MetaProvider meta={meta}>
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
      binding: 'none',
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

describe('Table search', () => {
  describe('visibility', () => {
    it('shows searchbar when model has searchable fields', async () => {
      mockApiResponse(sampleData);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('hides searchbar when model has no searchable fields', async () => {
      mockApiResponse(sampleData);
      renderTable({ meta: metaWithoutSearch });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
  });

  describe('debounced store update', () => {
    it('updates $search store key after debounce', async () => {
      mockApiResponse(sampleData);
      const state = new StateStore();
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      await waitFor(
        () => {
          expect(state.get('$search.test.model')).toBe('Acme');
        },
        { timeout: 500 },
      );
    });

    it('resets page to 1 when search is applied', async () => {
      mockApiResponse(sampleData);
      const state = new StateStore();
      state.set('$page.test.model', 3);
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(
        () => {
          expect(state.get('$page.test.model')).toBe(1);
        },
        { timeout: 500 },
      );
    });

    it('clears search from store when input is emptied', async () => {
      mockApiResponse(sampleData);
      const state = new StateStore();
      state.set('$search.test.model', 'old');
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(
        () => {
          expect(state.get('$search.test.model')).toBeNull();
        },
        { timeout: 500 },
      );
    });
  });

  describe('API integration', () => {
    it('sends search param in API call', async () => {
      mockApiClient.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: sampleData, meta: { total: 2 } }),
      } as unknown as Response);

      const state = new StateStore();
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      await waitFor(
        () => {
          const calls = mockApiClient.mock.calls.map((c) => c[0] as string);
          expect(calls.some((url) => url.includes('search=Acme'))).toBe(true);
        },
        { timeout: 1000 },
      );
    });

    it('does not send search param when empty', async () => {
      mockApiResponse(sampleData);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const firstCall = mockApiClient.mock.calls[0][0] as string;
      expect(firstCall).not.toContain('search');
    });
  });

  describe('clear button', () => {
    it('shows clear button when search has value', async () => {
      mockApiResponse(sampleData);
      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears input and store on clear button click', async () => {
      mockApiResponse(sampleData);
      const state = new StateStore();
      renderTable({ state });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(
        () => {
          expect(state.get('$search.test.model')).toBe('test');
        },
        { timeout: 500 },
      );

      fireEvent.click(screen.getByLabelText('Clear search'));

      await waitFor(
        () => {
          expect(searchInput.value).toBe('');
          expect(state.get('$search.test.model')).toBeNull();
        },
        { timeout: 500 },
      );
    });
  });
});
