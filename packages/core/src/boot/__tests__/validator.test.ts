import { describe, it, expect } from 'vitest';
import { validateApps, DefinitionValidationError } from '../validator.js';
import type { DiscoveredApp } from '../types.js';

function makeApp(overrides: Partial<DiscoveredApp> = {}): DiscoveredApp {
  return {
    packageInfo: {
      packageName: 'test-app',
      path: '/apps/test',
      rangka: { type: 'app', entrypoint: 'src/index.ts' },
    },
    config: { name: 'test', label: 'Test' },
    schemas: [],
    extensions: [],
    ...overrides,
  };
}

describe('validateApps', () => {
  it('passes with valid definitions', () => {
    const app = makeApp({
      schemas: [
        { module: 'test', schema: { name: 'item', fields: { title: { type: 'string' } } } },
      ],
      modules: [{ name: 'test', label: 'Test Module' }],
    });
    expect(() => validateApps([app])).not.toThrow();
  });

  it('throws DefinitionValidationError for invalid model', () => {
    const app = makeApp({
      schemas: [{ module: 'test', schema: { name: '', fields: {} } as any }],
    });
    expect(() => validateApps([app])).toThrow(DefinitionValidationError);
  });

  it('throws DefinitionValidationError for reserved module name', () => {
    const app = makeApp({
      modules: [{ name: 'core', label: 'Core' }],
    });
    expect(() => validateApps([app])).toThrow(DefinitionValidationError);
  });

  it('throws DefinitionValidationError for invalid page', () => {
    const app = makeApp({
      pages: [
        { module: 'test', page: { key: '', label: 'Bad', type: 'collection', body: [] } as any },
      ],
    });
    expect(() => validateApps([app])).toThrow(DefinitionValidationError);
  });

  it('aggregates multiple errors across definitions', () => {
    const app = makeApp({
      schemas: [
        { module: 'test', schema: { name: '', fields: {} } as any },
        { module: 'test', schema: { name: 'valid', fields: { x: { type: 'invalid' } } } as any },
      ],
      modules: [{ name: 'rangka_bad', label: 'Bad' }],
    });
    try {
      validateApps([app]);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(DefinitionValidationError);
      expect((e as DefinitionValidationError).errors.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('validates hooks structurally', () => {
    const app = makeApp({
      hooks: [{ model: 'test.item', hooks: { validate: () => {}, afterSave: async () => {} } }],
    });
    expect(() => validateApps([app])).not.toThrow();
  });

  it('validates services', () => {
    const app = makeApp({
      services: [{ name: 'test.svc', factory: () => ({}) }],
    });
    expect(() => validateApps([app])).not.toThrow();
  });

  it('validates jobs', () => {
    const app = makeApp({
      jobs: [{ name: 'test.job', config: { handler: async () => {} } }],
    });
    expect(() => validateApps([app])).not.toThrow();
  });

  it('includes file path in error', () => {
    const app = makeApp({
      schemas: [{ module: 'test', schema: { name: '', fields: {} } as any }],
    });
    try {
      validateApps([app]);
    } catch (e) {
      const err = e as DefinitionValidationError;
      expect(err.errors[0].file).toContain('/apps/test');
    }
  });
});
