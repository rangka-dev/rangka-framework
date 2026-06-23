import { describe, it, expect } from 'vitest';
import { validateWidgetProps, BUILT_IN_WIDGET_TYPES } from '../schemas/widget-props/index.js';

describe('validateWidgetProps', () => {
  it('passes for unknown custom widget type', () => {
    const result = validateWidgetProps('my-custom-widget', { anything: true });
    expect(result.success).toBe(true);
  });

  it('passes valid input props', () => {
    const result = validateWidgetProps('input', {
      label: 'Name',
      placeholder: 'Enter name',
      disabled: false,
    });
    expect(result.success).toBe(true);
  });

  it('passes valid button props', () => {
    const result = validateWidgetProps('button', {
      label: 'Submit',
      variant: 'primary',
      size: 'md',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid button variant', () => {
    const result = validateWidgetProps('button', { variant: 'invalid_variant' });
    expect(result.success).toBe(false);
  });

  it('passes valid table props', () => {
    const result = validateWidgetProps('table', { selectable: true, pageSize: 25, striped: true });
    expect(result.success).toBe(true);
  });

  it('passes valid grid props', () => {
    const result = validateWidgetProps('grid', { columns: 3, gap: 'md' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid grid gap value', () => {
    const result = validateWidgetProps('grid', { gap: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('passes valid section props', () => {
    const result = validateWidgetProps('section', { label: 'Details', collapsible: true });
    expect(result.success).toBe(true);
  });

  it('passes valid modal props', () => {
    const result = validateWidgetProps('modal', { size: 'lg', title: 'Edit', closable: true });
    expect(result.success).toBe(true);
  });

  it('rejects invalid modal size', () => {
    const result = validateWidgetProps('modal', { size: 'enormous' });
    expect(result.success).toBe(false);
  });

  it('passes valid datagrid props', () => {
    const result = validateWidgetProps('datagrid', {
      editable: true,
      rowHeight: 'compact',
      pageSize: 50,
    });
    expect(result.success).toBe(true);
  });

  it('passes valid badge props', () => {
    const result = validateWidgetProps('badge', { variant: 'destructive', color: 'red' });
    expect(result.success).toBe(true);
  });

  it('passes valid drawer props', () => {
    const result = validateWidgetProps('drawer', { width: 'lg', title: 'Settings' });
    expect(result.success).toBe(true);
  });

  it('passes undefined/null props for any widget', () => {
    const result = validateWidgetProps('input', undefined);
    expect(result.success).toBe(true);
  });

  it('has schemas for all expected built-in widgets', () => {
    expect(BUILT_IN_WIDGET_TYPES.length).toBe(39);
  });

  it('covers all widget categories', () => {
    const inputWidgets = [
      'input',
      'select',
      'textarea',
      'checkbox',
      'datepicker',
      'datetime',
      'money',
      'link',
      'many-to-many',
      'dynamic-link',
      'attachment',
      'attachments',
      'json',
      'code',
      'tree',
      'sequence',
      'computed',
    ];
    const displayWidgets = ['text', 'badge', 'icon', 'image'];
    const layoutWidgets = [
      'section',
      'group',
      'grid',
      'split',
      'stack',
      'spacer',
      'card',
      'divider',
      'scroll-area',
      'column',
      'modal',
      'drawer',
    ];
    const actionWidgets = ['button', 'form'];
    const dataWidgets = ['table', 'data', 'repeat', 'datagrid'];

    const allWidgets = [
      ...inputWidgets,
      ...displayWidgets,
      ...layoutWidgets,
      ...actionWidgets,
      ...dataWidgets,
    ];
    for (const w of allWidgets) {
      expect(BUILT_IN_WIDGET_TYPES).toContain(w);
    }
  });
});
