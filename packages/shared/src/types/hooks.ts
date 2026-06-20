import type { FrameworkContext } from './context.js';

export type HookDocument = Record<string, unknown>;

export type ValidateHook = (doc: HookDocument) => void;
export type BeforeHook = (doc: HookDocument, ctx: FrameworkContext) => Promise<void>;
export type AfterHook = (doc: HookDocument, ctx: FrameworkContext) => Promise<void>;

export interface HooksConfig {
  validate?: ValidateHook;
  beforeSave?: BeforeHook;
  afterSave?: AfterHook;
  beforeCreate?: BeforeHook;
  afterCreate?: AfterHook;
  beforeUpdate?: BeforeHook;
  afterUpdate?: AfterHook;
  beforeDelete?: BeforeHook;
  afterDelete?: AfterHook;
}
