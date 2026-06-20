import type { WidgetDefinitionMeta } from '@rangka/shared';

export class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinitionMeta>();

  register(definition: WidgetDefinitionMeta): void {
    if (this.widgets.has(definition.name)) {
      throw new Error(`Widget '${definition.name}' is already registered`);
    }
    this.widgets.set(definition.name, definition);
  }

  get(name: string): WidgetDefinitionMeta | undefined {
    return this.widgets.get(name);
  }

  has(name: string): boolean {
    return this.widgets.has(name);
  }

  getAll(): WidgetDefinitionMeta[] {
    return [...this.widgets.values()];
  }

  names(): string[] {
    return [...this.widgets.keys()];
  }

  clear(): void {
    this.widgets.clear();
  }
}
