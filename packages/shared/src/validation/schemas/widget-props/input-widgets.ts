import * as z from 'zod';

export const inputPropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    readOnly: z.boolean().optional(),
    disabled: z.boolean().optional(),
    error: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();

export const selectPropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    searchable: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const textareaPropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    rows: z.number().optional(),
    disabled: z.boolean().optional(),
    readOnly: z.boolean().optional(),
  })
  .optional();

export const checkboxPropsSchema = z
  .object({
    label: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const datepickerPropsSchema = z
  .object({
    label: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const datetimePropsSchema = z
  .object({
    label: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const moneyPropsSchema = z
  .object({
    label: z.string().optional(),
    currency: z.string().optional(),
    disabled: z.boolean().optional(),
    readOnly: z.boolean().optional(),
  })
  .optional();

export const linkPropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const manyToManyPropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const dynamicLinkPropsSchema = z
  .object({
    label: z.string().optional(),
    modelField: z.string().optional(),
    models: z.array(z.string()).optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const attachmentPropsSchema = z
  .object({
    label: z.string().optional(),
    accept: z.string().optional(),
    maxSize: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const attachmentsPropsSchema = z
  .object({
    label: z.string().optional(),
    accept: z.string().optional(),
    maxSize: z.string().optional(),
    maxCount: z.number().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const jsonPropsSchema = z
  .object({
    label: z.string().optional(),
    rows: z.number().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const codePropsSchema = z
  .object({
    label: z.string().optional(),
    language: z.string().optional(),
    rows: z.number().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const treePropsSchema = z
  .object({
    label: z.string().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .optional();

export const sequencePropsSchema = z
  .object({
    label: z.string().optional(),
  })
  .optional();

export const computedPropsSchema = z
  .object({
    label: z.string().optional(),
    format: z.enum(['text', 'number', 'currency', 'date', 'datetime']).optional(),
  })
  .optional();
