import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Size } from './types.js';

export interface DrawerState {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  content?: ReactNode;
  size?: Size;
}

export interface DrawerAPI {
  state: DrawerState;
  openDrawer(config: Omit<DrawerState, 'open'>): void;
  closeDrawer(): void;
}

const DrawerContext = createContext<DrawerAPI | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>({ open: false });

  const openDrawer = useCallback((config: Omit<DrawerState, 'open'>) => {
    setState({ ...config, open: true });
  }, []);

  const closeDrawer = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <DrawerContext.Provider value={{ state, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerAPI {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return ctx;
}
