import type { ServiceDefinition, ServiceInstance, ServiceContext } from './types.js';

// --- Error types ---

export class ServiceCircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular service dependency detected: ${cycle.join(' → ')}`);
    this.name = 'ServiceCircularDependencyError';
  }
}

export class ServiceNotFoundError extends Error {
  constructor(public readonly serviceName: string) {
    super(`Service "${serviceName}" is not registered`);
    this.name = 'ServiceNotFoundError';
  }
}

export class DuplicateServiceError extends Error {
  constructor(public readonly serviceName: string) {
    super(`Service "${serviceName}" is already registered`);
    this.name = 'DuplicateServiceError';
  }
}

// --- Registry ---

/**
 * Manages service definitions and lazily-created singleton instances.
 * Services declare dependencies by name; the registry resolves them on first access.
 */
export class ServiceRegistry {
  /** Registered service blueprints (name -> definition). */
  private definitions = new Map<string, ServiceDefinition>();

  /** Cached singleton instances, created on first `get()` call. */
  private instances = new Map<string, ServiceInstance>();

  /** Tracks which services are mid-resolution to detect runtime cycles. */
  private resolving = new Set<string>();

  // --- Registration & lookup ---

  /** Register a service definition. Throws if the name is already taken. */
  register(definition: ServiceDefinition): void {
    if (this.definitions.has(definition.name)) {
      throw new DuplicateServiceError(definition.name);
    }
    this.definitions.set(definition.name, definition);
  }

  /** Check whether a service name has been registered. */
  has(name: string): boolean {
    return this.definitions.has(name);
  }

  /** Return the raw definition for a service, or undefined if not registered. */
  getDefinition(name: string): ServiceDefinition | undefined {
    return this.definitions.get(name);
  }

  /** Return all registered definitions. */
  getAll(): ServiceDefinition[] {
    return [...this.definitions.values()];
  }

  // --- Dependency validation ---

  /**
   * Walk the full dependency graph up-front and throw if any cycle exists.
   * Uses depth-first traversal with a recursion stack to detect back-edges.
   */
  detectCircularDependencies(): void {
    const fullyVisited = new Set<string>();
    const currentPath = new Set<string>();

    const visit = (serviceName: string, ancestors: string[]): void => {
      // Back-edge: we've looped back to a node already on the current path.
      if (currentPath.has(serviceName)) {
        const cycleStart = ancestors.indexOf(serviceName);
        throw new ServiceCircularDependencyError([...ancestors.slice(cycleStart), serviceName]);
      }

      // Already fully explored from a previous traversal root -- skip.
      if (fullyVisited.has(serviceName)) return;

      currentPath.add(serviceName);
      ancestors.push(serviceName);

      const definition = this.definitions.get(serviceName);
      if (definition?.deps) {
        for (const dependency of definition.deps) {
          visit(dependency, ancestors);
        }
      }

      ancestors.pop();
      currentPath.delete(serviceName);
      fullyVisited.add(serviceName);
    };

    for (const serviceName of this.definitions.keys()) {
      visit(serviceName, []);
    }
  }

  // --- Resolution ---

  /**
   * Resolve a service by name: return the cached instance or create it via its factory.
   * Dependencies are resolved recursively through the same mechanism.
   */
  get(name: string, baseContext: Omit<ServiceContext, 'service'>): ServiceInstance {
    // Return cached singleton if already instantiated.
    const cached = this.instances.get(name);
    if (cached) return cached;

    const definition = this.definitions.get(name);
    if (!definition) {
      throw new ServiceNotFoundError(name);
    }

    // Guard against runtime circular resolution (e.g. A -> B -> A).
    if (this.resolving.has(name)) {
      throw new ServiceCircularDependencyError([...this.resolving, name]);
    }

    this.resolving.add(name);
    try {
      const instance = this.createInstance(definition, baseContext);
      this.instances.set(name, instance);
      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }

  /** Discard all cached instances (definitions remain registered). */
  reset(): void {
    this.instances.clear();
  }

  // --- Private helpers ---

  /** Invoke a service factory with a context that can resolve sibling services. */
  private createInstance(
    definition: ServiceDefinition,
    baseContext: Omit<ServiceContext, 'service'>,
  ): ServiceInstance {
    const context: ServiceContext = {
      ...baseContext,
      service: (dependencyName: string) => this.get(dependencyName, baseContext),
    };
    return definition.factory(context);
  }
}
