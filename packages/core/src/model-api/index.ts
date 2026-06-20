import type { ModelAccess, ModelAccessOptions, ModelOps, ModelQuery } from './types.js';
import { ModelQueryBuilder } from './query-builder.js';
import { KyselyModelOps } from '../db/model-ops.js';
import { ExternalModelOps } from '../external-model/external-model-ops.js';
import { CompositeIncludeResolver } from '../db/include-resolver.js';

export type {
  ModelAccess,
  ModelQuery,
  ModelAccessOptions,
  ModelOps,
  FilterExpression,
  QueryResult,
  QueryResultWithMeta,
  QueryState,
  TranslatedFilter,
  IncludeResolver,
} from './types.js';
export { ModelQueryBuilder } from './query-builder.js';
export { translateFilters } from './filter-translator.js';
export { applyModelFilters } from './filter-applier.js';
export { applyScopeEnforcement, stripHiddenFields, enforceReadOnly } from './scope-enforcer.js';
export { resolveModelIncludes } from './include-resolver.js';
export { CapabilityNotSupportedError } from '../external-model/mutation-executor.js';

export function createModelAccess(opts: ModelAccessOptions): ModelAccess {
  const { db, registry, auth, adapterRegistry, externalModelFields, adapterCapabilities } = opts;

  const includeResolver = new CompositeIncludeResolver({
    registry,
    db,
    adapterRegistry,
    externalModelFields,
  });

  function resolveOps(modelName: string): ModelOps {
    const model = registry.getModel(modelName);
    if (!model) throw new Error(`Model not found: ${modelName}`);

    if (model.source) {
      if (!adapterRegistry) {
        throw new Error(
          `No adapter registry configured. Cannot resolve external model: ${modelName}`,
        );
      }
      const adapter = adapterRegistry.get(model.source);
      const fields = externalModelFields?.[model.qualifiedName] ?? {};
      const capabilities = adapterCapabilities?.[model.source] ?? ['read'];
      return new ExternalModelOps({
        adapter,
        adapterName: model.source,
        modelName: model.qualifiedName,
        fields,
        capabilities,
      });
    }

    return new KyselyModelOps({ db, model, registry, auth });
  }

  return {
    async get(modelName: string, id: string) {
      return resolveOps(modelName).get(id);
    },

    query(modelName: string): ModelQuery {
      const model = registry.getModel(modelName);
      if (!model) throw new Error(`Model not found: ${modelName}`);
      const ops = resolveOps(modelName);
      const qb = new ModelQueryBuilder(ops, model, registry, includeResolver);
      return auth ? qb.withAuth(auth) : qb;
    },

    async create(modelName: string, data: Record<string, unknown>) {
      return resolveOps(modelName).create(data, auth);
    },

    async update(modelName: string, id: string, data: Record<string, unknown>) {
      return resolveOps(modelName).update(id, data, auth);
    },

    async delete(modelName: string, id: string) {
      return resolveOps(modelName).delete(id, auth);
    },
  };
}
