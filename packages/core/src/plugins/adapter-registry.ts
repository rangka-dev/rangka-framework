import type { DataAdapter } from './types.js';

export class AdapterNotFoundError extends Error {
  constructor(public readonly adapterName: string) {
    super(`Adapter "${adapterName}" is not registered`);
    this.name = 'AdapterNotFoundError';
  }
}

export class DuplicateAdapterError extends Error {
  constructor(public readonly adapterName: string) {
    super(`Adapter "${adapterName}" is already registered`);
    this.name = 'DuplicateAdapterError';
  }
}

export class AdapterRegistry {
  private adapters = new Map<string, DataAdapter>();

  register(name: string, adapter: DataAdapter): void {
    if (this.adapters.has(name)) {
      throw new DuplicateAdapterError(name);
    }
    this.adapters.set(name, adapter);
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  get(name: string): DataAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new AdapterNotFoundError(name);
    }
    return adapter;
  }

  getAll(): Array<{ name: string; adapter: DataAdapter }> {
    return [...this.adapters.entries()].map(([name, adapter]) => ({ name, adapter }));
  }
}
