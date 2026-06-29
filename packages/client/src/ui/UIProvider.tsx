import { createContext, useContext, type ReactNode } from 'react';
import type { UIKit, WidgetProps, ShellComponents } from '@rangka/shared';
import type { ComponentType } from 'react';

const UIContext = createContext<UIKit | null>(null);

export function UIProvider({ kit, children }: { kit: UIKit; children: ReactNode }) {
  return <UIContext.Provider value={kit}>{children}</UIContext.Provider>;
}

export function useUIKit(): UIKit {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUIKit must be used within a UIProvider');
  }
  return ctx;
}

export function useWidgetComponent(type: string): ComponentType<WidgetProps> | undefined {
  return useContext(UIContext)?.widgets[type];
}

export function useShellComponents(): ShellComponents {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useShellComponents must be used within a UIProvider');
  }
  return ctx.shell;
}
