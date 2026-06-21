import * as esbuild from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface DiscoveredWidget {
  module: string;
  key: string;
  basename: string;
  filePath: string;
}

interface BuildResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function buildWidgets(root: string): Promise<BuildResult> {
  try {
    const components = await scanWidgets(root);
    if (components.length === 0) return { success: true, count: 0 };

    const outDir = path.join(root, '.rangka');
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(path.join(outDir, 'widgets'), { recursive: true });

    const manifest: Record<string, string> = {};

    for (const comp of components) {
      const hash = createHash(comp.filePath);
      const filename = `${comp.module}--${comp.basename}.${hash}.js`;
      const outputPath = path.join(outDir, 'widgets', filename);

      await esbuild.build({
        entryPoints: [comp.filePath],
        outfile: outputPath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        external: ['react', 'react-dom', '@rangka/client', 'rangka', '@rangka/shared'],
      });

      manifest[comp.key] = `/_rangka/widgets/${filename}`;
    }

    await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return { success: true, count: components.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}

async function scanWidgets(root: string): Promise<DiscoveredWidget[]> {
  const components: DiscoveredWidget[] = [];
  const modulesDir = path.join(root, 'modules');

  if (!(await dirExists(modulesDir))) return components;

  const modules = await fs.readdir(modulesDir, { withFileTypes: true });

  for (const mod of modules) {
    if (!mod.isDirectory()) continue;

    const widgetsDir = path.join(modulesDir, mod.name, 'widgets');
    if (!(await dirExists(widgetsDir))) continue;

    const entries = await fs.readdir(widgetsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;

      const basename = entry.name.replace(/\.(tsx?|ts)$/, '');
      const kebab = basename.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      const key = `${mod.name}.${kebab}`;

      components.push({
        module: mod.name,
        key,
        basename: kebab,
        filePath: path.join(widgetsDir, entry.name),
      });
    }
  }

  return components;
}

function createHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
