import type { WidgetAction, WidgetNode } from './widget.js';
import type { Condition } from '../validation/schemas/widget.js';

export interface ActionItem {
  label: string;
  action: WidgetAction;
  icon?: string;
}

export interface Action {
  type: 'button' | 'menu' | 'toggle-group' | 'separator';
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  action?: WidgetAction;
  visible?: Condition | Condition[];
  items?: ActionItem[];
}

export interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  layout?: 'default' | 'full';
  actions?: Action[];
  widgets: WidgetNode[];
}
