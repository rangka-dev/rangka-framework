import type {
  HooksConfig,
  HookDocument,
  ValidateHook,
  BeforeHook,
  AfterHook,
  FrameworkContext,
} from '@rangka/shared';

export type HookLifecycle =
  | 'validate'
  | 'beforeSave'
  | 'afterSave'
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete';

export interface HookEntry {
  hooks: HooksConfig;
  source: string;
}

export interface HookChain {
  entries: HookEntry[];
}

export type HookContext = FrameworkContext;

export type { HooksConfig, HookDocument, ValidateHook, BeforeHook, AfterHook };
