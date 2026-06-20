import type { HooksConfig } from '@rangka/shared';
import type { HookChain } from './types.js';

export class HookRegistry {
  private chains: Map<string, HookChain> = new Map();

  register(model: string, hooks: HooksConfig, source: string): void {
    const chain = this.chains.get(model) ?? { entries: [] };
    chain.entries.push({ hooks, source });
    this.chains.set(model, chain);
  }

  getChain(model: string): HookChain | undefined {
    return this.chains.get(model);
  }

  hasHooks(model: string): boolean {
    return this.chains.has(model);
  }
}
