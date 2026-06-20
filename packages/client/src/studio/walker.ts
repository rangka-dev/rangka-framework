import type { WidgetInspectMeta } from './types.js';

export function findWidgetElement(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute('data-rangka-widget')) return current;
    current = current.parentElement;
  }
  return null;
}

export function buildWidgetPath(el: HTMLElement): string[] {
  const segments: string[] = [];
  let current: HTMLElement | null = el;

  while (current) {
    if (current.hasAttribute('data-rangka-widget')) {
      const id = current.getAttribute('data-rangka-id');
      const type = current.getAttribute('data-rangka-widget')!;
      segments.push(id || type);
    }
    current = current.parentElement;
  }

  segments.reverse();
  return segments;
}

export function findPageKey(el: HTMLElement): string | undefined {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute('data-page-key')) {
      return current.getAttribute('data-page-key') ?? undefined;
    }
    current = current.parentElement;
  }
  return undefined;
}

export function extractMeta(el: HTMLElement): WidgetInspectMeta {
  return {
    type: el.getAttribute('data-rangka-widget') ?? '',
    id: el.getAttribute('data-rangka-id') ?? undefined,
    model: el.getAttribute('data-rangka-model') ?? undefined,
    field: el.getAttribute('data-rangka-field') ?? undefined,
    mode: el.getAttribute('data-rangka-mode') ?? undefined,
  };
}
