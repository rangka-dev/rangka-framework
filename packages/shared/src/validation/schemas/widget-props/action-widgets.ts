import * as z from 'zod';

export const buttonPropsSchema = z
  .object({
    label: z.string().optional(),
    variant: z
      .enum(['default', 'primary', 'secondary', 'destructive', 'outline', 'ghost', 'link'])
      .optional(),
    size: z.enum(['sm', 'md', 'lg', 'icon']).optional(),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
  })
  .optional();

export const formPropsSchema = z
  .object({
    submitLabel: z.string().optional(),
    cancelLabel: z.string().optional(),
    showCancel: z.boolean().optional(),
    variant: z.enum(['default', 'inline']).optional(),
  })
  .optional();
