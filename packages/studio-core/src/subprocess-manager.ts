import { fork, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import pg from 'pg';
import { configurePragmas } from '@rangka/core';
import type {
  ChildMessage,
  ParentMessage,
  ChildPhase,
  RuntimeStatus,
  SerializedDdlOperation,
  ChildStatusSnapshot,
  IntrospectType,
  DatabaseConfig,
  ScanWarning,
} from './ipc-protocol.js';

export interface SubprocessManagerConfig {
  projectRoot: string;
  frameworkPort?: number;
  bootTimeout?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class SubprocessManager extends EventEmitter {
  private config: SubprocessManagerConfig;
  private child: ChildProcess | null = null;
  private phase: ChildPhase = 'stopped';
  private sessionToken: string | null = null;
  private serverPort: number | null = null;
  private dbConfig: DatabaseConfig | null = null;
  private queryDb: Kysely<unknown> | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private bootResolve: ((value: void) => void) | null = null;
  private bootReject: ((error: Error) => void) | null = null;
  private lastStatus: RuntimeStatus | null = null;
  private lastPendingOps: SerializedDdlOperation[] = [];
  private lastWarnings: ScanWarning[] = [];
  private starting = false;
  private intentionalKill = false;

  constructor(config: SubprocessManagerConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.starting || this.child) {
      throw new Error('Subprocess already starting or running');
    }
    this.starting = true;
    this.intentionalKill = false;

    const childPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'child-process.js');

    this.phase = 'stopped';
    this.sessionToken = null;
    this.serverPort = null;
    this.lastPendingOps = [];

    this.child = fork(childPath, [], {
      env: {
        ...process.env,
        RANGKA_PROJECT_ROOT: this.config.projectRoot,
        RANGKA_FRAMEWORK_PORT: String(this.config.frameworkPort ?? 3000),
      },
      stdio: ['pipe', 'inherit', 'inherit', 'ipc'],
    });

    this.child.on('message', (msg: ChildMessage) => this.handleMessage(msg));
    this.child.on('exit', (code, signal) => this.handleExit(code, signal));
    this.child.on('error', (err) => {
      this.emit('error', err.message, this.phase);
    });

    const timeout = this.config.bootTimeout ?? 30000;

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.bootResolve = null;
        this.bootReject = null;
        this.starting = false;
        this.kill().catch(() => {});
        reject(new Error(`Boot timeout after ${timeout}ms`));
      }, timeout);

      this.bootResolve = () => {
        clearTimeout(timer);
        this.starting = false;
        resolve();
      };
      this.bootReject = (error: Error) => {
        clearTimeout(timer);
        this.starting = false;
        reject(error);
      };
    });
  }

  async restart(): Promise<void> {
    await this.kill();
    await this.start();
  }

  async kill(): Promise<void> {
    if (!this.child) return;

    const child = this.child;
    this.child = null;
    this.intentionalKill = true;

    this.rejectAllPending(new Error('Subprocess killed'));

    if (this.queryDb) {
      await this.queryDb.destroy();
      this.queryDb = null;
    }

    return new Promise<void>((resolve) => {
      const forceKillTimer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          /* already dead */
        }
        resolve();
      }, 5000);

      child.once('exit', () => {
        clearTimeout(forceKillTimer);
        resolve();
      });

      try {
        child.send({ type: 'parent:shutdown' } satisfies ParentMessage);
      } catch {
        try {
          child.kill('SIGTERM');
        } catch {
          /* already dead */
        }
      }
    });
  }

  async approveSync(ids: string[]): Promise<{ applied: boolean; error?: string }> {
    if (!this.child || this.phase !== 'waiting_for_sync') {
      return { applied: false, error: 'Not waiting for sync approval' };
    }

    this.sendToChild({ type: 'parent:sync_approve', operationIds: ids });

    const child = this.child;
    const SYNC_TIMEOUT = 30000;

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        settled = true;
        clearTimeout(timer);
        child.removeListener('message', onMessage);
        child.removeListener('exit', onExit);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        resolve({ applied: false, error: 'Sync timeout' });
      }, SYNC_TIMEOUT);

      const onMessage = (msg: ChildMessage) => {
        if (settled) return;
        if (msg.type === 'child:sync_applied') {
          cleanup();
          this.lastPendingOps = [];
          resolve({ applied: true });
        } else if (msg.type === 'child:sync_error') {
          cleanup();
          resolve({ applied: false, error: msg.error });
        }
      };

      const onExit = () => {
        if (settled) return;
        cleanup();
        resolve({ applied: false, error: 'Child process exited during sync' });
      };

      child.on('message', onMessage);
      child.on('exit', onExit);
    });
  }

  rejectSync(reason?: string): void {
    if (!this.child || this.phase !== 'waiting_for_sync') return;
    this.sendToChild({ type: 'parent:sync_reject', reason });
    this.lastPendingOps = [];
  }

  async getStatus(): Promise<ChildStatusSnapshot> {
    if (!this.child) {
      return {
        phase: this.phase,
        runtime: null,
        pendingOps: [],
        serverPort: null,
        sessionToken: null,
        error: null,
      };
    }

    const requestId = crypto.randomUUID();
    return this.sendRequest(requestId, {
      type: 'parent:get_status',
      requestId,
    }) as Promise<ChildStatusSnapshot>;
  }

  async introspect(
    type: IntrospectType,
    module?: string,
  ): Promise<{ data: unknown[]; count: number }> {
    if (!this.child || this.phase !== 'serving') {
      throw new Error('Framework not running');
    }

    const requestId = crypto.randomUUID();
    const msg: ParentMessage = { type: 'parent:introspect', requestId, resource: type, module };
    return this.sendRequest(requestId, msg) as Promise<{ data: unknown[]; count: number }>;
  }

  getPhase(): ChildPhase {
    return this.phase;
  }

  isRunning(): boolean {
    return this.child !== null && this.phase === 'serving';
  }

  isWaitingForSync(): boolean {
    return this.phase === 'waiting_for_sync';
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  getBaseUrl(): string {
    return `http://localhost:${this.serverPort ?? this.config.frameworkPort ?? 3000}`;
  }

  getProjectRoot(): string {
    return this.config.projectRoot;
  }

  getLastStatus(): RuntimeStatus | null {
    return this.lastStatus;
  }

  getPendingOps(): SerializedDdlOperation[] {
    return this.lastPendingOps;
  }

  getWarnings(): ScanWarning[] {
    return this.lastWarnings;
  }

  getQueryDb(): Kysely<unknown> | null {
    return this.queryDb;
  }

  private handleMessage(msg: ChildMessage): void {
    switch (msg.type) {
      case 'child:phase':
        this.phase = msg.phase;
        this.emit('phase', msg.phase);
        break;

      case 'child:boot_success':
        this.lastStatus = msg.status;
        this.sessionToken = msg.sessionToken;
        this.dbConfig = msg.dbConfig;
        this.lastWarnings = msg.warnings;
        this.initQueryDb(msg.dbConfig);
        if (this.bootResolve) {
          this.bootResolve();
          this.bootResolve = null;
          this.bootReject = null;
        }
        this.emit('ready', msg.status, msg.sessionToken);
        break;

      case 'child:boot_error':
        if (this.bootReject) {
          this.bootReject(new Error(msg.error));
          this.bootReject = null;
          this.bootResolve = null;
        }
        this.emit('error', msg.error, msg.phase);
        break;

      case 'child:sync_pending':
        this.lastPendingOps = msg.operations;
        this.lastStatus = msg.status;
        this.lastWarnings = msg.warnings;
        this.dbConfig = msg.dbConfig;
        this.initQueryDb(msg.dbConfig);
        if (this.bootResolve) {
          this.bootResolve();
          this.bootResolve = null;
          this.bootReject = null;
        }
        this.emit('sync_pending', msg.operations);
        break;

      case 'child:serving':
        this.serverPort = msg.port;
        this.emit('serving', msg.port);
        break;

      case 'child:status_response': {
        const pending = this.pendingRequests.get(msg.requestId);
        if (pending) {
          this.pendingRequests.delete(msg.requestId);
          clearTimeout(pending.timer);
          pending.resolve(msg.status);
        }
        break;
      }

      case 'child:introspect_response': {
        const pending = this.pendingRequests.get(msg.requestId);
        if (pending) {
          this.pendingRequests.delete(msg.requestId);
          clearTimeout(pending.timer);
          pending.resolve({ data: msg.data, count: msg.count });
        }
        break;
      }

      case 'child:introspect_error': {
        const pending = this.pendingRequests.get(msg.requestId);
        if (pending) {
          this.pendingRequests.delete(msg.requestId);
          clearTimeout(pending.timer);
          pending.reject(new Error(msg.error));
        }
        break;
      }

      case 'child:log':
        console.log(`[child:${msg.level}] ${msg.message}`);
        break;

      case 'child:sync_applied':
        this.lastPendingOps = [];
        break;

      case 'child:sync_error':
        break;
    }
  }

  private handleExit(code: number | null, signal: string | null): void {
    const wasIntentional = this.intentionalKill;
    this.child = null;
    this.phase = 'stopped';
    this.starting = false;
    this.intentionalKill = false;
    this.rejectAllPending(new Error(`Child exited: code=${code}, signal=${signal}`));

    if (this.bootReject) {
      this.bootReject(
        new Error(`Child process exited unexpectedly (code=${code}, signal=${signal})`),
      );
      this.bootReject = null;
      this.bootResolve = null;
    }

    if (!wasIntentional) {
      this.emit('exit', code, signal);
    }
  }

  private sendToChild(msg: ParentMessage): void {
    if (this.child?.connected) {
      this.child.send(msg);
    }
  }

  private sendRequest(requestId: string, msg: ParentMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('IPC request timeout'));
      }, 10000);

      this.pendingRequests.set(requestId, { resolve, reject, timer });
      this.sendToChild(msg);
    });
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pendingRequests.delete(id);
    }
  }

  private initQueryDb(config: DatabaseConfig): void {
    if (this.queryDb) {
      this.queryDb.destroy().catch(() => {});
    }

    if (config.dialect === 'sqlite') {
      const require = createRequire(import.meta.url);
      const Database = require('better-sqlite3');
      const sqliteDb = new Database(config.path);
      configurePragmas(sqliteDb);
      this.queryDb = new Kysely({ dialect: new SqliteDialect({ database: sqliteDb }) });
    } else {
      this.queryDb = new Kysely({
        dialect: new PostgresDialect({
          pool: new pg.Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            max: 1,
          }),
        }),
      });
    }
  }

  async shutdown(): Promise<void> {
    await this.kill();
  }
}
