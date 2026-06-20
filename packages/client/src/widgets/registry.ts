import type { WidgetDefinitionMeta } from '@rangka/shared';
import type { ComponentType } from 'react';
import type { WidgetProps } from './types.js';

export interface WidgetRegistryEntry {
  meta: WidgetDefinitionMeta;
  component: ComponentType<WidgetProps>;
}

const widgets = new Map<string, WidgetRegistryEntry>();

export function registerWidget(
  meta: WidgetDefinitionMeta,
  component: ComponentType<WidgetProps>,
): void {
  widgets.set(meta.name, { meta, component });
}

export function getWidget(name: string): WidgetRegistryEntry | undefined {
  return widgets.get(name);
}

export function getWidgetMeta(name: string): WidgetDefinitionMeta | undefined {
  return widgets.get(name)?.meta;
}

export function getAllWidgetMeta(): WidgetDefinitionMeta[] {
  return [...widgets.values()].map((e) => e.meta);
}

export function getWidgetRegistry(): Map<string, WidgetDefinitionMeta> {
  const map = new Map<string, WidgetDefinitionMeta>();
  for (const [name, entry] of widgets) {
    map.set(name, entry.meta);
  }
  return map;
}

export function clearWidgetRegistry(): void {
  widgets.clear();
}
