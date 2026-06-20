export interface NavigationItem {
  page: string;
  label: string;
  icon?: string;
}

export interface NavigationSection {
  section: string;
  items: NavigationItem[];
}

export interface ScopeDefinition {
  model: string;
  default: string;
  switchable?: boolean;
}

export interface ModuleConfig {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  type?: 'internal' | 'external';
  depends?: string[];
  scopes?: Record<string, ScopeDefinition>;
  navigation?: NavigationSection[];
}
