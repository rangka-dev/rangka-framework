import type {
  WidgetNode,
  WidgetAction,
  WidgetBinding,
  WidgetSource,
  Condition,
} from './types/widget.js';
import type { PageDefinition, Action } from './types/page.js';

export class WidgetBuilder {
  private node: WidgetNode;

  constructor(type: string) {
    this.node = { type };
  }

  id(id: string): this {
    this.node.id = id;
    return this;
  }

  props(props: Record<string, unknown>): this {
    this.node.props = { ...this.node.props, ...props };
    return this;
  }

  bind(bind: WidgetBinding): this {
    this.node.bind = bind;
    return this;
  }

  bindField(field: string): this {
    this.node.bind = { field };
    return this;
  }

  bindExpression(expression: string): this {
    this.node.bind = { expression: `{{${expression}}}` };
    return this;
  }

  bindModel(name: string, filters?: Record<string, unknown>, limit?: number): this {
    this.node.bind = { model: { name, filters, limit } };
    return this;
  }

  source(source: WidgetSource): this {
    this.node.source = source;
    return this;
  }

  visible(condition: Condition | Condition[]): this {
    this.node.visible = condition;
    return this;
  }

  on(trigger: string, action: WidgetAction | WidgetAction[]): this {
    this.node.on = { ...this.node.on, [trigger]: action };
    return this;
  }

  children(children: (WidgetNode | WidgetBuilder)[]): this {
    this.node.children = children.map((c) => (c instanceof WidgetBuilder ? c.toJSON() : c));
    return this;
  }

  toJSON(): WidgetNode {
    return { ...this.node };
  }
}

// --- Chainable Widget Factories ---

export function $input(field: string): WidgetBuilder {
  return new WidgetBuilder('input').bindField(field);
}

export function $text(content: string): WidgetBuilder {
  return new WidgetBuilder('text').bindExpression(content);
}

export function $button(label: string): WidgetBuilder {
  return new WidgetBuilder('button').props({ label });
}

export function $badge(field: string): WidgetBuilder {
  return new WidgetBuilder('badge').bindField(field);
}

export function $icon(name: string): WidgetBuilder {
  return new WidgetBuilder('icon').props({ name });
}

export function $group(direction: 'row' | 'column' = 'column'): WidgetBuilder {
  return new WidgetBuilder('group').props({ direction });
}

export function $section(label: string): WidgetBuilder {
  return new WidgetBuilder('section').props({ label });
}

export function $table(model: string): WidgetBuilder {
  return new WidgetBuilder('table').bindModel(model);
}

export function $column(label: string): WidgetBuilder {
  return new WidgetBuilder('column').props({ label });
}

export function $divider(): WidgetBuilder {
  return new WidgetBuilder('divider');
}

export function $spacer(): WidgetBuilder {
  return new WidgetBuilder('spacer');
}

export function $split(sizes?: number[]): WidgetBuilder {
  const builder = new WidgetBuilder('split');
  if (sizes) {
    builder.props({ sizes });
  }
  return builder;
}

export function $grid(columns: number = 4): WidgetBuilder {
  return new WidgetBuilder('grid').props({ columns });
}

export function $data(model: string, opts?: { id?: string }): WidgetBuilder {
  const builder = new WidgetBuilder('data');
  const src: WidgetSource = { model };
  if (opts?.id) src.id = opts.id;
  builder.source(src);
  return builder;
}

export function $repeat(layout?: 'list' | 'grid'): WidgetBuilder {
  const builder = new WidgetBuilder('repeat');
  if (layout) builder.props({ layout });
  return builder;
}

export function $drawer(width?: 'sm' | 'md' | 'lg'): WidgetBuilder {
  return new WidgetBuilder('drawer').props({ width: width ?? 'md' });
}

export function $modal(size?: 'sm' | 'md' | 'lg'): WidgetBuilder {
  return new WidgetBuilder('modal').props({ size: size ?? 'md' });
}

export function $image(src: string): WidgetBuilder {
  return new WidgetBuilder('image').bindField(src);
}

// --- Page Builder ---

export class PageBuilder {
  private def: Partial<PageDefinition> & {
    key: string;
    label: string;
    type: PageDefinition['type'];
  };

  constructor(key: string, label: string, type: PageDefinition['type']) {
    this.def = { key, label, type, body: [] };
  }

  path(path: string): this {
    this.def.path = path;
    return this;
  }

  actions(actions: Action[]): this {
    this.def.actions = actions;
    return this;
  }

  body(nodes: (WidgetNode | WidgetBuilder)[]): this {
    this.def.body = nodes.map((n) => (n instanceof WidgetBuilder ? n.toJSON() : n));
    return this;
  }

  toJSON(): PageDefinition {
    return this.def as PageDefinition;
  }
}

export function page(
  key: string,
  label: string,
  type: 'collection' | 'record' | 'dashboard',
): PageBuilder {
  return new PageBuilder(key, label, type);
}
