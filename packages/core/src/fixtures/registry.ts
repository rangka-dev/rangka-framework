import type { FixtureDefinition, RegisteredFixture } from './types.js';

/**
 * Stores fixture definitions keyed by model name.
 * Fixtures can be retrieved in dependency-sorted order for safe loading.
 */
export class FixtureRegistry {
  private readonly fixtures: Map<string, RegisteredFixture[]> = new Map();

  /** Validate and store a fixture definition. */
  register(definition: FixtureDefinition): void {
    const errors = this.validate(definition);
    if (errors.length > 0) {
      throw new Error(`Invalid fixture for "${definition.model}": ${errors.join('; ')}`);
    }

    const existing = this.fixtures.get(definition.model) ?? [];
    existing.push({ model: definition.model, definition });
    this.fixtures.set(definition.model, existing);
  }

  getForModel(model: string): RegisteredFixture[] {
    return this.fixtures.get(model) ?? [];
  }

  getAll(): RegisteredFixture[] {
    const all: RegisteredFixture[] = [];
    for (const fixtures of this.fixtures.values()) {
      all.push(...fixtures);
    }
    return all;
  }

  getAllModels(): string[] {
    return Array.from(this.fixtures.keys());
  }

  /** Return all definitions sorted so dependencies load first. */
  getLoadOrder(): FixtureDefinition[] {
    const allDefinitions = this.getAll().map((f) => f.definition);
    return this.topologicalSort(allDefinitions);
  }

  /**
   * Get fixtures for a specific variant. Variant fixtures override base (no-variant)
   * fixtures on a per-model basis. Results are dependency-sorted.
   */
  getForVariant(variant: string | undefined): FixtureDefinition[] {
    const allDefinitions = this.getAll().map((f) => f.definition);

    if (!variant) {
      return allDefinitions.filter((f) => !f.variant);
    }

    // Start with base fixtures, then let variant fixtures override per-model
    const fixtureByModel = new Map<string, FixtureDefinition>();
    for (const fixture of allDefinitions) {
      if (!fixture.variant) {
        fixtureByModel.set(fixture.model, fixture);
      }
    }
    for (const fixture of allDefinitions) {
      if (fixture.variant === variant) {
        fixtureByModel.set(fixture.model, fixture);
      }
    }

    return this.topologicalSort(Array.from(fixtureByModel.values()));
  }

  /**
   * Sort definitions so that each fixture's dependencies appear before it.
   * Uses depth-first traversal with visited tracking.
   */
  private topologicalSort(definitions: FixtureDefinition[]): FixtureDefinition[] {
    const definitionByModel = new Map<string, FixtureDefinition>();
    for (const def of definitions) {
      definitionByModel.set(def.model, def);
    }

    const visited = new Set<string>();
    const sorted: FixtureDefinition[] = [];

    const visit = (model: string) => {
      if (visited.has(model)) return;
      visited.add(model);

      const def = definitionByModel.get(model);
      if (!def) return;

      // Visit dependencies first
      if (def.depends) {
        for (const dependency of def.depends) {
          visit(dependency);
        }
      }

      sorted.push(def);
    };

    for (const model of definitionByModel.keys()) {
      visit(model);
    }

    return sorted;
  }

  private validate(definition: FixtureDefinition): string[] {
    const errors: string[] = [];

    if (!definition.model || definition.model.trim().length === 0) {
      errors.push('Fixture model must not be empty');
    }

    if (!definition.key || definition.key.trim().length === 0) {
      errors.push('Fixture key must not be empty');
    }

    if (!definition.records || definition.records.length === 0) {
      errors.push('Fixture must have at least one record');
    }

    return errors;
  }
}
