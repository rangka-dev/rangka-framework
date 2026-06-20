/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResolvedModel } from '../schema/types.js';
import type { RequestContext } from '../auth/types.js';

export interface ScopeEnforcementOptions {
  model?: ResolvedModel;
  checkOwnership?: boolean;
}

export function applyScopeEnforcement(
  query: any,
  auth: RequestContext | undefined,
  options?: ScopeEnforcementOptions,
): any {
  if (!auth) return query;

  let result = query;

  if (auth.scopeFilters && auth.scopeFilters.length > 0) {
    for (const filter of auth.scopeFilters) {
      const operator = filter.operator === 'in' ? 'in' : '=';
      result = result.where(filter.field, operator, filter.value);
    }
  }

  if (options?.checkOwnership && options.model && auth.permissions && auth.user) {
    const modelPerms = auth.permissions.models[options.model.qualifiedName];
    if (modelPerms && modelPerms.read === 'own') {
      const hasCreatedBy = options.model.fields.some((f) => f.name === 'created_by');
      if (hasCreatedBy) {
        result = result.where('created_by', '=', auth.user.id);
      }
    }
  }

  return result;
}
