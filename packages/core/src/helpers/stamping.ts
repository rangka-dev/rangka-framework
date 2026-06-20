import type { ResolvedModel } from '../schema/types.js';

export function stampCreate(
  body: Record<string, unknown>,
  model: ResolvedModel,
  auth?: { user?: { id: string } | null },
): void {
  if (!model.traits.includes('timestamped')) return;
  const now = new Date().toISOString();
  body.created_at = now;
  body.updated_at = now;
  if (auth?.user?.id) {
    body.created_by = auth.user.id;
    body.updated_by = auth.user.id;
  }
}

export function stampUpdate(
  body: Record<string, unknown>,
  model: ResolvedModel,
  auth?: { user?: { id: string } | null },
): void {
  if (!model.traits.includes('timestamped')) return;
  body.updated_at = new Date().toISOString();
  if (auth?.user?.id) {
    body.updated_by = auth.user.id;
  }
}
