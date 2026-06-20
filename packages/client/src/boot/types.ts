import type { BootResponse } from '@rangka/shared';

export type BootState =
  | { status: 'checking' }
  | { status: 'setup' }
  | { status: 'login'; sessionExpired?: boolean }
  | { status: 'loading' }
  | { status: 'ready'; data: BootResponse }
  | { status: 'error'; error: unknown };
