import { defineCommand } from 'citty';
import * as path from 'node:path';
import { buildWidgets } from '../build-widgets.js';

export const buildCommand = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile custom widgets for the shell to load at runtime',
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

    console.log(`[rangka] Scanning for custom widgets...`);

    const result = await buildWidgets(root);

    if (!result.success) {
      console.error(`[rangka] Build failed: ${result.error}`);
      process.exit(1);
    }

    if (result.count === 0) {
      console.log(`[rangka] No custom widgets found.`);
      return;
    }

    console.log(`[rangka] Found ${result.count} custom widgets`);
    console.log(`[rangka] Build complete → .rangka/`);
  },
});
