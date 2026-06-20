import type { PluginLifecycleEvent, LifecycleHandler } from './types.js';

export class PluginLifecycleManager {
  private handlers: Map<PluginLifecycleEvent, LifecycleHandler[]>;

  constructor(handlers?: Map<PluginLifecycleEvent, LifecycleHandler[]>) {
    this.handlers = handlers ?? new Map();
  }

  register(event: PluginLifecycleEvent, handler: LifecycleHandler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  async emit(event: PluginLifecycleEvent, ...args: unknown[]): Promise<void> {
    const list = this.handlers.get(event);
    if (!list) return;
    for (const handler of list) {
      await handler(...args);
    }
  }

  getHandlers(event: PluginLifecycleEvent): LifecycleHandler[] {
    return this.handlers.get(event) ?? [];
  }
}
