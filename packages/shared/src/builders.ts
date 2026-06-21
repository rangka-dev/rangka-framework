import type { WidgetNode, WidgetAction, Condition } from './types/widget.js';

// --- Widget Factories ---

export function input(field: string, opts?: Partial<WidgetNode>): WidgetNode {
  return { type: 'input', bind: { field }, ...opts };
}

export function text(content: string, opts?: Partial<WidgetNode>): WidgetNode {
  return { type: 'text', bind: { expression: `{{${content}}}` }, ...opts };
}

export function button(label: string, opts?: Partial<WidgetNode>): WidgetNode {
  const { props: extraProps, ...rest } = opts ?? {};
  return { type: 'button', props: { label, ...extraProps }, ...rest };
}

export function badge(field: string, opts?: Partial<WidgetNode>): WidgetNode {
  return { type: 'badge', bind: { field }, ...opts };
}

export function icon(name: string, opts?: Partial<WidgetNode>): WidgetNode {
  const { props: extraProps, ...rest } = opts ?? {};
  return { type: 'icon', props: { name, ...extraProps }, ...rest };
}

export function group(direction: 'row' | 'column', children: WidgetNode[]): WidgetNode {
  return { type: 'group', props: { direction }, children };
}

export function section(label: string, children: WidgetNode[]): WidgetNode {
  return { type: 'section', props: { label }, children };
}

export function table(model: string, columns: WidgetNode[]): WidgetNode {
  return { type: 'table', source: { model }, children: columns };
}

export function column(label: string, children: WidgetNode[]): WidgetNode {
  return { type: 'column', props: { label }, children };
}

export function divider(): WidgetNode {
  return { type: 'divider' };
}

export function spacer(): WidgetNode {
  return { type: 'spacer' };
}

// --- Action Factories ---

export function setValue(field: string, value: unknown): WidgetAction {
  return { type: 'setValue', field, value };
}

export function clearValue(field: string): WidgetAction {
  return { type: 'clearValue', field };
}

export function setValues(values: Record<string, unknown>): WidgetAction {
  return { type: 'setValues', values };
}

export function service(
  name: string,
  params?: Record<string, unknown>,
  opts?: { onSuccess?: WidgetAction; onError?: WidgetAction },
): WidgetAction {
  return { type: 'service', name, params: params ?? {}, ...opts };
}

export function navigate(path: string): WidgetAction {
  return { type: 'navigate', path };
}

export function fetchOptions(field: string, depends: string[]): WidgetAction {
  return { type: 'fetchOptions', field, depends };
}

export function refreshSource(): WidgetAction {
  return { type: 'refreshSource' };
}

export function validate(fields?: string[]): WidgetAction {
  return { type: 'validate', fields };
}

export function addRow(field: string): WidgetAction {
  return { type: 'addRow', field };
}

export function removeRow(field: string): WidgetAction {
  return { type: 'removeRow', field };
}

export function duplicateRow(field: string): WidgetAction {
  return { type: 'duplicateRow', field };
}

export function sequence(...actions: WidgetAction[]): WidgetAction {
  return { type: 'sequence', actions };
}

export function conditional(
  condition: Condition,
  then: WidgetAction,
  elseAction?: WidgetAction,
): WidgetAction {
  return { type: 'conditional', condition, then, else: elseAction };
}

// --- Layout Widget Factories ---

export function split(sizes: number[], children: WidgetNode[]): WidgetNode {
  return { type: 'split', props: { sizes }, children };
}

export function grid(columns: number, children: WidgetNode[]): WidgetNode {
  return { type: 'grid', props: { columns }, children };
}

export function data(model: string, id: string | undefined, children: WidgetNode[]): WidgetNode {
  return { type: 'data', source: { model, id }, children };
}

export function repeat(
  children: WidgetNode[],
  opts?: { layout?: string; columns?: number },
): WidgetNode {
  return { type: 'repeat', props: opts, children };
}

export function drawer(
  children: WidgetNode[],
  opts?: { width?: string; title?: string },
): WidgetNode {
  return { type: 'drawer', props: opts, children };
}

export function modal(
  children: WidgetNode[],
  opts?: { size?: string; title?: string },
): WidgetNode {
  return { type: 'modal', props: opts, children };
}

export function image(src: string, opts?: Partial<WidgetNode>): WidgetNode {
  return { type: 'image', bind: { field: src }, ...opts };
}
