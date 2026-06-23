import {
  validateModel,
  validateModule,
  validatePage,
  validateHooks,
  validateService,
  validateJob,
  validateFixture,
  validateRoles,
  validateExtension,
  widgetDefinitionMetaSchema,
} from '@rangka/shared';
import type { DiscoveredApp } from './types.js';

export interface DefinitionError {
  app: string;
  file: string;
  defType: string;
  name: string;
  issues: Array<{ path: string; message: string }>;
}

export class DefinitionValidationError extends Error {
  constructor(public readonly errors: DefinitionError[]) {
    const summary = formatErrors(errors);
    super(summary);
    this.name = 'DefinitionValidationError';
  }
}

function formatPath(path: PropertyKey[]): string {
  return path
    .map((p, i) =>
      typeof p === 'number'
        ? `[${p}]`
        : typeof p === 'symbol'
          ? `[${String(p)}]`
          : i === 0
            ? p
            : `.${p}`,
    )
    .join('');
}

function formatErrors(errors: DefinitionError[]): string {
  const lines = [`Boot failed: ${errors.length} invalid definition(s)\n`];

  for (const err of errors) {
    lines.push(`  ${err.file}`);
    lines.push(`    [${err.defType}] "${err.name}"`);
    for (const issue of err.issues) {
      lines.push(`      → ${issue.path}: ${issue.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function validateApps(apps: DiscoveredApp[]): void {
  const errors: DefinitionError[] = [];

  for (const app of apps) {
    const basePath = app.packageInfo.path;

    // Validate module configs
    if (app.modules) {
      for (const mod of app.modules) {
        const result = validateModule(mod);
        if (!result.success) {
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${mod.name ?? 'unknown'}/module.ts`,
            defType: 'module',
            name: mod.name ?? '(unknown)',
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate model schemas
    for (const { module, schema, file } of app.schemas) {
      const result = validateModel(schema);
      if (!result.success) {
        const filename = file ?? `${schema.name ?? 'unknown'}.ts`;
        errors.push({
          app: app.config.name,
          file: `${basePath}/modules/${module}/models/${filename}`,
          defType: 'model',
          name: schema.name ? `${module}.${schema.name}` : '(unknown)',
          issues: result.error.issues.map((i) => ({
            path: formatPath(i.path),
            message: i.message,
          })),
        });
      }
    }

    // Validate extensions
    for (const { target, config } of app.extensions) {
      const result = validateExtension(config);
      if (!result.success) {
        errors.push({
          app: app.config.name,
          file: `${basePath}/extensions/${target}.ts`,
          defType: 'extension',
          name: target,
          issues: result.error.issues.map((i) => ({
            path: formatPath(i.path),
            message: i.message,
          })),
        });
      }
    }

    // Validate pages
    if (app.pages) {
      for (const { module, page, file } of app.pages) {
        const result = validatePage(page);
        if (!result.success) {
          const filename = file ?? `${page.key?.split('.').pop() ?? 'unknown'}.ts`;
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${module}/pages/${filename}`,
            defType: 'page',
            name: page.key ?? '(unknown)',
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate hooks
    if (app.hooks) {
      for (const { model, hooks, file } of app.hooks) {
        const result = validateHooks(hooks);
        if (!result.success) {
          const hookModule = model.includes('.') ? model.split('.')[0] : app.config.name;
          const filename = file ?? `${model}.ts`;
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${hookModule}/hooks/${filename}`,
            defType: 'hooks',
            name: model,
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate roles
    if (app.roles) {
      for (const { config, app: roleSrc } of app.roles) {
        const result = validateRoles(config);
        if (!result.success) {
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${roleSrc}/roles.ts`,
            defType: 'roles',
            name: roleSrc,
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate jobs
    if (app.jobs) {
      for (const { name, config, file } of app.jobs) {
        const result = validateJob({ name, ...config });
        if (!result.success) {
          const filename = file ?? `${name}.ts`;
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${app.config.name}/jobs/${filename}`,
            defType: 'job',
            name,
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate services
    if (app.services) {
      for (const svc of app.services) {
        const result = validateService(svc);
        if (!result.success) {
          const filename = svc.file ?? `${svc.name ?? 'unknown'}.ts`;
          const svcModule = svc.name?.split('.')[0] ?? app.config.name;
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${svcModule}/services/${filename}`,
            defType: 'service',
            name: svc.name ?? '(unknown)',
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate fixtures
    if (app.fixtures) {
      for (const fixture of app.fixtures) {
        const result = validateFixture(fixture);
        if (!result.success) {
          const filename = fixture.file ?? `${fixture.model ?? 'unknown'}.ts`;
          const fixModule = fixture.model?.split('.')[0] ?? app.config.name;
          errors.push({
            app: app.config.name,
            file: `${basePath}/modules/${fixModule}/fixtures/${filename}`,
            defType: 'fixture',
            name: fixture.model ?? '(unknown)',
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }

    // Validate widget definitions
    if (app.widgets) {
      for (const widget of app.widgets) {
        const result = widgetDefinitionMetaSchema.safeParse(widget);
        if (!result.success) {
          errors.push({
            app: app.config.name,
            file: `${basePath}/widgets/${widget.name ?? 'unknown'}.ts`,
            defType: 'widget',
            name: widget.name ?? '(unknown)',
            issues: result.error.issues.map((i) => ({
              path: formatPath(i.path),
              message: i.message,
            })),
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new DefinitionValidationError(errors);
  }
}
