import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ResolvedModel } from '../schema/types.js';
import type { ModelPermissions } from '@rangka/shared';
import { getAuthContext } from './session.js';
import { ForbiddenError } from '../errors.js';

export interface ResolvedFieldPermissions {
  hidden: Set<string>;
  readOnly: Set<string>;
}

// Determines which fields should be hidden or read-only for a given model
// based on the user's resolved permissions.
export function resolveFieldPermissions(
  model: ResolvedModel,
  modelPermissionsMap: Record<string, ModelPermissions>,
): ResolvedFieldPermissions {
  const hidden = new Set<string>();
  const readOnly = new Set<string>();

  const permissions = modelPermissionsMap[model.qualifiedName];
  if (!permissions?.fieldPermissions) {
    return { hidden, readOnly };
  }

  for (const [field, fieldPerm] of Object.entries(permissions.fieldPermissions)) {
    if (fieldPerm.read === false) {
      hidden.add(field);
    } else if (fieldPerm.write === false) {
      readOnly.add(field);
    }
  }

  return { hidden, readOnly };
}

// Hook that rejects writes to read-only fields with a 403 response.
export function createFieldWriteGuard(model: ResolvedModel) {
  return async function fieldWriteGuard(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    if (!isWriteMethod(request.method)) return;

    const ctx = getAuthContext(request);
    if (!ctx.permissions) return;

    const { readOnly } = resolveFieldPermissions(model, ctx.permissions.models);
    if (readOnly.size === 0) return;

    const body = request.body as Record<string, unknown> | undefined;
    if (!body) return;

    const violatedFields = Object.keys(body).filter((field) => readOnly.has(field));

    if (violatedFields.length > 0) {
      throw new ForbiddenError(
        'FORBIDDEN',
        `Cannot write to read-only fields: ${violatedFields.join(', ')}`,
        { fields: violatedFields },
      );
    }
  };
}

// Hook that strips hidden fields from response payloads before sending.
export function createFieldStripHook(model: ResolvedModel) {
  return async function fieldStripHook(
    request: FastifyRequest,
    _reply: FastifyReply,
    payload: unknown,
  ): Promise<unknown> {
    if (typeof payload !== 'string') return payload;

    const ctx = getAuthContext(request);
    if (!ctx.permissions) return payload;

    const { hidden } = resolveFieldPermissions(model, ctx.permissions.models);
    if (hidden.size === 0) return payload;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return payload;
    }

    if (Array.isArray(parsed?.data)) {
      parsed.data = parsed.data.map((record: Record<string, unknown>) =>
        stripFields(record, hidden),
      );
    } else if (typeof parsed?.data === 'object' && parsed.data !== null) {
      parsed.data = stripFields(parsed.data, hidden);
    }

    return JSON.stringify(parsed);
  };
}

function isWriteMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH';
}

function stripFields(
  record: Record<string, unknown>,
  hidden: Set<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!hidden.has(key)) {
      result[key] = value;
    }
  }
  return result;
}
