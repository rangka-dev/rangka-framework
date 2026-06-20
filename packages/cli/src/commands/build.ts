import { defineCommand } from 'citty';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as esbuild from 'esbuild';
import { scanCustomUI } from '../ui-scanner.js';

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile custom UI components (views, fields, cards)',
  },
  args: {
    root: {
      type: 'string',
      description: 'Project root directory',
      default: '.',
    },
  },
  async run({ args }) {
    const root = path.resolve(args.root);
    const outDir = path.join(root, '.rangka');

    console.log(`[rangka] Scanning for custom components...`);

    const { components, hasCustomUI } = await scanCustomUI(root);

    if (!hasCustomUI) {
      console.log(`[rangka] No custom components found.`);
      return;
    }

    console.log(`[rangka] Found ${components.length} custom components`);

    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });

    const manifest: Record<string, Record<string, string>> = {
      views: {},
      fields: {},
      cards: {},
    };

    for (const component of components) {
      const hash = createHash(component.filePath);
      const filename = `${component.module}--${path.basename(component.filePath, path.extname(component.filePath))}.${hash}.js`;
      const typeDir = `${component.type}s`;
      const outputPath = path.join(outDir, typeDir, filename);

      await fs.mkdir(path.join(outDir, typeDir), { recursive: true });

      await esbuild.build({
        entryPoints: [component.filePath],
        outfile: outputPath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        external: ['react', 'react-dom', '@rangka/client'],
      });

      manifest[typeDir]![component.key] = `/_rangka/${typeDir}/${filename}`;
    }

    await fs.writeFile(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );

    console.log(`[rangka] Build complete → .rangka/`);
  },
});

function createHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}
