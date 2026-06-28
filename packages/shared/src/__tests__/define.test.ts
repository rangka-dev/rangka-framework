import { describe, it, expect } from 'vitest';
import {
  defineModel,
  defineApp,
  defineHooks,
  defineExtension,
  defineService,
  definePage,
  defineJob,
  defineFixture,
  defineRoles,
  defineConfig,
} from '../define.js';

describe('define functions', () => {
  it('defineModel passes through config unchanged', () => {
    const config = { name: 'Invoice', fields: {} };
    expect(defineModel(config)).toBe(config);
  });

  it('defineApp passes through config unchanged', () => {
    const config = { name: 'Sales', label: 'Sales' };
    expect(defineApp(config)).toBe(config);
  });

  it('defineHooks adds model to config', () => {
    const config = { validate: () => {} };
    const result = defineHooks('sales.order', config);
    expect(result.model).toBe('sales.order');
    expect(result.validate).toBe(config.validate);
  });

  it('defineExtension adds target to config', () => {
    const config = { actions: {} };
    const result = defineExtension('Invoice', config);
    expect(result.target).toBe('Invoice');
    expect(result.actions).toBe(config.actions);
  });

  it('defineService passes through config unchanged', () => {
    const config = { name: 'EmailService', factory: () => ({ send: () => Promise.resolve() }) };
    const result = defineService(config);
    expect(result).toBe(config);
  });

  it('definePage passes through config unchanged', () => {
    const config = {
      key: 'sales.orders',
      label: 'Sales Orders',
      widgets: [{ type: 'data', source: { model: 'sales.order' }, children: [] }],
    };
    expect(definePage(config)).toBe(config);
  });

  it('defineJob adds name to config', () => {
    const config = { handler: async () => {} };
    const result = defineJob('syncData', config);
    expect(result.name).toBe('syncData');
    expect(result.handler).toBe(config.handler);
  });

  it('defineFixture passes through config unchanged', () => {
    const config = {
      model: 'Currency',
      key: 'code',
      records: [{ code: 'USD', name: 'US Dollar' }],
    };
    expect(defineFixture(config)).toBe(config);
  });

  it('defineRoles passes through config unchanged', () => {
    const config = { admin: { label: 'Admin', models: { '*': { read: true, write: true } } } };
    expect(defineRoles(config)).toBe(config);
  });

  it('defineConfig passes through config unchanged', () => {
    const config = {
      database: { dialect: 'pg' as const, connectionString: 'postgresql://localhost/test' },
      server: { port: 3000 },
    };
    expect(defineConfig(config)).toBe(config);
  });

  describe('identity behavior', () => {
    it('returns the exact same object reference for simple defines', () => {
      const schema = { name: 'Test', fields: {} };
      const result = defineModel(schema);
      expect(result).toBe(schema);
      schema.name = 'Modified';
      expect(result.name).toBe('Modified');
    });
  });
});
