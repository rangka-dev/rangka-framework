import { createContext, useContext, type ReactNode } from 'react';
import type { LoginCredentials, SetupCredentials } from '../api/auth.js';
import type { BootState } from './types.js';
import { useBoot } from './useBoot.js';

interface BootContextValue {
  state: BootState;
  handleLogin: (credentials: LoginCredentials) => Promise<void>;
  handleSetup: (credentials: SetupCredentials) => Promise<void>;
  handleSessionExpired: () => void;
  handleLogout: () => void;
  retry: () => void;
}

const BootContext = createContext<BootContextValue | null>(null);

export function BootProvider({ children }: { children: ReactNode }) {
  const boot = useBoot();
  return <BootContext.Provider value={boot}>{children}</BootContext.Provider>;
}

export function useBootContext(): BootContextValue {
  const ctx = useContext(BootContext);
  if (!ctx) {
    throw new Error('useBootContext must be used within a BootProvider');
  }
  return ctx;
}
