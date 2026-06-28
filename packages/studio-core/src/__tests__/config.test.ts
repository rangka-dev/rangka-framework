import { describe, it, expect } from 'vitest';
import { migrateConfig } from '../config.js';
import type { StudioConfig } from '../protocol.js';

describe('config', () => {
  describe('migrateConfig', () => {
    it('migrates old anthropic config to new format', () => {
      const old = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test-key',
        model: 'claude-sonnet-4-20250514',
        selectedModels: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'],
        baseUrl: 'https://custom-proxy.com',
      };

      const result = migrateConfig(old);

      expect(result).toEqual({
        activeProvider: 'anthropic',
        providers: {
          anthropic: {
            apiKey: 'sk-ant-test-key',
            model: 'claude-sonnet-4-20250514',
            selectedModels: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'],
            baseUrl: 'https://custom-proxy.com',
          },
        },
      });
    });

    it('migrates old openai config to new format', () => {
      const old = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4o',
        selectedModels: ['gpt-4o'],
      };

      const result = migrateConfig(old);

      expect(result).toEqual({
        activeProvider: 'openai',
        providers: {
          openai: {
            apiKey: 'sk-test-key',
            model: 'gpt-4o',
            selectedModels: ['gpt-4o'],
          },
        },
      });
    });

    it('returns new format unchanged', () => {
      const newConfig: StudioConfig = {
        activeProvider: 'groq',
        providers: {
          groq: { apiKey: 'gsk-test', model: 'llama-3.3-70b' },
        },
      };

      const result = migrateConfig(newConfig);
      expect(result).toEqual(newConfig);
    });

    it('returns default config for null/undefined', () => {
      const result = migrateConfig(null);
      expect(result).toEqual({
        activeProvider: 'anthropic',
        providers: {},
      });
    });

    it('returns default config for non-object', () => {
      const result = migrateConfig('invalid');
      expect(result).toEqual({
        activeProvider: 'anthropic',
        providers: {},
      });
    });

    it('does not include baseUrl in migrated settings if not set', () => {
      const old = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test-key',
      };

      const result = migrateConfig(old);
      expect(result.providers.anthropic?.baseUrl).toBeUndefined();
    });
  });
});
