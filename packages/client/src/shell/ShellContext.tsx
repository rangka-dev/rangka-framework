import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useNavigate as useRouterNavigate } from '../router/hooks.js';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ShellAPI {
  toast(message: string, type?: ToastType): void;
  confirm(message: string): Promise<boolean>;
  navigate(path: string): void;
}

const ShellContext = createContext<ShellAPI | null>(null);

export function ShellAPIProvider({ children }: { children: ReactNode }) {
  const navigate = useRouterNavigate();

  const api = useMemo(
    (): ShellAPI => ({
      toast(message: string, type: ToastType = 'info') {
        document.dispatchEvent(new CustomEvent('rangka:toast', { detail: { message, type } }));
      },
      confirm(message: string): Promise<boolean> {
        return new Promise((resolve) => {
          document.dispatchEvent(
            new CustomEvent('rangka:confirm', { detail: { message, resolve } }),
          );
        });
      },
      navigate(path: string) {
        navigate(path);
      },
    }),
    [navigate],
  );

  return <ShellContext.Provider value={api}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellAPI {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error('useShell must be used within a ShellAPIProvider');
  }
  return ctx;
}
