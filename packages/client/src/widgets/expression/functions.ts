import type { EvalContext } from './evaluator.js';

type ExprFn = (args: unknown[], context: EvalContext) => unknown;

function toNumber(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function toArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return [];
}

export const functions: Record<string, ExprFn> = {
  // Aggregate
  sum(args) {
    const arr = toArray(args[0]);
    return arr.reduce((acc: number, item) => acc + toNumber(item), 0);
  },
  count(args) {
    const arr = toArray(args[0]);
    return arr.length;
  },
  avg(args) {
    const arr = toArray(args[0]);
    if (arr.length === 0) return 0;
    const total = arr.reduce((acc: number, item) => acc + toNumber(item), 0);
    return total / arr.length;
  },
  min(args) {
    const arr = toArray(args[0]);
    if (arr.length === 0) return 0;
    return Math.min(...arr.map(toNumber));
  },
  max(args) {
    const arr = toArray(args[0]);
    if (arr.length === 0) return 0;
    return Math.max(...arr.map(toNumber));
  },

  // Math
  round(args) {
    const value = toNumber(args[0]);
    const decimals = args[1] != null ? toNumber(args[1]) : 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
  abs(args) {
    return Math.abs(toNumber(args[0]));
  },
  ceil(args) {
    return Math.ceil(toNumber(args[0]));
  },
  floor(args) {
    return Math.floor(toNumber(args[0]));
  },

  // String
  upper(args) {
    return String(args[0] ?? '').toUpperCase();
  },
  lower(args) {
    return String(args[0] ?? '').toLowerCase();
  },
  concat(args) {
    return args.map((a) => String(a ?? '')).join('');
  },
  trim(args) {
    return String(args[0] ?? '').trim();
  },

  // Date
  today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  },
  now() {
    return new Date().toISOString();
  },
  add_days(args) {
    const date = new Date(String(args[0]));
    const days = toNumber(args[1]);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  },
  diff_days(args) {
    const a = new Date(String(args[0]));
    const b = new Date(String(args[1]));
    return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  },
  format_date(args) {
    const date = new Date(String(args[0]));
    const pattern = String(args[1] ?? '');
    return pattern
      .replace('YYYY', String(date.getFullYear()))
      .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(date.getDate()).padStart(2, '0'));
  },

  // Format
  format_currency(args) {
    const value = toNumber(args[0]);
    const currency = String(args[1] ?? 'USD');
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  },
  format_number(args) {
    const value = toNumber(args[0]);
    const decimals = args[1] != null ? toNumber(args[1]) : 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  // Logic
  if(args) {
    return args[0] ? args[1] : args[2];
  },
  coalesce(args) {
    for (const arg of args) {
      if (arg != null) return arg;
    }
    return null;
  },
};
