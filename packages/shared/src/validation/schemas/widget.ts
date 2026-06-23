import * as z from 'zod';

export const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'in', 'notIn', 'empty', 'notEmpty', 'gt', 'lt', 'gte', 'lte']),
  value: z.unknown().optional(),
});

export const widgetBindingSchema = z.object({
  field: z.string().optional(),
  expression: z.string().optional(),
  id: z.string().optional(),
});

export const widgetSourceSchema = z.object({
  model: z.string(),
  id: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  limit: z.number().optional(),
});

// --- Widget Actions (discriminated union) ---

const setValueActionSchema = z.object({
  type: z.literal('setValue'),
  field: z.string(),
  value: z.unknown(),
});

const clearValueActionSchema = z.object({
  type: z.literal('clearValue'),
  field: z.string(),
});

const setValuesActionSchema = z.object({
  type: z.literal('setValues'),
  values: z.record(z.string(), z.unknown()),
});

const fetchOptionsActionSchema = z.object({
  type: z.literal('fetchOptions'),
  field: z.string(),
  depends: z.array(z.string()),
});

const refreshSourceActionSchema = z.object({
  type: z.literal('refreshSource'),
});

const validateActionSchema = z.object({
  type: z.literal('validate'),
  fields: z.array(z.string()).optional(),
});

const navigateActionSchema = z.object({
  type: z.literal('navigate'),
  path: z.string(),
});

const focusActionSchema = z.object({
  type: z.literal('focus'),
  field: z.string(),
});

const addRowActionSchema = z.object({
  type: z.literal('addRow'),
  field: z.string(),
});

const removeRowActionSchema = z.object({
  type: z.literal('removeRow'),
  field: z.string(),
});

const duplicateRowActionSchema = z.object({
  type: z.literal('duplicateRow'),
  field: z.string(),
});

const modelCreateActionSchema = z.object({
  type: z.literal('model.create'),
  model: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const modelUpdateActionSchema = z.object({
  type: z.literal('model.update'),
  model: z.string().optional(),
  id: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
});

const modelDeleteActionSchema = z.object({
  type: z.literal('model.delete'),
  model: z.string().optional(),
  id: z.string().optional(),
});

const modelFetchActionSchema = z.object({
  type: z.literal('model.fetch'),
  model: z.string(),
  id: z.string(),
  into: z.string(),
});

const modelListActionSchema = z.object({
  type: z.literal('model.list'),
  model: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
  into: z.string(),
});

const formSubmitActionSchema = z.object({
  type: z.literal('form.submit'),
});

const formResetActionSchema = z.object({
  type: z.literal('form.reset'),
});

const baseActionSchemas = [
  setValueActionSchema,
  clearValueActionSchema,
  setValuesActionSchema,
  fetchOptionsActionSchema,
  refreshSourceActionSchema,
  validateActionSchema,
  navigateActionSchema,
  focusActionSchema,
  addRowActionSchema,
  removeRowActionSchema,
  duplicateRowActionSchema,
  modelCreateActionSchema,
  modelUpdateActionSchema,
  modelDeleteActionSchema,
  modelFetchActionSchema,
  modelListActionSchema,
  formSubmitActionSchema,
  formResetActionSchema,
] as const;

// Service action references widgetActionSchema recursively
const serviceActionSchema = z.object({
  type: z.literal('service'),
  name: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
  context: z.string().optional(),
  onSuccess: z.lazy(() => widgetActionSchema).optional(),
  onError: z.lazy(() => widgetActionSchema).optional(),
});

const sequenceActionSchema = z.object({
  type: z.literal('sequence'),
  actions: z.lazy(() => z.array(widgetActionSchema)),
});

const conditionalActionSchema = z.object({
  type: z.literal('conditional'),
  condition: conditionSchema,
  then: z.lazy(() => widgetActionSchema),
  else: z.lazy(() => widgetActionSchema).optional(),
});

export const widgetActionSchema: z.ZodType = z.union([
  z.discriminatedUnion('type', [...baseActionSchemas]),
  serviceActionSchema,
  sequenceActionSchema,
  conditionalActionSchema,
]);

export type WidgetAction = z.infer<typeof widgetActionSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type WidgetBinding = z.infer<typeof widgetBindingSchema>;
export type WidgetSource = z.infer<typeof widgetSourceSchema>;

// --- Widget Node (recursive) ---

export const widgetNodeSchema: z.ZodType = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
  bind: widgetBindingSchema.optional(),
  source: widgetSourceSchema.optional(),
  visible: z.union([conditionSchema, z.array(conditionSchema)]).optional(),
  on: z.record(z.string(), z.union([widgetActionSchema, z.array(widgetActionSchema)])).optional(),
  children: z.lazy(() => z.array(widgetNodeSchema)).optional(),
});

export type WidgetNode = z.infer<typeof widgetNodeSchema>;

// --- Widget Definition Meta ---

export const widgetPropSchemaSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'enum', 'object', 'array']),
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  options: z.array(z.string()).optional(),
});

export const widgetDefinitionMetaSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(['input', 'display', 'layout', 'action', 'data']),
  schema: z.record(z.string(), widgetPropSchemaSchema),
  binding: z.enum(['none', 'field', 'expression', 'record', 'model']),
  triggers: z.array(z.string()),
  container: z.boolean(),
  accepts: z.array(z.string()).optional(),
});

export type WidgetDefinitionMeta = z.infer<typeof widgetDefinitionMetaSchema>;
export type WidgetPropSchema = z.infer<typeof widgetPropSchemaSchema>;
