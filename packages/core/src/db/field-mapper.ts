import type { ResolvedField, ResolvedModel } from '../schema/types.js';
import type {
  ColumnDefinition,
  ForeignKeyDefinition,
  CheckConstraintDefinition,
  TableDefinition,
} from './types.js';

/**
 * The complete set of database artifacts produced when mapping a model's fields to columns.
 */
export interface FieldMappingResult {
  columns: ColumnDefinition[];
  foreignKeys: ForeignKeyDefinition[];
  checkConstraints: CheckConstraintDefinition[];
  extraTables: TableDefinition[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a dot-separated qualified model name (e.g. "core.User") to a
 * flat table name using double-underscore as separator (e.g. "core__User").
 */
export function modelToTableName(qualifiedName: string): string {
  return qualifiedName.replace('.', '__');
}

/**
 * Map all fields of a resolved model into database column definitions,
 * foreign keys, check constraints, and any extra junction/closure tables.
 */
export function mapFieldsToColumns(model: ResolvedModel): FieldMappingResult {
  const tableName = modelToTableName(model.qualifiedName);
  const columns: ColumnDefinition[] = [];
  const foreignKeys: ForeignKeyDefinition[] = [];
  const checkConstraints: CheckConstraintDefinition[] = [];
  const extraTables: TableDefinition[] = [];

  // Every table gets a UUID primary key (app-side generation via crypto.randomUUID)
  columns.push({
    name: 'id',
    type: 'UUID',
    nullable: false,
    primaryKey: true,
  });

  // Add trait-derived columns (timestamped, etc.)
  // but skip any that the model already declares explicitly as a field.
  const traitResult = mapTraitColumns(model.traits, tableName);
  const explicitFieldNames = new Set(model.fields.map((f) => f.name));
  for (const traitColumn of traitResult.columns) {
    if (!explicitFieldNames.has(traitColumn.name)) {
      columns.push(traitColumn);
    }
  }
  foreignKeys.push(...traitResult.foreignKeys);

  // Map each user-defined field to its database representation
  for (const field of model.fields) {
    const fieldResult = mapField(field, model, tableName);
    columns.push(...fieldResult.columns);
    foreignKeys.push(...fieldResult.foreignKeys);
    checkConstraints.push(...fieldResult.checkConstraints);
    extraTables.push(...fieldResult.extraTables);
  }

  return { columns, foreignKeys, checkConstraints, extraTables };
}

// ---------------------------------------------------------------------------
// Field-type mapping (main dispatcher)
// ---------------------------------------------------------------------------

/**
 * Route a single field to the appropriate column mapping logic based on its type.
 */
function mapField(
  field: ResolvedField,
  model: ResolvedModel,
  tableName: string,
): FieldMappingResult {
  const config = field.config;

  switch (config.type) {
    case 'string':
      return singleColumn({
        name: field.name,
        type: `VARCHAR(${config.maxLength ?? 255})`,
        nullable: !config.required,
        defaultValue: quoteStringDefault(config.default),
      });

    case 'text':
      return singleColumn({
        name: field.name,
        type: 'TEXT',
        nullable: !config.required,
        defaultValue: quoteStringDefault(config.default),
      });

    case 'int':
      return singleColumn({
        name: field.name,
        type: 'INTEGER',
        nullable: !config.required,
        defaultValue: config.default !== undefined ? String(config.default) : undefined,
      });

    case 'decimal':
      return singleColumn({
        name: field.name,
        type: `DECIMAL(${config.precision ?? 18},${config.scale ?? 6})`,
        nullable: !config.required,
        defaultValue: config.default !== undefined ? String(config.default) : undefined,
      });

    case 'boolean':
      return singleColumn({
        name: field.name,
        type: 'BOOLEAN',
        nullable: !config.required,
        defaultValue: formatBooleanDefault(config.default),
      });

    case 'date':
      return singleColumn({
        name: field.name,
        type: 'DATE',
        nullable: !config.required,
        defaultValue: quoteStringDefault(config.default),
      });

    case 'datetime':
      return singleColumn({
        name: field.name,
        type: 'TIMESTAMPTZ',
        nullable: !config.required,
        defaultValue: quoteStringDefault(config.default),
      });

    case 'enum':
      return mapEnumField(field, config, tableName);

    case 'json':
      return singleColumn({
        name: field.name,
        type: 'JSONB',
        nullable: !config.required,
      });

    case 'code':
      return singleColumn({
        name: field.name,
        type: 'TEXT',
        nullable: !config.required,
      });

    case 'link':
      return mapLinkField(field, config, model, tableName);

    case 'dynamicLink':
      return mapDynamicLinkField(field, config);

    case 'money':
      return mapMoneyField(field, config);

    case 'tree':
      return mapTreeField(field, model, tableName, config.strategy);

    case 'sequence':
      return singleColumn({
        name: field.name,
        type: 'VARCHAR(255)',
        nullable: true,
      });

    // Relation types have no local columns -- they're handled by the related model
    case 'hasMany':
    case 'children':
      return emptyResult();

    case 'manyToMany':
      return buildManyToManyJunction(field, model);

    case 'attachment':
    case 'attachments':
      return singleColumn({
        name: field.name,
        type: 'JSONB',
        nullable: !config.required,
      });

    default:
      return emptyResult();
  }
}

// ---------------------------------------------------------------------------
// Compound field mappers (produce multiple columns or constraints)
// ---------------------------------------------------------------------------

/** Enum fields store a VARCHAR with a CHECK constraint restricting allowed values. */
function mapEnumField(
  field: ResolvedField,
  config: { required?: boolean; default?: string; options: readonly string[] },
  tableName: string,
): FieldMappingResult {
  const allowedValues = config.options.map((v) => `'${v}'`).join(', ');

  return {
    columns: [
      {
        name: field.name,
        type: 'VARCHAR(255)',
        nullable: !config.required,
        defaultValue: quoteStringDefault(config.default),
      },
    ],
    foreignKeys: [],
    checkConstraints: [
      {
        name: `chk_${tableName}_${field.name}`,
        column: field.name,
        expression: `${field.name} IN (${allowedValues})`,
      },
    ],
    extraTables: [],
  };
}

/** Link fields store a UUID foreign key pointing to another model's table. */
function mapLinkField(
  field: ResolvedField,
  config: { required?: boolean; nullable?: boolean; model: string },
  currentModel: ResolvedModel,
  tableName: string,
): FieldMappingResult {
  const referencedTable =
    config.model === '__self__' ? tableName : resolveLinkedTableName(config.model, currentModel);

  return {
    columns: [
      {
        name: field.name,
        type: 'UUID',
        nullable: config.nullable === true ? true : !config.required,
      },
    ],
    foreignKeys: [
      {
        name: `fk_${tableName}_${field.name}`,
        column: field.name,
        referencedTable,
        referencedColumn: 'id',
      },
    ],
    checkConstraints: [],
    extraTables: [],
  };
}

/** Dynamic links store a model type discriminator column alongside the UUID reference. */
function mapDynamicLinkField(
  field: ResolvedField,
  config: { required?: boolean; modelField: string },
): FieldMappingResult {
  return {
    columns: [
      {
        name: config.modelField,
        type: 'VARCHAR(255)',
        nullable: !config.required,
      },
      {
        name: field.name,
        type: 'UUID',
        nullable: !config.required,
      },
    ],
    foreignKeys: [],
    checkConstraints: [],
    extraTables: [],
  };
}

/** Money fields store both the raw amount and a base-currency converted amount. */
function mapMoneyField(field: ResolvedField, config: { required?: boolean }): FieldMappingResult {
  return {
    columns: [
      {
        name: field.name,
        type: 'DECIMAL(18,6)',
        nullable: !config.required,
      },
      {
        name: `${field.name}_base`,
        type: 'DECIMAL(18,6)',
        nullable: !config.required,
      },
    ],
    foreignKeys: [],
    checkConstraints: [],
    extraTables: [],
  };
}

/**
 * Tree fields store a self-referencing parent FK plus strategy-specific columns:
 * - materialized_path: path (TEXT) + depth (INTEGER)
 * - nested_set: lft + rgt (INTEGER pair)
 * - closure_table: generates an extra closure junction table
 */
function mapTreeField(
  field: ResolvedField,
  _model: ResolvedModel,
  tableName: string,
  strategy: 'materialized_path' | 'nested_set' | 'closure_table',
): FieldMappingResult {
  const parentColumn = field.name;
  const columns: ColumnDefinition[] = [{ name: parentColumn, type: 'UUID', nullable: true }];

  const foreignKeys: ForeignKeyDefinition[] = [
    {
      name: `fk_${tableName}_${parentColumn}`,
      column: parentColumn,
      referencedTable: tableName,
      referencedColumn: 'id',
    },
  ];

  const extraTables: TableDefinition[] = [];

  switch (strategy) {
    case 'materialized_path':
      columns.push(
        { name: 'path', type: 'TEXT', nullable: true },
        { name: 'depth', type: 'INTEGER', nullable: true },
      );
      break;

    case 'nested_set':
      columns.push(
        { name: 'lft', type: 'INTEGER', nullable: true },
        { name: 'rgt', type: 'INTEGER', nullable: true },
      );
      break;

    case 'closure_table':
      extraTables.push(buildClosureTable(tableName));
      break;
  }

  return { columns, foreignKeys, checkConstraints: [], extraTables };
}

/** Build the closure junction table definition for a tree with closure_table strategy. */
function buildClosureTable(tableName: string): TableDefinition {
  return {
    name: `${tableName}_closure`,
    columns: [
      { name: 'ancestor_id', type: 'UUID', nullable: false },
      { name: 'descendant_id', type: 'UUID', nullable: false },
      { name: 'depth', type: 'INTEGER', nullable: false },
    ],
    foreignKeys: [
      {
        name: `fk_${tableName}_closure_ancestor`,
        column: 'ancestor_id',
        referencedTable: tableName,
        referencedColumn: 'id',
      },
      {
        name: `fk_${tableName}_closure_descendant`,
        column: 'descendant_id',
        referencedTable: tableName,
        referencedColumn: 'id',
      },
    ],
    checkConstraints: [],
    indexes: [],
  };
}

/** Build a junction table for a manyToMany field. */
function buildManyToManyJunction(field: ResolvedField, model: ResolvedModel): FieldMappingResult {
  const config = field.config as { type: 'manyToMany'; model: string; through: string };
  const junctionTable = resolveLinkedTableName(config.through, model);
  const sourceTable = modelToTableName(model.qualifiedName);
  const targetTable = resolveLinkedTableName(config.model, model);

  const sourceModelName = model.name;
  const targetModelName = config.model.includes('.')
    ? config.model.split('.').pop()!
    : config.model;

  const sourceFk = `${sourceModelName}_id`;
  const targetFk = `${targetModelName}_id`;

  const junction: TableDefinition = {
    name: junctionTable,
    columns: [
      { name: sourceFk, type: 'UUID', nullable: false },
      { name: targetFk, type: 'UUID', nullable: false },
    ],
    foreignKeys: [
      {
        name: `fk_${junctionTable}_${sourceFk}`,
        column: sourceFk,
        referencedTable: sourceTable,
        referencedColumn: 'id',
      },
      {
        name: `fk_${junctionTable}_${targetFk}`,
        column: targetFk,
        referencedTable: targetTable,
        referencedColumn: 'id',
      },
    ],
    checkConstraints: [],
    indexes: [
      {
        name: `idx_${junctionTable}_unique`,
        table: junctionTable,
        columns: [sourceFk, targetFk],
        unique: true,
      },
    ],
  };

  return { columns: [], foreignKeys: [], checkConstraints: [], extraTables: [junction] };
}

// ---------------------------------------------------------------------------
// Trait mapping
// ---------------------------------------------------------------------------

/**
 * Map model traits (e.g. "timestamped") into
 * the columns and foreign keys they imply.
 */
function mapTraitColumns(
  traits: string[],
  _tableName: string,
): { columns: ColumnDefinition[]; foreignKeys: ForeignKeyDefinition[] } {
  const columns: ColumnDefinition[] = [];
  const foreignKeys: ForeignKeyDefinition[] = [];

  for (const trait of traits) {
    switch (trait) {
      case 'timestamped':
        columns.push(
          { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false },
          { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false },
          { name: 'created_by', type: 'UUID', nullable: true },
          { name: 'updated_by', type: 'UUID', nullable: true },
        );
        break;
    }
  }

  return { columns, foreignKeys };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Wrap a single column definition into a full FieldMappingResult with no extras. */
function singleColumn(column: ColumnDefinition): FieldMappingResult {
  return { columns: [column], foreignKeys: [], checkConstraints: [], extraTables: [] };
}

/** Return an empty result (no columns, no constraints). Used for virtual/relation fields. */
function emptyResult(): FieldMappingResult {
  return { columns: [], foreignKeys: [], checkConstraints: [], extraTables: [] };
}

/** Wrap a string default value in single quotes, or return undefined if not set. */
function quoteStringDefault(value: string | undefined): string | undefined {
  return value !== undefined ? `'${value}'` : undefined;
}

/** Format a boolean default as SQL TRUE/FALSE, or return undefined if not set. */
function formatBooleanDefault(value: boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value ? 'TRUE' : 'FALSE';
}

/**
 * Resolve a model reference to a table name. If the reference is already
 * fully qualified (contains a dot), convert directly. Otherwise, assume
 * it belongs to the same module as the current model.
 */
function resolveLinkedTableName(modelRef: string, currentModel: ResolvedModel): string {
  if (modelRef.includes('.')) {
    return modelToTableName(modelRef);
  }
  const qualifiedName = `${currentModel.module}.${modelRef}`;
  return modelToTableName(qualifiedName);
}
