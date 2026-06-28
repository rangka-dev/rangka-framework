import type {
  AppConfig,
  ModelConfig,
  ExtensionConfig,
  HooksConfig,
  RolesConfig,
  JobConfig,
  PageDefinition,
  WidgetDefinitionMeta,
} from '@rangka/shared';
import type { ApiDefinition } from '../api/types.js';
import type { ServiceDefinition } from '../services/types.js';
import type { FixtureDefinition } from '../fixtures/types.js';

export interface RangkaPackageInfo {
  packageName: string;
  path: string;
  rangka: {
    type: 'app';
    entrypoint: string;
  };
}

export interface DiscoveredApp {
  packageInfo: RangkaPackageInfo;
  config: AppConfig;
  schemas: Array<{ app: string; schema: ModelConfig; file?: string }>;
  extensions: Array<{ target: string; config: ExtensionConfig }>;
  hooks?: Array<{ model: string; hooks: HooksConfig; file?: string }>;
  roles?: Array<{ config: RolesConfig; app: string }>;
  jobs?: Array<{ name: string; config: JobConfig; file?: string }>;
  services?: Array<ServiceDefinition & { file?: string }>;
  apiDefinitions?: ApiDefinition[];
  fixtures?: Array<FixtureDefinition & { file?: string }>;
  pages?: Array<{ app: string; page: PageDefinition; file?: string }>;
  widgets?: WidgetDefinitionMeta[];
}

export interface DiscoverySource {
  findRangkaPackages(): Promise<RangkaPackageInfo[]>;
}

export class SchemaConflictError extends Error {
  constructor(
    public readonly model: string,
    public readonly field: string,
    public readonly sourceA: string,
    public readonly sourceB: string,
  ) {
    super(
      `Schema conflict on model "${model}", field "${field}": declared by both "${sourceA}" and "${sourceB}"`,
    );
    this.name = 'SchemaConflictError';
  }
}

export class MissingDependencyError extends Error {
  constructor(
    public readonly app: string,
    public readonly missingDep: string,
  ) {
    super(`App "${app}" depends on "${missingDep}", which was not found in discovered packages`);
    this.name = 'MissingDependencyError';
  }
}

export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`);
    this.name = 'CircularDependencyError';
  }
}
