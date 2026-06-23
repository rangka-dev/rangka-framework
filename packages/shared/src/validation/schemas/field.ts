import * as z from 'zod';

const validationConfigSchema = z.object({
  format: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  message: z.string().optional(),
});

const baseFieldOptionsSchema = z.object({
  required: z.boolean().optional(),
  label: z.string().optional(),
  hidden: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  searchable: z.boolean().optional(),
  default: z.unknown().optional(),
  validation: validationConfigSchema.optional(),
});

const stringFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('string'),
  maxLength: z.number().optional(),
  default: z.string().optional(),
});

const textFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('text'),
  default: z.string().optional(),
});

const intFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('int'),
  default: z.number().optional(),
});

const decimalFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('decimal'),
  precision: z.number().optional(),
  scale: z.number().optional(),
  default: z.number().optional(),
});

const booleanFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('boolean'),
  default: z.boolean().optional(),
});

const dateFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('date'),
  default: z.string().optional(),
});

const datetimeFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('datetime'),
  default: z.string().optional(),
});

const enumFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('enum'),
  options: z.array(z.string()),
  default: z.string().optional(),
});

const jsonFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('json'),
  default: z.unknown().optional(),
});

const linkFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('link'),
  model: z.string(),
  nullable: z.boolean().optional(),
});

const hasManyFieldSchema = z.object({
  type: z.literal('hasMany'),
  model: z.string(),
  foreignKey: z.string(),
});

const childrenFieldSchema = z.object({
  type: z.literal('children'),
  model: z.string(),
  foreignKey: z.string(),
  fields: z.record(z.string(), z.unknown()).optional(),
});

const manyToManyFieldSchema = z.object({
  type: z.literal('manyToMany'),
  model: z.string(),
  through: z.string(),
});

const dynamicLinkFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('dynamicLink'),
  modelField: z.string(),
});

const moneyFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('money'),
});

const codeFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('code'),
  language: z.literal('expression'),
});

const treeFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('tree'),
  parentField: z.string(),
  strategy: z.enum(['materialized_path', 'nested_set', 'closure_table']),
});

const sequenceFieldSchema = z.object({
  type: z.literal('sequence'),
  prefix: z.string().optional(),
  digits: z.number().optional(),
});

const attachmentFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('attachment'),
  accept: z.array(z.string()).optional(),
  maxSize: z.string().optional(),
});

const attachmentsFieldSchema = baseFieldOptionsSchema.extend({
  type: z.literal('attachments'),
  accept: z.array(z.string()).optional(),
  maxSize: z.string().optional(),
  maxCount: z.number().optional(),
});

const computedFieldSchema = z.object({
  type: z.literal('computed'),
  depends: z.array(z.string()),
  compute: z.function(),
});

export const fieldSchema = z.union([
  z.discriminatedUnion('type', [
    stringFieldSchema,
    textFieldSchema,
    intFieldSchema,
    decimalFieldSchema,
    booleanFieldSchema,
    dateFieldSchema,
    datetimeFieldSchema,
    enumFieldSchema,
    jsonFieldSchema,
    linkFieldSchema,
    hasManyFieldSchema,
    manyToManyFieldSchema,
    dynamicLinkFieldSchema,
    moneyFieldSchema,
    codeFieldSchema,
    treeFieldSchema,
    sequenceFieldSchema,
    attachmentFieldSchema,
    attachmentsFieldSchema,
  ]),
  childrenFieldSchema,
  computedFieldSchema,
]);

export type FieldConfig = z.infer<typeof fieldSchema>;
export type ValidationConfig = z.infer<typeof validationConfigSchema>;

export {
  validationConfigSchema,
  baseFieldOptionsSchema,
  stringFieldSchema,
  textFieldSchema,
  intFieldSchema,
  decimalFieldSchema,
  booleanFieldSchema,
  dateFieldSchema,
  datetimeFieldSchema,
  enumFieldSchema,
  jsonFieldSchema,
  linkFieldSchema,
  hasManyFieldSchema,
  childrenFieldSchema,
  manyToManyFieldSchema,
  dynamicLinkFieldSchema,
  moneyFieldSchema,
  codeFieldSchema,
  treeFieldSchema,
  sequenceFieldSchema,
  attachmentFieldSchema,
  attachmentsFieldSchema,
  computedFieldSchema,
};
