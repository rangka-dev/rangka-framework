import type { Kysely } from 'kysely';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ParsedInclude } from './query-parser.js';
import {
  resolveModelIncludes,
  type IncludeSpec,
  type IncludeResolverOptions,
} from '../db/model-include-resolver.js';

function toIncludeSpec(parsed: ParsedInclude): IncludeSpec {
  if (!parsed.nested || parsed.nested.length === 0) return parsed.relation;
  return { relation: parsed.relation, nested: parsed.nested.map(toIncludeSpec) };
}

export async function resolveIncludes(
  records: Record<string, unknown>[],
  includes: ParsedInclude[],
  registry: SchemaRegistry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: Kysely<any>,
  sourceModel: string,
  _request: unknown,
  options?: IncludeResolverOptions,
): Promise<void> {
  const specs = includes.map(toIncludeSpec);
  await resolveModelIncludes(records, specs, registry, db, sourceModel, options);
}
