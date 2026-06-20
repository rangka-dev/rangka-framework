export interface FixtureRef {
  ref: string;
  key: string;
}

export interface FixtureDefinition {
  model: string;
  key: string;
  variant?: string;
  depends?: string[];
  records: Array<Record<string, unknown>>;
}

export type FixtureStatus = 'pending' | 'loaded' | 'skipped';

export interface FixtureRecord {
  model: string;
  key: string;
  keyValue: string;
  fixtureHash: string;
  status: FixtureStatus;
}

export interface RegisteredFixture {
  model: string;
  definition: FixtureDefinition;
}

export interface FixtureLoadResult {
  inserted: number;
  skipped: number;
  total: number;
}
