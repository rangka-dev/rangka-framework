#!/usr/bin/env node
import * as p from '@clack/prompts';
import { scaffold } from './scaffold.js';

async function main() {
  const dirArg = process.argv[2];

  p.intro('Create Rangka App');

  const options = await p.group(
    {
      name: () =>
        p.text({
          message: 'Project name',
          initialValue: dirArg || 'my-rangka-app',
          validate: (value) => {
            if (!value.trim()) return 'Project name is required';
            if (!/^[a-z0-9-_]+$/.test(value))
              return 'Use lowercase letters, numbers, hyphens, or underscores';
          },
        }),
    },
    { onCancel: () => process.exit(0) },
  );

  const targetDir = dirArg || options.name;

  await scaffold({ name: options.name, dir: targetDir });

  p.outro(`Done! Next steps:\n\n  cd ${targetDir}\n  pnpm install\n  pnpm dev`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
