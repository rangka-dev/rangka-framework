import type { ComponentType, ReactNode } from 'react';
import type { NavigationTree } from './boot.js';
import type { Action } from './page.js';
import type { WidgetAction, WidgetNode } from './widget.js';

// --- Widget contract ---

export interface WidgetProps {
  props: Record<string, unknown>;
  bind: {
    value: unknown;
    setValue?: (val: unknown) => void;
    meta?: {
      type: string;
      label: string;
      required: boolean;
      options?: unknown[];
      readOnly: boolean;
    };
    error?: string;
    id?: string;
  };
  on: Record<string, (...args: unknown[]) => void>;
  context: {
    record: Record<string, unknown>;
    model: string;
    mode: 'view' | 'edit';
    index?: number;
  };
  childNodes?: WidgetNode[];
  children?: ReactNode;
}

export type WidgetComponentMap = Record<string, ComponentType<WidgetProps>>;

// --- Shell contract ---

export interface ShellLayoutProps {
  children: ReactNode;
  navigation: NavigationTree[];
  user?: { id: string; name: string; email: string };
  activeApp: string | null;
  breadcrumbs: { label: string; path?: string }[];
  currentPath: string;
  pageActions?: Action[];
  onAction?: (action: WidgetAction) => void;
  onNavigate: (path: string) => void;
  onAppSwitch: (app: string) => void;
  onAllApps: () => void;
  onLogout: () => void;
  onSearch: () => void;
}

export interface PageOutletProps {
  pageKey: string;
  layout?: 'default' | 'full';
  actions?: Action[];
  onAction?: (action: WidgetAction) => void;
  children: ReactNode;
}

export interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onDismiss: () => void;
}

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ModuleSelectorProps {
  apps: { name: string; label: string; icon?: string; color?: string }[];
  onSelect: (app: string) => void;
}

export interface ShellComponents {
  Layout: ComponentType<ShellLayoutProps>;
  PageOutlet: ComponentType<PageOutletProps>;
  Toast: ComponentType<ToastProps>;
  ConfirmDialog: ComponentType<ConfirmDialogProps>;
  NotFound: ComponentType<object>;
  ModuleSelector: ComponentType<ModuleSelectorProps>;
}

// --- UIKit ---

export interface UIKit {
  widgets: WidgetComponentMap;
  shell: ShellComponents;
}
