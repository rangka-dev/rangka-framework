// --- Error types ---

export class ModelNotFoundError extends Error {
  constructor(
    public readonly model: string,
    public readonly id: string,
  ) {
    super(`Record not found in ${model}: ${id}`);
    this.name = 'ModelNotFoundError';
  }
}

export class ReadOnlyViolationError extends Error {
  constructor(
    public readonly model: string,
    public readonly field: string,
  ) {
    super(`Cannot write to read-only field "${field}" on ${model}`);
    this.name = 'ReadOnlyViolationError';
  }
}

export class UnsupportedOperationError extends Error {
  constructor(
    public readonly model: string,
    public readonly operation: string,
    public readonly reason: string,
  ) {
    super(`${operation} not supported on ${model}: ${reason}`);
    this.name = 'UnsupportedOperationError';
  }
}

export class ModelValidationError extends Error {
  constructor(
    public readonly model: string,
    public readonly issues: Array<{ field: string; message: string }>,
  ) {
    super(
      `Validation failed on ${model}: ${issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`,
    );
    this.name = 'ModelValidationError';
  }
}

// --- Filter types ---

export interface FilterOperators {
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  is?: null | 'not_null';
  between?: [unknown, unknown];
}

export type FilterValue = unknown | FilterOperators;

export interface FilterExpression {
  [field: string]: FilterValue;
  $or?: FilterExpression[];
}

// --- Aggregate types ---

export interface AggregateSpec {
  sum?: string | string[];
  avg?: string | string[];
  min?: string | string[];
  max?: string | string[];
  count?: true | string;
}

export interface AggregateResult {
  sum?: Record<string, number>;
  avg?: Record<string, number>;
  min?: Record<string, unknown>;
  max?: Record<string, unknown>;
  count?: number;
}

export interface GroupedAggregateResult {
  groups: Array<{
    key: Record<string, unknown>;
    sum?: Record<string, number>;
    avg?: Record<string, number>;
    min?: Record<string, unknown>;
    max?: Record<string, unknown>;
    count?: number;
  }>;
}

// --- Query result types ---

export interface QueryResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}

export interface QueryResultWithMeta {
  data: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
