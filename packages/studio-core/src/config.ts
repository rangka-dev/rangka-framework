import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { StudioConfig, ProviderSettings } from './protocol.js';

const CONFIG_DIR = path.join(os.homedir(), '.rangka');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface OldStudioConfig {
  provider: string;
  apiKey: string;
  model?: string;
  selectedModels?: string[];
  baseUrl?: string;
}

function isOldFormat(raw: unknown): raw is OldStudioConfig {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    'provider' in raw &&
    'apiKey' in raw &&
    !('activeProvider' in raw)
  );
}

export function migrateConfig(raw: unknown): StudioConfig {
  if (!raw || typeof raw !== 'object') {
    return { activeProvider: 'anthropic', providers: {} };
  }

  if (isOldFormat(raw)) {
    const settings: ProviderSettings = {
      apiKey: raw.apiKey,
      ...(raw.model ? { model: raw.model } : {}),
      ...(raw.selectedModels ? { selectedModels: raw.selectedModels } : {}),
      ...(raw.baseUrl ? { baseUrl: raw.baseUrl } : {}),
    };

    return {
      activeProvider: raw.provider,
      providers: {
        [raw.provider]: settings,
      },
    };
  }

  // Already new format
  if ('activeProvider' in raw && 'providers' in raw) {
    return raw as StudioConfig;
  }

  return { activeProvider: 'anthropic', providers: {} };
}

export function loadConfig(): StudioConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const config = migrateConfig(raw);

    // Auto-migrate: write back if format changed
    if (isOldFormat(raw)) {
      saveConfig(config);
    }

    return config;
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
