import * as z from 'zod';
import { widgetNodeSchema, widgetActionSchema } from './widget.js';

const actionItemSchema = z.object({
  label: z.string(),
  action: widgetActionSchema,
  icon: z.string().optional(),
});

const actionSchema = z.object({
  type: z.enum(['button', 'menu', 'toggle-group', 'separator']),
  label: z.string().optional(),
  icon: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
  action: widgetActionSchema.optional(),
  items: z.array(actionItemSchema).optional(),
});

export const pageDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['collection', 'record', 'dashboard']),
  path: z.string().optional(),
  layout: z.enum(['default', 'full']).optional(),
  actions: z.array(actionSchema).optional(),
  body: z.array(widgetNodeSchema).min(1),
});

export type PageDefinition = z.infer<typeof pageDefinitionSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;

export function validatePage(raw: unknown) {
  return pageDefinitionSchema.safeParse(raw);
}

export { actionSchema, actionItemSchema };
