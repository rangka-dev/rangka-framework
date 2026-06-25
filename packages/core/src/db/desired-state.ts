import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedModel } from '../schema/types.js';
import type { DesiredState, TableDefinition, IndexDefinition } from './types.js';
import { mapFieldsToColumns, modelToTableName } from './field-mapper.js';
import { getJobTables } from '../jobs/tables.js';
import type { Dialect } from './client.js';

/**
 * Converts the in-memory schema registry into the desired database state
 * (list of table definitions) used by the diff engine for migrations.
 */
export class SchemaToDesired {
  convert(registry: SchemaRegistry, dialect: Dialect = 'postgres'): DesiredState {
    const tables: TableDefinition[] = [];
    const models = registry.getAllModels();
    let hasSequenceField = false;

    for (const model of models) {
      const { primaryTable, joinTables } = this.modelToTables(model);
      tables.push(primaryTable);
      tables.push(...joinTables);

      if (model.fields.some((f) => f.config.type === 'sequence')) {
        hasSequenceField = true;
      }
    }

    // Add the naming_sequence helper table if any model uses sequence fields
    if (hasSequenceField) {
      tables.push(this.buildNamingSequenceTable());
    }

    // Job tables are only relevant for PostgreSQL (requires row-level locking)
    if (dialect === 'postgres') {
      tables.push(...getJobTables());
    }

    return { tables };
  }

  /**
   * Converts a single model into its primary table definition plus any
   * extra join/pivot tables required by its fields.
   */
  private modelToTables(model: ResolvedModel): {
    primaryTable: TableDefinition;
    joinTables: TableDefinition[];
  } {
    const tableName = modelToTableName(model.qualifiedName);
    const mapping = mapFieldsToColumns(model);
    const indexes = this.buildIndexes(model, tableName);

    const primaryTable: TableDefinition = {
      name: tableName,
      columns: mapping.columns,
      foreignKeys: mapping.foreignKeys,
      checkConstraints: mapping.checkConstraints,
      indexes,
    };

    return { primaryTable, joinTables: mapping.extraTables };
  }

  /** Generates index definitions from a model's declared indexes. */
  private buildIndexes(model: ResolvedModel, tableName: string): IndexDefinition[] {
    if (!model.indexes || model.indexes.length === 0) return [];

    return model.indexes.map((idx) => {
      const prefix = idx.unique ? 'uidx' : 'idx';
      const indexName = `${prefix}_${tableName}_${idx.fields.join('_')}`;
      return {
        name: indexName,
        table: tableName,
        columns: idx.fields,
        unique: idx.unique ?? false,
      };
    });
  }

  /** Table definition for the naming_sequence counter table. */
  private buildNamingSequenceTable(): TableDefinition {
    return {
      name: 'rangka_naming_sequence',
      columns: [
        { name: 'model', type: 'VARCHAR(255)', nullable: false },
        { name: 'field', type: 'VARCHAR(255)', nullable: false },
        { name: 'next_val', type: 'BIGINT', nullable: false, defaultValue: '1' },
      ],
      foreignKeys: [],
      checkConstraints: [],
      indexes: [
        {
          name: 'uidx_rangka_naming_sequence_key',
          table: 'rangka_naming_sequence',
          columns: ['model', 'field'],
          unique: true,
        },
      ],
    };
  }
}
