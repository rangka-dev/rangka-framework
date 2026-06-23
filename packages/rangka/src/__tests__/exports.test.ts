import { describe, it, expect } from 'vitest';
import * as rangka from '../index.js';

describe('rangka public API exports', () => {
  describe('define* functions', () => {
    it('exports defineModel', () => {
      expect(rangka.defineModel).toBeTypeOf('function');
    });

    it('exports defineModule', () => {
      expect(rangka.defineModule).toBeTypeOf('function');
    });

    it('exports defineHooks', () => {
      expect(rangka.defineHooks).toBeTypeOf('function');
    });

    it('exports defineExtension', () => {
      expect(rangka.defineExtension).toBeTypeOf('function');
    });

    it('exports defineService', () => {
      expect(rangka.defineService).toBeTypeOf('function');
    });

    it('exports definePage', () => {
      expect(rangka.definePage).toBeTypeOf('function');
    });

    it('exports defineJob', () => {
      expect(rangka.defineJob).toBeTypeOf('function');
    });

    it('exports defineFixture', () => {
      expect(rangka.defineFixture).toBeTypeOf('function');
    });

    it('exports defineRoles', () => {
      expect(rangka.defineRoles).toBeTypeOf('function');
    });

    it('exports defineConfig', () => {
      expect(rangka.defineConfig).toBeTypeOf('function');
    });

    it('exports defineWidget', () => {
      expect(rangka.defineWidget).toBeTypeOf('function');
    });
  });

  describe('field helper', () => {
    it('exports field factory', () => {
      expect(rangka.field).toBeTypeOf('object');
    });

    it('field.string', () => {
      expect(rangka.field.string).toBeTypeOf('function');
    });

    it('field.text', () => {
      expect(rangka.field.text).toBeTypeOf('function');
    });

    it('field.int', () => {
      expect(rangka.field.int).toBeTypeOf('function');
    });

    it('field.decimal', () => {
      expect(rangka.field.decimal).toBeTypeOf('function');
    });

    it('field.boolean', () => {
      expect(rangka.field.boolean).toBeTypeOf('function');
    });

    it('field.date', () => {
      expect(rangka.field.date).toBeTypeOf('function');
    });

    it('field.datetime', () => {
      expect(rangka.field.datetime).toBeTypeOf('function');
    });

    it('field.enum', () => {
      expect(rangka.field.enum).toBeTypeOf('function');
    });

    it('field.json', () => {
      expect(rangka.field.json).toBeTypeOf('function');
    });

    it('field.link', () => {
      expect(rangka.field.link).toBeTypeOf('function');
    });

    it('field.hasMany', () => {
      expect(rangka.field.hasMany).toBeTypeOf('function');
    });

    it('field.children', () => {
      expect(rangka.field.children).toBeTypeOf('function');
    });

    it('field.manyToMany', () => {
      expect(rangka.field.manyToMany).toBeTypeOf('function');
    });

    it('field.dynamicLink', () => {
      expect(rangka.field.dynamicLink).toBeTypeOf('function');
    });

    it('field.money', () => {
      expect(rangka.field.money).toBeTypeOf('function');
    });

    it('field.code', () => {
      expect(rangka.field.code).toBeTypeOf('function');
    });

    it('field.tree', () => {
      expect(rangka.field.tree).toBeTypeOf('function');
    });

    it('field.sequence', () => {
      expect(rangka.field.sequence).toBeTypeOf('function');
    });

    it('field.attachment', () => {
      expect(rangka.field.attachment).toBeTypeOf('function');
    });

    it('field.attachments', () => {
      expect(rangka.field.attachments).toBeTypeOf('function');
    });

    it('field.computed', () => {
      expect(rangka.field.computed).toBeTypeOf('function');
    });
  });

  describe('validation schemas', () => {
    it('exports modelSchema', () => {
      expect(rangka.modelSchema).toBeDefined();
    });

    it('exports moduleSchema', () => {
      expect(rangka.moduleSchema).toBeDefined();
    });

    it('exports fieldSchema', () => {
      expect(rangka.fieldSchema).toBeDefined();
    });

    it('exports pageDefinitionSchema', () => {
      expect(rangka.pageDefinitionSchema).toBeDefined();
    });

    it('exports widgetActionSchema', () => {
      expect(rangka.widgetActionSchema).toBeDefined();
    });

    it('exports widgetNodeSchema', () => {
      expect(rangka.widgetNodeSchema).toBeDefined();
    });

    it('exports fixtureSchema', () => {
      expect(rangka.fixtureSchema).toBeDefined();
    });

    it('exports rolesConfigSchema', () => {
      expect(rangka.rolesConfigSchema).toBeDefined();
    });

    it('exports hooksSchema', () => {
      expect(rangka.hooksSchema).toBeDefined();
    });

    it('exports serviceSchema', () => {
      expect(rangka.serviceSchema).toBeDefined();
    });

    it('exports jobSchema', () => {
      expect(rangka.jobSchema).toBeDefined();
    });

    it('exports extensionSchema', () => {
      expect(rangka.extensionSchema).toBeDefined();
    });
  });

  describe('validation functions', () => {
    it('exports validateModel', () => {
      expect(rangka.validateModel).toBeTypeOf('function');
    });

    it('exports validateModule', () => {
      expect(rangka.validateModule).toBeTypeOf('function');
    });

    it('exports validatePage', () => {
      expect(rangka.validatePage).toBeTypeOf('function');
    });

    it('exports validateHooks', () => {
      expect(rangka.validateHooks).toBeTypeOf('function');
    });

    it('exports validateService', () => {
      expect(rangka.validateService).toBeTypeOf('function');
    });

    it('exports validateJob', () => {
      expect(rangka.validateJob).toBeTypeOf('function');
    });

    it('exports validateFixture', () => {
      expect(rangka.validateFixture).toBeTypeOf('function');
    });

    it('exports validateRoles', () => {
      expect(rangka.validateRoles).toBeTypeOf('function');
    });

    it('exports validateExtension', () => {
      expect(rangka.validateExtension).toBeTypeOf('function');
    });
  });

  describe('widget prop schemas', () => {
    it('exports BUILT_IN_WIDGET_PROP_SCHEMAS', () => {
      expect(rangka.BUILT_IN_WIDGET_PROP_SCHEMAS).toBeTypeOf('object');
    });

    it('exports BUILT_IN_WIDGET_TYPES', () => {
      expect(rangka.BUILT_IN_WIDGET_TYPES).toBeInstanceOf(Array);
      expect(rangka.BUILT_IN_WIDGET_TYPES.length).toBe(39);
    });

    it('exports validateWidgetProps', () => {
      expect(rangka.validateWidgetProps).toBeTypeOf('function');
    });

    it('exports detectWidgetTypos', () => {
      expect(rangka.detectWidgetTypos).toBeTypeOf('function');
    });
  });

  describe('error classes', () => {
    it('exports AppError', () => {
      expect(rangka.AppError).toBeTypeOf('function');
    });

    it('exports BadRequestError', () => {
      expect(rangka.BadRequestError).toBeTypeOf('function');
    });

    it('exports NotFoundError', () => {
      expect(rangka.NotFoundError).toBeTypeOf('function');
    });

    it('exports DefinitionValidationError', () => {
      expect(rangka.DefinitionValidationError).toBeTypeOf('function');
    });
  });

  describe('runtime', () => {
    it('exports boot', () => {
      expect(rangka.boot).toBeTypeOf('function');
    });

    it('exports DatabaseClient', () => {
      expect(rangka.DatabaseClient).toBeTypeOf('function');
    });

    it('exports createFrameworkContext', () => {
      expect(rangka.createFrameworkContext).toBeTypeOf('function');
    });
  });

  describe('deprecated APIs are removed', () => {
    it('does not export defineLayout', () => {
      expect((rangka as any).defineLayout).toBeUndefined();
    });

    it('does not export defineApi', () => {
      expect((rangka as any).defineApi).toBeUndefined();
    });

    it('does not export WidgetBuilder', () => {
      expect((rangka as any).WidgetBuilder).toBeUndefined();
    });

    it('does not export PageBuilder', () => {
      expect((rangka as any).PageBuilder).toBeUndefined();
    });
  });
});
