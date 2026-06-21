import { registerWidget } from '../registry.js';
import { ButtonWidget } from './ButtonWidget.js';
import { InputWidget } from './InputWidget.js';
import { SelectWidget } from './SelectWidget.js';
import { TextWidget } from './TextWidget.js';
import { GroupWidget } from './GroupWidget.js';
import { SectionWidget } from './SectionWidget.js';
import { GridWidget } from './GridWidget.js';
import { DataWidget } from './DataWidget.js';
import { FormWidget } from '../form/FormWidget.js';
import type { WidgetDefinitionMeta } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import type { ComponentType } from 'react';

type WidgetWithMeta = ComponentType<WidgetProps> & {
  widgetMeta: WidgetDefinitionMeta;
};

const builtInWidgets: WidgetWithMeta[] = [
  ButtonWidget as unknown as WidgetWithMeta,
  InputWidget as unknown as WidgetWithMeta,
  SelectWidget as unknown as WidgetWithMeta,
  TextWidget as unknown as WidgetWithMeta,
  GroupWidget as unknown as WidgetWithMeta,
  SectionWidget as unknown as WidgetWithMeta,
  GridWidget as unknown as WidgetWithMeta,
  DataWidget as unknown as WidgetWithMeta,
  FormWidget as unknown as WidgetWithMeta,
];

export function registerBuiltInWidgets(): void {
  for (const widget of builtInWidgets) {
    registerWidget(widget.widgetMeta, widget);
  }
}
