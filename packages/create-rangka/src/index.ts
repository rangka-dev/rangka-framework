#!/usr/bin/env node
import * as p from '@clack/prompts';
import { scaffold } from './scaffold.js';

function detectPackageManager(): string {
  const ua = process.env.npm_config_user_agent;
  if (!ua) return 'npm';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  return 'npm';
}

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
  const pm = detectPackageManager();
  const run = pm === 'npm' ? 'npm run' : pm;

  await scaffold({ name: options.name, dir: targetDir });

  p.outro(
    `Done! Next steps:\n\n  cd ${targetDir}\n  ${pm} install\n  ${run} start        # start the app (SQLite, no setup needed)\n  ${run} studio       # open the AI studio`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
