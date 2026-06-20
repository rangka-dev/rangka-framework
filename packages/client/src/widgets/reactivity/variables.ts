/**
 * Reactive variable parsing helpers for $filter, $sort, $page namespaces.
 *
 * These variables are stored in the same flat StateStore as $state keys.
 * The store keys use the full prefix (e.g. "$filter.sales.order.status__gt").
 * These helpers parse those keys into structured query parameters.
 */

export type FilterOperator =
  | 'eq'
  | 'in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'empty'
  | 'not_empty';

export interface ParsedFilterKey {
  model: string;
  field: string;
  operator: FilterOperator;
}

export interface ParsedFilter {
  model: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface SortEntry {
  field: string;
  direction: 'asc' | 'desc';
}

const OPERATOR_SUFFIXES: Record<string, FilterOperator> = {
  __gt: 'gt',
  __gte: 'gte',
  __lt: 'lt',
  __lte: 'lte',
  __like: 'like',
  __empty: 'empty',
  __not_empty: 'not_empty',
};

const FILTER_PREFIX = '$filter.';
const SORT_PREFIX = '$sort.';
const PAGE_PREFIX = '$page.';
const SEARCH_PREFIX = '$search.';

/**
 * Parse a $filter key into its model, field, and operator components.
 *
 * Key format: $filter.{module}.{model}.{field}[__{op}]
 * The model is the first two dot-separated segments after $filter (module.model).
 * The field is the remaining segment, optionally with an operator suffix.
 *
 * Examples:
 *   "$filter.sales.order.status"       -> { model: "sales.order", field: "status", operator: "eq" }
 *   "$filter.sales.order.total__gt"    -> { model: "sales.order", field: "total", operator: "gt" }
 *   "$filter.sales.order.deleted_at__empty" -> { model: "sales.order", field: "deleted_at", operator: "empty" }
 */
export function parseFilterKey(key: string): ParsedFilterKey | null {
  if (!key.startsWith(FILTER_PREFIX)) return null;

  const rest = key.slice(FILTER_PREFIX.length);
  // Need at least module.model.field = 3 dot-separated segments
  const parts = rest.split('.');
  if (parts.length < 3) return null;

  // Model is first two segments (module.model)
  const model = `${parts[0]}.${parts[1]}`;

  // Field is the remaining segments joined (supports dotted field names, though unusual)
  let fieldPart = parts.slice(2).join('.');

  // Check for operator suffix (longest match first)
  let operator: FilterOperator = 'eq';
  for (const [suffix, op] of Object.entries(OPERATOR_SUFFIXES)) {
    if (fieldPart.endsWith(suffix)) {
      operator = op;
      fieldPart = fieldPart.slice(0, -suffix.length);
      break;
    }
  }

  if (!fieldPart) return null;

  return { model, field: fieldPart, operator };
}

/**
 * Get all active filters for a given model from the state store.
 * Reads all keys starting with $filter.{model}. and parses them.
 */
export function getFiltersForModel(state: Map<string, unknown>, model: string): ParsedFilter[] {
  const prefix = `${FILTER_PREFIX}${model}.`;
  const filters: ParsedFilter[] = [];

  for (const [key, value] of state) {
    if (!key.startsWith(prefix)) continue;
    // Skip null/undefined values (cleared filters)
    if (value === null || value === undefined) continue;

    const parsed = parseFilterKey(key);
    if (!parsed) continue;

    // Determine operator: if no suffix but value is an array, use 'in'
    let operator = parsed.operator;
    if (operator === 'eq' && Array.isArray(value)) {
      operator = 'in';
    }

    filters.push({
      model: parsed.model,
      field: parsed.field,
      operator,
      value,
    });
  }

  return filters;
}

/**
 * Get the sort configuration for a model.
 * The sort value is a comma-separated string. Prefix '-' means descending.
 *
 * Examples:
 *   "-date"       -> [{ field: "date", direction: "desc" }]
 *   "-date,name"  -> [{ field: "date", direction: "desc" }, { field: "name", direction: "asc" }]
 *   null          -> null (use model default)
 */
export function getSortForModel(state: Map<string, unknown>, model: string): SortEntry[] | null {
  const key = `${SORT_PREFIX}${model}`;
  const value = state.get(key);

  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.trim() === '') return null;

  const entries: SortEntry[] = [];
  const parts = value.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('-')) {
      entries.push({ field: trimmed.slice(1), direction: 'desc' });
    } else {
      entries.push({ field: trimmed, direction: 'asc' });
    }
  }

  return entries.length > 0 ? entries : null;
}

/**
 * Get the current page number for a model.
 * Returns null if not set (use default page 1).
 */
export function getPageForModel(state: Map<string, unknown>, model: string): number | null {
  const key = `${PAGE_PREFIX}${model}`;
  const value = state.get(key);

  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : null;
}

/**
 * Get the current search term for a model.
 * Returns null if not set.
 */
export function getSearchForModel(state: Map<string, unknown>, model: string): string | null {
  const key = `${SEARCH_PREFIX}${model}`;
  const value = state.get(key);
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Check whether a store key belongs to one of the reactive variable namespaces.
 */
export function isReactiveVariableKey(key: string): 'filter' | 'sort' | 'page' | 'state' | null {
  if (key.startsWith(FILTER_PREFIX)) return 'filter';
  if (key.startsWith(SORT_PREFIX)) return 'sort';
  if (key.startsWith(PAGE_PREFIX)) return 'page';
  if (key.startsWith('$state.')) return 'state';
  return null;
}

/**
 * Extract the model name from a $filter, $sort, or $page key.
 * Returns null for $state or unrecognized keys.
 */
export function getModelFromKey(key: string): string | null {
  if (key.startsWith(FILTER_PREFIX)) {
    const rest = key.slice(FILTER_PREFIX.length);
    const parts = rest.split('.');
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : null;
  }
  if (key.startsWith(SORT_PREFIX)) {
    return key.slice(SORT_PREFIX.length) || null;
  }
  if (key.startsWith(PAGE_PREFIX)) {
    return key.slice(PAGE_PREFIX.length) || null;
  }
  return null;
}
