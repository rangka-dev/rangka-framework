import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  ModuleConfig,
  ModelConfig,
  HooksConfig,
  ExtensionConfig,
  JobConfig,
  PageDefinition,
  RolesConfig,
  RangkaConfig,
} from '@rangka/shared';
import type { DiscoveredApp, RangkaPackageInfo } from './types.js';
import type { ServiceDefinition } from '../services/types.js';
import type { FixtureDefinition } from '../fixtures/types.js';
import { validatePageSources, detectDuplicatePageKeys } from './page-utils.js';

// ---------- Public types ----------

export interface ProjectScanResult {
  app: DiscoveredApp;
  rangkaConfig: RangkaConfig;
  warnings: ScanWarning[];
}

export interface ScanWarning {
  file: string;
  message: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// ---------- Scanner ----------

export class ProjectScanner {
  constructor(private readonly root: string) {}

  /**
   * Scans the project root and returns a fully-assembled DiscoveredApp
   * along with the rangka.config.ts settings.
   */
  async scan(): Promise<ProjectScanResult> {
    const rangkaConfig = await this.loadRangkaConfig();
    const modules = await this.scanModules();

    // Collect artifacts from every module
    const schemas: DiscoveredApp['schemas'] = [];
    const hooks: NonNullable<DiscoveredApp['hooks']> = [];
    const roles: NonNullable<DiscoveredApp['roles']> = [];
    const services: ServiceDefinition[] = [];
    const jobs: Array<{ name: string; config: JobConfig }> = [];
    const fixtures: FixtureDefinition[] = [];
    const pages: Array<{ module: string; page: PageDefinition }> = [];
    const warnings: ScanWarning[] = [];

    for (const moduleConfig of modules) {
      await this.collectModuleArtifacts(moduleConfig, {
        schemas,
        hooks,
        roles,
        services,
        jobs,
        fixtures,
        pages,
        warnings,
      });
    }

    const extensions = await this.scanExtensions();

    this.warnAboutPageIssues(pages, schemas);

    const app = this.buildDiscoveredApp(modules, {
      schemas,
      extensions,
      modules,
      hooks,
      roles,
      jobs,
      services,
      fixtures,
      pages,
    });

    return { app, rangkaConfig, warnings };
  }

  // ---------- Top-level loading ----------

  /** Loads rangka.config.ts from the project root. */
  private async loadRangkaConfig(): Promise<RangkaConfig> {
    const configPath = path.join(this.root, 'rangka.config.ts');
    await this.assertFileExists(configPath, 'No rangka.config.ts found');
    const mod = await this.importFile(configPath);
    return mod.default;
  }

  /** Discovers all sub-modules under the modules/ directory. */
  private async scanModules(): Promise<ModuleConfig[]> {
    const modulesDir = path.join(this.root, 'modules');
    if (!(await this.dirExists(modulesDir))) return [];

    const entries = await fs.readdir(modulesDir, { withFileTypes: true });
    const modules: ModuleConfig[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const moduleFile = path.join(modulesDir, entry.name, 'module.ts');
      if (!(await this.fileExists(moduleFile))) continue;

      const mod = await this.importFile(moduleFile);
      modules.push(mod.default);
    }

    return modules;
  }

  // ---------- Per-module artifact collection ----------

  /**
   * Scans a single module's subdirectories and pushes discovered
   * artifacts into the corresponding accumulator arrays.
   */
  private async collectModuleArtifacts(
    moduleConfig: ModuleConfig,
    accumulators: {
      schemas: DiscoveredApp['schemas'];
      hooks: NonNullable<DiscoveredApp['hooks']>;
      roles: NonNullable<DiscoveredApp['roles']>;
      services: ServiceDefinition[];
      jobs: Array<{ name: string; config: JobConfig }>;
      fixtures: FixtureDefinition[];
      pages: Array<{ module: string; page: PageDefinition }>;
      warnings: ScanWarning[];
    },
  ): Promise<void> {
    const moduleName = moduleConfig.name;

    // Models — flat .ts files in models/
    const models = await this.scanModels(moduleName);
    for (const schema of models) {
      accumulators.schemas.push({ module: moduleName, schema });
    }

    // Hooks — separate hooks/ directory
    accumulators.hooks.push(...(await this.scanHooksDirectory(moduleName)));

    // Roles — per-module roles.ts file
    const roles = await this.scanRoles(moduleName);
    if (roles) {
      accumulators.roles.push({ config: roles, app: moduleName });
    }

    // Services, jobs, fixtures, pages
    accumulators.services.push(...(await this.scanServices(moduleName)));
    accumulators.jobs.push(...(await this.scanJobs(moduleName)));
    accumulators.fixtures.push(...(await this.scanFixtures(moduleName)));

    const { pages: scannedPages, warnings: pageWarnings } = await this.scanPages(moduleName);
    accumulators.pages.push(...scannedPages);
    accumulators.warnings.push(...pageWarnings);
  }

  // ---------- Model scanning (flat files) ----------

  /** Scans .ts files in modules/<name>/models/ for model definitions. */
  private async scanModels(moduleName: string): Promise<ModelConfig[]> {
    const modelsDir = path.join(this.root, 'modules', moduleName, 'models');
    return this.scanTsFilesWithDefault<ModelConfig>(modelsDir);
  }

  // ---------- Hooks scanning (separate directory) ----------

  /**
   * Scans .ts files in modules/<name>/hooks/ for hook definitions.
   * Each file exports defineHooks(model, config) which returns { model, ...config }.
   */
  private async scanHooksDirectory(
    moduleName: string,
  ): Promise<Array<{ model: string; hooks: HooksConfig }>> {
    const hooksDir = path.join(this.root, 'modules', moduleName, 'hooks');
    if (!(await this.dirExists(hooksDir))) return [];

    const entries = await fs.readdir(hooksDir, { withFileTypes: true });
    const result: Array<{ model: string; hooks: HooksConfig }> = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      try {
        const mod = await this.importFile(path.join(hooksDir, entry.name));
        if (mod.default) {
          const { model, ...hooksConfig } = mod.default;
          const qualifiedModel = model.includes('.') ? model : `${moduleName}.${model}`;
          result.push({ model: qualifiedModel, hooks: hooksConfig });
        }
      } catch (err) {
        console.warn(
          `[rangka] Failed to import hook file modules/${moduleName}/hooks/${entry.name}: ${(err as Error).message}`,
        );
      }
    }

    return result;
  }

  // ---------- Roles scanning (per-module file) ----------

  /** Loads modules/<name>/roles.ts if it exists. Returns the RolesConfig or null. */
  private async scanRoles(moduleName: string): Promise<RolesConfig | null> {
    const rolesFile = path.join(this.root, 'modules', moduleName, 'roles.ts');
    if (!(await this.fileExists(rolesFile))) return null;

    const mod = await this.importFile(rolesFile);
    return mod.default ?? null;
  }

  // ---------- Other artifact scanners ----------

  /** Scans .ts files in modules/<name>/services/ for service definitions. */
  private async scanServices(moduleName: string): Promise<ServiceDefinition[]> {
    const servicesDir = path.join(this.root, 'modules', moduleName, 'services');
    return this.scanTsFilesWithDefault<ServiceDefinition>(servicesDir);
  }

  /** Scans .ts files in modules/<name>/jobs/ for job definitions. */
  private async scanJobs(moduleName: string): Promise<Array<{ name: string; config: JobConfig }>> {
    const jobsDir = path.join(this.root, 'modules', moduleName, 'jobs');
    const rawJobs = await this.scanTsFilesWithDefault<{ name: string } & JobConfig>(jobsDir);
    return rawJobs.map(({ name, ...config }) => ({ name, config }));
  }

  /** Scans .ts files in modules/<name>/fixtures/ for fixture definitions. */
  private async scanFixtures(moduleName: string): Promise<FixtureDefinition[]> {
    const fixturesDir = path.join(this.root, 'modules', moduleName, 'fixtures');
    return this.scanTsFilesWithDefault<FixtureDefinition>(fixturesDir);
  }

  /** Scans .ts files in modules/<name>/pages/ for page definitions (with error handling). */
  private async scanPages(
    moduleName: string,
  ): Promise<{ pages: Array<{ module: string; page: PageDefinition }>; warnings: ScanWarning[] }> {
    const pagesDir = path.join(this.root, 'modules', moduleName, 'pages');
    if (!(await this.dirExists(pagesDir))) return { pages: [], warnings: [] };

    const entries = await fs.readdir(pagesDir, { withFileTypes: true });
    const pages: Array<{ module: string; page: PageDefinition }> = [];
    const warnings: ScanWarning[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const filePath = `modules/${moduleName}/pages/${entry.name}`;
      try {
        const mod = await this.importFile(path.join(pagesDir, entry.name));
        if (mod.default) {
          const page = mod.default;
          if (!page.widgets && page.body) {
            console.warn(
              `[rangka] Page "${page.key ?? entry.name}" uses deprecated "body" field. Rename it to "widgets".`,
            );
            page.widgets = page.body;
          }
          if (!page.widgets) {
            const msg = `Missing "widgets" array — skipping`;
            warnings.push({ file: filePath, message: msg });
            console.warn(`[rangka] ${filePath}: ${msg}`);
            continue;
          }

          const issues = this.validatePageDefinition(page, filePath);
          if (issues.length > 0) {
            for (const issue of issues) {
              warnings.push({ file: filePath, message: issue });
              console.warn(`[rangka] ${filePath}: ${issue}`);
            }
          }

          pages.push({ module: moduleName, page });
        }
      } catch (err) {
        const msg = `Failed to import: ${(err as Error).message}`;
        warnings.push({ file: filePath, message: msg });
        console.warn(`[rangka] ${filePath}: ${msg}`);
      }
    }

    return { pages, warnings };
  }

  private validatePageDefinition(page: Record<string, unknown>, _filePath: string): string[] {
    const issues: string[] = [];

    if (page.label !== undefined && typeof page.label !== 'string') {
      issues.push(`"label" must be a string, got ${typeof page.label}`);
    }

    if (page.key !== undefined && typeof page.key !== 'string') {
      issues.push(`"key" must be a string, got ${typeof page.key}`);
    }

    if (Array.isArray(page.widgets)) {
      const nullCount = page.widgets.filter((w: unknown) => w == null).length;
      if (nullCount > 0) {
        issues.push(
          `"widgets" contains ${nullCount} null/undefined ${nullCount === 1 ? 'entry' : 'entries'} (removed)`,
        );
        page.widgets = page.widgets.filter((w: unknown) => w != null);
      }
    }

    return issues;
  }

  /** Scans extensions/ directory for extension definitions. */
  private async scanExtensions(): Promise<DiscoveredApp['extensions']> {
    const extensionsDir = path.join(this.root, 'extensions');
    if (!(await this.dirExists(extensionsDir))) return [];

    const entries = await fs.readdir(extensionsDir, { withFileTypes: true });
    const extensions: DiscoveredApp['extensions'] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const mod = await this.importFile(path.join(extensionsDir, entry.name));
      if (mod.default) {
        const { target, ...config } = mod.default;
        extensions.push({ target, config: config as ExtensionConfig });
      }
    }

    return extensions;
  }

  // ---------- Validation ----------

  /** Emits console warnings for invalid page sources or duplicate page keys. */
  private warnAboutPageIssues(
    pages: Array<{ module: string; page: PageDefinition }>,
    schemas: DiscoveredApp['schemas'],
  ): void {
    if (pages.length === 0) return;

    const knownModels = new Set(schemas.map((s) => `${s.module}.${s.schema.name}`));
    const sourceWarnings = validatePageSources(pages, knownModels);
    const duplicateWarnings = detectDuplicatePageKeys(pages);

    for (const warning of [...sourceWarnings, ...duplicateWarnings]) {
      console.warn(`[rangka] ${warning.pageKey} (${warning.location}): ${warning.message}`);
    }
  }

  // ---------- Assembly ----------

  /** Builds the final DiscoveredApp object, omitting empty optional arrays. */
  private buildDiscoveredApp(
    modules: ModuleConfig[],
    parts: {
      schemas: DiscoveredApp['schemas'];
      extensions: DiscoveredApp['extensions'];
      modules: ModuleConfig[];
      hooks: NonNullable<DiscoveredApp['hooks']>;
      roles: NonNullable<DiscoveredApp['roles']>;
      jobs: Array<{ name: string; config: JobConfig }>;
      services: ServiceDefinition[];
      fixtures: FixtureDefinition[];
      pages: Array<{ module: string; page: PageDefinition }>;
    },
  ): DiscoveredApp {
    const appName = modules[0]?.name ?? 'app';

    const packageInfo: RangkaPackageInfo = {
      packageName: appName,
      path: this.root,
      rangka: { type: 'app', entrypoint: './rangka.config.ts' },
    };

    const config: ModuleConfig = {
      name: appName,
      label: appName,
    };

    return {
      packageInfo,
      config,
      schemas: parts.schemas,
      extensions: parts.extensions,
      modules: parts.modules.length > 0 ? parts.modules : undefined,
      hooks: parts.hooks.length > 0 ? parts.hooks : undefined,
      roles: parts.roles.length > 0 ? parts.roles : undefined,
      jobs: parts.jobs.length > 0 ? parts.jobs : undefined,
      services: parts.services.length > 0 ? parts.services : undefined,
      fixtures: parts.fixtures.length > 0 ? parts.fixtures : undefined,
      pages: parts.pages.length > 0 ? parts.pages : undefined,
    };
  }

  // ---------- Filesystem utilities ----------

  /** Dynamically imports a TypeScript file by path. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async importFile(filePath: string): Promise<any> {
    return import(`file://${filePath}?t=${Date.now()}`);
  }

  /** Returns true if the path exists and is a regular file. */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /** Returns true if the path exists and is a directory. */
  private async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /** Throws if the file does not exist. */
  private async assertFileExists(filePath: string, message: string): Promise<void> {
    if (!(await this.fileExists(filePath))) {
      throw new Error(`${message}: ${filePath}`);
    }
  }

  /**
   * Generic helper: reads all .ts files in a directory and collects
   * their default exports into an array. Skips files without a default export.
   * Returns an empty array if the directory doesn't exist.
   */
  private async scanTsFilesWithDefault<T>(dirPath: string): Promise<T[]> {
    if (!(await this.dirExists(dirPath))) return [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: T[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const mod = await this.importFile(path.join(dirPath, entry.name));
      if (mod.default) results.push(mod.default);
    }

    return results;
  }
}
