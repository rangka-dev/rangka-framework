import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { NavigationTree } from '@rangka/shared';

const STORAGE_KEY = 'rangka:active-module';

interface ModuleContextValue {
  activeModule: string | null;
  setActiveModule: (name: string) => void;
  clearActiveModule: () => void;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({
  navigation,
  children,
}: {
  navigation: NavigationTree[];
  children: ReactNode;
}) {
  const [activeModule, setActiveModuleState] = useState<string | null>(() => {
    const pathModule = window.location.pathname.split('/').filter(Boolean)[0];
    if (pathModule && navigation.some((n) => n.module === pathModule)) {
      return pathModule;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && navigation.some((n) => n.module === stored)) {
      return stored;
    }
    return null;
  });

  useEffect(() => {
    if (activeModule) {
      localStorage.setItem(STORAGE_KEY, activeModule);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeModule]);

  const setActiveModule = useCallback((name: string) => {
    setActiveModuleState(name);
  }, []);

  const clearActiveModule = useCallback(() => {
    setActiveModuleState(null);
  }, []);

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule, clearActiveModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return ctx;
}
