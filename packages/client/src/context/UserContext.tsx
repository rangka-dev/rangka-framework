import { createContext, useContext, type ReactNode } from 'react';
import type { BootUser } from '@rangka/shared';

const UserContext = createContext<BootUser | null>(null);

export function UserProvider({ user, children }: { user: BootUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): BootUser {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return ctx;
}
