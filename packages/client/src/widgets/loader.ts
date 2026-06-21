import { getWidget, registerWidget } from './registry.js';
import type { WidgetDefinitionMeta } from '@rangka/shared';
import type { ComponentType } from 'react';
import type { WidgetProps } from './types.js';

type ManifestEntry = string | { js: string; css: string };
type Manifest = Record<string, ManifestEntry>;

let manifestCache: Manifest | null = null;
const loaded = new Set<string>();
const loading = new Map<string, Promise<boolean>>();

export async function loadCustomWidgets(
  manifestUrl: string = '/_rangka/manifest.json',
): Promise<void> {
  try {
    const res = await fetch(manifestUrl);
    if (!res.ok) return;
    manifestCache = await res.json();
  } catch {
    return;
  }
}

export async function ensureWidget(name: string): Promise<boolean> {
  if (getWidget(name)) return true;
  if (loaded.has(name)) return getWidget(name) !== undefined;

  const pending = loading.get(name);
  if (pending) return pending;

  if (!manifestCache) {
    await loadCustomWidgets();
  }

  const raw = manifestCache?.[name];
  if (!raw) return false;

  const entry = typeof raw === 'string' ? { js: raw, css: '' } : raw;
  const promise = loadWidget(name, entry);
  loading.set(name, promise);

  const result = await promise;
  loading.delete(name);
  return result;
}

async function loadWidget(name: string, entry: { js: string; css: string }): Promise<boolean> {
  try {
    if (entry.css) {
      await injectCSS(entry.css);
    }

    const mod = await import(/* @vite-ignore */ entry.js);

    if (mod.default && typeof mod.default === 'object') {
      const def = mod.default;
      if (def.meta && def.component) {
        registerWidget(
          def.meta as WidgetDefinitionMeta,
          def.component as ComponentType<WidgetProps>,
        );
      } else if (def.name) {
        registerWidget(def as WidgetDefinitionMeta, mod.default as ComponentType<WidgetProps>);
      }
    }

    loaded.add(name);
    return getWidget(name) !== undefined;
  } catch {
    loaded.add(name);
    return false;
  }
}

function injectCSS(href: string): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}
