import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { NavigationTree } from '@rangka/shared';

const STORAGE_KEY = 'rangka:active-app';

interface AppContextValue {
  activeApp: string | null;
  setActiveApp: (name: string) => void;
  clearActiveApp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  navigation,
  children,
}: {
  navigation: NavigationTree[];
  children: ReactNode;
}) {
  const [activeApp, setActiveAppState] = useState<string | null>(() => {
    const pathApp = window.location.pathname.split('/').filter(Boolean)[0];
    if (pathApp && navigation.some((n) => n.app === pathApp)) {
      return pathApp;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && navigation.some((n) => n.app === stored)) {
      return stored;
    }
    return null;
  });

  useEffect(() => {
    if (activeApp) {
      localStorage.setItem(STORAGE_KEY, activeApp);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeApp]);

  const setActiveApp = useCallback((name: string) => {
    setActiveAppState(name);
  }, []);

  const clearActiveApp = useCallback(() => {
    setActiveAppState(null);
  }, []);

  return (
    <AppContext.Provider value={{ activeApp, setActiveApp, clearActiveApp }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
