import * as esbuild from 'esbuild';
import type { Plugin } from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { scanCustomUI } from './ui-scanner.js';
import { resolveShellDir } from './resolve-client.js';

export interface BuildResult {
  success: boolean;
  count: number;
  error?: string;
}

function globalExternalsPlugin(): Plugin {
  return {
    name: 'global-externals',
    setup(build) {
      build.onResolve({ filter: /^react-dom($|\/)/ }, (args) => ({
        path: args.path,
        namespace: 'global-react-dom',
      }));
      build.onResolve({ filter: /^react\/jsx-runtime$/ }, (args) => ({
        path: args.path,
        namespace: 'global-jsx-runtime',
      }));
      build.onResolve({ filter: /^react($|\/)/ }, (args) => ({
        path: args.path,
        namespace: 'global-react',
      }));
      build.onResolve({ filter: /^@rangka\/client$/ }, (args) => ({
        path: args.path,
        namespace: 'global-rangka-client',
      }));
      build.onLoad({ filter: /.*/, namespace: 'global-react' }, () => ({
        contents: `module.exports = window.__rangka_React;`,
        loader: 'js',
      }));
      build.onLoad({ filter: /.*/, namespace: 'global-react-dom' }, () => ({
        contents: `module.exports = window.__rangka_ReactDOM;`,
        loader: 'js',
      }));
      build.onLoad({ filter: /.*/, namespace: 'global-jsx-runtime' }, () => ({
        contents: `
          var React = window.__rangka_React;
          module.exports = {
            jsx: React.createElement,
            jsxs: React.createElement,
            Fragment: React.Fragment,
          };
        `,
        loader: 'js',
      }));
      build.onLoad({ filter: /.*/, namespace: 'global-rangka-client' }, () => ({
        contents: `module.exports = window.__rangka_client;`,
        loader: 'js',
      }));
    },
  };
}

async function generateWidgetCSS(widgetPath: string, themeBlock: string): Promise<string | null> {
  const inputCSS = [
    '@import "tailwindcss/utilities" source(none);',
    '@import "tailwindcss/theme" source(none);',
    `@source "${widgetPath}";`,
    themeBlock,
  ].join('\n');

  const result = await postcss([tailwindcss()]).process(inputCSS, {
    from: widgetPath,
  });

  // Strip shell semantic token definitions from theme layer to avoid overriding
  // the shell's theme. Keep Tailwind's default palette variables (emerald, etc.)
  const css = result.css
    .replace(/@layer theme\s*\{[\s\S]*?\n\}/g, (match) => {
      // Remove the :root block that redefines shell tokens
      return match.replace(/:root,\s*:host\s*\{[\s\S]*?\}/g, '');
    })
    .replace(/@layer base\s*\{[\s\S]*?\n\}/g, '')
    .trim();
  return css || null;
}

export async function buildWidgets(root: string): Promise<BuildResult> {
  try {
    const { components, hasCustomUI } = await scanCustomUI(root);
    if (!hasCustomUI) return { success: true, count: 0 };

    const outDir = path.join(root, '.rangka');
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(path.join(outDir, 'widgets'), { recursive: true });

    // Extract theme block for Tailwind compilation
    // theme.css is shipped in @rangka/client/dist/ alongside the shell
    let themeBlock = '';
    try {
      const shellDir = resolveShellDir();
      const themePath = path.resolve(shellDir, '../theme.css');
      themeBlock = await fs.readFile(themePath, 'utf-8');
    } catch {
      // No theme available, Tailwind will use defaults
    }

    const manifest: Record<string, string | { js: string; css: string }> = {};

    for (const component of components) {
      const hash = createHash(component.filePath);
      const basename = `${component.app}--${path.basename(component.filePath, path.extname(component.filePath))}.${hash}`;
      const jsFilename = `${basename}.js`;
      const cssFilename = `${basename}.css`;
      const outputPath = path.join(outDir, 'widgets', jsFilename);
      const cssOutputPath = path.join(outDir, 'widgets', cssFilename);

      await esbuild.build({
        entryPoints: [component.filePath],
        outfile: outputPath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        jsx: 'transform',
        banner: { js: 'var React = window.__rangka_React;' },
        nodePaths: [path.join(root, 'node_modules')],
        plugins: [globalExternalsPlugin()],
      });

      // Collect CSS: esbuild may produce CSS from imported .css files
      let cssContent = '';
      if (await fileExists(cssOutputPath)) {
        cssContent = await fs.readFile(cssOutputPath, 'utf-8');
      }

      // Generate Tailwind CSS for this widget's utility classes
      if (themeBlock) {
        const tailwindCss = await generateWidgetCSS(component.filePath, themeBlock);
        if (tailwindCss) {
          cssContent = cssContent ? `${cssContent}\n${tailwindCss}` : tailwindCss;
        }
      }

      // Write merged CSS
      const hasCss = cssContent.length > 0;
      if (hasCss) {
        await fs.writeFile(cssOutputPath, cssContent);
      }

      if (hasCss) {
        manifest[component.key] = {
          js: `/_rangka/widgets/${jsFilename}`,
          css: `/_rangka/widgets/${cssFilename}`,
        };
      } else {
        manifest[component.key] = `/_rangka/widgets/${jsFilename}`;
      }
    }

    await fs.writeFile(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );

    return { success: true, count: components.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}
