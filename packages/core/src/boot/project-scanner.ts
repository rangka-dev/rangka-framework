import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  AppConfig,
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
  externalApps: DiscoveredApp[];
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
   * Scans the project root and returns the local app plus any external
   * apps found in the apps/ directory (as listed in rangka.config.ts).
   */
  async scan(): Promise<ProjectScanResult> {
    const rangkaConfig = await this.loadRangkaConfig();
    const warnings: ScanWarning[] = [];

    // Scan the local (root) app
    const localApp = await this.scanApp(this.root, warnings);

    // Scan external apps from apps/ directory
    const externalApps: DiscoveredApp[] = [];
    const configuredApps = rangkaConfig.apps ?? [];

    for (const appName of configuredApps) {
      const appDir = path.join(this.root, 'apps', appName);
      if (!(await this.dirExists(appDir))) {
        warnings.push({
          file: `apps/${appName}`,
          message: `App "${appName}" listed in config but not found in apps/ directory`,
        });
        continue;
      }
      const externalApp = await this.scanApp(appDir, warnings);
      externalApps.push(externalApp);
    }

    return { app: localApp, externalApps, rangkaConfig, warnings };
  }

  // ---------- App scanning ----------

  /**
   * Scans a single app directory (root or external) for app.ts and all artifacts.
   */
  private async scanApp(appDir: string, warnings: ScanWarning[]): Promise<DiscoveredApp> {
    const appConfig = await this.loadAppConfig(appDir);
    const appName = appConfig.name;

    const schemas: DiscoveredApp['schemas'] = [];
    const hooks: NonNullable<DiscoveredApp['hooks']> = [];
    const roles: NonNullable<DiscoveredApp['roles']> = [];
    const services: ServiceDefinition[] = [];
    const jobs: Array<{ name: string; config: JobConfig }> = [];
    const fixtures: FixtureDefinition[] = [];
    const pages: Array<{ app: string; page: PageDefinition }> = [];

    // Models
    const models = await this.scanModels(appDir);
    for (const { schema, file } of models) {
      schemas.push({ app: appName, schema, file });
    }

    // Hooks
    hooks.push(...(await this.scanHooksDirectory(appDir, appName)));

    // Roles
    const rolesConfig = await this.scanRoles(appDir);
    if (rolesConfig) {
      roles.push({ config: rolesConfig, app: appName });
    }

    // Services, jobs, fixtures, pages
    services.push(...(await this.scanServices(appDir)));
    jobs.push(...(await this.scanJobs(appDir)));
    fixtures.push(...(await this.scanFixtures(appDir)));

    const { pages: scannedPages, warnings: pageWarnings } = await this.scanPages(appDir, appName);
    pages.push(...scannedPages);
    warnings.push(...pageWarnings);

    // Extensions
    const extensions = await this.scanExtensions(appDir);

    // Page validation
    this.warnAboutPageIssues(pages, schemas);

    const packageInfo: RangkaPackageInfo = {
      packageName: appName,
      path: appDir,
      rangka: { type: 'app', entrypoint: './app.ts' },
    };

    return {
      packageInfo,
      config: appConfig,
      schemas,
      extensions,
      hooks: hooks.length > 0 ? hooks : undefined,
      roles: roles.length > 0 ? roles : undefined,
      jobs: jobs.length > 0 ? jobs : undefined,
      services: services.length > 0 ? services : undefined,
      fixtures: fixtures.length > 0 ? fixtures : undefined,
      pages: pages.length > 0 ? pages : undefined,
    };
  }

  // ---------- Top-level loading ----------

  private async loadRangkaConfig(): Promise<RangkaConfig> {
    const configPath = path.join(this.root, 'rangka.config.ts');
    await this.assertFileExists(configPath, 'No rangka.config.ts found');
    const mod = await this.importFile(configPath);
    return mod.default;
  }

  private async loadAppConfig(appDir: string): Promise<AppConfig> {
    const appFile = path.join(appDir, 'app.ts');
    await this.assertFileExists(appFile, `No app.ts found in ${appDir}`);
    const mod = await this.importFile(appFile);
    return mod.default;
  }

  // ---------- Model scanning ----------

  private async scanModels(appDir: string): Promise<Array<{ schema: ModelConfig; file: string }>> {
    const modelsDir = path.join(appDir, 'models');
    if (!(await this.dirExists(modelsDir))) return [];

    const entries = await fs.readdir(modelsDir, { withFileTypes: true });
    const results: Array<{ schema: ModelConfig; file: string }> = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const mod = await this.importFile(path.join(modelsDir, entry.name));
      if (mod.default) {
        results.push({ schema: mod.default, file: entry.name });
      }
    }

    return results;
  }

  // ---------- Hooks scanning ----------

  private async scanHooksDirectory(
    appDir: string,
    appName: string,
  ): Promise<Array<{ model: string; hooks: HooksConfig; file?: string }>> {
    const hooksDir = path.join(appDir, 'hooks');
    if (!(await this.dirExists(hooksDir))) return [];

    const entries = await fs.readdir(hooksDir, { withFileTypes: true });
    const result: Array<{ model: string; hooks: HooksConfig; file?: string }> = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      try {
        const mod = await this.importFile(path.join(hooksDir, entry.name));
        if (mod.default) {
          const { model, ...hooksConfig } = mod.default;
          const qualifiedModel = model.includes('.') ? model : `${appName}.${model}`;
          result.push({ model: qualifiedModel, hooks: hooksConfig, file: entry.name });
        }
      } catch (err) {
        console.warn(
          `[rangka] Failed to import hook file ${appName}/hooks/${entry.name}: ${(err as Error).message}`,
        );
      }
    }

    return result;
  }

  // ---------- Roles scanning ----------

  private async scanRoles(appDir: string): Promise<RolesConfig | null> {
    const rolesFile = path.join(appDir, 'roles.ts');
    if (!(await this.fileExists(rolesFile))) return null;

    const mod = await this.importFile(rolesFile);
    return mod.default ?? null;
  }

  // ---------- Other artifact scanners ----------

  private async scanServices(
    appDir: string,
  ): Promise<Array<ServiceDefinition & { file?: string }>> {
    const servicesDir = path.join(appDir, 'services');
    const items = await this.scanTsFilesWithFile<ServiceDefinition>(servicesDir);
    return items.map(({ value, file }) => ({ ...value, file }));
  }

  private async scanJobs(
    appDir: string,
  ): Promise<Array<{ name: string; config: JobConfig; file?: string }>> {
    const jobsDir = path.join(appDir, 'jobs');
    const items = await this.scanTsFilesWithFile<{ name: string } & JobConfig>(jobsDir);
    return items.map(({ value: { name, ...config }, file }) => ({ name, config, file }));
  }

  private async scanFixtures(
    appDir: string,
  ): Promise<Array<FixtureDefinition & { file?: string }>> {
    const fixturesDir = path.join(appDir, 'fixtures');
    const items = await this.scanTsFilesWithFile<FixtureDefinition>(fixturesDir);
    return items.map(({ value, file }) => ({ ...value, file }));
  }

  private async scanPages(
    appDir: string,
    appName: string,
  ): Promise<{
    pages: Array<{ app: string; page: PageDefinition; file?: string }>;
    warnings: ScanWarning[];
  }> {
    const pagesDir = path.join(appDir, 'pages');
    if (!(await this.dirExists(pagesDir))) return { pages: [], warnings: [] };

    const entries = await fs.readdir(pagesDir, { withFileTypes: true });
    const pages: Array<{ app: string; page: PageDefinition; file?: string }> = [];
    const warnings: ScanWarning[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const filePath = `${appName}/pages/${entry.name}`;
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

          pages.push({ app: appName, page, file: entry.name });
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

  private async scanExtensions(appDir: string): Promise<DiscoveredApp['extensions']> {
    const extensionsDir = path.join(appDir, 'extensions');
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

  private warnAboutPageIssues(
    pages: Array<{ app: string; page: PageDefinition }>,
    schemas: DiscoveredApp['schemas'],
  ): void {
    if (pages.length === 0) return;

    const knownModels = new Set(schemas.map((s) => `${s.app}.${s.schema.name}`));
    const sourceWarnings = validatePageSources(pages, knownModels);
    const duplicateWarnings = detectDuplicatePageKeys(pages);

    for (const warning of [...sourceWarnings, ...duplicateWarnings]) {
      console.warn(`[rangka] ${warning.pageKey} (${warning.location}): ${warning.message}`);
    }
  }

  // ---------- Filesystem utilities ----------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async importFile(filePath: string): Promise<any> {
    return import(`file://${filePath}?t=${Date.now()}`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  private async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async assertFileExists(filePath: string, message: string): Promise<void> {
    if (!(await this.fileExists(filePath))) {
      throw new Error(`${message}: ${filePath}`);
    }
  }

  private async scanTsFilesWithFile<T>(
    dirPath: string,
  ): Promise<Array<{ value: T; file: string }>> {
    if (!(await this.dirExists(dirPath))) return [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: Array<{ value: T; file: string }> = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const mod = await this.importFile(path.join(dirPath, entry.name));
      if (mod.default) results.push({ value: mod.default, file: entry.name });
    }

    return results;
  }
}
