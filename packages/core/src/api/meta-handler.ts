import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  ModuleConfig,
  PageDefinition,
  BootResponse,
  ModelMeta,
  FieldMeta,
  NavigationTree,
  NavigationTreeSection,
  WidgetDefinitionMeta,
  WidgetNode,
} from '@rangka/shared';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedPermissions } from '../auth/types.js';
import type { ResolvedField } from '../schema/types.js';
import { getAuthContext } from '../auth/session.js';
import { UnauthorizedError } from '../errors.js';

export interface MetaBootContext {
  schemaRegistry: SchemaRegistry;
  pages: Array<{ module: string; page: PageDefinition }>;
  modules: ModuleConfig[];
  widgets?: WidgetDefinitionMeta[];
}

/**
 * Creates the GET /meta/boot handler that returns everything
 * the client needs to render the shell: user info, permissions,
 * navigation tree, page definitions, and model metadata.
 */
export function createMetaBootHandler(ctx: MetaBootContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authCtx = getAuthContext(request);
    if (!authCtx.user || !authCtx.permissions) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { user, permissions } = authCtx;
    const accessiblePages = resolveAccessiblePages(ctx.pages, permissions);
    const navigation = buildNavigationTree(ctx.modules, accessiblePages);
    const models = buildModelMeta(accessiblePages, ctx.schemaRegistry);

    const response: BootResponse = {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        roles: authCtx.roles ?? [],
      },
      permissions: {
        models: permissions.models,
        pages: permissions.pages,
      },
      navigation,
      pages: accessiblePages.map((p) => p.page),
      models,
      widgets: ctx.widgets,
    };

    return reply.send(response);
  };
}

// --- Page access resolution ---

/**
 * Filters pages to only those the user can access.
 * A page is accessible if explicitly listed in page permissions,
 * or if the user has read access to any model the page references.
 */
function resolveAccessiblePages(
  pages: Array<{ module: string; page: PageDefinition }>,
  permissions: ResolvedPermissions,
): Array<{ module: string; page: PageDefinition }> {
  return pages.filter(({ page }) => {
    if (permissions.pages.includes(page.key)) {
      return true;
    }

    const referencedModels = collectModelRefs(page);
    if (referencedModels.length === 0) {
      return true;
    }

    return referencedModels.some((model) => permissions.models[model]?.read === true);
  });
}

/**
 * Collects all model names referenced by a page's body widget tree.
 */
function collectModelRefs(page: PageDefinition): string[] {
  const models = new Set<string>();

  for (const node of page.body) {
    collectModelRefsFromNode(node, models);
  }

  return Array.from(models);
}

/** Recursively collects model references from a widget node tree. */
function collectModelRefsFromNode(node: WidgetNode, models: Set<string>): void {
  if (node.source?.model) {
    models.add(node.source.model);
  }
  if (node.bind?.model?.name) {
    models.add(node.bind.model.name);
  }
  if (node.children) {
    for (const child of node.children) {
      collectModelRefsFromNode(child, models);
    }
  }
}

// --- Navigation tree ---

/**
 * Builds the navigation tree by filtering each module's nav sections
 * down to only pages the user can access, then sorting by module order.
 */
function buildNavigationTree(
  modules: ModuleConfig[],
  accessiblePages: Array<{ module: string; page: PageDefinition }>,
): NavigationTree[] {
  const accessiblePageKeys = new Set(accessiblePages.map((p) => p.page.key));
  const tree: NavigationTree[] = [];

  for (const mod of modules) {
    if (!mod.navigation) continue;

    const sections = buildAccessibleSections(mod.navigation, accessiblePageKeys);
    if (sections.length === 0) continue;

    tree.push({
      module: mod.name,
      label: mod.label,
      description: mod.description,
      icon: mod.icon,
      color: mod.color,
      order: mod.order,
      type: mod.type,
      sections,
    });
  }

  tree.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return tree;
}

/** Filters a module's navigation sections to only include accessible pages. */
function buildAccessibleSections(
  navigation: NonNullable<ModuleConfig['navigation']>,
  accessiblePageKeys: Set<string>,
): NavigationTreeSection[] {
  const sections: NavigationTreeSection[] = [];

  for (const section of navigation) {
    const visibleItems = section.items.filter((item) => accessiblePageKeys.has(item.page));
    if (visibleItems.length === 0) continue;

    sections.push({
      section: section.section,
      items: visibleItems.map((item) => ({
        page: item.page,
        label: item.label,
        icon: item.icon,
      })),
    });
  }

  return sections;
}

// --- Model metadata ---

/**
 * Builds a map of model metadata for all models referenced by accessible pages.
 */
function buildModelMeta(
  accessiblePages: Array<{ module: string; page: PageDefinition }>,
  schemaRegistry: SchemaRegistry,
): Record<string, ModelMeta> {
  const referencedModelNames = new Set<string>();

  for (const { page } of accessiblePages) {
    for (const ref of collectModelRefs(page)) {
      referencedModelNames.add(ref);
    }
  }

  const result: Record<string, ModelMeta> = {};

  for (const name of referencedModelNames) {
    const model = schemaRegistry.getModel(name);
    if (!model) continue;

    result[name] = {
      qualifiedName: model.qualifiedName,
      label: model.label,
      fields: model.fields.map((field) => resolvedFieldToMeta(field)),
    };
  }

  return result;
}

/** Converts a resolved field definition into the client-facing FieldMeta shape. */
function resolvedFieldToMeta(field: ResolvedField): FieldMeta {
  const meta: FieldMeta = {
    name: field.name,
    type: field.config.type,
  };

  if ('label' in field.config && field.config.label) {
    meta.label = field.config.label;
  }

  if ('required' in field.config && field.config.required) {
    meta.required = true;
  }

  if ('searchable' in field.config && field.config.searchable) {
    meta.searchable = true;
  }

  if (field.config.type === 'enum') {
    meta.options = field.config.options;
  }

  // Attach relationship metadata based on field type
  meta.relationship = extractRelationshipMeta(field.config);

  return meta;
}

/** Extracts relationship metadata from a field config, or returns undefined for non-relational fields. */
function extractRelationshipMeta(config: ResolvedField['config']): FieldMeta['relationship'] {
  switch (config.type) {
    case 'link':
      return { type: 'link', model: config.model };
    case 'hasMany':
      return { type: 'hasMany', model: config.model, foreignKey: config.foreignKey };
    case 'children':
      return { type: 'children', model: config.model, foreignKey: config.foreignKey };
    case 'manyToMany':
      return { type: 'manyToMany', model: config.model, through: config.through };
    case 'dynamicLink':
      return { type: 'dynamicLink', modelField: config.modelField };
    default:
      return undefined;
  }
}
