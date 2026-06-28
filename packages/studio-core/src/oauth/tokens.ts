import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}

function getTokensDir(): string {
  return path.join(os.homedir(), '.rangka');
}

function getTokensFile(): string {
  return path.join(getTokensDir(), 'tokens.json');
}

export function loadTokens(): Record<string, OAuthTokens> {
  try {
    const tokensFile = getTokensFile();
    if (!fs.existsSync(tokensFile)) return {};
    const raw = fs.readFileSync(tokensFile, 'utf-8');
    return JSON.parse(raw) as Record<string, OAuthTokens>;
  } catch {
    return {};
  }
}

export function saveTokens(tokens: Record<string, OAuthTokens>): void {
  const tokensDir = getTokensDir();
  const tokensFile = getTokensFile();
  if (!fs.existsSync(tokensDir)) {
    fs.mkdirSync(tokensDir, { recursive: true });
  }
  fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2), 'utf-8');
  fs.chmodSync(tokensFile, 0o600);
}

export function getProviderTokens(providerId: string): OAuthTokens | null {
  const tokens = loadTokens();
  return tokens[providerId] ?? null;
}

export function setProviderTokens(providerId: string, providerTokens: OAuthTokens): void {
  const tokens = loadTokens();
  tokens[providerId] = providerTokens;
  saveTokens(tokens);
}

export function clearProviderTokens(providerId: string): void {
  const tokens = loadTokens();
  delete tokens[providerId];
  saveTokens(tokens);
}
