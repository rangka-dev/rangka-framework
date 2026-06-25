import type { Kysely } from 'kysely';
import { enqueue } from '../jobs/enqueue.js';
import type { EventListener } from './types.js';
import type { Dialect } from '../db/client.js';

/**
 * Simple pub/sub event bus that supports two dispatch modes:
 * - sync: invoke listeners directly in sequence
 * - async (default): enqueue the event as a background job via the database
 *
 * When dialect is 'sqlite', all events dispatch synchronously (no job queue).
 */
export class EventBus {
  private readonly listeners: Map<string, EventListener[]> = new Map();
  private db: Kysely<unknown> | null = null;
  private _dialect: Dialect = 'postgres';

  /** Set the dialect to control dispatch behavior. */
  setDialect(dialect: Dialect): void {
    this._dialect = dialect;
  }

  get dialect(): Dialect {
    return this._dialect;
  }

  /** Provide the database connection used for async event dispatch. */
  setDb(db: Kysely<unknown>): void {
    this.db = db;
  }

  /** Register a listener for a specific event. */
  on(event: string, handler: (payload: unknown) => Promise<void>, source?: string): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ event, handler, source });
  }

  /**
   * Emit an event. By default, the event is enqueued as a background job.
   * Pass { sync: true } to invoke listeners immediately in sequence.
   * On SQLite, all events always dispatch synchronously.
   */
  async emit(event: string, payload: unknown, options?: { sync?: boolean }): Promise<void> {
    if (options?.sync || this._dialect === 'sqlite') {
      await this.dispatchSync(event, payload);
    } else {
      await this.dispatchAsync(event, payload);
    }
  }

  /**
   * Emit an event within an existing database transaction.
   * Sync mode invokes listeners directly; async mode enqueues via the transaction.
   * On SQLite, always dispatches synchronously.
   */
  async emitWithTrx(
    event: string,
    payload: unknown,
    trx: Kysely<unknown>,
    options?: { sync?: boolean },
  ): Promise<void> {
    if (options?.sync || this._dialect === 'sqlite') {
      await this.dispatchSync(event, payload);
    } else {
      await enqueue(trx, `__event:${event}`, payload);
    }
  }

  /** Return all listeners registered for a given event. */
  getListeners(event: string): EventListener[] {
    return this.listeners.get(event) ?? [];
  }

  /** Return the names of all events that have at least one listener. */
  getAllEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  /** Check whether any listeners are registered for a given event. */
  hasListeners(event: string): boolean {
    const eventListeners = this.listeners.get(event);
    return !!eventListeners && eventListeners.length > 0;
  }

  // --- Private dispatch methods ---

  /** Invoke all listeners for an event synchronously, one after another. */
  private async dispatchSync(event: string, payload: unknown): Promise<void> {
    const eventListeners = this.listeners.get(event) ?? [];
    for (const listener of eventListeners) {
      await listener.handler(payload);
    }
  }

  /** Enqueue the event as a background job via the database. */
  private async dispatchAsync(event: string, payload: unknown): Promise<void> {
    if (!this.db) {
      throw new Error('EventBus: database not set. Call setDb() before emitting async events.');
    }
    await enqueue(this.db, `__event:${event}`, payload);
  }
}
