import type { PageDefinition, FieldConfig } from '@rangka/shared';
import { widget, action } from '@rangka/shared';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedField, ResolvedModel } from '../schema/types.js';

interface FieldGroup {
  basic: ResolvedField[];
  details: ResolvedField[];
  wide: ResolvedField[];
  system: ResolvedField[];
}

const SYSTEM_FIELDS = new Set(['created_at', 'updated_at', 'deleted_at']);
const WIDE_TYPES = new Set(['text', 'json', 'code', 'attachment', 'attachments']);
const SKIP_LIST_TYPES = new Set([
  'text',
  'json',
  'code',
  'attachment',
  'attachments',
  'hasMany',
  'children',
  'manyToMany',
]);
const SKIP_FORM_TYPES = new Set(['hasMany', 'children', 'manyToMany', 'computed', 'sequence']);

const MAX_LIST_COLUMNS = 7;

export function generateCrudPages(
  registry: SchemaRegistry,
  manualPageKeys: Set<string>,
): Array<{ app: string; page: PageDefinition }> {
  const pages: Array<{ app: string; page: PageDefinition }> = [];

  for (const model of registry.getAllModels()) {
    if (model.crud === false) continue;

    const listKey = model.qualifiedName;
    const createKey = `${model.qualifiedName}.new`;
    const editKey = `${model.qualifiedName}.edit`;

    if (!manualPageKeys.has(listKey)) {
      const listPage = generateListPage(model);
      if (listPage) pages.push({ app: model.app, page: listPage });
    }

    if (!manualPageKeys.has(createKey)) {
      pages.push({ app: model.app, page: generateCreatePage(model) });
    }

    if (!manualPageKeys.has(editKey)) {
      pages.push({ app: model.app, page: generateEditPage(model) });
    }
  }

  return pages;
}

function generateListPage(model: ResolvedModel): PageDefinition | null {
  const columns = getListColumns(model);
  if (columns.length === 0) return null;

  const modelLabel = model.label ?? toTitleCase(model.name);
  const basePath = `/${model.app}/${model.name}`;
  const peekFields = getPeekFields(model);

  return {
    key: model.qualifiedName,
    label: pluralize(modelLabel),
    path: basePath,
    layout: 'full',
    actions: [
      {
        type: 'button',
        label: 'New',
        icon: 'plus',
        variant: 'primary',
        action: action.navigate(`${basePath}/new`),
      },
    ],
    widgets: [
      widget.table(
        model.qualifiedName,
        {
          pageSize: 20,
          props: { selectable: true },
          on: { rowClick: action.setValue('$state.selectedId', '{{id}}') },
        },
        columns,
      ),
      widget.drawer(
        {
          title: modelLabel,
          width: 'md',
          visible: { field: '$state.selectedId', operator: 'neq', value: null },
          on: { close: action.setValue('$state.selectedId', null) },
        },
        [
          widget.data(model.qualifiedName, { id: '$state.selectedId' }, [
            ...peekFields,
            widget.group({ direction: 'row', gap: 'sm', justify: 'end' }, [
              widget.button('View Full', {
                variant: 'primary',
                icon: 'external-link',
                on: {
                  click: action.sequence([
                    action.navigate(`${basePath}/{{id}}`),
                    action.setValue('$state.selectedId', null),
                  ]),
                },
              }),
            ]),
          ]),
        ],
      ),
    ],
  };
}

function generateCreatePage(model: ResolvedModel): PageDefinition {
  const modelLabel = model.label ?? toTitleCase(model.name);
  const basePath = `/${model.app}/${model.name}`;
  const groups = groupFields(model, true);
  const sections = buildFormSections(groups, false);

  return {
    key: `${model.qualifiedName}.new`,
    label: `New ${modelLabel}`,
    path: `${basePath}/new`,
    actions: [
      {
        type: 'button',
        label: 'Back',
        icon: 'arrow-left',
        variant: 'ghost',
        action: action.navigate(basePath),
      },
    ],
    widgets: [
      widget.form(
        model.qualifiedName,
        {
          on: {
            success: action.sequence([
              action.toast('Record created', 'success'),
              action.navigate(`${basePath}/{{id}}`),
            ]),
          },
        },
        [
          ...sections,
          widget.group({ direction: 'row', gap: 'sm', justify: 'end' }, [
            widget.button('Cancel', {
              variant: 'ghost',
              on: { click: action.navigate(basePath) },
            }),
            widget.button('Save', { variant: 'primary', on: { click: action.submit() } }),
          ]),
        ],
      ),
    ],
  };
}

function generateEditPage(model: ResolvedModel): PageDefinition {
  const modelLabel = model.label ?? toTitleCase(model.name);
  const basePath = `/${model.app}/${model.name}`;
  const groups = groupFields(model, false);
  const sections = buildFormSections(groups, true);

  return {
    key: `${model.qualifiedName}.edit`,
    label: modelLabel,
    path: `${basePath}/$id`,
    actions: [
      {
        type: 'button',
        label: 'Back',
        icon: 'arrow-left',
        variant: 'ghost',
        action: action.navigate(basePath),
      },
      {
        type: 'button',
        label: 'Edit',
        icon: 'pencil',
        variant: 'secondary',
        visible: { field: '$state.editing', operator: 'neq', value: true },
        action: action.setValue('$state.editing', true),
      },
      {
        type: 'button',
        label: 'Cancel',
        variant: 'ghost',
        visible: { field: '$state.editing', operator: 'eq', value: true },
        action: action.sequence([action.reset(), action.setValue('$state.editing', false)]),
      },
      {
        type: 'button',
        label: 'Save',
        icon: 'check',
        variant: 'primary',
        visible: { field: '$state.editing', operator: 'eq', value: true },
        action: action.submit(),
      },
    ],
    widgets: [
      widget.form(
        model.qualifiedName,
        {
          id: '$route.id',
          mode: '$state.editing',
          on: {
            success: action.sequence([
              action.toast('Changes saved', 'success'),
              action.setValue('$state.editing', false),
            ]),
          },
        },
        sections,
      ),
    ],
  };
}

// --- Field classification ---

function groupFields(model: ResolvedModel, isCreate: boolean): FieldGroup {
  const basic: ResolvedField[] = [];
  const details: ResolvedField[] = [];
  const wide: ResolvedField[] = [];
  const system: ResolvedField[] = [];

  for (const field of model.fields) {
    if (field.name === 'id') continue;
    if (isHidden(field.config)) continue;
    if (SKIP_FORM_TYPES.has(field.config.type)) continue;

    if (SYSTEM_FIELDS.has(field.name)) {
      if (!isCreate) system.push(field);
      continue;
    }

    if (WIDE_TYPES.has(field.config.type)) {
      wide.push(field);
      continue;
    }

    if (field.name === model.naming || isRequired(field.config)) {
      basic.push(field);
      continue;
    }

    details.push(field);
  }

  return { basic, details, wide, system };
}

function getListColumns(model: ResolvedModel): import('@rangka/shared').WidgetNode[] {
  const columns: import('@rangka/shared').WidgetNode[] = [];
  const prioritized: ResolvedField[] = [];
  const rest: ResolvedField[] = [];

  for (const field of model.fields) {
    if (field.name === 'id') continue;
    if (isHidden(field.config)) continue;
    if (SKIP_LIST_TYPES.has(field.config.type)) continue;

    if (field.name === model.naming || field.config.type === 'sequence') {
      prioritized.unshift(field);
    } else if (isRequired(field.config)) {
      prioritized.push(field);
    } else {
      rest.push(field);
    }
  }

  const ordered = [...prioritized, ...rest];

  for (const field of ordered) {
    if (columns.length >= MAX_LIST_COLUMNS) break;

    const label = getLabel(field);
    const sortable = isSearchable(field.config) || isRequired(field.config);
    const align = isNumericType(field.config.type) ? ('right' as const) : undefined;
    const filterable = isFilterableType(field.config.type);
    const width = getColumnWidth(field);

    columns.push(
      widget.column(field.name, {
        label,
        sortable: sortable || undefined,
        align,
        filterable: filterable || undefined,
        width,
      }),
    );
  }

  return columns;
}

// --- Peek drawer fields ---

const STAMP_FIELDS = new Set([
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
  'deleted_by',
]);

function getPeekFields(model: ResolvedModel): import('@rangka/shared').WidgetNode[] {
  const basic: ResolvedField[] = [];
  const details: ResolvedField[] = [];

  for (const field of model.fields) {
    if (field.name === 'id') continue;
    if (isHidden(field.config)) continue;
    if (SKIP_LIST_TYPES.has(field.config.type)) continue;
    if (STAMP_FIELDS.has(field.name)) continue;
    if (field.config.type === 'link' || field.config.type === 'dynamicLink') continue;

    if (field.name === model.naming || isRequired(field.config)) {
      if (basic.length < 6) basic.push(field);
    } else {
      if (details.length < 4) details.push(field);
    }
  }

  const nodes: import('@rangka/shared').WidgetNode[] = [];

  if (basic.length > 0) {
    nodes.push(
      widget.section('Overview', [
        widget.grid({ columns: 2, gap: 'sm' }, basic.map(peekFieldNode)),
      ]),
    );
  }

  if (details.length > 0) {
    nodes.push(
      widget.section('Details', [
        widget.grid({ columns: 2, gap: 'sm' }, details.map(peekFieldNode)),
      ]),
    );
  }

  return nodes;
}

function peekFieldNode(field: ResolvedField): import('@rangka/shared').WidgetNode {
  return fieldToWidget(field);
}

// --- Form section building ---

function buildFormSections(
  groups: FieldGroup,
  includeSystem: boolean,
): import('@rangka/shared').WidgetNode[] {
  const sections: import('@rangka/shared').WidgetNode[] = [];

  if (groups.basic.length > 0) {
    sections.push(
      widget.section('Basic Info', [
        widget.grid({ columns: 2, gap: 'md' }, groups.basic.map(fieldToWidget)),
      ]),
    );
  }

  if (groups.details.length > 0) {
    sections.push(
      widget.section('Details', [
        widget.grid({ columns: 2, gap: 'md' }, groups.details.map(fieldToWidget)),
      ]),
    );
  }

  if (groups.wide.length > 0) {
    sections.push(
      widget.section('Additional', { collapsible: true }, groups.wide.map(fieldToWidget)),
    );
  }

  if (includeSystem && groups.system.length > 0) {
    sections.push(
      widget.section('System', { collapsible: true, defaultCollapsed: true }, [
        widget.grid({ columns: 2, gap: 'md' }, groups.system.map(fieldToWidget)),
      ]),
    );
  }

  return sections;
}

function fieldToWidget(field: ResolvedField): import('@rangka/shared').WidgetNode {
  const opts = isRequired(field.config) ? { required: true } : undefined;

  switch (field.config.type) {
    case 'string':
    case 'int':
    case 'decimal':
      return widget.input(field.name, opts);
    case 'text':
      return widget.textarea(field.name, opts);
    case 'boolean':
      return widget.checkbox(field.name, opts);
    case 'date':
      return widget.datepicker(field.name, opts);
    case 'datetime':
      return widget.datetime(field.name, opts);
    case 'enum':
      return widget.select(field.name, {
        ...opts,
        options: (field.config as { options: readonly string[] }).options,
      });
    case 'json':
      return widget.json(field.name, opts);
    case 'link':
    case 'dynamicLink':
      return widget.link(field.name, opts);
    case 'money':
      return widget.money(field.name, opts);
    case 'code':
      return widget.code(field.name, opts);
    case 'attachment':
      return widget.attachment(field.name, opts);
    case 'attachments':
      return widget.attachments(field.name, opts);
    case 'tree':
      return widget.tree(field.name, opts);
    default:
      return widget.input(field.name, opts);
  }
}

// --- Utility helpers ---

function isHidden(config: FieldConfig): boolean {
  return 'hidden' in config && config.hidden === true;
}

function isRequired(config: FieldConfig): boolean {
  return 'required' in config && config.required === true;
}

function isSearchable(config: FieldConfig): boolean {
  return 'searchable' in config && (config as { searchable?: boolean }).searchable === true;
}

function isNumericType(type: string): boolean {
  return type === 'money' || type === 'decimal' || type === 'int';
}

function getColumnWidth(field: ResolvedField): string | undefined {
  switch (field.config.type) {
    case 'boolean':
      return '80px';
    case 'date':
      return '120px';
    case 'datetime':
      return '160px';
    case 'int':
      return '100px';
    case 'decimal':
    case 'money':
      return '120px';
    case 'enum':
      return '140px';
    case 'sequence':
      return '140px';
    default:
      return undefined;
  }
}

function isFilterableType(type: string): boolean {
  return (
    type === 'enum' ||
    type === 'boolean' ||
    type === 'link' ||
    type === 'date' ||
    type === 'datetime' ||
    type === 'int' ||
    type === 'decimal' ||
    type === 'money'
  );
}

function getLabel(field: ResolvedField): string {
  if ('label' in field.config && field.config.label) {
    return field.config.label as string;
  }
  return toTitleCase(field.name);
}

function toTitleCase(str: string): string {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function pluralize(str: string): string {
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z')) return `${str}es`;
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) return `${str.slice(0, -1)}ies`;
  return `${str}s`;
}
