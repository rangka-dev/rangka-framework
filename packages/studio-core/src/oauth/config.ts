export interface OAuthProviderConfig {
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  extraAuthParams?: Record<string, string>;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  anthropic: {
    clientId: 'rangka-studio-anthropic',
    authorizationUrl: 'https://console.anthropic.com/oauth/authorize',
    tokenUrl: 'https://console.anthropic.com/oauth/token',
    scopes: ['models:read', 'messages:write'],
  },
  openai: {
    clientId: 'rangka-studio-openai',
    authorizationUrl: 'https://auth.openai.com/authorize',
    tokenUrl: 'https://auth.openai.com/token',
    scopes: ['model.read', 'chat.completions.write'],
  },
  codex: {
    clientId: 'rangka-studio-codex',
    authorizationUrl: 'https://auth.openai.com/authorize',
    tokenUrl: 'https://auth.openai.com/token',
    scopes: ['model.read', 'responses.write'],
  },
  gemini: {
    clientId: 'rangka-studio-gemini',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/generative-language'],
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },
  cursor: {
    clientId: 'rangka-studio-cursor',
    authorizationUrl: 'https://cursor.sh/oauth/authorize',
    tokenUrl: 'https://cursor.sh/oauth/token',
    scopes: ['models:read', 'completions:write'],
  },
  qwen: {
    clientId: 'rangka-studio-qwen',
    authorizationUrl: 'https://account.aliyun.com/oauth2/authorize',
    tokenUrl: 'https://account.aliyun.com/oauth2/token',
    scopes: ['qwen:read', 'qwen:generate'],
  },
};
