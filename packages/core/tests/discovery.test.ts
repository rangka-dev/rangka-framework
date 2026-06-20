import { describe, it, expect } from 'vitest';
import { NodeModulesDiscoverySource, MemoryDiscoverySource } from '../src/boot/discovery.js';
import type { RangkaPackageInfo } from '../src/boot/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('MemoryDiscoverySource', () => {
  it('returns configured packages', async () => {
    const packages: RangkaPackageInfo[] = [
      {
        packageName: '@rangka/sales',
        path: '/fake/node_modules/@rangka/sales',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
      {
        packageName: 'rangka-custom',
        path: '/fake/node_modules/rangka-custom',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
    ];

    const source = new MemoryDiscoverySource(packages);
    const result = await source.findRangkaPackages();

    expect(result).toEqual(packages);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no packages configured', async () => {
    const source = new MemoryDiscoverySource([]);
    const result = await source.findRangkaPackages();
    expect(result).toEqual([]);
  });
});

describe('NodeModulesDiscoverySource', () => {
  let tmpDir: string;

  async function setupFakeNodeModules(packages: Record<string, object>) {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rangka-test-'));
    const nodeModules = path.join(tmpDir, 'node_modules');
    await fs.mkdir(nodeModules, { recursive: true });

    for (const [name, pkgJson] of Object.entries(packages)) {
      const pkgDir = path.join(nodeModules, name);
      await fs.mkdir(pkgDir, { recursive: true });
      await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkgJson));
    }

    return tmpDir;
  }

  it('discovers packages with rangka field', async () => {
    const root = await setupFakeNodeModules({
      'my-app': {
        name: 'my-app',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
    });

    const source = new NodeModulesDiscoverySource(root);
    const result = await source.findRangkaPackages();

    expect(result).toHaveLength(1);
    expect(result[0].packageName).toBe('my-app');
    expect(result[0].rangka.type).toBe('app');
    expect(result[0].rangka.entrypoint).toBe('./app.ts');
  });

  it('ignores packages without rangka field', async () => {
    const root = await setupFakeNodeModules({
      lodash: { name: 'lodash', version: '4.0.0' },
      'my-app': {
        name: 'my-app',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
    });

    const source = new NodeModulesDiscoverySource(root);
    const result = await source.findRangkaPackages();

    expect(result).toHaveLength(1);
    expect(result[0].packageName).toBe('my-app');
  });

  it('discovers scoped packages', async () => {
    const root = await setupFakeNodeModules({
      '@rangka/sales': {
        name: '@rangka/sales',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
      '@rangka/accounting': {
        name: '@rangka/accounting',
        rangka: { type: 'app', entrypoint: './dist/app.js' },
      },
    });

    const source = new NodeModulesDiscoverySource(root);
    const result = await source.findRangkaPackages();

    expect(result).toHaveLength(2);
    const names = result.map((r) => r.packageName).sort();
    expect(names).toEqual(['@rangka/accounting', '@rangka/sales']);
  });

  it('discovers both scoped and unscoped packages', async () => {
    const root = await setupFakeNodeModules({
      '@rangka/sales': {
        name: '@rangka/sales',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
      'rangka-custom-app': {
        name: 'rangka-custom-app',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
    });

    const source = new NodeModulesDiscoverySource(root);
    const result = await source.findRangkaPackages();

    expect(result).toHaveLength(2);
    const names = result.map((r) => r.packageName).sort();
    expect(names).toEqual(['@rangka/sales', 'rangka-custom-app']);
  });
});
