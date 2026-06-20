import type { FrameworkContext, ServiceInstance } from '@rangka/shared';

export interface ServiceDependency {
  name: string;
}

export interface ServiceDefinition {
  name: string;
  deps?: string[];
  factory: ServiceFactory;
}

export type ServiceFactory = (ctx: ServiceContext) => ServiceInstance;

export type { ServiceInstance };

export interface ServiceContext {
  db: FrameworkContext['db'];
  schema: FrameworkContext['schema'];
  enqueue: FrameworkContext['enqueue'];
  events: FrameworkContext['events'];
  config: FrameworkContext['config'];
  models?: FrameworkContext['models'];
  auth?: FrameworkContext['auth'];
  scope?: FrameworkContext['scope'];
  service: (name: string) => ServiceInstance;
}
