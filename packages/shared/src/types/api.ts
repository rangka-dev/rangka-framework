import type { FrameworkContext } from './context.js';

export interface ApiRequest {
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  params: Record<string, string>;
}

export interface ApiEndpoint {
  allowed?: string[];
  handler: (req: ApiRequest, ctx: FrameworkContext) => unknown | Promise<unknown>;
}

export type ApiConfig = Record<string, ApiEndpoint>;

export interface ApiDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  roles?: string[];
  handler: (req: ApiRequest, ctx: FrameworkContext) => unknown | Promise<unknown>;
}
