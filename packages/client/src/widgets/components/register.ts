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
import { CheckboxWidget } from './CheckboxWidget.js';
import { BadgeWidget } from './BadgeWidget.js';
import { IconWidget } from './IconWidget.js';
import { ImageWidget } from './ImageWidget.js';
import { DividerWidget } from './DividerWidget.js';
import { SpacerWidget } from './SpacerWidget.js';
import { SplitWidget } from './SplitWidget.js';
import { CardWidget } from './CardWidget.js';
import { ScrollAreaWidget } from './ScrollAreaWidget.js';
import { StackWidget } from './StackWidget.js';
import { TableWidget } from './TableWidget.js';
import { ColumnWidget } from './ColumnWidget.js';
import { RepeatWidget } from './RepeatWidget.js';
import { DrawerWidget } from './DrawerWidget.js';
import { ModalWidget } from './ModalWidget.js';
import { TextareaWidget } from './TextareaWidget.js';
import { DatePickerWidget } from './DatePickerWidget.js';
import { DatetimeWidget } from './DatetimeWidget.js';
import { MoneyWidget } from './MoneyWidget.js';
import { LinkWidget } from './LinkWidget.js';
import { ManyToManyWidget } from './ManyToManyWidget.js';
import { DynamicLinkWidget } from './DynamicLinkWidget.js';
import { AttachmentWidget } from './AttachmentWidget.js';
import { AttachmentsWidget } from './AttachmentsWidget.js';
import { SequenceWidget } from './SequenceWidget.js';
import { ComputedWidget } from './ComputedWidget.js';
import { CodeWidget } from './CodeWidget.js';
import { JsonWidget } from './JsonWidget.js';
import { TreeWidget } from './TreeWidget.js';
import { DatagridWidget } from './datagrid/index.js';
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
  CheckboxWidget as unknown as WidgetWithMeta,
  BadgeWidget as unknown as WidgetWithMeta,
  IconWidget as unknown as WidgetWithMeta,
  ImageWidget as unknown as WidgetWithMeta,
  DividerWidget as unknown as WidgetWithMeta,
  SpacerWidget as unknown as WidgetWithMeta,
  SplitWidget as unknown as WidgetWithMeta,
  CardWidget as unknown as WidgetWithMeta,
  ScrollAreaWidget as unknown as WidgetWithMeta,
  StackWidget as unknown as WidgetWithMeta,
  TableWidget as unknown as WidgetWithMeta,
  ColumnWidget as unknown as WidgetWithMeta,
  RepeatWidget as unknown as WidgetWithMeta,
  DrawerWidget as unknown as WidgetWithMeta,
  ModalWidget as unknown as WidgetWithMeta,
  TextareaWidget as unknown as WidgetWithMeta,
  DatePickerWidget as unknown as WidgetWithMeta,
  DatetimeWidget as unknown as WidgetWithMeta,
  MoneyWidget as unknown as WidgetWithMeta,
  LinkWidget as unknown as WidgetWithMeta,
  ManyToManyWidget as unknown as WidgetWithMeta,
  DynamicLinkWidget as unknown as WidgetWithMeta,
  AttachmentWidget as unknown as WidgetWithMeta,
  AttachmentsWidget as unknown as WidgetWithMeta,
  SequenceWidget as unknown as WidgetWithMeta,
  ComputedWidget as unknown as WidgetWithMeta,
  CodeWidget as unknown as WidgetWithMeta,
  JsonWidget as unknown as WidgetWithMeta,
  TreeWidget as unknown as WidgetWithMeta,
  DatagridWidget as unknown as WidgetWithMeta,
];

export function registerBuiltInWidgets(): void {
  for (const widget of builtInWidgets) {
    registerWidget(widget.widgetMeta, widget);
  }
}
