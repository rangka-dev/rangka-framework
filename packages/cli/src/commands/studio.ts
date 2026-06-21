import { defineCommand } from 'citty';
import * as path from 'node:path';

export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Start Rangka Studio development environment',
  },
  args: {
    root: {
      type: 'string',
      description: 'Project root directory',
      default: '.',
    },
    port: {
      type: 'string',
      description: 'Studio port (UI + WebSocket)',
      default: '4000',
    },
    frameworkPort: {
      type: 'string',
      description: 'Framework preview port',
      default: '3000',
    },
  },
  async run({ args }) {
    let createStudioServer: (config: {
      wsPort: number;
      projectRoot: string;
      frameworkPort: number;
    }) => Promise<unknown>;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studio = await (Function('return import("@rangka/studio-core")')() as Promise<any>);
      createStudioServer = studio.createStudioServer;
    } catch {
      console.error(
        `\n  @rangka/studio-core is not installed.\n` +
          `  Install it as a dev dependency to use the studio command:\n\n` +
          `    pnpm add -D @rangka/studio-core\n`,
      );
      process.exit(1);
    }

    const root = path.resolve(args.root);
    const wsPort = parseInt(args.port, 10);
    const frameworkPort = parseInt(args.frameworkPort, 10);

    console.log(`[studio] Starting Rangka Studio...`);
    console.log(`[studio] Project root: ${root}`);

    await createStudioServer({
      wsPort,
      projectRoot: root,
      frameworkPort,
    });

    process.on('SIGINT', () => process.exit(0));
    process.on('SIGTERM', () => process.exit(0));
  },
});
