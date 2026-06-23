import { describe, it, expect } from 'vitest';
import { detectWidgetTypos } from '../helpers.js';

const BUILT_IN = [
  'input',
  'select',
  'checkbox',
  'textarea',
  'datepicker',
  'datetime',
  'money',
  'text',
  'badge',
  'icon',
  'image',
  'link',
  'group',
  'section',
  'grid',
  'split',
  'divider',
  'spacer',
  'card',
  'scroll-area',
  'stack',
  'table',
  'column',
  'data',
  'repeat',
  'tree',
  'datagrid',
  'button',
  'modal',
  'drawer',
  'form',
  'many-to-many',
  'dynamic-link',
  'attachment',
  'attachments',
  'sequence',
  'computed',
  'code',
  'json',
];

describe('detectWidgetTypos', () => {
  it('detects typo "inptu" -> "input"', () => {
    const warnings = detectWidgetTypos([{ type: 'inptu' }], BUILT_IN);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].suggestion).toBe('input');
    expect(warnings[0].path).toBe('body[0].type');
  });

  it('detects typo "tabel" -> "table"', () => {
    const warnings = detectWidgetTypos([{ type: 'tabel' }], BUILT_IN);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].suggestion).toBe('table');
  });

  it('does not warn for valid built-in types', () => {
    const warnings = detectWidgetTypos([{ type: 'input' }, { type: 'table' }], BUILT_IN);
    expect(warnings).toHaveLength(0);
  });

  it('does not warn for clearly custom widgets', () => {
    const warnings = detectWidgetTypos([{ type: 'my-custom-chart' }], BUILT_IN);
    expect(warnings).toHaveLength(0);
  });

  it('detects typos in nested children', () => {
    const warnings = detectWidgetTypos(
      [{ type: 'group', children: [{ type: 'buttn' }] }],
      BUILT_IN,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].suggestion).toBe('button');
    expect(warnings[0].path).toBe('body[0].children[0].type');
  });

  it('returns empty for empty body', () => {
    const warnings = detectWidgetTypos([], BUILT_IN);
    expect(warnings).toHaveLength(0);
  });
});
