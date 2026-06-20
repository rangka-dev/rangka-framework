import type { Trait } from './types/schema.js';

export const TRAITS: Record<string, Trait> = {
  LEDGER: 'ledger',
  TIMESTAMPED: 'timestamped',
  SOFT_DELETE: 'soft_delete',
} as const;
