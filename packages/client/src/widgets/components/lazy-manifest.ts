import type { ComponentType } from 'react';
import type { WidgetProps } from '../types.js';
import type { WidgetDefinitionMeta } from '@rangka/shared';

type LazyWidgetModule = {
  default: ComponentType<WidgetProps> & { widgetMeta: WidgetDefinitionMeta };
};

export const lazyWidgets: Record<string, () => Promise<LazyWidgetModule>> = {
  checkbox: () => import('./CheckboxWidget.js') as unknown as Promise<LazyWidgetModule>,
  badge: () => import('./BadgeWidget.js') as unknown as Promise<LazyWidgetModule>,
  icon: () => import('./IconWidget.js') as unknown as Promise<LazyWidgetModule>,
  image: () => import('./ImageWidget.js') as unknown as Promise<LazyWidgetModule>,
  divider: () => import('./DividerWidget.js') as unknown as Promise<LazyWidgetModule>,
  spacer: () => import('./SpacerWidget.js') as unknown as Promise<LazyWidgetModule>,
  split: () => import('./SplitWidget.js') as unknown as Promise<LazyWidgetModule>,
  card: () => import('./CardWidget.js') as unknown as Promise<LazyWidgetModule>,
  'scroll-area': () => import('./ScrollAreaWidget.js') as unknown as Promise<LazyWidgetModule>,
  stack: () => import('./StackWidget.js') as unknown as Promise<LazyWidgetModule>,
  table: () => import('./TableWidget.js') as unknown as Promise<LazyWidgetModule>,
  column: () => import('./ColumnWidget.js') as unknown as Promise<LazyWidgetModule>,
  repeat: () => import('./RepeatWidget.js') as unknown as Promise<LazyWidgetModule>,
  drawer: () => import('./DrawerWidget.js') as unknown as Promise<LazyWidgetModule>,
  modal: () => import('./ModalWidget.js') as unknown as Promise<LazyWidgetModule>,
  textarea: () => import('./TextareaWidget.js') as unknown as Promise<LazyWidgetModule>,
  datepicker: () => import('./DatePickerWidget.js') as unknown as Promise<LazyWidgetModule>,
  datetime: () => import('./DatetimeWidget.js') as unknown as Promise<LazyWidgetModule>,
  money: () => import('./MoneyWidget.js') as unknown as Promise<LazyWidgetModule>,
  link: () => import('./LinkWidget.js') as unknown as Promise<LazyWidgetModule>,
  'many-to-many': () => import('./ManyToManyWidget.js') as unknown as Promise<LazyWidgetModule>,
  'dynamic-link': () => import('./DynamicLinkWidget.js') as unknown as Promise<LazyWidgetModule>,
  attachment: () => import('./AttachmentWidget.js') as unknown as Promise<LazyWidgetModule>,
  attachments: () => import('./AttachmentsWidget.js') as unknown as Promise<LazyWidgetModule>,
  sequence: () => import('./SequenceWidget.js') as unknown as Promise<LazyWidgetModule>,
  computed: () => import('./ComputedWidget.js') as unknown as Promise<LazyWidgetModule>,
  code: () => import('./CodeWidget.js') as unknown as Promise<LazyWidgetModule>,
  json: () => import('./JsonWidget.js') as unknown as Promise<LazyWidgetModule>,
  tree: () => import('./TreeWidget.js') as unknown as Promise<LazyWidgetModule>,
};
