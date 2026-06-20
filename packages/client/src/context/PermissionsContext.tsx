import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { BootPermissions } from '@rangka/shared';

export interface PermissionsApi {
  canRead: (model: string) => boolean;
  canCreate: (model: string) => boolean;
  canAccessPage: (pageKey: string) => boolean;
  raw: BootPermissions;
}

const PermissionsContext = createContext<PermissionsApi | null>(null);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: BootPermissions;
  children: ReactNode;
}) {
  const api = useMemo<PermissionsApi>(
    () => ({
      canRead: (model: string) => !!permissions.models[model]?.read,
      canCreate: (model: string) => !!permissions.models[model]?.create,
      canAccessPage: (pageKey: string) => permissions.pages.includes(pageKey),
      raw: permissions,
    }),
    [permissions],
  );

  return <PermissionsContext.Provider value={api}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsApi {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return ctx;
}
