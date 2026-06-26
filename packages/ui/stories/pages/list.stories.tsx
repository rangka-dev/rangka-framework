import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { FilterBar } from '../../src/data/filter-bar';
import { PageShell } from './page-shell';
import { TableWidget } from '../../src/widgets/data/table-widget';

const meta: Meta = {
  title: 'Widget Compose/List',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const ctx = { record: {}, model: 'sales.order', mode: 'view' as const };

const orders = [
  {
    id: 'ORD-001',
    customer: 'Acme Corp',
    date: '2026-06-20',
    status: 'Confirmed',
    total: '$4,250.00',
  },
  {
    id: 'ORD-002',
    customer: 'Globex Inc',
    date: '2026-06-21',
    status: 'Draft',
    total: '$1,800.00',
  },
  {
    id: 'ORD-003',
    customer: 'Wayne Enterprises',
    date: '2026-06-22',
    status: 'Overdue',
    total: '$12,500.00',
  },
  {
    id: 'ORD-004',
    customer: 'Stark Industries',
    date: '2026-06-23',
    status: 'Pending',
    total: '$8,900.00',
  },
  {
    id: 'ORD-005',
    customer: 'Umbrella Corp',
    date: '2026-06-24',
    status: 'Confirmed',
    total: '$3,200.00',
  },
  {
    id: 'ORD-006',
    customer: 'Cyberdyne Systems',
    date: '2026-06-24',
    status: 'Shipped',
    total: '$6,750.00',
  },
  { id: 'ORD-007', customer: 'Initech', date: '2026-06-25', status: 'Draft', total: '$950.00' },
  {
    id: 'ORD-008',
    customer: 'Weyland-Yutani',
    date: '2026-06-25',
    status: 'Confirmed',
    total: '$22,000.00',
  },
];

const customers = [
  {
    id: '1',
    company: 'Acme Corp',
    contact: 'John Smith',
    email: 'john@acme.com',
    terms: 'Net 30',
    outstanding: '$14,500.00',
  },
  {
    id: '2',
    company: 'Globex Inc',
    contact: 'Jane Doe',
    email: 'jane@globex.com',
    terms: 'Net 15',
    outstanding: '$3,200.00',
  },
  {
    id: '3',
    company: 'Wayne Enterprises',
    contact: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    terms: 'Net 60',
    outstanding: '$45,000.00',
  },
  {
    id: '4',
    company: 'Stark Industries',
    contact: 'Pepper Potts',
    email: 'pepper@stark.com',
    terms: 'Net 30',
    outstanding: '$8,900.00',
  },
  {
    id: '5',
    company: 'Umbrella Corp',
    contact: 'Albert Wesker',
    email: 'wesker@umbrella.com',
    terms: 'Net 30',
    outstanding: '$0.00',
  },
];

export const OrderList: Story = {
  name: 'Order List (Bleed)',
  render: () => (
    <PageShell
      module="Sales"
      page="Orders"
      layout="full"
      action={
        <Button variant="primary" size="xs">
          <Icon icon={Plus} size="sm" />
          <span>New Order</span>
        </Button>
      }
    >
      <TableWidget
        props={{
          variant: 'flat',
          columns: [
            { field: 'id', label: 'Order', sortable: true },
            { field: 'customer', label: 'Customer', sortable: true },
            { field: 'date', label: 'Date', sortable: true },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 142,
        }}
        bind={{ value: orders }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const OrderListCard: Story = {
  name: 'Order List (Card)',
  render: () => (
    <PageShell module="Sales" page="Orders">
      <TableWidget
        props={{
          variant: 'card',
          columns: [
            { field: 'id', label: 'Order', sortable: true },
            { field: 'customer', label: 'Customer', sortable: true },
            { field: 'date', label: 'Date', sortable: true },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 142,
        }}
        bind={{ value: orders }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const CustomerList: Story = {
  name: 'Customer List (Bleed)',
  render: () => (
    <PageShell
      module="Sales"
      page="Customers"
      layout="full"
      action={
        <Button variant="primary" size="xs">
          <Icon icon={Plus} size="sm" />
          <span>New Customer</span>
        </Button>
      }
    >
      <TableWidget
        props={{
          variant: 'flat',
          columns: [
            { field: 'company', label: 'Company', sortable: true },
            { field: 'contact', label: 'Contact' },
            { field: 'email', label: 'Email' },
            { field: 'terms', label: 'Payment Terms' },
            { field: 'outstanding', label: 'Outstanding', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 28,
        }}
        bind={{ value: customers }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const EmptyList: Story = {
  name: 'Empty List',
  render: () => (
    <PageShell module="Sales" page="Orders">
      <TableWidget
        props={{
          variant: 'card',
          columns: [
            { field: 'id', label: 'Order' },
            { field: 'customer', label: 'Customer' },
            { field: 'date', label: 'Date' },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right' },
          ],
          emptyText: 'No orders found. Create your first order to get started.',
        }}
        bind={{ value: [] }}
        on={{}}
        context={ctx}
      />
    </PageShell>
  ),
};

const STRING_OPERATORS = [
  { value: 'like', label: 'Contains', needsValue: true },
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

const NUMERIC_OPERATORS = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'gt', label: 'Greater than', needsValue: true },
  { value: 'gte', label: 'Greater or equal', needsValue: true },
  { value: 'lt', label: 'Less than', needsValue: true },
  { value: 'lte', label: 'Less or equal', needsValue: true },
];

const filterFields = [
  { field: 'customer', label: 'Customer', type: 'string' },
  { field: 'status', label: 'Status', type: 'string' },
  { field: 'total', label: 'Total', type: 'decimal' },
  { field: 'date', label: 'Date', type: 'date' },
];

function getOps(type: string) {
  if (type === 'decimal') return NUMERIC_OPERATORS;
  return STRING_OPERATORS;
}

function getSymbol(op: string) {
  switch (op) {
    case 'eq':
      return '=';
    case 'neq':
      return '≠';
    case 'gt':
      return '>';
    case 'gte':
      return '≥';
    case 'lt':
      return '<';
    case 'lte':
      return '≤';
    case 'like':
      return '≈';
    case 'empty':
      return 'is empty';
    case 'not_empty':
      return 'is not empty';
    default:
      return '=';
  }
}

interface ActiveFilter {
  field: string;
  label: string;
  operator: string;
  value: string;
}

export const WithFilter: Story = {
  name: 'With Filter Bar',
  render: function FilterDemo() {
    const [filterOpen, setFilterOpen] = useState(true);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [filters, setFilters] = useState<ActiveFilter[]>([
      { field: 'customer', label: 'Customer', operator: 'like', value: 'Acme' },
      { field: 'total', label: 'Total', operator: 'gte', value: '1000' },
    ]);
    const [step, setStep] = useState<'fields' | 'operator'>('fields');
    const [selectedField, setSelectedField] = useState<(typeof filterFields)[0] | null>(null);
    const [operator, setOperator] = useState('');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');

    const handleFieldSelect = (f: (typeof filterFields)[0]) => {
      setSelectedField(f);
      const ops = getOps(f.type);
      setOperator(ops[0].value);
      setValue('');
      setStep('operator');
    };

    const handleApply = () => {
      if (!selectedField) return;
      setFilters((prev) => [
        ...prev,
        { field: selectedField.field, label: selectedField.label, operator, value },
      ]);
      setPopoverOpen(false);
      setStep('fields');
      setSelectedField(null);
      setSearch('');
    };

    const handleRemove = (field: string) => {
      const next = filters.filter((f) => f.field !== field);
      setFilters(next);
      if (next.length === 0) setFilterOpen(false);
    };

    const handleToggle = () => {
      if (!filterOpen && filters.length === 0) {
        setFilterOpen(true);
        setPopoverOpen(true);
      } else {
        setFilterOpen(!filterOpen);
      }
    };

    const handleAddClick = () => {
      setPopoverOpen(true);
      setStep('fields');
      setSelectedField(null);
      setSearch('');
    };

    const filteredFields = filterFields.filter((f) =>
      f.label.toLowerCase().includes(search.toLowerCase()),
    );
    const currentOps = selectedField ? getOps(selectedField.type) : [];
    const currentOp = currentOps.find((o) => o.value === operator);

    return (
      <PageShell
        module="Sales"
        page="Orders"
        layout="full"
        action={
          <>
            <FilterBar.Trigger count={filters.length} active={filterOpen} onToggle={handleToggle} />
            <Button variant="primary" size="xs">
              <Icon icon={Plus} size="sm" />
              <span>New Order</span>
            </Button>
          </>
        }
      >
        {filterOpen && (
          <FilterBar>
            <FilterBar.Content>
              {filters.map((f) => (
                <FilterBar.Badge
                  key={f.field}
                  label={f.label}
                  operator={getSymbol(f.operator)}
                  value={f.value}
                  onRemove={() => handleRemove(f.field)}
                />
              ))}
              <div className="relative">
                <FilterBar.AddButton onClick={handleAddClick} />
                <FilterBar.Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  {step === 'fields' ? (
                    <FilterBar.FieldList search={search} onSearchChange={setSearch}>
                      {filteredFields.map((f) => (
                        <FilterBar.FieldItem key={f.field} onClick={() => handleFieldSelect(f)}>
                          {f.label}
                        </FilterBar.FieldItem>
                      ))}
                    </FilterBar.FieldList>
                  ) : (
                    <FilterBar.OperatorForm
                      fieldLabel={selectedField?.label ?? ''}
                      operators={currentOps}
                      operator={operator}
                      onOperatorChange={setOperator}
                      value={value}
                      onValueChange={setValue}
                      needsValue={currentOp?.needsValue}
                      onApply={handleApply}
                      onBack={() => {
                        setStep('fields');
                        setSelectedField(null);
                      }}
                    />
                  )}
                </FilterBar.Popover>
              </div>
            </FilterBar.Content>
          </FilterBar>
        )}
        <TableWidget
          props={{
            variant: 'flat',
            columns: [
              { field: 'id', label: 'Order', sortable: true },
              { field: 'customer', label: 'Customer', sortable: true },
              { field: 'date', label: 'Date', sortable: true },
              { field: 'status', label: 'Status' },
              { field: 'total', label: 'Total', align: 'right', sortable: true },
            ],
            page: 1,
            pageSize: 20,
            total: 142,
          }}
          bind={{ value: orders }}
          on={{ rowClick: () => {} }}
          context={ctx}
        />
      </PageShell>
    );
  },
};
