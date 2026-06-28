import type { KnownProvider, ProviderSettings } from './protocol.js';

export const KNOWN_PROVIDERS: KnownProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'codex',
    name: 'Codex',
    type: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'openai-compatible',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    type: 'openai-compatible',
    baseUrl: 'https://api.cursor.sh/v1',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    type: 'openai-compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    requiresApiKey: true,
    supportsOAuth: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    type: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
  },
  {
    id: 'together',
    name: 'Together AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.together.xyz/v1',
    requiresApiKey: true,
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    requiresApiKey: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    type: 'openai-compatible',
    baseUrl: 'https://api.cerebras.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    type: 'openai-compatible',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    requiresApiKey: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    type: 'openai-compatible',
    baseUrl: 'https://api.perplexity.ai',
    requiresApiKey: true,
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    type: 'openai-compatible',
    baseUrl: 'https://api.x.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    type: 'openai-compatible',
    baseUrl: 'https://api.cohere.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    type: 'openai-compatible',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    type: 'openai-compatible',
    baseUrl: 'https://api.sambanova.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'hyperbolic',
    name: 'Hyperbolic',
    type: 'openai-compatible',
    baseUrl: 'https://api.hyperbolic.xyz/v1',
    requiresApiKey: true,
  },
  {
    id: 'lambda',
    name: 'Lambda AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.lambda.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'novita',
    name: 'Novita AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.novita.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    type: 'openai-compatible',
    baseUrl: 'https://api.minimax.io/v1',
    requiresApiKey: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.moonshot.cn/v1',
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'openai-compatible',
    baseUrl: 'http://localhost:11434',
    requiresApiKey: false,
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    type: 'openai-compatible',
    baseUrl: 'http://localhost:1234/v1',
    requiresApiKey: false,
  },
  { id: 'custom', name: 'Custom', type: 'openai-compatible', baseUrl: '', requiresApiKey: false },
];

export function getProvider(id: string): KnownProvider | undefined {
  return KNOWN_PROVIDERS.find((p) => p.id === id);
}

export function resolveBaseUrl(providerId: string, settings: ProviderSettings): string {
  if (settings.baseUrl) {
    return settings.baseUrl.replace(/\/+$/, '');
  }
  const known = getProvider(providerId);
  return known?.baseUrl ?? '';
}
