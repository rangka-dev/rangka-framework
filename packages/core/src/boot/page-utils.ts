import type { PageDefinition, WidgetNode } from '@rangka/shared';
import type { SchemaRegistry } from '../schema/registry.js';

export interface PageValidationWarning {
  pageKey: string;
  file?: string;
  location: string;
  message: string;
}

/**
 * Collect all distinct model names referenced as data sources within a page body.
 */
export function extractSourceModels(page: PageDefinition): string[] {
  const models = new Set<string>();

  for (const node of page.widgets) {
    collectModelsFromWidgetNode(node, models);
  }

  return [...models];
}

/**
 * Validate that every source model referenced by pages actually exists
 * in the known model set. Returns warnings for unresolved references.
 */
export function validatePageSources(
  pages: Array<{ app: string; page: PageDefinition }>,
  knownModels: Set<string>,
): PageValidationWarning[] {
  const warnings: PageValidationWarning[] = [];

  for (const { page } of pages) {
    for (let i = 0; i < page.widgets.length; i++) {
      checkWidgetNodeSources(page.widgets[i], `widgets[${i}]`, page.key, knownModels, warnings);
    }
  }

  return warnings;
}

/** Detect pages that share the same key across different apps. */
export function detectDuplicatePageKeys(
  pages: Array<{ app: string; page: PageDefinition }>,
): PageValidationWarning[] {
  const warnings: PageValidationWarning[] = [];
  const seenKeyInApp = new Map<string, string>();

  for (const { app, page } of pages) {
    const previousApp = seenKeyInApp.get(page.key);
    if (previousApp) {
      warnings.push({
        pageKey: page.key,
        location: `${app}/pages`,
        message: `Duplicate page key "${page.key}" (also defined in ${previousApp})`,
      });
    } else {
      seenKeyInApp.set(page.key, `${app}/pages`);
    }
  }

  return warnings;
}

function collectModelsFromWidgetNode(node: WidgetNode, models: Set<string>): void {
  if (node.source?.model) {
    models.add(node.source.model);
  }
  if (node.children) {
    for (const child of node.children) {
      collectModelsFromWidgetNode(child, models);
    }
  }
}

function checkWidgetNodeSources(
  node: WidgetNode,
  path: string,
  pageKey: string,
  knownModels: Set<string>,
  warnings: PageValidationWarning[],
): void {
  if (node.source?.model && !knownModels.has(node.source.model)) {
    warnings.push({
      pageKey,
      location: path,
      message: `Unresolved source model "${node.source.model}"`,
    });
  }
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      checkWidgetNodeSources(
        node.children[i],
        `${path}.children[${i}]`,
        pageKey,
        knownModels,
        warnings,
      );
    }
  }
}

/**
 * Validate that widget bindings reference fields that exist on their
 * source model context. Walks the widget tree tracking the nearest
 * ancestor source. Returns warnings (does not halt boot).
 */
export function validatePageBindings(
  pages: Array<{ app: string; page: PageDefinition; file?: string }>,
  registry: SchemaRegistry,
): PageValidationWarning[] {
  const warnings: PageValidationWarning[] = [];

  for (const { app, page, file } of pages) {
    const filePath = file ? `${app}/pages/${file}` : undefined;
    for (let i = 0; i < page.widgets.length; i++) {
      checkWidgetBindings(
        page.widgets[i],
        `widgets[${i}]`,
        page.key,
        filePath,
        null,
        registry,
        warnings,
      );
    }
  }

  return warnings;
}

function checkWidgetBindings(
  node: WidgetNode,
  path: string,
  pageKey: string,
  file: string | undefined,
  sourceModel: string | null,
  registry: SchemaRegistry,
  warnings: PageValidationWarning[],
): void {
  const currentSource = node.source?.model ?? sourceModel;

  if (node.bind?.field) {
    if (!currentSource) {
      warnings.push({
        pageKey,
        file,
        location: path,
        message: `Widget has bind.field "${node.bind.field}" but no source model in scope`,
      });
    } else {
      const model = registry.getModel(currentSource);
      if (model) {
        const fieldExists = model.fields.some((f) => f.name === node.bind!.field);
        if (!fieldExists) {
          warnings.push({
            pageKey,
            file,
            location: path,
            message: `Field "${node.bind.field}" does not exist on model "${currentSource}"`,
          });
        }
      }
    }
  }

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      checkWidgetBindings(
        node.children[i],
        `${path}.children[${i}]`,
        pageKey,
        file,
        currentSource,
        registry,
        warnings,
      );
    }
  }
}
