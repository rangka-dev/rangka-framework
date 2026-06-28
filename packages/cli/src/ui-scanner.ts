import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface DiscoveredComponent {
  type: 'widget';
  app: string;
  key: string;
  filePath: string;
}

export interface ScanResult {
  components: DiscoveredComponent[];
  hasCustomUI: boolean;
}

export async function scanCustomUI(root: string): Promise<ScanResult> {
  const components: DiscoveredComponent[] = [];

  // Scan root widgets/ directory
  const rootAppName = await resolveAppName(root);
  const rootWidgets = await scanWidgetsDir(path.join(root, 'widgets'), rootAppName);
  components.push(...rootWidgets);

  // Scan apps/*/widgets/ directories
  const appsDir = path.join(root, 'apps');
  if (await dirExists(appsDir)) {
    const apps = await fs.readdir(appsDir, { withFileTypes: true });
    for (const app of apps) {
      if (!app.isDirectory()) continue;
      const appDir = path.join(appsDir, app.name);
      const widgets = await scanWidgetsDir(path.join(appDir, 'widgets'), app.name);
      components.push(...widgets);
    }
  }

  return { components, hasCustomUI: components.length > 0 };
}

async function scanWidgetsDir(dir: string, appName: string): Promise<DiscoveredComponent[]> {
  const components: DiscoveredComponent[] = [];

  if (!(await dirExists(dir))) return components;

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;

    const basename = entry.name.replace(/\.(tsx?|ts)$/, '');
    const key = toRegistryKey(appName, basename);

    components.push({
      type: 'widget',
      app: appName,
      key,
      filePath: path.join(dir, entry.name),
    });
  }

  return components;
}

async function resolveAppName(root: string): Promise<string> {
  try {
    const appFile = path.join(root, 'app.ts');
    const mod = await import(`file://${appFile}?t=${Date.now()}`);
    return mod.default?.name ?? 'app';
  } catch {
    return 'app';
  }
}

function toRegistryKey(appName: string, basename: string): string {
  const kebab = basename.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `${appName}.${kebab}`;
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
