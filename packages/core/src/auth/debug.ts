import type { DatabaseClient } from '../db/client.js';
import type { PermissionRegistry } from './permission-registry.js';
import type { SchemaRegistry } from '../schema/registry.js';

export interface DebugResult {
  user: { email: string; id: string; enabled: boolean };
  roles: string[];
  inheritanceChains: Record<string, string[]>;
  effectivePermissions: Record<string, Record<string, boolean>>;
  fieldRestrictions: Record<string, { hidden: string[]; readOnly: string[] }>;
}

const TRACKED_ACTIONS = ['read', 'write', 'create', 'delete'] as const;

// Looks up a user by email and resolves their full permission picture:
// roles, inheritance chains, effective model permissions, and field restrictions.
export async function debugPermissions(
  email: string,
  db: DatabaseClient,
  permissionRegistry: PermissionRegistry,
  _schemaRegistry: SchemaRegistry,
): Promise<DebugResult> {
  const user = await findUserByEmail(db, email);
  const roleNames = await getUserRoleNames(db, user.id);
  const resolved = permissionRegistry.resolvePermissionsForRoles(roleNames);

  return {
    user: { email: user.email, id: user.id, enabled: user.enabled },
    roles: roleNames,
    inheritanceChains: buildInheritanceChains(roleNames, permissionRegistry),
    effectivePermissions: buildEffectivePermissions(resolved),
    fieldRestrictions: buildFieldRestrictions(resolved),
  };
}

async function findUserByEmail(db: DatabaseClient, email: string) {
  const user = (await db
    .selectFrom('core.user')
    .selectAll()
    .where('email', '=', email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .executeTakeFirst()) as any;

  if (!user) throw new Error(`User not found: ${email}`);
  return user;
}

async function getUserRoleNames(db: DatabaseClient, userId: string): Promise<string[]> {
  const userRoles = await db
    .selectFrom('core.user_role')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleIds = userRoles.map((ur: any) => ur.role_id);
  if (roleIds.length === 0) return [];

  const roles = await db.selectFrom('core.role').selectAll().where('id', 'in', roleIds).execute();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return roles.map((r: any) => r.name);
}

function buildInheritanceChains(
  roleNames: string[],
  permissionRegistry: PermissionRegistry,
): Record<string, string[]> {
  const chains: Record<string, string[]> = {};
  for (const name of roleNames) {
    chains[name] = permissionRegistry.getInheritanceChain(name);
  }
  return chains;
}

function buildEffectivePermissions(
  resolved: ReturnType<PermissionRegistry['resolvePermissionsForRoles']>,
): Record<string, Record<string, boolean>> {
  const permissions: Record<string, Record<string, boolean>> = {};

  for (const [model, modelPerms] of Object.entries(resolved.models)) {
    const granted: Record<string, boolean> = {};
    for (const action of TRACKED_ACTIONS) {
      if (modelPerms[action]) granted[action] = true;
    }
    permissions[model] = granted;
  }

  return permissions;
}

function buildFieldRestrictions(
  resolved: ReturnType<PermissionRegistry['resolvePermissionsForRoles']>,
): Record<string, { hidden: string[]; readOnly: string[] }> {
  const restrictions: Record<string, { hidden: string[]; readOnly: string[] }> = {};

  for (const [model, modelPerms] of Object.entries(resolved.models)) {
    if (!modelPerms.fieldPermissions) continue;

    const hidden: string[] = [];
    const readOnly: string[] = [];

    for (const [field, fieldPerm] of Object.entries(modelPerms.fieldPermissions)) {
      if (fieldPerm.read === false) hidden.push(field);
      else if (fieldPerm.write === false) readOnly.push(field);
    }

    if (hidden.length > 0 || readOnly.length > 0) {
      restrictions[model] = { hidden, readOnly };
    }
  }

  return restrictions;
}

export function formatDebugResult(result: DebugResult): string {
  const lines: string[] = [];

  lines.push(`User: ${result.user.email} (${result.user.id})`);
  lines.push(`Enabled: ${result.user.enabled}`);
  lines.push(`Roles: ${result.roles.join(', ') || '(none)'}`);
  lines.push('');

  if (Object.keys(result.inheritanceChains).length > 0) {
    lines.push('Role Inheritance:');
    for (const [role, chain] of Object.entries(result.inheritanceChains)) {
      if (chain.length > 0) {
        lines.push(`  ${role} ← ${chain.join(' ← ')}`);
      } else {
        lines.push(`  ${role} (no inheritance)`);
      }
    }
    lines.push('');
  }

  lines.push('Effective Permissions:');
  for (const [model, perms] of Object.entries(result.effectivePermissions)) {
    const actions = Object.entries(perms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    lines.push(`  ${model}: ${actions.join(', ') || '(none)'}`);
  }
  lines.push('');

  if (Object.keys(result.fieldRestrictions).length > 0) {
    lines.push('Field Restrictions:');
    for (const [model, restrictions] of Object.entries(result.fieldRestrictions)) {
      if (restrictions.hidden.length > 0) {
        lines.push(`  ${model} [hidden]: ${restrictions.hidden.join(', ')}`);
      }
      if (restrictions.readOnly.length > 0) {
        lines.push(`  ${model} [read-only]: ${restrictions.readOnly.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}
