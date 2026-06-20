export interface ServerConfig {
  port?: number;
  host?: string;
  logger?: boolean | { level: string };
  requestIdHeader?: string;
  docs?: boolean;
  tags?: Array<{ name: string; description?: string }>;
}

export interface ApiDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  roles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (request: any, reply: any) => Promise<unknown>;
}
