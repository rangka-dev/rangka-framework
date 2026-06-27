import { describe, it, expect } from 'vitest';
import { renderDisplay, renderEditor } from '../cell-renderers';
import { CellInput } from '../../../data/cell-editors/cell-input';
import { CellCheckbox } from '../../../data/cell-editors/cell-checkbox';
import { CellSelect } from '../../../data/cell-editors/cell-select';
import { CellDate } from '../../../data/cell-editors/cell-date';
import { CellDateTime } from '../../../data/cell-editors/cell-date-time';
import { CellMultiSelect } from '../../../data/cell-editors/cell-multi-select';
import { CellAttachment } from '../../../data/cell-editors/cell-attachment';
import { CellJson } from '../../../data/cell-editors/cell-json';

describe('Cell Renderers API surface', () => {
  it('exports renderDisplay function', () => {
    expect(renderDisplay).toBeDefined();
    expect(typeof renderDisplay).toBe('function');
  });

  it('exports renderEditor function', () => {
    expect(renderEditor).toBeDefined();
    expect(typeof renderEditor).toBe('function');
  });

  it('renderDisplay handles all field types without throwing', () => {
    const types = [
      'string',
      'text',
      'int',
      'decimal',
      'money',
      'date',
      'datetime',
      'boolean',
      'enum',
      'link',
      'attachment',
      'json',
      'sequence',
    ];

    for (const type of types) {
      expect(() => renderDisplay(type, 'test')).not.toThrow();
    }
  });

  it('renderDisplay returns null placeholder for null values', () => {
    const result = renderDisplay('string', null);
    expect(result).toBeTruthy();
  });

  it('renderDisplay handles undefined fieldType as default text', () => {
    const result = renderDisplay(undefined, 'hello');
    expect(result).toBeTruthy();
  });

  it('renderEditor handles all editable field types without throwing', () => {
    const noop = () => {};
    const types = [
      'string',
      'text',
      'int',
      'decimal',
      'money',
      'boolean',
      'enum',
      'link',
      'date',
      'datetime',
    ];

    for (const type of types) {
      expect(() => renderEditor(type, 'test', noop, { field: 'x', options: [] })).not.toThrow();
    }
  });

  it('renderEditor falls back to display for non-editable types', () => {
    const noop = () => {};
    const readOnlyTypes = ['sequence', 'json', 'attachment', 'attachments'];

    for (const type of readOnlyTypes) {
      expect(() => renderEditor(type, 'test', noop)).not.toThrow();
    }
  });
});

describe('Cell Editors API surface', () => {
  it('exports CellInput component', () => {
    expect(CellInput).toBeDefined();
    expect(CellInput.displayName).toBe('CellInput');
  });

  it('exports CellCheckbox component', () => {
    expect(CellCheckbox).toBeDefined();
    expect(CellCheckbox.displayName).toBe('CellCheckbox');
  });

  it('exports CellSelect component', () => {
    expect(CellSelect).toBeDefined();
    expect(CellSelect.displayName).toBe('CellSelect');
  });

  it('exports CellDate component', () => {
    expect(CellDate).toBeDefined();
    expect(CellDate.displayName).toBe('CellDate');
  });

  it('exports CellDateTime component', () => {
    expect(CellDateTime).toBeDefined();
    expect(CellDateTime.displayName).toBe('CellDateTime');
  });

  it('exports CellMultiSelect component', () => {
    expect(CellMultiSelect).toBeDefined();
    expect(CellMultiSelect.displayName).toBe('CellMultiSelect');
  });

  it('exports CellAttachment component', () => {
    expect(CellAttachment).toBeDefined();
    expect(CellAttachment.displayName).toBe('CellAttachment');
  });

  it('exports CellJson component', () => {
    expect(CellJson).toBeDefined();
    expect(CellJson.displayName).toBe('CellJson');
  });
});
