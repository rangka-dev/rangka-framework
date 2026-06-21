import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const css = readFileSync(join(root, 'src/index.css'), 'utf-8');
const match = css.match(/@theme inline \{[\s\S]*?\n\}/);

if (match) {
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/theme.css'), match[0]);
}
