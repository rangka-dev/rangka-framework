import type { ResolvedField } from '../schema/types.js';
import type { FieldConfig } from '@rangka/shared';
import { toBool, toInt, isNil } from '../helpers/coerce.js';

// --- Result types returned by the parser ---

export interface ParsedFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface ParsedSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface ParsedInclude {
  relation: string;
  nested?: ParsedInclude[];
}

export interface ParsedQuery {
  filters: ParsedFilter[];
  sort: ParsedSort[];
  pagination: ParsedPagination;
  includes: ParsedInclude[];
  fields: string[];
  search?: string;
}

// --- Type classification sets for operator validation ---

const NUMERIC_TYPES = new Set(['int', 'decimal', 'money']);
const DATE_TYPES = new Set(['date', 'datetime']);
/** Types that support comparison operators (gt, gte, lt, lte) */
const ORDERED_TYPES = new Set([...NUMERIC_TYPES, ...DATE_TYPES]);

const COMPARISON_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte']);
const ALL_OPERATORS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'isnull']);

// --- Pagination defaults ---

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const MAX_INCLUDE_DEPTH = 2;

// --- Helpers ---

/** Split a comma-separated string into trimmed, non-empty parts. */
function splitCommaSeparated(input: string): string[] {
  return input
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/** Clamp a numeric value to a [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parses incoming query-string parameters into a structured, validated query object.
 * Validates field names, operators, and types against the entity schema.
 */
export class QueryParser {
  private readonly fieldMap: Map<string, FieldConfig>;
  private readonly relationNames: Set<string>;

  constructor(fields: ResolvedField[], relationNames: string[]) {
    this.fieldMap = new Map();
    for (const resolved of fields) {
      this.fieldMap.set(resolved.name, resolved.config);
    }
    this.relationNames = new Set(relationNames);
  }

  /** Parse all query sections at once. */
  parse(query: Record<string, unknown>): ParsedQuery {
    return {
      filters: this.parseFilters(query),
      sort: this.parseSort(query),
      pagination: this.parsePagination(query),
      includes: this.parseIncludes(query),
      fields: this.parseFields(query),
      search: this.parseSearch(query),
    };
  }

  /**
   * Parse filter conditions from `query.filter`.
   * Expected shape: { filter: { fieldName: { operator: value } } }
   */
  parseFilters(query: Record<string, unknown>): ParsedFilter[] {
    const filterParam = query['filter'];
    if (!filterParam || typeof filterParam !== 'object') return [];

    const filters: ParsedFilter[] = [];
    const filtersByField = filterParam as Record<string, unknown>;

    for (const [fieldName, operatorMap] of Object.entries(filtersByField)) {
      const fieldConfig = this.getFieldConfigOrThrow(fieldName);

      if (!operatorMap || typeof operatorMap !== 'object') continue;
      const operatorEntries = operatorMap as Record<string, unknown>;

      for (const [operator, rawValue] of Object.entries(operatorEntries)) {
        if (!ALL_OPERATORS.has(operator)) {
          throw new QueryValidationError(`Unknown filter operator: ${operator}`);
        }

        this.validateOperatorForType(fieldName, operator, fieldConfig);

        filters.push({
          field: fieldName,
          operator,
          value: this.coerceValue(operator, rawValue, fieldConfig),
        });
      }
    }

    return filters;
  }

  /**
   * Parse sort directives from `query.sort`.
   * Expected format: "field1,-field2" (prefix with `-` for descending).
   */
  parseSort(query: Record<string, unknown>): ParsedSort[] {
    const sortParam = query['sort'];
    if (!sortParam || typeof sortParam !== 'string') return [];

    const sortFields = splitCommaSeparated(sortParam);
    const result: ParsedSort[] = [];

    for (const entry of sortFields) {
      const isDescending = entry.startsWith('-');
      const fieldName = isDescending ? entry.slice(1) : entry;

      if (!this.fieldMap.has(fieldName)) {
        throw new QueryValidationError(`Unknown sort field: ${fieldName}`);
      }

      result.push({ field: fieldName, direction: isDescending ? 'desc' : 'asc' });
    }

    return result;
  }

  /** Parse page/limit from the query, applying defaults and bounds. */
  parsePagination(query: Record<string, unknown>): ParsedPagination {
    const page = this.parsePageNumber(query['page']);
    const limit = this.parseLimit(query['limit']);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Parse relation includes from `query.include`.
   * Supports dot notation for nested relations up to depth 2: "posts.comments"
   */
  parseIncludes(query: Record<string, unknown>): ParsedInclude[] {
    const includeParam = query['include'];
    if (!includeParam || typeof includeParam !== 'string') return [];

    const includePaths = splitCommaSeparated(includeParam);
    const result: ParsedInclude[] = [];

    for (const path of includePaths) {
      const segments = path.split('.');

      if (segments.length > MAX_INCLUDE_DEPTH) {
        throw new QueryValidationError(
          `Max include depth of ${MAX_INCLUDE_DEPTH} exceeded: ${path}`,
        );
      }

      if (!this.relationNames.has(segments[0])) {
        throw new QueryValidationError(`Unknown relation: ${segments[0]}`);
      }

      const parsed: ParsedInclude = { relation: segments[0] };
      if (segments.length === 2) {
        parsed.nested = [{ relation: segments[1] }];
      }

      result.push(parsed);
    }

    return result;
  }

  /**
   * Parse sparse fieldsets from `query.fields`.
   * Always ensures "id" is included.
   */
  parseFields(query: Record<string, unknown>): string[] {
    const fieldsParam = query['fields'];
    if (!fieldsParam || typeof fieldsParam !== 'string') return [];

    const requestedFields = splitCommaSeparated(fieldsParam);

    for (const fieldName of requestedFields) {
      if (fieldName === 'id') continue;
      if (!this.fieldMap.has(fieldName)) {
        throw new QueryValidationError(`Unknown field: ${fieldName}`);
      }
    }

    // Ensure "id" is always present at the start
    if (!requestedFields.includes('id')) {
      requestedFields.unshift('id');
    }

    return requestedFields;
  }

  // --- Private helpers ---

  /** Look up a field config, throwing if the field is not recognized. */
  private getFieldConfigOrThrow(fieldName: string): FieldConfig {
    const config = this.fieldMap.get(fieldName);
    if (!config) {
      throw new QueryValidationError(`Unknown filter field: ${fieldName}`);
    }
    return config;
  }

  /** Validate that the operator is allowed for the field's type. */
  private validateOperatorForType(fieldName: string, operator: string, config: FieldConfig): void {
    if (COMPARISON_OPERATORS.has(operator) && !ORDERED_TYPES.has(config.type)) {
      throw new QueryValidationError(
        `Operator '${operator}' is not valid for ${config.type} field '${fieldName}'`,
      );
    }

    if (operator === 'like' && config.type !== 'string' && config.type !== 'text') {
      throw new QueryValidationError(
        `Operator 'like' is not valid for ${config.type} field '${fieldName}'`,
      );
    }
  }

  /** Coerce a raw query value to the appropriate JS type based on the operator and field config. */
  private coerceValue(operator: string, rawValue: unknown, config: FieldConfig): unknown {
    const stringValue = String(rawValue);

    if (operator === 'isnull') {
      return toBool(rawValue);
    }

    if (operator === 'in') {
      return stringValue.split(',').map((item) => this.coerceSingleValue(item.trim(), config));
    }

    return this.coerceSingleValue(stringValue, config);
  }

  /** Coerce a single string value to its typed representation (number, boolean, or string). */
  private coerceSingleValue(value: string, config: FieldConfig): unknown {
    if (NUMERIC_TYPES.has(config.type)) {
      const parsed = Number(value);
      if (isNaN(parsed)) return value;
      return parsed;
    }
    if (config.type === 'boolean') {
      return toBool(value);
    }
    return value;
  }

  /** Parse and validate the page number, defaulting to 1 if invalid. */
  private parsePageNumber(raw: unknown): number {
    const parsed = toInt(raw, -1);
    if (parsed < 1) return DEFAULT_PAGE;
    return parsed;
  }

  /** Parse and validate the limit, clamping to [MIN_LIMIT, MAX_LIMIT]. */
  private parseLimit(raw: unknown): number {
    if (isNil(raw) || raw === '') return DEFAULT_LIMIT;
    const parsed = toInt(raw, -1);
    if (parsed < 0) return DEFAULT_LIMIT;
    return clamp(parsed, MIN_LIMIT, MAX_LIMIT);
  }

  /** Parse the search term from the query, trimming whitespace. */
  parseSearch(query: Record<string, unknown>): string | undefined {
    const raw = query['search'];
    if (!raw || typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}

/** Thrown when a query string contains invalid field names, operators, or values. */
export class QueryValidationError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'QUERY_VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'QueryValidationError';
  }
}
