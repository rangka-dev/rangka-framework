export type { ModuleConfig } from '../validation/schemas/module.js';

// These sub-types are inferred from Zod schemas
import type * as z from 'zod';
import type {
  navigationItemSchema,
  navigationSectionSchema,
  scopeDefinitionSchema,
} from '../validation/schemas/module.js';

export type NavigationItem = z.infer<typeof navigationItemSchema>;
export type NavigationSection = z.infer<typeof navigationSectionSchema>;
export type ScopeDefinition = z.infer<typeof scopeDefinitionSchema>;
