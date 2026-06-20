import type { FrameworkContext, ServiceInstance } from './context.js';

export interface ServiceConfig {
  name: string;
  deps?: string[];
  factory: (ctx: FrameworkContext) => ServiceInstance;
}
