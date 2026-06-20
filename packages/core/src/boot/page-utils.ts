import type { PageDefinition, WidgetNode } from '@rangka/shared';

export interface PageValidationWarning {
  pageKey: string;
  location: string;
  message: string;
}

/**
 * Collect all distinct model names referenced as data sources within a page body.
 */
export function extractSourceModels(page: PageDefinition): string[] {
  const models = new Set<string>();

  for (const node of page.body) {
    collectModelsFromWidgetNode(node, models);
  }

  return [...models];
}

/**
 * Validate that every source model referenced by pages actually exists
 * in the known model set. Returns warnings for unresolved references.
 */
export function validatePageSources(
  pages: Array<{ module: string; page: PageDefinition }>,
  knownModels: Set<string>,
): PageValidationWarning[] {
  const warnings: PageValidationWarning[] = [];

  for (const { page } of pages) {
    for (let i = 0; i < page.body.length; i++) {
      checkWidgetNodeSources(page.body[i], `body[${i}]`, page.key, knownModels, warnings);
    }
  }

  return warnings;
}

/** Detect pages that share the same key across different modules. */
export function detectDuplicatePageKeys(
  pages: Array<{ module: string; page: PageDefinition }>,
): PageValidationWarning[] {
  const warnings: PageValidationWarning[] = [];
  const seenKeyInModule = new Map<string, string>();

  for (const { module, page } of pages) {
    const previousModule = seenKeyInModule.get(page.key);
    if (previousModule) {
      warnings.push({
        pageKey: page.key,
        location: `modules/${module}/pages`,
        message: `Duplicate page key "${page.key}" (also defined in ${previousModule})`,
      });
    } else {
      seenKeyInModule.set(page.key, `modules/${module}/pages`);
    }
  }

  return warnings;
}

function collectModelsFromWidgetNode(node: WidgetNode, models: Set<string>): void {
  if (node.source?.model) {
    models.add(node.source.model);
  }
  if (node.bind?.model?.name) {
    models.add(node.bind.model.name);
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
  if (node.bind?.model?.name && !knownModels.has(node.bind.model.name)) {
    warnings.push({
      pageKey,
      location: path,
      message: `Unresolved source model "${node.bind.model.name}"`,
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
