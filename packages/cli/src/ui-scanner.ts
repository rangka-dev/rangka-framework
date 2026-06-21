import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface DiscoveredComponent {
  type: 'widget';
  module: string;
  key: string;
  filePath: string;
}

export interface ScanResult {
  components: DiscoveredComponent[];
  hasCustomUI: boolean;
}

export async function scanCustomUI(root: string): Promise<ScanResult> {
  const components: DiscoveredComponent[] = [];
  const modulesDir = path.join(root, 'modules');

  if (!(await dirExists(modulesDir))) {
    return { components, hasCustomUI: false };
  }

  const modules = await fs.readdir(modulesDir, { withFileTypes: true });

  for (const mod of modules) {
    if (!mod.isDirectory()) continue;

    const moduleDir = path.join(modulesDir, mod.name);
    const widgets = await scanComponentDir(moduleDir, 'widgets', mod.name);

    components.push(...widgets);
  }

  return { components, hasCustomUI: components.length > 0 };
}

async function scanComponentDir(
  moduleDir: string,
  subdir: string,
  moduleName: string,
): Promise<DiscoveredComponent[]> {
  const components: DiscoveredComponent[] = [];
  const dir = path.join(moduleDir, subdir);

  if (!(await dirExists(dir))) return components;

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;

    const basename = entry.name.replace(/\.(tsx?|ts)$/, '');
    const key = toRegistryKey(moduleName, basename);

    components.push({
      type: 'widget',
      module: moduleName,
      key,
      filePath: path.join(dir, entry.name),
    });
  }

  return components;
}

function toRegistryKey(moduleName: string, basename: string): string {
  const kebab = basename.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `${moduleName}.${kebab}`;
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
