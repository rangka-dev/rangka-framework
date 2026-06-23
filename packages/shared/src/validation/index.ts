export { fieldSchema, validationConfigSchema, baseFieldOptionsSchema } from './schemas/field.js';

export {
  modelSchema,
  indexConfigSchema,
  scopeConfigSchema,
  validateModel,
} from './schemas/model.js';

export {
  moduleSchema,
  validateModule,
  navigationItemSchema,
  navigationSectionSchema,
  scopeDefinitionSchema,
} from './schemas/module.js';

export {
  widgetActionSchema,
  widgetNodeSchema,
  widgetBindingSchema,
  widgetSourceSchema,
  conditionSchema,
  widgetDefinitionMetaSchema,
  widgetPropSchemaSchema,
} from './schemas/widget.js';

export {
  pageDefinitionSchema,
  validatePage,
  actionSchema,
  actionItemSchema,
} from './schemas/page.js';

export { hooksSchema, validateHooks } from './schemas/hooks.js';

export { serviceSchema, validateService } from './schemas/service.js';

export { jobSchema, validateJob } from './schemas/job.js';

export { fixtureSchema, validateFixture } from './schemas/fixture.js';

export {
  rolesConfigSchema,
  validateRoles,
  modelPermissionsSchema,
  roleConfigSchema,
  fieldPermissionsSchema,
} from './schemas/permissions.js';

export { extensionSchema, validateExtension } from './schemas/extension.js';

export { detectWidgetTypos } from './helpers.js';
export type { TypoWarning } from './helpers.js';

export {
  BUILT_IN_WIDGET_PROP_SCHEMAS,
  BUILT_IN_WIDGET_TYPES,
  validateWidgetProps,
} from './schemas/widget-props/index.js';
