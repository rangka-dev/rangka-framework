import * as path from 'node:path';
import { ProjectScanner } from '@rangka/core';
import { boot } from '@rangka/core';
import type { BootResult } from '@rangka/core';
import { MemoryDiscoverySource } from '@rangka/core';
import { getTestDatabaseConfig } from './db.js';

const BASIC_APP_ROOT = path.resolve(__dirname, '../../fixtures/basic-app');
const ERP_APP_ROOT = path.resolve(__dirname, '../../fixtures/erp-app');

export async function bootFixtureApp(options?: { server?: boolean }): Promise<BootResult> {
  const scanner = new ProjectScanner(BASIC_APP_ROOT);
  const { app } = await scanner.scan();

  const dbConfig = getTestDatabaseConfig();

  return boot({
    discoverySource: new MemoryDiscoverySource([]),
    apps: [app],
    database: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    },
    server: options?.server ? { port: 0 } : undefined,
  });
}

export async function bootErpApp(options?: {
  server?: boolean;
  worker?: { enabled: boolean };
}): Promise<BootResult> {
  const scanner = new ProjectScanner(ERP_APP_ROOT);
  const { app } = await scanner.scan();

  const dbConfig = getTestDatabaseConfig();

  return boot({
    discoverySource: new MemoryDiscoverySource([]),
    apps: [app],
    database: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    },
    server: options?.server ? { port: 0 } : undefined,
    worker: options?.worker ?? { enabled: false },
  });
}
