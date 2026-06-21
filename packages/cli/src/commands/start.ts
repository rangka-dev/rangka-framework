import { defineCommand } from 'citty';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import fastifyStatic from '@fastify/static';
import { ProjectScanner, MemoryDiscoverySource, boot } from '@rangka/core';
import type { BootResult } from '@rangka/core';
import { resolveShellDir } from '../resolve-client.js';

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Start the Rangka application',
  },
  args: {
    root: {
      type: 'string',
      description: 'Project root directory',
      default: '.',
    },
    'no-sync': {
      type: 'boolean',
      description: 'Skip automatic database schema sync',
      default: false,
    },
  },
  async run({ args }) {
    const root = path.resolve(args.root);

    console.log(`[rangka] Starting...`);
    console.log(`[rangka] Project root: ${root}`);

    let result: BootResult;

    try {
      const scanner = new ProjectScanner(root);
      const { app, rangkaConfig } = await scanner.scan();
      console.log(`[rangka] Discovered app with ${app.schemas.length} models`);

      const dbConfig = rangkaConfig.database;
      if (!dbConfig) {
        console.error(
          `[rangka] No database config found. Add database settings to rangka.config.ts`,
        );
        process.exit(1);
      }

      const databaseConfig = {
        host: dbConfig.host ?? 'localhost',
        port: dbConfig.port ?? 5432,
        database: dbConfig.database ?? 'rangka',
        user: dbConfig.user ?? 'postgres',
        password: dbConfig.password ?? '',
      };

      console.log(`[rangka] Connecting to database...`);

      const serverPort = rangkaConfig.server?.port ?? 3000;

      result = await boot({
        discoverySource: new MemoryDiscoverySource([]),
        apps: [app],
        database: databaseConfig,
        skipAutoSync: args['no-sync'],
        server: { port: serverPort },
      });

      console.log(`[rangka] Schema synced: ${result.registry.getAllModels().length} models`);

      // Serve pre-built shell from @rangka/client
      const shellDir = resolveShellDir();
      await result.server!.register(fastifyStatic, {
        root: shellDir,
        wildcard: false,
        prefix: '/',
      });

      // Serve custom widget bundles from .rangka/ if they exist
      const rangkaDir = path.join(root, '.rangka');
      if (await dirExists(rangkaDir)) {
        await result.server!.register(fastifyStatic, {
          root: rangkaDir,
          prefix: '/_rangka/',
          decorateReply: false,
        });
        console.log(`[rangka] Serving custom widgets from .rangka/`);
      }

      // SPA fallback — all non-API routes serve index.html
      result.server!.setNotFoundHandler((_req, reply) => {
        return reply.sendFile('index.html');
      });

      await result.server!.listen({ port: serverPort });
      console.log(`[rangka] Listening on http://localhost:${serverPort}`);
    } catch (err: unknown) {
      console.error(`[rangka] Start failed: ${(err as Error).message}`);
      process.exit(1);
    }

    const shutdown = async () => {
      console.log(`\n[rangka] Shutting down...`);
      if (result.server) {
        await result.server.close();
      }
      if (result.db) {
        await result.db.destroy();
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  },
});

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
