import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModelsForProvider } from '../server.js';
import { getProvider } from '../providers.js';
import type { ProviderSettings } from '../protocol.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchModelsForProvider', () => {
  it('fetches Anthropic models with correct headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4' },
          { id: 'claude-haiku-4-20250514', display_name: 'Claude Haiku 4' },
        ],
      }),
    });

    const provider = getProvider('anthropic')!;
    const settings: ProviderSettings = { apiKey: 'sk-ant-test' };
    const result = await fetchModelsForProvider(
      'anthropic',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': 'sk-ant-test', 'anthropic-version': '2023-06-01' },
    });
    expect(result.models).toHaveLength(2);
    expect(result.models[0]).toEqual({
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
    });
  });

  it('fetches OpenAI-compatible models with Bearer token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        ],
      }),
    });

    const provider = getProvider('openai')!;
    const settings: ProviderSettings = { apiKey: 'sk-test' };
    const result = await fetchModelsForProvider(
      'openai',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
      headers: { Authorization: 'Bearer sk-test' },
    });
    expect(result.models).toHaveLength(2);
    expect(result.models[0].provider).toBe('openai');
  });

  it('fetches Ollama models via /api/tags', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: 'llama3:latest' }, { name: 'codellama:7b' }],
      }),
    });

    const provider = getProvider('ollama')!;
    const settings: ProviderSettings = {};
    const result = await fetchModelsForProvider(
      'ollama',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    expect(result.models).toHaveLength(2);
    expect(result.models[0]).toEqual({
      id: 'llama3:latest',
      name: 'llama3:latest',
      provider: 'ollama',
    });
  });

  it('skips auth header for Ollama (no headers arg)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: 'llama3:latest' }],
      }),
    });

    const provider = getProvider('ollama')!;
    const settings: ProviderSettings = {};
    await fetchModelsForProvider(
      'ollama',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    // Only one argument — no headers object
    expect(mockFetch.mock.calls[0]).toHaveLength(1);
  });

  it('uses settings baseUrl override', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const provider = getProvider('openai')!;
    const settings: ProviderSettings = {
      apiKey: 'sk-test',
      baseUrl: 'https://my-proxy.example.com/v1',
    };
    await fetchModelsForProvider(
      'openai',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://my-proxy.example.com/v1/models',
      expect.any(Object),
    );
  });

  it('returns error on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const provider = getProvider('openai')!;
    const settings: ProviderSettings = { apiKey: 'bad-key' };
    const result = await fetchModelsForProvider(
      'openai',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(result.models).toHaveLength(0);
    expect(result.error).toContain('401');
  });

  it('returns error on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const provider = getProvider('ollama')!;
    const settings: ProviderSettings = {};
    const result = await fetchModelsForProvider(
      'ollama',
      provider,
      settings,
      mockFetch as unknown as typeof fetch,
    );

    expect(result.models).toHaveLength(0);
    expect(result.error).toBe('ECONNREFUSED');
  });
});
