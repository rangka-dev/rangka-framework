export interface EventListener {
  event: string;
  handler: (payload: unknown) => Promise<void>;
  source?: string;
}

export interface EventBusConfig {
  sync?: boolean;
}
