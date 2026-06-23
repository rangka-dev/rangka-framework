import type * as z from 'zod';
import {
  inputPropsSchema,
  selectPropsSchema,
  textareaPropsSchema,
  checkboxPropsSchema,
  datepickerPropsSchema,
  datetimePropsSchema,
  moneyPropsSchema,
  linkPropsSchema,
  manyToManyPropsSchema,
  dynamicLinkPropsSchema,
  attachmentPropsSchema,
  attachmentsPropsSchema,
  jsonPropsSchema,
  codePropsSchema,
  treePropsSchema,
  sequencePropsSchema,
  computedPropsSchema,
} from './input-widgets.js';
import {
  textPropsSchema,
  badgePropsSchema,
  iconPropsSchema,
  imagePropsSchema,
} from './display-widgets.js';
import {
  sectionPropsSchema,
  groupPropsSchema,
  gridPropsSchema,
  splitPropsSchema,
  stackPropsSchema,
  spacerPropsSchema,
  cardPropsSchema,
  dividerPropsSchema,
  scrollAreaPropsSchema,
  columnPropsSchema,
  modalPropsSchema,
  drawerPropsSchema,
} from './layout-widgets.js';
import { buttonPropsSchema, formPropsSchema } from './action-widgets.js';
import {
  tablePropsSchema,
  dataPropsSchema,
  repeatPropsSchema,
  datagridPropsSchema,
} from './data-widgets.js';

export const BUILT_IN_WIDGET_PROP_SCHEMAS: Record<string, z.ZodType | undefined> = {
  // Input widgets
  input: inputPropsSchema,
  select: selectPropsSchema,
  textarea: textareaPropsSchema,
  checkbox: checkboxPropsSchema,
  datepicker: datepickerPropsSchema,
  datetime: datetimePropsSchema,
  money: moneyPropsSchema,
  link: linkPropsSchema,
  'many-to-many': manyToManyPropsSchema,
  'dynamic-link': dynamicLinkPropsSchema,
  attachment: attachmentPropsSchema,
  attachments: attachmentsPropsSchema,
  json: jsonPropsSchema,
  code: codePropsSchema,
  tree: treePropsSchema,
  sequence: sequencePropsSchema,
  computed: computedPropsSchema,

  // Display widgets
  text: textPropsSchema,
  badge: badgePropsSchema,
  icon: iconPropsSchema,
  image: imagePropsSchema,

  // Layout widgets
  section: sectionPropsSchema,
  group: groupPropsSchema,
  grid: gridPropsSchema,
  split: splitPropsSchema,
  stack: stackPropsSchema,
  spacer: spacerPropsSchema,
  card: cardPropsSchema,
  divider: dividerPropsSchema,
  'scroll-area': scrollAreaPropsSchema,
  column: columnPropsSchema,
  modal: modalPropsSchema,
  drawer: drawerPropsSchema,

  // Action widgets
  button: buttonPropsSchema,
  form: formPropsSchema,

  // Data widgets
  table: tablePropsSchema,
  data: dataPropsSchema,
  repeat: repeatPropsSchema,
  datagrid: datagridPropsSchema,
};

export const BUILT_IN_WIDGET_TYPES = Object.keys(BUILT_IN_WIDGET_PROP_SCHEMAS);

export function validateWidgetProps(
  widgetType: string,
  props: unknown,
): { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } } {
  const schema = BUILT_IN_WIDGET_PROP_SCHEMAS[widgetType];
  if (!schema) {
    return { success: true };
  }
  const result = schema.safeParse(props);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: { issues: result.error.issues } };
}

export {
  inputPropsSchema,
  selectPropsSchema,
  textareaPropsSchema,
  checkboxPropsSchema,
  datepickerPropsSchema,
  datetimePropsSchema,
  moneyPropsSchema,
  linkPropsSchema,
  manyToManyPropsSchema,
  dynamicLinkPropsSchema,
  attachmentPropsSchema,
  attachmentsPropsSchema,
  jsonPropsSchema,
  codePropsSchema,
  treePropsSchema,
  sequencePropsSchema,
  computedPropsSchema,
  textPropsSchema,
  badgePropsSchema,
  iconPropsSchema,
  imagePropsSchema,
  sectionPropsSchema,
  groupPropsSchema,
  gridPropsSchema,
  splitPropsSchema,
  stackPropsSchema,
  spacerPropsSchema,
  cardPropsSchema,
  dividerPropsSchema,
  scrollAreaPropsSchema,
  columnPropsSchema,
  modalPropsSchema,
  drawerPropsSchema,
  buttonPropsSchema,
  formPropsSchema,
  tablePropsSchema,
  dataPropsSchema,
  repeatPropsSchema,
  datagridPropsSchema,
};
