import type { WidgetNode } from './widget.js';

export interface ActionItem {
  label: string;
  action: string;
  icon?: string;
}

export interface Action {
  type: 'button' | 'menu' | 'toggle-group' | 'separator';
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  action?: string;
  items?: ActionItem[];
}

export interface PageDefinition {
  key: string;
  label: string;
  type: 'collection' | 'record' | 'dashboard';
  path?: string;
  actions?: Action[];
  body: WidgetNode[];
}
