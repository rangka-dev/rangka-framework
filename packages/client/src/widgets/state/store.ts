export type Subscriber = (value: unknown) => void;
export type StoreListener = () => void;

export class StateStore {
  private state: Map<string, unknown> = new Map();
  private subscribers: Map<string, Set<Subscriber>> = new Map();
  private listeners: Set<StoreListener> = new Set();
  private version = 0;

  get(key: string): unknown {
    return this.state.get(key);
  }

  set(key: string, value: unknown): void {
    const prev = this.state.get(key);
    if (prev === value) return;
    this.state.set(key, value);
    this.version++;
    this.notify(key, value);
    this.notifyListeners();
  }

  setMany(entries: Record<string, unknown>): void {
    const changed: [string, unknown][] = [];
    for (const [key, value] of Object.entries(entries)) {
      const prev = this.state.get(key);
      if (prev !== value) {
        this.state.set(key, value);
        changed.push([key, value]);
      }
    }
    if (changed.length > 0) {
      this.version++;
      for (const [key, value] of changed) {
        this.notify(key, value);
      }
      this.notifyListeners();
    }
  }

  subscribe(key: string, fn: Subscriber): () => void {
    let subs = this.subscribers.get(key);
    if (!subs) {
      subs = new Set();
      this.subscribers.set(key, subs);
    }
    subs.add(fn);
    return () => {
      subs!.delete(fn);
      if (subs!.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  onchange(fn: StoreListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getVersion(): number {
    return this.version;
  }

  clear(): void {
    this.state.clear();
    this.subscribers.clear();
    this.listeners.clear();
    this.version = 0;
  }

  reset(): void {
    if (this.state.size === 0) return;
    this.state.clear();
    this.version++;
    this.notifyListeners();
  }

  keys(): string[] {
    return [...this.state.keys()];
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.state);
  }

  private notify(key: string, value: unknown): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      for (const fn of subs) {
        fn(value);
      }
    }
  }

  private notifyListeners(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }
}
