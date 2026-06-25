import type { ModelAccess, ModelAccessOptions, ModelOps, ModelQuery } from './types.js';
import { ModelQueryBuilder } from './query-builder.js';
import { KyselyModelOps } from '../db/model-ops.js';
import { ExternalModelOps } from '../external-model/external-model-ops.js';
import { CompositeIncludeResolver } from '../db/include-resolver.js';
import { modelToTableName } from '../db/field-mapper.js';

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
  OrFilter,
  AppliedFilter,
  IncludeResolver,
  IncludeSpec,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDatabaseClient = typeof (db as any).kysely !== 'undefined';
    const tableName = isDatabaseClient
      ? model.qualifiedName
      : modelToTableName(model.qualifiedName);
    return new KyselyModelOps({ db, model, registry, auth, tableName, dialect: opts.dialect });
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

    async createMany(modelName: string, data: Record<string, unknown>[]) {
      return resolveOps(modelName).createMany(data, auth);
    },

    async transaction<T>(fn: (models: ModelAccess) => Promise<T>): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDb = db as any;
      if (typeof anyDb.transaction !== 'function') {
        throw new Error('transaction() is only supported on Kysely-backed model access');
      }
      // DatabaseClient wraps Kysely and exposes transaction(callback) directly
      if (typeof anyDb.kysely !== 'undefined') {
        return anyDb.transaction((trx: unknown) => {
          const scopedAccess = createModelAccess({ ...opts, db: trx as typeof db });
          return fn(scopedAccess);
        });
      }
      // Raw Kysely: db.transaction().execute(callback)
      return anyDb.transaction().execute((trx: unknown) => {
        const scopedAccess = createModelAccess({ ...opts, db: trx as typeof db });
        return fn(scopedAccess);
      });
    },
  };
}
