import type { ResolvedModel, ResolvedField, ModelRelationship, ExtensionSource } from './types.js';
import { buildRelationships } from './relationships.js';

/**
 * Central registry providing lookup access to all resolved models,
 * their relationships, and extension metadata.
 */
export class SchemaRegistry {
  private readonly modelMap: Map<string, ResolvedModel>;
  private readonly relationships: ModelRelationship[];
  private readonly extensionSourceMap: Map<string, ExtensionSource[]>;

  constructor(models: ResolvedModel[]) {
    this.modelMap = new Map();
    for (const model of models) {
      this.modelMap.set(model.qualifiedName, model);
    }
    this.relationships = buildRelationships(models);
    this.extensionSourceMap = this.buildExtensionSourceMap(models);
  }

  /** Retrieve a single model by its fully qualified name (e.g. "sales.Invoice"). */
  getModel(qualifiedName: string): ResolvedModel | undefined {
    return this.modelMap.get(qualifiedName);
  }

  /** Return all registered models. */
  getAllModels(): ResolvedModel[] {
    return Array.from(this.modelMap.values());
  }

  /** Return the field definitions for a given model. */
  getFieldsForModel(qualifiedName: string): ResolvedField[] {
    const model = this.modelMap.get(qualifiedName);
    if (!model) return [];
    return model.fields;
  }

  /** Return all computed relationships across the schema. */
  getRelationships(): ModelRelationship[] {
    return this.relationships;
  }

  /** Return relationships originating from a specific model. */
  getRelationshipsForModel(qualifiedName: string): ModelRelationship[] {
    return this.relationships.filter((r) => r.from === qualifiedName);
  }

  /** Return extension source metadata for a model (which apps contributed fields). */
  getExtensionSources(qualifiedName: string): ExtensionSource[] {
    return this.extensionSourceMap.get(qualifiedName) ?? [];
  }

  /** Group all models by their app name. */
  getModelsByModule(): Map<string, ResolvedModel[]> {
    const appToModels = new Map<string, ResolvedModel[]>();
    for (const model of this.modelMap.values()) {
      const group = appToModels.get(model.app) ?? [];
      group.push(model);
      appToModels.set(model.app, group);
    }
    return appToModels;
  }

  /**
   * Builds a map from model name to the list of apps that extended it with extra fields.
   */
  private buildExtensionSourceMap(models: ResolvedModel[]): Map<string, ExtensionSource[]> {
    const map = new Map<string, ExtensionSource[]>();

    for (const model of models) {
      const extensionFields = model.fields.filter((f) => f.provenance.source === 'extension');
      if (extensionFields.length === 0) continue;

      // Group extension fields by the app that contributed them
      const fieldsByApp = new Map<string, string[]>();
      for (const field of extensionFields) {
        const contributingApp = field.provenance.app!;
        const fieldNames = fieldsByApp.get(contributingApp) ?? [];
        fieldNames.push(field.name);
        fieldsByApp.set(contributingApp, fieldNames);
      }

      const sources: ExtensionSource[] = [];
      for (const [app, fields] of fieldsByApp) {
        sources.push({ app, fields });
      }
      map.set(model.qualifiedName, sources);
    }

    return map;
  }
}
