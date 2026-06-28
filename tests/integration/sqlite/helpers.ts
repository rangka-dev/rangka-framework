import * as path from 'node:path';
import { ProjectScanner, boot, MemoryDiscoverySource } from '@rangka/core';
import type { BootResult } from '@rangka/core';

const BASIC_APP_ROOT = path.resolve(__dirname, '../../fixtures/basic-app');

export async function bootSqliteApp(options?: { server?: boolean }): Promise<BootResult> {
  const scanner = new ProjectScanner(BASIC_APP_ROOT);
  const { app, externalApps } = await scanner.scan();

  return boot({
    discoverySource: new MemoryDiscoverySource([]),
    apps: [app, ...externalApps],
    database: {
      dialect: 'sqlite',
      path: ':memory:',
    },
    server: options?.server ? { port: 0 } : undefined,
    worker: { enabled: false },
  });
}
