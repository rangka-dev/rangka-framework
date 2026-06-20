import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { StudioConfig } from './protocol.js';

const CONFIG_DIR = path.join(os.homedir(), '.rangka');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function loadConfig(): StudioConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as StudioConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: StudioConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
