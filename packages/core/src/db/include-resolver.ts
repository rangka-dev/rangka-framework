import type { Kysely } from 'kysely';
import type { SchemaRegistry } from '../schema/registry.js';
import type { IncludeResolver, IncludeSpec } from '../model-api/types.js';
import type { AdapterRegistry } from '../plugins/adapter-registry.js';
import type { ExternalFieldConfig } from '../external-model/types.js';
import { resolveModelIncludes } from './model-include-resolver.js';

export interface CompositeIncludeResolverConfig {
  registry: SchemaRegistry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: Kysely<any> | any;
  adapterRegistry?: AdapterRegistry;
  externalModelFields?: Record<string, Record<string, ExternalFieldConfig>>;
}

export class CompositeIncludeResolver implements IncludeResolver {
  private readonly registry: SchemaRegistry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: Kysely<any>;
  private readonly adapterRegistry?: AdapterRegistry;
  private readonly externalModelFields?: Record<string, Record<string, ExternalFieldConfig>>;

  constructor(config: CompositeIncludeResolverConfig) {
    this.registry = config.registry;
    this.db = config.db;
    this.adapterRegistry = config.adapterRegistry;
    this.externalModelFields = config.externalModelFields;
  }

  async resolve(
    records: Record<string, unknown>[],
    includes: IncludeSpec[],
    sourceModel: string,
  ): Promise<void> {
    await resolveModelIncludes(records, includes, this.registry, this.db, sourceModel, {
      adapterRegistry: this.adapterRegistry,
      externalModelFields: this.externalModelFields,
    });
  }
}
