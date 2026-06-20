export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
}

export interface ForeignKeyDefinition {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface CheckConstraintDefinition {
  name: string;
  column: string;
  expression: string;
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  where?: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  foreignKeys: ForeignKeyDefinition[];
  checkConstraints: CheckConstraintDefinition[];
  indexes: IndexDefinition[];
}

export interface DesiredState {
  tables: TableDefinition[];
}

export interface ActualColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
}

export interface ActualForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface ActualIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ActualCheckConstraint {
  name: string;
  column: string;
  expression: string;
}

export interface ActualTable {
  name: string;
  columns: ActualColumn[];
  foreignKeys: ActualForeignKey[];
  indexes: ActualIndex[];
  checkConstraints: ActualCheckConstraint[];
}

export interface ActualState {
  tables: ActualTable[];
}

export type DdlOperationType =
  | 'CREATE_TABLE'
  | 'ADD_COLUMN'
  | 'ALTER_COLUMN_TYPE'
  | 'ADD_FOREIGN_KEY'
  | 'ADD_CHECK_CONSTRAINT'
  | 'CREATE_INDEX'
  | 'DROP_COLUMN'
  | 'DROP_TABLE'
  | 'DROP_FOREIGN_KEY'
  | 'DROP_INDEX';

export interface DdlOperation {
  type: DdlOperationType;
  table: string;
  sql: string;
  destructive: boolean;
  detail?: string;
}
