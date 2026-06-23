import * as z from 'zod';

export const textPropsSchema = z
  .object({
    style: z.enum(['heading', 'subheading', 'body', 'caption', 'code', 'muted']).optional(),
  })
  .optional();

export const badgePropsSchema = z
  .object({
    variant: z.enum(['default', 'secondary', 'destructive', 'outline']).optional(),
    color: z
      .enum(['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])
      .optional(),
    colorMap: z.record(z.string(), z.string()).optional(),
  })
  .optional();

export const iconPropsSchema = z
  .object({
    name: z.string().optional(),
    size: z.number().optional(),
    color: z.string().optional(),
  })
  .optional();

export const imagePropsSchema = z
  .object({
    src: z.string().optional(),
    alt: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  })
  .optional();
