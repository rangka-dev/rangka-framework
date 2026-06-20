import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DiscoverySource, RangkaPackageInfo } from './types.js';

// Scans node_modules for packages that declare themselves as rangka apps in package.json.
export class NodeModulesDiscoverySource implements DiscoverySource {
  constructor(private readonly projectRoot: string) {}

  async findRangkaPackages(): Promise<RangkaPackageInfo[]> {
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    const packageDirs = await this.listPackageDirs(nodeModulesPath);

    const results: RangkaPackageInfo[] = [];
    for (const { dirPath, packageName } of packageDirs) {
      const info = await this.tryReadRangkaConfig(dirPath, packageName);
      if (info) results.push(info);
    }
    return results;
  }

  // Lists all package directories, expanding scoped (@org/pkg) folders.
  private async listPackageDirs(
    nodeModulesPath: string,
  ): Promise<{ dirPath: string; packageName: string }[]> {
    const entries = await fs.readdir(nodeModulesPath, { withFileTypes: true });
    const dirs: { dirPath: string; packageName: string }[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      if (entry.name.startsWith('@')) {
        const scopePath = path.join(nodeModulesPath, entry.name);
        const scopedEntries = await fs.readdir(scopePath, { withFileTypes: true });
        for (const scoped of scopedEntries) {
          if (!scoped.isDirectory()) continue;
          dirs.push({
            dirPath: path.join(scopePath, scoped.name),
            packageName: `${entry.name}/${scoped.name}`,
          });
        }
      } else {
        dirs.push({
          dirPath: path.join(nodeModulesPath, entry.name),
          packageName: entry.name,
        });
      }
    }

    return dirs;
  }

  // Reads package.json and returns info only if it declares rangka.type === 'app'.
  private async tryReadRangkaConfig(
    dirPath: string,
    packageName: string,
  ): Promise<RangkaPackageInfo | null> {
    try {
      const content = await fs.readFile(path.join(dirPath, 'package.json'), 'utf-8');
      const pkgJson = JSON.parse(content);

      if (pkgJson.rangka?.type === 'app') {
        return {
          packageName,
          path: dirPath,
          rangka: {
            type: pkgJson.rangka.type,
            entrypoint: pkgJson.rangka.entrypoint || './app.ts',
          },
        };
      }
    } catch {
      // package.json doesn't exist or is unreadable — skip
    }
    return null;
  }
}

// In-memory discovery source for testing.
export class MemoryDiscoverySource implements DiscoverySource {
  constructor(private readonly packages: RangkaPackageInfo[]) {}

  async findRangkaPackages(): Promise<RangkaPackageInfo[]> {
    return this.packages;
  }
}
