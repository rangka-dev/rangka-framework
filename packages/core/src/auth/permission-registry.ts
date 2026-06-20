import type { RolesConfig, RoleConfig, ModelPermissions } from '@rangka/shared';
import type { RegisteredRole, ResolvedPermissions } from './types.js';

const MODEL_ACTIONS = ['read', 'write', 'create', 'delete'] as const;

export class PermissionRegistry {
  private readonly roles: Map<string, RegisteredRole> = new Map();
  private resolvedInheritance: Map<string, string[]> = new Map();
  private version: number = 0;

  registerRoles(config: RolesConfig, app: string): void {
    for (const [name, roleConfig] of Object.entries(config)) {
      if (this.roles.has(name)) {
        const existing = this.roles.get(name)!;
        throw new DuplicateRoleError(name, existing.app, app);
      }
      this.roles.set(name, { name, config: roleConfig, app });
    }
    this.rebuildInheritanceChains();
    this.version++;
  }

  getRole(name: string): RegisteredRole | undefined {
    return this.roles.get(name);
  }

  getAllRoles(): RegisteredRole[] {
    return Array.from(this.roles.values());
  }

  getVersion(): number {
    return this.version;
  }

  getInheritanceChain(roleName: string): string[] {
    return this.resolvedInheritance.get(roleName) ?? [];
  }

  // Collects permissions from the given roles (and their ancestors) into a single resolved set.
  // Later roles in the array can only grant — they never revoke what an earlier role granted.
  resolvePermissionsForRoles(roleNames: string[]): ResolvedPermissions {
    const models: Record<string, ModelPermissions> = {};
    const pages = new Set<string>();

    for (const roleName of roleNames) {
      const rolesToApply = [...this.getInheritanceChain(roleName), roleName];

      for (const name of rolesToApply) {
        const role = this.roles.get(name);
        if (!role) continue;

        this.applyModelPermissions(role.config, models);
        this.collectPages(role.config, pages);
      }
    }

    return { models, pages: Array.from(pages), version: this.version };
  }

  private applyModelPermissions(
    roleConfig: RoleConfig,
    target: Record<string, ModelPermissions>,
  ): void {
    if (!roleConfig.models) return;

    for (const [model, sourcePerms] of Object.entries(roleConfig.models)) {
      if (!target[model]) target[model] = {};
      mergeModelPermissions(target[model], sourcePerms);
    }
  }

  private collectPages(roleConfig: RoleConfig, pages: Set<string>): void {
    if (!roleConfig.pages) return;
    for (const page of roleConfig.pages) {
      pages.add(page);
    }
  }

  // Walks each role's `extends` chain and caches the full ancestor list.
  // Detects cycles and missing parents.
  private rebuildInheritanceChains(): void {
    const resolved = new Map<string, string[]>();
    const inProgress = new Set<string>();

    const resolve = (name: string): string[] => {
      if (resolved.has(name)) return resolved.get(name)!;

      if (inProgress.has(name)) {
        throw new RoleInheritanceCycleError([...inProgress, name]);
      }

      inProgress.add(name);

      const role = this.roles.get(name);
      if (!role?.config.extends) {
        inProgress.delete(name);
        resolved.set(name, []);
        return [];
      }

      const parentName = role.config.extends;
      if (!this.roles.has(parentName)) {
        throw new Error(`Role "${name}" extends unknown role "${parentName}"`);
      }

      const ancestors = [...resolve(parentName), parentName];
      inProgress.delete(name);
      resolved.set(name, ancestors);
      return ancestors;
    };

    for (const name of this.roles.keys()) {
      resolve(name);
    }

    this.resolvedInheritance = resolved;
  }
}

// Merges source permissions into target. true > 'own' > unset/false.
function mergeModelPermissions(target: ModelPermissions, source: ModelPermissions): void {
  for (const action of MODEL_ACTIONS) {
    const src = source[action];
    if (!src) continue;
    // true is the most permissive — never downgrade from true to 'own'
    if (target[action] === true) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target[action] = src as any;
  }

  if (!source.fieldPermissions) return;

  if (!target.fieldPermissions) target.fieldPermissions = {};

  for (const [field, sourceField] of Object.entries(source.fieldPermissions)) {
    const targetField = target.fieldPermissions[field];

    if (!targetField) {
      target.fieldPermissions[field] = { ...sourceField };
      continue;
    }

    // Grants always win; denials only apply if not already granted
    if (sourceField.read === true) targetField.read = true;
    else if (sourceField.read === false && targetField.read === undefined) targetField.read = false;

    if (sourceField.write === true) targetField.write = true;
    else if (sourceField.write === false && targetField.write === undefined)
      targetField.write = false;
  }
}

export class DuplicateRoleError extends Error {
  constructor(
    public readonly role: string,
    public readonly existingApp: string,
    public readonly newApp: string,
  ) {
    super(
      `Duplicate role "${role}": already registered by "${existingApp}", cannot register from "${newApp}"`,
    );
    this.name = 'DuplicateRoleError';
  }
}

export class RoleInheritanceCycleError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Role inheritance cycle detected: ${cycle.join(' → ')}`);
    this.name = 'RoleInheritanceCycleError';
  }
}
