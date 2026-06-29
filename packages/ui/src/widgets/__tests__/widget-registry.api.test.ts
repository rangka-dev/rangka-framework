import { describe, it, expect } from 'vitest';
import type { WidgetProps } from '@rangka/shared';
import type { ComponentType } from 'react';
import { widgetComponents } from '../index';

describe('Widget registry contract', () => {
  it('exports widgetComponents map', () => {
    expect(widgetComponents).toBeDefined();
    expect(typeof widgetComponents).toBe('object');
  });

  it('every registered widget is a valid component', () => {
    for (const [type, component] of Object.entries(widgetComponents)) {
      expect(component, `widget "${type}" should be a function`).toBeTypeOf('function');
    }
  });

  it('satisfies WidgetProps contract (compile-time check)', () => {
    // This assertion exists at the type level — if any widget in the registry
    // does not accept WidgetProps, TypeScript will fail to compile this file.
    const _registry: Record<string, ComponentType<WidgetProps>> = widgetComponents;
    expect(_registry).toBeDefined();
  });
});
