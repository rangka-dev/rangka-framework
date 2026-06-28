import * as path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { ServerMessage } from './protocol.js';

export type FileChangeHandler = (msg: ServerMessage) => void;

export interface FileWatcherConfig {
  projectRoot: string;
  onChange: FileChangeHandler;
  onError: (error: string) => void;
  onReady?: () => void;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private config: FileWatcherConfig;

  constructor(config: FileWatcherConfig) {
    this.config = config;
  }

  start(): void {
    const modulesDir = path.join(this.config.projectRoot);

    this.watcher = watch(modulesDir, {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**'],
      persistent: true,
    });

    this.watcher.on('add', (filePath) => this.handleChange(filePath, 'create'));
    this.watcher.on('change', (filePath) => this.handleChange(filePath, 'update'));
    this.watcher.on('unlink', (filePath) => this.handleChange(filePath, 'delete'));

    this.watcher.on('error', (err) => {
      this.config.onError(err instanceof Error ? err.message : String(err));
    });

    if (this.config.onReady) {
      this.watcher.on('ready', this.config.onReady);
    }
  }

  private handleChange(filePath: string, action: 'create' | 'update' | 'delete'): void {
    const relativePath = path.relative(this.config.projectRoot, filePath);

    this.config.onChange({
      type: 'file.changed',
      path: relativePath,
      action,
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}
