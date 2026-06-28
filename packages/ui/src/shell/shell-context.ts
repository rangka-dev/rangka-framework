import { createContext, useContext } from 'react';

export type ShellContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  railDocked: boolean;
  setRailDocked: (docked: boolean) => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within a Shell.');
  }
  return context;
}
