/**
 * SQLite PRAGMA configuration for optimal dev/Studio usage.
 * Applied once when the connection is established.
 */
export interface SqlitePragmaConfig {
  foreignKeys?: boolean;
  journalMode?: 'wal' | 'delete' | 'truncate' | 'memory' | 'off';
  busyTimeout?: number;
  synchronous?: 'off' | 'normal' | 'full' | 'extra';
}

const defaults: Required<SqlitePragmaConfig> = {
  foreignKeys: true,
  journalMode: 'wal',
  busyTimeout: 5000,
  synchronous: 'normal',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configurePragmas(db: any, config?: SqlitePragmaConfig): void {
  const opts = { ...defaults, ...config };

  if (opts.foreignKeys) {
    db.pragma('foreign_keys = ON');
  }
  db.pragma(`journal_mode = ${opts.journalMode.toUpperCase()}`);
  db.pragma(`busy_timeout = ${opts.busyTimeout}`);
  db.pragma(`synchronous = ${opts.synchronous.toUpperCase()}`);
}
