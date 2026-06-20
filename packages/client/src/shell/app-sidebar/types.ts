import type { ReactNode } from 'react';

export interface AppSidebarModule {
  name: string;
  label: string;
  icon?: ReactNode;
}

export interface AppSidebarNavItem {
  title: string;
  url: string;
}

export interface AppSidebarNavSection {
  title: string;
  icon?: ReactNode;
  items: AppSidebarNavItem[];
}

export interface AppSidebarUser {
  name: string;
  email: string;
  avatar?: string;
}

export interface AppSidebarProps {
  modules: AppSidebarModule[];
  activeModule?: string;
  onModuleSwitch: (name: string) => void;
  onAllModules?: () => void;
  onSearch?: () => void;
  navigation: AppSidebarNavSection[];
  currentPath: string;
  onNavigate: (url: string) => void;
  user?: AppSidebarUser;
  onLogout?: () => void;
  onPreferences?: () => void;
}
