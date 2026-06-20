import type { ModuleConfig, ScopeDefinition, ScopeConfig } from '@rangka/shared';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedModel } from '../schema/types.js';

export interface ResolvedScope {
  name: string;
  definition: ScopeDefinition;
  module: string;
}

export interface ModelScopeBinding {
  scopeName: string;
  column: string;
  scopeModel: string;
}

export class ScopeResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeResolutionError';
  }
}

export class ScopeRegistry {
  private readonly scopes: Map<string, ResolvedScope> = new Map();
  private readonly modelBindings: Map<string, ModelScopeBinding> = new Map();

  constructor(modules: ModuleConfig[], schemaRegistry: SchemaRegistry) {
    this.registerScopes(modules);
    this.resolveModelBindings(schemaRegistry);
  }

  getScope(name: string): ResolvedScope | undefined {
    return this.scopes.get(name);
  }

  getAllScopes(): ResolvedScope[] {
    return Array.from(this.scopes.values());
  }

  getModelBinding(qualifiedName: string): ModelScopeBinding | undefined {
    return this.modelBindings.get(qualifiedName);
  }

  isModelScoped(qualifiedName: string): boolean {
    return this.modelBindings.has(qualifiedName);
  }

  private registerScopes(modules: ModuleConfig[]): void {
    for (const mod of modules) {
      if (!mod.scopes) continue;
      for (const [name, definition] of Object.entries(mod.scopes)) {
        if (this.scopes.has(name)) {
          throw new ScopeResolutionError(
            `Scope "${name}" declared by module "${mod.name}" conflicts with existing scope from module "${this.scopes.get(name)!.module}"`,
          );
        }
        this.scopes.set(name, { name, definition, module: mod.name });
      }
    }
  }

  private resolveModelBindings(schemaRegistry: SchemaRegistry): void {
    for (const model of schemaRegistry.getAllModels()) {
      if (!model.scope) continue;

      const binding = this.resolveBinding(model, schemaRegistry);
      this.modelBindings.set(model.qualifiedName, binding);
    }
  }

  private resolveBinding(model: ResolvedModel, schemaRegistry: SchemaRegistry): ModelScopeBinding {
    const scopeName = this.parseScopeName(model.scope!);
    const explicitField = this.parseExplicitField(model.scope!);

    const scope = this.scopes.get(scopeName);
    if (!scope) {
      throw new ScopeResolutionError(
        `Model "${model.qualifiedName}" references scope "${scopeName}" which is not defined by any module`,
      );
    }

    const column = explicitField ?? this.findLinkColumn(model, scope, schemaRegistry);
    return { scopeName, column, scopeModel: scope.definition.model };
  }

  private parseScopeName(scopeConfig: ScopeConfig): string {
    if (typeof scopeConfig === 'string') return scopeConfig;
    return scopeConfig.name;
  }

  private parseExplicitField(scopeConfig: ScopeConfig): string | undefined {
    if (typeof scopeConfig === 'string') return undefined;
    return scopeConfig.field;
  }

  private findLinkColumn(
    model: ResolvedModel,
    scope: ResolvedScope,
    schemaRegistry: SchemaRegistry,
  ): string {
    const relationships = schemaRegistry.getRelationshipsForModel(model.qualifiedName);
    const matchingLinks = relationships.filter(
      (r) => r.type === 'link' && r.to === scope.definition.model,
    );

    if (matchingLinks.length === 0) {
      throw new ScopeResolutionError(
        `Model "${model.qualifiedName}" is scoped by "${scope.name}" but has no link field to "${scope.definition.model}"`,
      );
    }

    if (matchingLinks.length > 1) {
      throw new ScopeResolutionError(
        `Model "${model.qualifiedName}" has multiple link fields to "${scope.definition.model}" (${matchingLinks.map((l) => l.field).join(', ')}). Specify which field to use: scope: { name: '${scope.name}', field: '<field_name>' }`,
      );
    }

    return matchingLinks[0].field;
  }
}
