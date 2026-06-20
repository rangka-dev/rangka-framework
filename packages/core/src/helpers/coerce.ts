/**
 * Type coercion helpers for normalizing values from query params,
 * database results, and other loosely-typed boundaries.
 */

export function toBool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function toInt(value: unknown, fallback: number = 0): number {
  if (isNil(value) || value === '') return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const parsed = Number(value);
  if (isNaN(parsed) || !Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function toCount(result: unknown): number {
  if (isNil(result)) return 0;
  const raw = typeof result === 'object' ? (result as Record<string, unknown>).count : result;
  return toInt(raw, 0);
}
