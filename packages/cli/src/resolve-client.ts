import * as path from 'node:path';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';

export function resolveShellDir(): string {
  const require = createRequire(import.meta.url);

  try {
    const lookupPaths = require.resolve.paths('@rangka/client') ?? [];

    for (const base of lookupPaths) {
      const candidate = path.join(base, '@rangka', 'client', 'dist', 'shell');
      if (fs.existsSync(path.join(candidate, 'index.html'))) {
        return fs.realpathSync(candidate);
      }
    }
  } catch {
    /* lookup failed, fall through to error */
  }

  console.error('[rangka] Missing shell build. Run `pnpm build` in @rangka/client first.');
  process.exit(1);
}
