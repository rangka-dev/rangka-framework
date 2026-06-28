import { describe, it, expect } from 'vitest';
import { widgetControllers } from '../controllers/index';

describe('widgetControllers', () => {
  it('exports controllers for all orchestrated widget types', () => {
    expect(widgetControllers).toHaveProperty('data');
    expect(widgetControllers).toHaveProperty('form');
    expect(widgetControllers).toHaveProperty('table');
    expect(widgetControllers).toHaveProperty('repeat');
    expect(widgetControllers).toHaveProperty('datagrid');
    expect(widgetControllers).toHaveProperty('modal');
    expect(widgetControllers).toHaveProperty('drawer');
  });

  it('does not export controllers for simple widgets', () => {
    expect(widgetControllers).not.toHaveProperty('input');
    expect(widgetControllers).not.toHaveProperty('button');
    expect(widgetControllers).not.toHaveProperty('text');
    expect(widgetControllers).not.toHaveProperty('card');
    expect(widgetControllers).not.toHaveProperty('group');
  });

  it('all controllers are valid React components', () => {
    for (const [, Controller] of Object.entries(widgetControllers)) {
      expect(typeof Controller).toBe('function');
    }
  });
});
