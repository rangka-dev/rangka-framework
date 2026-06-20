import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ResolvedModel } from '../schema/types.js';
import type { PermissionRegistry } from './permission-registry.js';
import type { ResolvedPermissions } from './types.js';
import { getAuthContext } from './session.js';
import { ForbiddenError } from '../errors.js';

type PermAction = 'read' | 'write' | 'create' | 'delete';

export function isOwnerOnly(
  permissions: ResolvedPermissions | undefined,
  model: string,
  action: 'read' | 'write' | 'delete',
): boolean {
  if (!permissions) return false;
  const modelPerms = permissions.models[model];
  return modelPerms?.[action] === 'own';
}

export function modelHasCreatedBy(model: ResolvedModel): boolean {
  return model.fields.some((f) => f.name === 'created_by');
}

const METHOD_TO_ACTION: Record<string, PermAction> = {
  GET: 'read',
  POST: 'create',
  PUT: 'write',
  PATCH: 'write',
  DELETE: 'delete',
};

function resolveAction(method: string): PermAction {
  return METHOD_TO_ACTION[method] ?? 'read';
}

export function createModelPermissionGuard(
  model: ResolvedModel,
  _permissionRegistry: PermissionRegistry,
) {
  return async function modelPermissionGuard(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const ctx = getAuthContext(request);
    if (!ctx.permissions) {
      throw new ForbiddenError('FORBIDDEN', 'No permissions resolved');
    }

    const action = resolveAction(request.method);
    const modelPerms = ctx.permissions.models[model.qualifiedName];

    if (!modelPerms || !modelPerms[action]) {
      throw new ForbiddenError(
        'FORBIDDEN',
        `Insufficient permission: ${action} on ${model.qualifiedName}`,
      );
    }
  };
}
