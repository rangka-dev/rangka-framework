import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { WidgetNode } from '@rangka/shared';
import { WidgetSlotRenderer } from '../shell/WidgetSlotRenderer.js';
import { ShellAPIProvider } from '../../shell/ShellContext.js';
import { DrawerProvider } from '../../shell/DrawerContext.js';
import { registerWidget, clearWidgetRegistry } from '../registry.js';
import type { WidgetProps } from '../types.js';

const mockNavigate = vi.fn();
vi.mock('../../router/hooks.js', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useRoute: () => ({ pageKey: undefined, path: '/' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// --- Realistic API Mock ---

let mockFetchResponses: Map<string, { status: number; body: unknown }>;
let fetchCalls: Array<{ url: string; method: string; body?: string }>;

function mockApiResponse(path: string, body: unknown, status = 200) {
  mockFetchResponses.set(path, { status, body });
}

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const pathname = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
  const method = init?.method ?? 'GET';
  const key = `${method}:${pathname}`;

  fetchCalls.push({ url: pathname, method, body: init?.body as string | undefined });

  // Try exact method:path match first, then just path for GET
  const match =
    mockFetchResponses.get(key) ??
    (method === 'GET' ? mockFetchResponses.get(pathname) : undefined);

  if (!match) {
    // Try prefix match for URLs with query params
    for (const [mockKey, mockValue] of mockFetchResponses.entries()) {
      const mockMethod = mockKey.includes(':') ? mockKey.split(':')[0] : 'GET';
      const mockPath = mockKey.includes(':') ? mockKey.slice(mockKey.indexOf(':') + 1) : mockKey;
      if (mockMethod === method && pathname.startsWith(mockPath.split('?')[0])) {
        return Promise.resolve(
          new Response(JSON.stringify(mockValue.body), {
            status: mockValue.status,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
    }

    return Promise.resolve(new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }));
  }

  return Promise.resolve(
    new Response(JSON.stringify(match.body), {
      status: match.status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// --- Test Widgets ---

function TestButton({ props, on }: WidgetProps) {
  return (
    <button data-testid="test-button" onClick={() => on?.click?.()}>
      {String(props?.label ?? 'Button')}
    </button>
  );
}

function TestInput({ bind, on }: WidgetProps) {
  return (
    <input
      data-testid="test-input"
      value={String(bind?.value ?? '')}
      onChange={(e) => {
        bind?.setValue?.(e.target.value);
        on?.change?.(e.target.value);
      }}
    />
  );
}

function TestDisplay({ props, bind }: WidgetProps) {
  return <span data-testid="test-display">{String(bind?.value ?? props?.text ?? '')}</span>;
}

function TestGroup({ children }: WidgetProps) {
  return <div data-testid="test-group">{children}</div>;
}

// --- Test Wrapper ---

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ShellAPIProvider>
          <DrawerProvider>{children}</DrawerProvider>
        </ShellAPIProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient, cleanup: () => {} };
}

// --- Setup/Teardown ---

beforeEach(() => {
  mockFetchResponses = new Map();
  fetchCalls = [];
  vi.stubGlobal('fetch', mockFetch);
  clearWidgetRegistry();

  registerWidget(
    {
      name: 'test-button',
      label: 'Test Button',
      category: 'action',
      schema: {},
      binding: 'none',
      triggers: ['click'],
      container: false,
    },
    TestButton,
  );
  registerWidget(
    {
      name: 'test-input',
      label: 'Test Input',
      category: 'input',
      schema: {},
      binding: 'field',
      triggers: ['change'],
      container: false,
    },
    TestInput,
  );
  registerWidget(
    {
      name: 'test-display',
      label: 'Test Display',
      category: 'display',
      schema: {},
      binding: 'expression',
      triggers: [],
      container: false,
    },
    TestDisplay,
  );
  registerWidget(
    {
      name: 'test-group',
      label: 'Test Group',
      category: 'layout',
      schema: {},
      binding: 'none',
      triggers: [],
      container: true,
    },
    TestGroup,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearWidgetRegistry();
});

// --- Tests ---

describe('WidgetSlotRenderer — shell integration', () => {
  describe('basic rendering', () => {
    it('renders widget nodes with record context', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-display', bind: { expression: '{{name}}' } }];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ name: 'John Doe', id: '1' }}
            model="contacts.contact"
          />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-display')).toHaveTextContent('John Doe');
    });

    it('renders nested container with children', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-group',
          children: [
            { type: 'test-button', props: { label: 'Save' } },
            { type: 'test-button', props: { label: 'Cancel' } },
          ],
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('test-button')).toHaveLength(2);
    });

    it('renders multiple slots independently', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        { type: 'test-display', props: { text: 'Slot A' } },
        { type: 'test-display', props: { text: 'Slot B' } },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} />
        </Wrapper>,
      );

      const displays = screen.getAllByTestId('test-display');
      expect(displays).toHaveLength(2);
      expect(displays[0]).toHaveTextContent('Slot A');
      expect(displays[1]).toHaveTextContent('Slot B');
    });

    it('renders empty nodes array without crashing', () => {
      const { Wrapper } = createWrapper();
      const { container } = render(
        <Wrapper>
          <WidgetSlotRenderer nodes={[]} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });

  describe('record state management', () => {
    it('updates record state when setValue is called via binding', async () => {
      const onRecordChange = vi.fn();
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        { type: 'test-input', bind: { field: 'name' } },
        { type: 'test-display', bind: { expression: '{{name}}' } },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ name: 'initial' }}
            model="contacts.contact"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      const input = screen.getByTestId('test-input');
      fireEvent.change(input, { target: { value: 'updated' } });

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'updated' }));
      });
    });

    it('handles rapid sequential setValue calls without losing state', async () => {
      const onRecordChange = vi.fn();
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-input', bind: { field: 'field1' } }];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ field1: '' }}
            model="test.model"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      const input = screen.getByTestId('test-input');
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenLastCalledWith(expect.objectContaining({ field1: 'abc' }));
      });
    });

    it('preserves other record fields when updating one field', async () => {
      const onRecordChange = vi.fn();
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-input', bind: { field: 'name' } }];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ name: 'old', email: 'test@test.com', age: 25 }}
            model="contacts.contact"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      const input = screen.getByTestId('test-input');
      fireEvent.change(input, { target: { value: 'new' } });

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalledWith({
          name: 'new',
          email: 'test@test.com',
          age: 25,
        });
      });
    });
  });

  describe('action handlers — navigate', () => {
    it('dispatches navigation via navigate action', async () => {
      const { Wrapper } = createWrapper();
      mockNavigate.mockClear();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Go' },
          on: { click: { type: 'navigate', path: '/orders/123' } },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ id: '123' }} model="sales.order" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/123');
      });
    });

    it('resolves expressions in navigate path', async () => {
      const { Wrapper } = createWrapper();
      mockNavigate.mockClear();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'View' },
          on: { click: { type: 'navigate', path: '/orders/{{id}}' } },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ id: '456' }} model="sales.order" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/456');
      });
    });
  });

  describe('action handlers — model CRUD', () => {
    it('calls model.create with resolved data', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/sales/order', { id: 'new-1', status: 'draft' }, 201);

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Create' },
          on: {
            click: {
              type: 'model.create',
              model: 'sales.order',
              data: { status: 'draft', customer: '{{customer_id}}' },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ customer_id: 'cust-99' }}
            model="sales.order"
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        const createCall = fetchCalls.find(
          (c) => c.method === 'POST' && c.url.includes('/api/sales/order'),
        );
        expect(createCall).toBeDefined();
        const body = JSON.parse(createCall!.body!);
        expect(body.customer).toBe('cust-99');
        expect(body.status).toBe('draft');
      });
    });

    it('calls model.update with correct id and data', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('PUT:/api/sales/order/order-1', { id: 'order-1', status: 'confirmed' });

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Confirm' },
          on: {
            click: {
              type: 'model.update',
              model: 'sales.order',
              id: '{{id}}',
              data: { status: 'confirmed' },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ id: 'order-1', status: 'draft' }}
            model="sales.order"
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        const updateCall = fetchCalls.find(
          (c) => c.method === 'PUT' && c.url.includes('/api/sales/order/order-1'),
        );
        expect(updateCall).toBeDefined();
      });
    });

    it('calls model.delete and invalidates queries', async () => {
      const { Wrapper, queryClient } = createWrapper();
      mockApiResponse('DELETE:/api/hr/payslip/pay-1', null);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Delete' },
          on: {
            click: {
              type: 'model.delete',
              model: 'hr.payslip',
              id: '{{id}}',
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ id: 'pay-1' }} model="hr.payslip" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: ['model', 'hr.payslip'] }),
        );
      });
    });

    it('calls model.fetch and loads into record', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('/api/sales/order/fetch-1', {
        id: 'fetch-1',
        total: 500,
        status: 'confirmed',
      });

      const onRecordChange = vi.fn();
      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Load' },
          on: {
            click: {
              type: 'model.fetch',
              model: 'sales.order',
              id: 'fetch-1',
              into: '$record',
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{}}
            model="sales.order"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalled();
      });
    });

    it('calls model.list with filters', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('GET:/api/sales/order', {
        data: [
          { id: '1', status: 'draft' },
          { id: '2', status: 'draft' },
        ],
      });

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'List' },
          on: {
            click: {
              type: 'model.list',
              model: 'sales.order',
              filters: { status: 'draft' },
              into: '$state.orders',
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        const listCall = fetchCalls.find(
          (c) =>
            c.method === 'GET' && c.url.includes('/api/sales/order') && c.url.includes('filter'),
        );
        expect(listCall).toBeDefined();
      });
    });

    it('handles model.create failure gracefully', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/sales/order', { message: 'Validation failed' }, 400);

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Create' },
          on: {
            click: {
              type: 'model.create',
              model: 'sales.order',
              data: { status: 'invalid' },
            },
          },
        },
      ];

      // Should not throw — action errors are silently caught
      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      // Click should not crash the renderer
      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(screen.getByTestId('test-button')).toBeInTheDocument();
      });
    });
  });

  describe('action handlers — service calls', () => {
    it('calls service endpoint with resolved params', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/services/approve-order', { approved: true });

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Approve' },
          on: {
            click: {
              type: 'service',
              name: 'approve-order',
              params: { orderId: '{{id}}', force: true },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ id: 'ord-42' }} model="sales.order" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        const serviceCall = fetchCalls.find(
          (c) => c.method === 'POST' && c.url.includes('/api/services/approve-order'),
        );
        expect(serviceCall).toBeDefined();
        const body = JSON.parse(serviceCall!.body!);
        expect(body.orderId).toBe('ord-42');
        expect(body.force).toBe(true);
      });
    });

    it('executes onSuccess action after successful service call', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/services/calc-total', { total: 1500 });

      const onRecordChange = vi.fn();
      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Calculate' },
          on: {
            click: {
              type: 'service',
              name: 'calc-total',
              params: { items: '{{items}}' },
              onSuccess: {
                type: 'setValue',
                field: 'total',
                value: '{{$response.total}}',
              },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ items: [{ amount: 500 }, { amount: 1000 }], total: 0 }}
            model="sales.order"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalledWith(expect.objectContaining({ total: 1500 }));
      });
    });

    it('executes onError action after failed service call', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/services/risky-op', { message: 'Server error' }, 500);

      const onRecordChange = vi.fn();
      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Risky' },
          on: {
            click: {
              type: 'service',
              name: 'risky-op',
              params: {},
              onError: {
                type: 'setValue',
                field: '$state.error',
                value: '{{$response.message}}',
              },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{}}
            model="sales.order"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      // Should not crash
      await waitFor(() => {
        expect(screen.getByTestId('test-button')).toBeInTheDocument();
      });
    });
  });

  describe('action handlers — $state integration', () => {
    it('setValue writes to $state and affects visibility', async () => {
      const { Wrapper } = createWrapper();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Show Details' },
          on: { click: { type: 'setValue', field: '$state.showDetails', value: true } },
        },
        {
          type: 'test-display',
          props: { text: 'Details visible' },
          visible: { field: '$state.showDetails', operator: 'eq', value: true },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      expect(screen.queryByText('Details visible')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(screen.getByText('Details visible')).toBeInTheDocument();
      });
    });

    it('setValues updates multiple $state keys atomically', async () => {
      const { Wrapper } = createWrapper();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Set Multiple' },
          on: {
            click: {
              type: 'setValues',
              values: {
                '$state.step': 2,
                '$state.loading': false,
              },
            },
          },
        },
        {
          type: 'test-display',
          props: { text: 'Step 2' },
          visible: { field: '$state.step', operator: 'eq', value: 2 },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      expect(screen.queryByText('Step 2')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
      });
    });
  });

  describe('action handlers — sequence and conditional', () => {
    it('executes sequence of actions in order', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/services/save', { success: true });
      mockNavigate.mockClear();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Save & Navigate' },
          on: {
            click: {
              type: 'sequence',
              actions: [
                { type: 'setValue', field: '$state.saving', value: true },
                { type: 'service', name: 'save', params: {} },
                { type: 'setValue', field: '$state.saving', value: false },
                { type: 'navigate', path: '/dashboard' },
              ],
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('executes conditional action — then branch', async () => {
      const { Wrapper } = createWrapper();
      const onRecordChange = vi.fn();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Check' },
          on: {
            click: {
              type: 'conditional',
              condition: { field: 'status', operator: 'eq', value: 'draft' },
              then: { type: 'setValue', field: 'status', value: 'confirmed' },
              else: { type: 'setValue', field: 'status', value: 'draft' },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ status: 'draft' }}
            model="sales.order"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'confirmed' }),
        );
      });
    });

    it('executes conditional action — else branch', async () => {
      const { Wrapper } = createWrapper();
      const onRecordChange = vi.fn();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Check' },
          on: {
            click: {
              type: 'conditional',
              condition: { field: 'status', operator: 'eq', value: 'draft' },
              then: { type: 'setValue', field: 'status', value: 'confirmed' },
              else: { type: 'setValue', field: 'status', value: 'reverted' },
            },
          },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ status: 'confirmed' }}
            model="sales.order"
            onRecordChange={onRecordChange}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(onRecordChange).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'reverted' }),
        );
      });
    });
  });

  describe('action handlers — refreshSource', () => {
    it('invalidates model query when refreshSource fires', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Refresh' },
          on: { click: { type: 'refreshSource' } },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{}}
            model="sales.order"
            sourceQueryKey={['model', 'sales.order', {}]}
          />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: ['model', 'sales.order', {}] }),
        );
      });
    });

    it('falls back to model key when no sourceQueryKey provided', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Refresh' },
          on: { click: { type: 'refreshSource' } },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="hr.payslip" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: ['model', 'hr.payslip'] }),
        );
      });
    });
  });

  describe('expression resolution in context', () => {
    it('resolves nested record field expressions', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          bind: { expression: '{{qty * rate}}' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ qty: 5, rate: 100 }} model="sales.line" />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-display')).toHaveTextContent('500');
    });

    it('resolves template strings with multiple expressions', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          props: { text: '{{name}} - {{status}}' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ name: 'Order #1', status: 'draft' }}
            model="sales.order"
          />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-display')).toHaveTextContent('Order #1 - draft');
    });

    it('handles null/undefined field gracefully in expressions', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          bind: { expression: '{{missing_field}}' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="sales.order" />
        </Wrapper>,
      );

      // Should render without crashing, showing empty or null
      expect(screen.getByTestId('test-display')).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('hides widget when condition is not met', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          props: { text: 'Only for draft' },
          visible: { field: 'status', operator: 'eq', value: 'draft' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ status: 'confirmed' }} model="sales.order" />
        </Wrapper>,
      );

      expect(screen.queryByText('Only for draft')).not.toBeInTheDocument();
    });

    it('shows widget when condition is met', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          props: { text: 'Only for draft' },
          visible: { field: 'status', operator: 'eq', value: 'draft' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ status: 'draft' }} model="sales.order" />
        </Wrapper>,
      );

      expect(screen.getByText('Only for draft')).toBeInTheDocument();
    });

    it('evaluates multiple conditions (AND logic)', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          props: { text: 'Draft with total' },
          visible: [
            { field: 'status', operator: 'eq', value: 'draft' },
            { field: 'total', operator: 'gt', value: 0 },
          ],
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ status: 'draft', total: 0 }}
            model="sales.order"
          />
        </Wrapper>,
      );

      expect(screen.queryByText('Draft with total')).not.toBeInTheDocument();
    });

    it('shows widget when all AND conditions pass', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          props: { text: 'Draft with total' },
          visible: [
            { field: 'status', operator: 'eq', value: 'draft' },
            { field: 'total', operator: 'gt', value: 0 },
          ],
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ status: 'draft', total: 100 }}
            model="sales.order"
          />
        </Wrapper>,
      );

      expect(screen.getByText('Draft with total')).toBeInTheDocument();
    });
  });

  describe('edge cases and stress tests', () => {
    it('handles deeply nested widget tree (5 levels)', () => {
      const { Wrapper } = createWrapper();

      const deepNode: WidgetNode = {
        type: 'test-group',
        children: [
          {
            type: 'test-group',
            children: [
              {
                type: 'test-group',
                children: [
                  {
                    type: 'test-group',
                    children: [{ type: 'test-display', props: { text: 'deeply nested' } }],
                  },
                ],
              },
            ],
          },
        ],
      };

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={[deepNode]} record={{}} model="test.model" />
        </Wrapper>,
      );

      expect(screen.getByText('deeply nested')).toBeInTheDocument();
      expect(screen.getAllByTestId('test-group')).toHaveLength(4);
    });

    it('handles large number of nodes (50 widgets)', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = Array.from({ length: 50 }, (_, i) => ({
        type: 'test-display',
        props: { text: `item-${i}` },
      }));

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="test.model" />
        </Wrapper>,
      );

      expect(screen.getAllByTestId('test-display')).toHaveLength(50);
      expect(screen.getByText('item-0')).toBeInTheDocument();
      expect(screen.getByText('item-49')).toBeInTheDocument();
    });

    it('handles unknown widget type gracefully', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        { type: 'nonexistent-widget', props: { label: 'Ghost' } },
        { type: 'test-display', props: { text: 'still renders' } },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="test.model" />
        </Wrapper>,
      );

      expect(screen.getByText('still renders')).toBeInTheDocument();
    });

    it('handles concurrent actions without race conditions', async () => {
      const { Wrapper } = createWrapper();
      mockApiResponse('POST:/api/services/slow', { result: 'done' });
      mockApiResponse('POST:/api/services/fast', { result: 'quick' });

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Fire Both' },
          on: {
            click: {
              type: 'sequence',
              actions: [
                { type: 'service', name: 'slow', params: {} },
                { type: 'service', name: 'fast', params: {} },
                { type: 'setValue', field: '$state.done', value: true },
              ],
            },
          },
        },
        {
          type: 'test-display',
          props: { text: 'All done' },
          visible: { field: '$state.done', operator: 'eq', value: true },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="test.model" />
        </Wrapper>,
      );

      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(screen.getByText('All done')).toBeInTheDocument();
      });
    });

    it('handles model with no record gracefully', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-input', bind: { field: 'name' } }];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} model="sales.order" />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('handles widget with no props, no bind, no triggers', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-group' }];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} model="test.model" />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-group')).toBeInTheDocument();
    });

    it('handles action dispatch when model is undefined', async () => {
      const { Wrapper } = createWrapper();

      const nodes: WidgetNode[] = [
        {
          type: 'test-button',
          props: { label: 'Nav' },
          on: { click: { type: 'navigate', path: '/home' } },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{}} />
        </Wrapper>,
      );

      // Should not throw
      fireEvent.click(screen.getByTestId('test-button'));

      await waitFor(() => {
        expect(screen.getByTestId('test-button')).toBeInTheDocument();
      });
    });

    it('handles expressions with special characters in field values', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [
        {
          type: 'test-display',
          bind: { expression: '{{description}}' },
        },
      ];

      render(
        <Wrapper>
          <WidgetSlotRenderer
            nodes={nodes}
            record={{ description: 'Has "quotes" & <tags>' }}
            model="test.model"
          />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-display')).toHaveTextContent('Has "quotes" & <tags>');
    });

    it('handles numeric zero and boolean false as valid values', () => {
      const { Wrapper } = createWrapper();
      const nodes: WidgetNode[] = [{ type: 'test-display', bind: { expression: '{{count}}' } }];

      render(
        <Wrapper>
          <WidgetSlotRenderer nodes={nodes} record={{ count: 0 }} model="test.model" />
        </Wrapper>,
      );

      expect(screen.getByTestId('test-display')).toHaveTextContent('0');
    });
  });
});
