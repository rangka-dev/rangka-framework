import { describe, it, expect } from 'vitest';
import { loadSchemas } from '../src/boot/schema-loader.js';
import type { DiscoveredApp } from '../src/boot/types.js';
import { field } from '@rangka/shared';

function makeApp(overrides: Partial<DiscoveredApp> & { name: string }): DiscoveredApp {
  return {
    packageInfo: {
      packageName: `@rangka/${overrides.name}`,
      path: `/fake/${overrides.name}`,
      rangka: { type: 'app', entrypoint: './module.ts' },
    },
    config: { name: overrides.name, label: overrides.name },
    schemas: overrides.schemas ?? [],
    extensions: overrides.extensions ?? [],
  } as DiscoveredApp;
}

describe('loadSchemas', () => {
  it('collects schemas from all apps', () => {
    const apps: DiscoveredApp[] = [
      makeApp({
        name: 'sales',
        schemas: [
          { module: 'sales', schema: { name: 'invoice', fields: { total: field.decimal() } } },
        ],
      }),
    ];

    const result = loadSchemas(apps);

    expect(result.schemas).toHaveLength(1);
    expect(result.schemas[0].app).toBe('sales');
    expect(result.schemas[0].module).toBe('sales');
    expect(result.schemas[0].schema.name).toBe('invoice');
  });

  it('collects extensions from all apps', () => {
    const apps: DiscoveredApp[] = [
      makeApp({
        name: 'project',
        extensions: [{ target: 'sales.customer', config: { fields: { loyalty: field.int() } } }],
      }),
    ];

    const result = loadSchemas(apps);

    expect(result.extensions).toHaveLength(1);
    expect(result.extensions[0].app).toBe('project');
    expect(result.extensions[0].target).toBe('sales.customer');
  });
});
