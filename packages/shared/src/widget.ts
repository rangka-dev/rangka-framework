import type { WidgetNode } from './types/widget.js';
import type { Condition, WidgetBinding, WidgetSource } from './validation/schemas/widget.js';
import type { WidgetAction } from './types/widget.js';
import type { WidgetType } from './validation/schemas/widget-props/index.js';

interface WidgetOptions {
  props?: Record<string, unknown>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}

interface InputOptions {
  required?: boolean;
  placeholder?: string;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  props?: Record<string, unknown>;
}

interface SelectOptions extends InputOptions {
  options?: readonly string[];
}

interface ContainerOptions {
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface GridOptions {
  columns?: number;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rowGap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colGap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  autoFlow?: 'row' | 'column' | 'dense';
  responsive?: Record<string, number>;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface CardOptions {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface TableOptions {
  sortable?: boolean;
  pageSize?: number;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  props?: Record<string, unknown>;
}

interface ColumnOptions {
  label?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface ButtonOptions {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface TextOptions {
  style?: 'heading' | 'label' | 'body' | 'caption' | 'code';
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface SectionOptions {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
  closable?: boolean;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface DrawerOptions {
  width?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  closable?: boolean;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface FieldOptions {
  label?: string;
}

interface TabDefinition {
  label: string;
  icon?: string;
  badge?: string;
}

interface TabsOptions {
  defaultTab?: number;
  size?: 'sm' | 'md';
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
}

interface DatagridOptions {
  sortable?: boolean;
  pageSize?: number;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  props?: Record<string, unknown>;
}

function buildNode(type: WidgetType, opts?: WidgetOptions): WidgetNode {
  const node: WidgetNode = { type };
  if (opts?.props) node.props = opts.props;
  if (opts?.bind) node.bind = opts.bind;
  if (opts?.source) node.source = opts.source;
  if (opts?.visible) node.visible = opts.visible;
  if (opts?.on) node.on = opts.on;
  if (opts?.children) node.children = opts.children;
  return node;
}

function inputNode(field: string, type: WidgetType, opts?: InputOptions): WidgetNode {
  const props: Record<string, unknown> = { ...opts?.props };
  if (opts?.required) props.required = true;
  if (opts?.placeholder) props.placeholder = opts.placeholder;
  const node: WidgetNode = { type, bind: { field } };
  if (Object.keys(props).length > 0) node.props = props;
  if (opts?.visible) node.visible = opts.visible;
  if (opts?.on) node.on = opts.on;
  return node;
}

/**
 * Factory for creating typed widget nodes.
 *
 * Use as a function for custom/generic widgets, or use named helpers for built-in types.
 *
 * @example
 * ```ts
 * // Custom widget
 * widget('kanban', { props: { columns: 'status' }, source: { model: 'sales.order' } })
 *
 * // Built-in helpers
 * widget.input('name', { required: true })
 * widget.table('sales.order', [widget.column('name')])
 * widget.card({ title: 'Details' }, [widget.input('name')])
 * ```
 */
export const widget = Object.assign(
  function widget(type: WidgetType, opts?: WidgetOptions): WidgetNode {
    return buildNode(type, opts);
  },
  {
    field(fieldName: string, opts?: FieldOptions): WidgetNode {
      const node: WidgetNode = { type: 'field', bind: { field: fieldName } };
      if (opts?.label) node.props = { label: opts.label };
      return node;
    },

    input(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'input', opts);
    },

    textarea(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'textarea', opts);
    },

    select(field: string, opts?: SelectOptions): WidgetNode {
      const props: Record<string, unknown> = { ...opts?.props };
      if (opts?.required) props.required = true;
      if (opts?.options) props.options = opts.options;
      const node: WidgetNode = { type: 'select', bind: { field } };
      if (Object.keys(props).length > 0) node.props = props;
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    checkbox(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'checkbox', opts);
    },

    datepicker(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'datepicker', opts);
    },

    datetime(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'datetime', opts);
    },

    money(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'money', opts);
    },

    link(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'link', opts);
    },

    attachment(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'attachment', opts);
    },

    attachments(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'attachments', opts);
    },

    json(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'json', opts);
    },

    code(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'code', opts);
    },

    tree(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'tree', opts);
    },

    manyToMany(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'many-to-many', opts);
    },

    dynamicLink(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'dynamic-link', opts);
    },

    sequence(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'sequence', opts);
    },

    computed(field: string, opts?: InputOptions): WidgetNode {
      return inputNode(field, 'computed', opts);
    },

    text(field: string, opts?: TextOptions): WidgetNode {
      const props: Record<string, unknown> = {};
      if (opts?.style) props.style = opts.style;
      const node: WidgetNode = { type: 'text', bind: { field } };
      if (Object.keys(props).length > 0) node.props = props;
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    badge(field: string, opts?: Omit<TextOptions, 'style'>): WidgetNode {
      const node: WidgetNode = { type: 'badge', bind: { field } };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    icon(name: string, opts?: Omit<TextOptions, 'style'>): WidgetNode {
      const node: WidgetNode = { type: 'icon', props: { name } };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    image(src: string, opts?: Omit<TextOptions, 'style'>): WidgetNode {
      const node: WidgetNode = { type: 'image', props: { src } };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    button(label: string, opts?: ButtonOptions): WidgetNode {
      const props: Record<string, unknown> = { label };
      if (opts?.variant) props.variant = opts.variant;
      if (opts?.icon) props.icon = opts.icon;
      const node: WidgetNode = { type: 'button', props };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    section(
      label: string,
      optsOrChildren: SectionOptions | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const props: Record<string, unknown> = { label };
      if (opts?.collapsible) props.collapsible = opts.collapsible;
      if (opts?.defaultCollapsed) props.defaultCollapsed = opts.defaultCollapsed;
      if (opts?.padding) props.padding = opts.padding;
      if (opts?.icon) props.icon = opts.icon;
      const node: WidgetNode = { type: 'section', props, children };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    group(opts: ContainerOptions, children: WidgetNode[]): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'group', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    grid(opts: GridOptions, children: WidgetNode[]): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'grid', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    card(opts: CardOptions, children: WidgetNode[]): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'card', props, children };
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    tabs(
      tabs: TabDefinition[],
      optsOrChildren: TabsOptions | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const props: Record<string, unknown> = { tabs };
      if (opts?.defaultTab !== undefined) props.defaultTab = opts.defaultTab;
      if (opts?.size) props.size = opts.size;
      const node: WidgetNode = { type: 'tabs', props, children };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    table(
      model: string,
      optsOrChildren: TableOptions | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const props: Record<string, unknown> = { ...opts?.props };
      if (opts?.sortable) props.sortable = opts.sortable;
      if (opts?.pageSize) props.pageSize = opts.pageSize;
      const node: WidgetNode = { type: 'table', source: { model }, children };
      if (Object.keys(props).length > 0) node.props = props;
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    column(field: string, opts?: ColumnOptions): WidgetNode {
      const props: Record<string, unknown> = {};
      if (opts?.label) props.label = opts.label;
      if (opts?.width) props.width = opts.width;
      if (opts?.align) props.align = opts.align;
      if (opts?.sortable) props.sortable = opts.sortable;
      if (opts?.filterable) props.filterable = opts.filterable;
      const node: WidgetNode = { type: 'column', bind: { field } };
      if (Object.keys(props).length > 0) node.props = props;
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    data(
      model: string,
      optsOrChildren:
        | {
            id?: string;
            visible?: Condition | Condition[];
            on?: Record<string, WidgetAction | WidgetAction[]>;
          }
        | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const source: WidgetSource = { model };
      if (opts?.id) source.id = opts.id;
      const node: WidgetNode = { type: 'data', source, children };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    datagrid(
      model: string,
      optsOrChildren: DatagridOptions | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const props: Record<string, unknown> = { ...opts?.props };
      if (opts?.sortable) props.sortable = opts.sortable;
      if (opts?.pageSize) props.pageSize = opts.pageSize;
      const node: WidgetNode = { type: 'datagrid', source: { model }, children };
      if (Object.keys(props).length > 0) node.props = props;
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    repeat(model: string, children: WidgetNode[]): WidgetNode {
      return { type: 'repeat', source: { model }, children };
    },

    form(
      model: string,
      optsOrChildren:
        | {
            id?: string;
            mode?: string;
            visible?: Condition | Condition[];
            on?: Record<string, WidgetAction | WidgetAction[]>;
          }
        | WidgetNode[],
      maybeChildren?: WidgetNode[],
    ): WidgetNode {
      const isOpts = !Array.isArray(optsOrChildren);
      const opts = isOpts ? optsOrChildren : undefined;
      const children = isOpts ? maybeChildren! : optsOrChildren;
      const source: WidgetSource = { model };
      if (opts?.id) source.id = opts.id;
      const node: WidgetNode = { type: 'form', source, children };
      if (opts?.mode) node.props = { ...node.props, mode: opts.mode };
      if (opts?.visible) node.visible = opts.visible;
      if (opts?.on) node.on = opts.on;
      return node;
    },

    spacer(opts?: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }): WidgetNode {
      const node: WidgetNode = { type: 'spacer' };
      if (opts?.size) node.props = { size: opts.size };
      return node;
    },

    divider(opts?: { margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl' }): WidgetNode {
      const node: WidgetNode = { type: 'divider' };
      if (opts?.margin) node.props = { margin: opts.margin };
      return node;
    },

    modal(opts: ModalOptions, children: WidgetNode[]): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'modal', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    drawer(opts: DrawerOptions, children: WidgetNode[]): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'drawer', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    split(
      opts: {
        sizes?: number[];
        direction?: 'horizontal' | 'vertical';
        minSize?: number;
        visible?: Condition | Condition[];
        on?: Record<string, WidgetAction | WidgetAction[]>;
      },
      children: WidgetNode[],
    ): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'split', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    stack(
      opts: {
        height?: string;
        padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
        visible?: Condition | Condition[];
        on?: Record<string, WidgetAction | WidgetAction[]>;
      },
      children: WidgetNode[],
    ): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'stack', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },

    scrollArea(
      opts: {
        direction?: 'vertical' | 'horizontal' | 'both';
        height?: string;
        maxHeight?: string;
        visible?: Condition | Condition[];
        on?: Record<string, WidgetAction | WidgetAction[]>;
      },
      children: WidgetNode[],
    ): WidgetNode {
      const { visible, on, ...rest } = opts;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v !== undefined) props[k] = v;
      }
      const node: WidgetNode = { type: 'scroll-area', children };
      if (Object.keys(props).length > 0) node.props = props;
      if (visible) node.visible = visible;
      if (on) node.on = on;
      return node;
    },
  },
);
