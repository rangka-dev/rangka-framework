import * as z from 'zod';

export const tablePropsSchema = z
  .object({
    variant: z.enum(['default', 'compact']).optional(),
    selectable: z.boolean().optional(),
    bordered: z.boolean().optional(),
    striped: z.boolean().optional(),
    pageSize: z.number().optional(),
    emptyText: z.string().optional(),
  })
  .optional();

export const dataPropsSchema = z
  .object({
    placeholder: z.string().optional(),
    pageSize: z.number().optional(),
  })
  .optional();

export const repeatPropsSchema = z
  .object({
    layout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
    columns: z.number().optional(),
    gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).optional(),
  })
  .optional();

export const datagridPropsSchema = z
  .object({
    pageSize: z.number().optional(),
    maxHeight: z.number().optional(),
    rowHeight: z.enum(['compact', 'default', 'comfortable']).optional(),
    editable: z.boolean().optional(),
    resizable: z.boolean().optional(),
    reorderable: z.boolean().optional(),
    selectable: z.boolean().optional(),
    addRow: z.boolean().optional(),
    emptyText: z.string().optional(),
  })
  .optional();
