export interface FixtureRef {
  ref: string;
  key: string;
}

export interface FixtureConfig {
  model: string;
  key: string;
  variant?: string;
  depends?: string[];
  records: Record<string, unknown>[];
}
