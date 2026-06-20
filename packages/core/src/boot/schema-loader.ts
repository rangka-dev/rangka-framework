import type { ModelConfig, ExtensionConfig } from '@rangka/shared';
import type { DiscoveredApp } from './types.js';

export interface SchemaLoadResult {
  schemas: Array<{ app: string; module: string; schema: ModelConfig }>;
  extensions: Array<{ app: string; target: string; config: ExtensionConfig }>;
}

export function loadSchemas(apps: DiscoveredApp[]): SchemaLoadResult {
  const schemas: SchemaLoadResult['schemas'] = [];
  const extensions: SchemaLoadResult['extensions'] = [];

  for (const app of apps) {
    const appName = app.config.name;

    for (const { module, schema } of app.schemas) {
      schemas.push({ app: appName, module, schema });
    }

    for (const { target, config } of app.extensions ?? []) {
      extensions.push({ app: appName, target, config });
    }
  }

  return { schemas, extensions };
}
