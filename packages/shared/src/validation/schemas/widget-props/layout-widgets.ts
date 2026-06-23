import * as z from 'zod';

const paddingEnum = z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional();
const gapEnum = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).optional();

export const sectionPropsSchema = z
  .object({
    label: z.string().optional(),
    collapsible: z.boolean().optional(),
    defaultCollapsed: z.boolean().optional(),
    padding: paddingEnum,
    icon: z.string().optional(),
  })
  .optional();

export const groupPropsSchema = z
  .object({
    direction: z.enum(['row', 'column']).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional(),
    gap: gapEnum,
    wrap: z.boolean().optional(),
    padding: paddingEnum,
    paddingX: paddingEnum,
    paddingY: paddingEnum,
  })
  .optional();

export const gridPropsSchema = z
  .object({
    columns: z.number().optional(),
    gap: gapEnum,
    rowGap: gapEnum,
    colGap: gapEnum,
    autoFlow: z.enum(['row', 'column', 'dense']).optional(),
    responsive: z.record(z.string(), z.number()).optional(),
    padding: paddingEnum,
    paddingX: paddingEnum,
    paddingY: paddingEnum,
  })
  .optional();

export const splitPropsSchema = z
  .object({
    sizes: z.array(z.number()).optional(),
    direction: z.enum(['horizontal', 'vertical']).optional(),
    minSize: z.number().optional(),
    padding: paddingEnum,
  })
  .optional();

export const stackPropsSchema = z
  .object({
    height: z.string().optional(),
    padding: paddingEnum,
  })
  .optional();

export const spacerPropsSchema = z
  .object({
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  })
  .optional();

export const cardPropsSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
    actions: z.array(z.unknown()).optional(),
    footer: z.array(z.unknown()).optional(),
  })
  .optional();

export const dividerPropsSchema = z
  .object({
    margin: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
    marginY: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  })
  .optional();

export const scrollAreaPropsSchema = z
  .object({
    direction: z.enum(['vertical', 'horizontal', 'both']).optional(),
    height: z.string().optional(),
    maxHeight: z.string().optional(),
  })
  .optional();

export const columnPropsSchema = z
  .object({
    label: z.string().optional(),
    width: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
  })
  .optional();

export const modalPropsSchema = z
  .object({
    size: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
    title: z.string().optional(),
    closable: z.boolean().optional(),
  })
  .optional();

export const drawerPropsSchema = z
  .object({
    width: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
    title: z.string().optional(),
    closable: z.boolean().optional(),
  })
  .optional();
