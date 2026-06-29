import { describe, it, expect } from 'vitest';
import { generateCrudPages } from '../crud-page-generator.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel, ResolvedField } from '../../schema/types.js';
import type { FieldConfig } from '@rangka/shared';

function makeField(name: string, config: FieldConfig): ResolvedField {
  return { name, config, provenance: { source: 'base' } };
}

function makeModel(
  app: string,
  name: string,
  fields: ResolvedField[],
  opts?: Partial<ResolvedModel>,
): ResolvedModel {
  return {
    qualifiedName: `${app}.${name}`,
    app,
    name,
    auditLog: false,
    crud: true,
    traits: [],
    fields: [makeField('id', { type: 'string', required: true }), ...fields],
    indexes: [],
    ...opts,
  };
}

describe('generateCrudPages', () => {
  describe('basic generation', () => {
    it('generates 3 pages per model (list, create, edit)', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('amount', { type: 'decimal', precision: 10, scale: 2 }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      expect(pages).toHaveLength(3);
      expect(pages.map((p) => p.page.key)).toEqual([
        'sales.invoice',
        'sales.invoice.new',
        'sales.invoice.edit',
      ]);
    });

    it('sets correct paths on generated pages', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      expect(pages[0].page.path).toBe('/sales/invoice');
      expect(pages[1].page.path).toBe('/sales/invoice/new');
      expect(pages[2].page.path).toBe('/sales/invoice/$id');
    });

    it('sets app correctly on generated pages', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      for (const p of pages) {
        expect(p.app).toBe('sales');
      }
    });

    it('generates pages for multiple models', () => {
      const invoice = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const customer = makeModel('sales', 'customer', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([invoice, customer]);
      const pages = generateCrudPages(registry, new Set());

      expect(pages).toHaveLength(6);
    });
  });

  describe('opt-out', () => {
    it('skips models with crud: false', () => {
      const model = makeModel(
        'sales',
        'invoice',
        [makeField('name', { type: 'string', required: true })],
        { crud: false },
      );
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      expect(pages).toHaveLength(0);
    });

    it('skips page keys already in manual set', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set(['sales.invoice']));

      expect(pages).toHaveLength(2);
      expect(pages.map((p) => p.page.key)).toEqual(['sales.invoice.new', 'sales.invoice.edit']);
    });

    it('skips individual page keys that are overridden', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set(['sales.invoice', 'sales.invoice.new']));

      expect(pages).toHaveLength(1);
      expect(pages[0].page.key).toBe('sales.invoice.edit');
    });
  });

  describe('list page', () => {
    it('skips list generation when no displayable columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('notes', { type: 'text' }),
        makeField('data', { type: 'json' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice');
      expect(listPage).toBeUndefined();
    });

    it('limits to 7 columns max', () => {
      const fields = Array.from({ length: 10 }, (_, i) =>
        makeField(`field_${i}`, { type: 'string' }),
      );
      const model = makeModel('sales', 'invoice', fields);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const table = listPage.page.widgets[0];
      expect(table.children!.length).toBeLessThanOrEqual(7);
    });

    it('skips text, json, attachment, hasMany, children, manyToMany from columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('notes', { type: 'text' }),
        makeField('data', { type: 'json' }),
        makeField('file', { type: 'attachment' }),
        makeField('items', { type: 'hasMany', model: 'sales.item', foreignKey: 'invoice' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const table = listPage.page.widgets[0];
      const columnFields = table.children!.map((c) => c.bind!.field);
      expect(columnFields).toEqual(['name']);
    });

    it('prioritizes naming field first', () => {
      const model = makeModel(
        'sales',
        'invoice',
        [
          makeField('amount', { type: 'decimal', precision: 10, scale: 2 }),
          makeField('title', { type: 'string', required: true }),
          makeField('status', { type: 'string' }),
        ],
        { naming: 'title' },
      );
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const table = listPage.page.widgets[0];
      expect(table.children![0].bind!.field).toBe('title');
    });

    it('aligns numeric columns to right', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('amount', { type: 'money' }),
        makeField('qty', { type: 'int' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const table = listPage.page.widgets[0];
      const amountCol = table.children!.find((c) => c.bind!.field === 'amount');
      const qtyCol = table.children!.find((c) => c.bind!.field === 'qty');
      expect(amountCol!.props!.align).toBe('right');
      expect(qtyCol!.props!.align).toBe('right');
    });

    it('includes a New button in page actions', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const newAction = listPage.page.actions!.find((a) => a.label === 'New');
      expect(newAction).toBeDefined();
      expect(newAction!.action).toEqual({
        type: 'navigate',
        path: '/sales/invoice/new',
      });
    });

    it('uses full layout for list page', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      expect(listPage.page.layout).toBe('full');
    });
  });

  describe('form pages (create and edit)', () => {
    it('skips id, sequence, computed, hasMany, children, manyToMany from forms', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('code', { type: 'sequence', prefix: 'INV', digits: 5 }),
        makeField('total', { type: 'computed', depends: ['amount'], compute: () => 0 }),
        makeField('items', { type: 'hasMany', model: 'sales.item', foreignKey: 'invoice' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const allBindFields = extractBindFields(form);
      expect(allBindFields).toEqual(['name']);
    });

    it('groups required fields in Basic Info section', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('amount', { type: 'decimal', precision: 10, scale: 2, required: true }),
        makeField('notes', { type: 'string' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const basicSection = form.children!.find((c) => c.props?.label === 'Basic Info');
      expect(basicSection).toBeDefined();
      const basicFields = extractBindFields(basicSection!);
      expect(basicFields).toContain('name');
      expect(basicFields).toContain('amount');
    });

    it('groups optional fields in Details section', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('notes', { type: 'string' }),
        makeField('status', { type: 'string' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const detailsSection = form.children!.find((c) => c.props?.label === 'Details');
      expect(detailsSection).toBeDefined();
      const detailFields = extractBindFields(detailsSection!);
      expect(detailFields).toContain('notes');
      expect(detailFields).toContain('status');
    });

    it('groups wide fields in Additional section', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
        makeField('description', { type: 'text' }),
        makeField('metadata', { type: 'json' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const additionalSection = form.children!.find((c) => c.props?.label === 'Additional');
      expect(additionalSection).toBeDefined();
      const wideFields = extractBindFields(additionalSection!);
      expect(wideFields).toContain('description');
      expect(wideFields).toContain('metadata');
    });

    it('edit page includes system fields section', () => {
      const model = makeModel(
        'sales',
        'invoice',
        [
          makeField('name', { type: 'string', required: true }),
          makeField('created_at', { type: 'datetime', readOnly: true }),
          makeField('updated_at', { type: 'datetime', readOnly: true }),
        ],
        { traits: ['timestamped'] },
      );
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const editPage = pages.find((p) => p.page.key === 'sales.invoice.edit')!;
      const form = editPage.page.widgets[0];
      const systemSection = form.children!.find((c) => c.props?.label === 'System');
      expect(systemSection).toBeDefined();
      expect(systemSection!.props!.collapsible).toBe(true);
      expect(systemSection!.props!.defaultCollapsed).toBe(true);
    });

    it('create page excludes system fields', () => {
      const model = makeModel(
        'sales',
        'invoice',
        [
          makeField('name', { type: 'string', required: true }),
          makeField('created_at', { type: 'datetime', readOnly: true }),
          makeField('updated_at', { type: 'datetime', readOnly: true }),
        ],
        { traits: ['timestamped'] },
      );
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const systemSection = form.children!.find((c) => c.props?.label === 'System');
      expect(systemSection).toBeUndefined();
    });

    it('edit page uses standalone form with source.id', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const editPage = pages.find((p) => p.page.key === 'sales.invoice.edit')!;
      const form = editPage.page.widgets[0];
      expect(form.type).toBe('form');
      expect(form.source).toEqual({ model: 'sales.invoice', id: '$route.id' });
      expect(form.props!.mode).toBe('$state.editing');
    });

    it('create page uses standalone form with source model', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      expect(form.type).toBe('form');
      expect(form.source).toEqual({ model: 'sales.invoice' });
    });
  });

  describe('widget type mapping', () => {
    const testCases: Array<{ fieldType: string; config: FieldConfig; expectedWidgetType: string }> =
      [
        { fieldType: 'string', config: { type: 'string' }, expectedWidgetType: 'input' },
        { fieldType: 'int', config: { type: 'int' }, expectedWidgetType: 'input' },
        {
          fieldType: 'decimal',
          config: { type: 'decimal', precision: 10, scale: 2 },
          expectedWidgetType: 'input',
        },
        { fieldType: 'text', config: { type: 'text' }, expectedWidgetType: 'textarea' },
        { fieldType: 'boolean', config: { type: 'boolean' }, expectedWidgetType: 'checkbox' },
        { fieldType: 'date', config: { type: 'date' }, expectedWidgetType: 'datepicker' },
        { fieldType: 'datetime', config: { type: 'datetime' }, expectedWidgetType: 'datetime' },
        {
          fieldType: 'enum',
          config: { type: 'enum', options: ['a', 'b'] },
          expectedWidgetType: 'select',
        },
        { fieldType: 'json', config: { type: 'json' }, expectedWidgetType: 'json' },
        {
          fieldType: 'link',
          config: { type: 'link', model: 'sales.customer' },
          expectedWidgetType: 'link',
        },
        { fieldType: 'money', config: { type: 'money' }, expectedWidgetType: 'money' },
        {
          fieldType: 'attachment',
          config: { type: 'attachment' },
          expectedWidgetType: 'attachment',
        },
      ];

    for (const { fieldType, config, expectedWidgetType } of testCases) {
      it(`maps ${fieldType} to ${expectedWidgetType} widget`, () => {
        const model = makeModel('sales', 'invoice', [makeField('test_field', config)]);
        const registry = new SchemaRegistry([model]);
        const pages = generateCrudPages(registry, new Set());

        const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
        const form = createPage.page.widgets[0];
        const fieldWidget = findWidgetByBind(form, 'test_field');
        expect(fieldWidget).toBeDefined();
        expect(fieldWidget!.type).toBe(expectedWidgetType);
      });
    }

    it('passes required: true for required fields', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const fieldWidget = findWidgetByBind(form, 'name');
      expect(fieldWidget!.props!.required).toBe(true);
    });

    it('passes options for enum fields', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('status', { type: 'enum', options: ['draft', 'sent', 'paid'] }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const createPage = pages.find((p) => p.page.key === 'sales.invoice.new')!;
      const form = createPage.page.widgets[0];
      const fieldWidget = findWidgetByBind(form, 'status');
      expect(fieldWidget!.props!.options).toEqual(['draft', 'sent', 'paid']);
    });
  });

  describe('labels', () => {
    it('uses field label when defined', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('inv_number', { type: 'string', required: true, label: 'Invoice Number' }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.label).toBe('Invoice Number');
    });

    it('converts field name to title case when no label', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('order_date', { type: 'date', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.label).toBe('Order Date');
    });

    it('pluralizes model label for list page', () => {
      const model = makeModel(
        'sales',
        'invoice',
        [makeField('name', { type: 'string', required: true })],
        { label: 'Invoice' },
      );
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      expect(listPage.page.label).toBe('Invoices');
    });
  });

  describe('filterable columns', () => {
    it('sets filterable on enum columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('status', { type: 'enum', options: ['draft', 'sent'], required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.filterable).toBe(true);
    });

    it('sets filterable on boolean columns', () => {
      const model = makeModel('sales', 'invoice', [makeField('is_paid', { type: 'boolean' })]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.filterable).toBe(true);
    });

    it('sets filterable on date columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('due_date', { type: 'date', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.filterable).toBe(true);
    });

    it('sets filterable on numeric columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('total', { type: 'money', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.filterable).toBe(true);
    });

    it('sets filterable on string columns', () => {
      const model = makeModel('sales', 'invoice', [
        makeField('name', { type: 'string', required: true }),
      ]);
      const registry = new SchemaRegistry([model]);
      const pages = generateCrudPages(registry, new Set());

      const listPage = pages.find((p) => p.page.key === 'sales.invoice')!;
      const col = listPage.page.widgets[0].children![0];
      expect(col.props!.filterable).toBe(true);
    });
  });
});

// --- Helpers ---

function extractBindFields(node: import('@rangka/shared').WidgetNode): string[] {
  const fields: string[] = [];
  if (node.bind?.field) fields.push(node.bind.field);
  if (node.children) {
    for (const child of node.children) {
      fields.push(...extractBindFields(child));
    }
  }
  return fields;
}

function findWidgetByBind(
  node: import('@rangka/shared').WidgetNode,
  field: string,
): import('@rangka/shared').WidgetNode | undefined {
  if (node.bind?.field === field) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findWidgetByBind(child, field);
      if (found) return found;
    }
  }
  return undefined;
}
