import { describe, it, expect } from 'vitest';
import { KNOWN_PROVIDERS, getProvider, resolveBaseUrl } from '../providers.js';
import type { ProviderSettings } from '../protocol.js';

describe('providers', () => {
  describe('KNOWN_PROVIDERS', () => {
    it('contains exactly 27 providers', () => {
      expect(KNOWN_PROVIDERS).toHaveLength(27);
    });

    it('has unique ids', () => {
      const ids = KNOWN_PROVIDERS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('anthropic is typed as anthropic', () => {
      const anthropic = KNOWN_PROVIDERS.find((p) => p.id === 'anthropic');
      expect(anthropic).toBeDefined();
      expect(anthropic!.type).toBe('anthropic');
    });

    it('all non-anthropic providers are openai-compatible', () => {
      const others = KNOWN_PROVIDERS.filter((p) => p.id !== 'anthropic');
      for (const p of others) {
        expect(p.type).toBe('openai-compatible');
      }
    });

    it('local providers do not require API key', () => {
      const ollama = KNOWN_PROVIDERS.find((p) => p.id === 'ollama');
      const lmStudio = KNOWN_PROVIDERS.find((p) => p.id === 'lm-studio');
      const custom = KNOWN_PROVIDERS.find((p) => p.id === 'custom');
      expect(ollama!.requiresApiKey).toBe(false);
      expect(lmStudio!.requiresApiKey).toBe(false);
      expect(custom!.requiresApiKey).toBe(false);
    });
  });

  describe('getProvider', () => {
    it('returns provider by id', () => {
      const p = getProvider('openai');
      expect(p).toBeDefined();
      expect(p!.name).toBe('OpenAI');
    });

    it('returns undefined for unknown id', () => {
      expect(getProvider('nonexistent')).toBeUndefined();
    });
  });

  describe('resolveBaseUrl', () => {
    it('returns known provider default when no override', () => {
      const settings: ProviderSettings = {};
      const url = resolveBaseUrl('anthropic', settings);
      expect(url).toBe('https://api.anthropic.com');
    });

    it('returns settings override when provided', () => {
      const settings: ProviderSettings = { baseUrl: 'https://my-proxy.com/v1' };
      const url = resolveBaseUrl('openai', settings);
      expect(url).toBe('https://my-proxy.com/v1');
    });

    it('returns empty string for unknown provider with no override', () => {
      const settings: ProviderSettings = {};
      const url = resolveBaseUrl('unknown-provider', settings);
      expect(url).toBe('');
    });

    it('strips trailing slashes from override', () => {
      const settings: ProviderSettings = { baseUrl: 'https://my-proxy.com/v1/' };
      const url = resolveBaseUrl('openai', settings);
      expect(url).toBe('https://my-proxy.com/v1');
    });
  });
});
