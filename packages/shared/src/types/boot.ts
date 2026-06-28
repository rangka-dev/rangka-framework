import type { ModelPermissions } from './permissions.js';
import type { PageDefinition } from './page.js';
import type { WidgetDefinitionMeta } from './widget.js';

export interface BootUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface BootPermissions {
  models: Record<string, ModelPermissions>;
  pages: string[];
}

export interface NavigationTreeItem {
  page: string;
  label: string;
  icon?: string;
}

export interface NavigationTreeSection {
  section: string;
  items: NavigationTreeItem[];
}

export interface NavigationTree {
  app: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  type?: 'internal' | 'external';
  sections: NavigationTreeSection[];
}

export interface FieldMeta {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  searchable?: boolean;
  options?: readonly string[];
  relationship?: {
    type: 'link' | 'hasMany' | 'children' | 'manyToMany' | 'dynamicLink';
    model?: string;
    foreignKey?: string;
    through?: string;
    modelField?: string;
  };
}

export interface ModelMeta {
  qualifiedName: string;
  label?: string;
  fields: FieldMeta[];
}

export interface BootResponse {
  user: BootUser;
  permissions: BootPermissions;
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
  widgets?: WidgetDefinitionMeta[];
}
