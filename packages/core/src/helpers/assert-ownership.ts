import type { ResolvedModel } from '../schema/types.js';
import type { ResolvedPermissions } from '../auth/types.js';
import { isOwnerOnly, modelHasCreatedBy } from '../auth/model-permissions.js';
import { ForbiddenError } from '../errors.js';

export function assertOwnership(
  permissions: ResolvedPermissions | undefined,
  model: ResolvedModel,
  record: Record<string, unknown>,
  userId: string | undefined,
  operation: 'read' | 'write' | 'delete',
): void {
  if (!isOwnerOnly(permissions, model.qualifiedName, operation)) return;

  if (!modelHasCreatedBy(model) || record.created_by !== userId) {
    const action = operation === 'delete' ? 'delete' : 'update';
    throw new ForbiddenError('FORBIDDEN', `You can only ${action} records you created`);
  }
}
