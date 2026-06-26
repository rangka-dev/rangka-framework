export type {
  WidgetComponentProps,
  WidgetComponent,
  WidgetRegistry,
  WidgetBind,
  WidgetBindMeta,
  WidgetContext,
  WidgetNode,
  FieldType,
} from './types';

export * from './input';
export * from './display';
export * from './action';
export * from './layout';
export * from './data';
export * from './overlay';

import type { WidgetRegistry } from './types';
import { InputWidget } from './input/input-widget';
import { SelectWidget } from './input/select-widget';
import { CheckboxWidget } from './input/checkbox-widget';
import { TextareaWidget } from './input/textarea-widget';
import { DatePickerWidget } from './input/datepicker-widget';
import { DateTimeWidget } from './input/datetime-widget';
import { MoneyWidget } from './input/money-widget';
import { CodeWidget } from './input/code-widget';
import { JsonWidget } from './input/json-widget';
import { LinkWidget } from './input/link-widget';
import { TreeWidget } from './input/tree-widget';
import { ManyToManyWidget } from './input/many-to-many-widget';
import { DynamicLinkWidget } from './input/dynamic-link-widget';
import { AttachmentWidget } from './input/attachment-widget';
import { AttachmentsWidget } from './input/attachments-widget';
import { TextWidget } from './display/text-widget';
import { BadgeWidget } from './display/badge-widget';
import { ImageWidget } from './display/image-widget';
import { IconWidget } from './display/icon-widget';
import { ComputedWidget } from './display/computed-widget';
import { SequenceWidget } from './display/sequence-widget';
import { ButtonWidget } from './action/button-widget';
import { GroupWidget } from './layout/group-widget';
import { GridWidget } from './layout/grid-widget';
import { SectionWidget } from './layout/section-widget';
import { CardWidget } from './layout/card-widget';
import { StackWidget } from './layout/stack-widget';
import { SplitWidget } from './layout/split-widget';
import { ScrollAreaWidget } from './layout/scroll-area-widget';
import { DividerWidget } from './layout/divider-widget';
import { SpacerWidget } from './layout/spacer-widget';
import { DataWidget } from './data/data-widget';
import { FormWidget } from './data/form-widget';
import { RepeatWidget } from './data/repeat-widget';
import { TableWidget } from './data/table-widget';
import { DatagridWidget } from './data/datagrid-widget';
import { ColumnWidget } from './data/column-widget';
import { ModalWidget } from './overlay/modal-widget';
import { DrawerWidget } from './overlay/drawer-widget';

export const widgetComponents: WidgetRegistry = {
  input: InputWidget,
  select: SelectWidget,
  checkbox: CheckboxWidget,
  textarea: TextareaWidget,
  datepicker: DatePickerWidget,
  datetime: DateTimeWidget,
  money: MoneyWidget,
  code: CodeWidget,
  json: JsonWidget,
  link: LinkWidget,
  tree: TreeWidget,
  'many-to-many': ManyToManyWidget,
  'dynamic-link': DynamicLinkWidget,
  attachment: AttachmentWidget,
  attachments: AttachmentsWidget,
  text: TextWidget,
  badge: BadgeWidget,
  image: ImageWidget,
  icon: IconWidget,
  computed: ComputedWidget,
  sequence: SequenceWidget,
  button: ButtonWidget,
  group: GroupWidget,
  grid: GridWidget,
  section: SectionWidget,
  card: CardWidget,
  stack: StackWidget,
  split: SplitWidget,
  'scroll-area': ScrollAreaWidget,
  divider: DividerWidget,
  spacer: SpacerWidget,
  data: DataWidget,
  form: FormWidget,
  repeat: RepeatWidget,
  table: TableWidget,
  datagrid: DatagridWidget,
  column: ColumnWidget,
  modal: ModalWidget,
  drawer: DrawerWidget,
};
