import * as crypto from 'node:crypto';
import { OAUTH_PROVIDERS } from './config.js';
import { getProviderTokens, setProviderTokens } from './tokens.js';
import type { OAuthTokens } from './tokens.js';

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export interface OAuthFlowState {
  providerId: string;
  codeVerifier: string;
  state: string;
  redirectUri: string;
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl(
  providerId: string,
  redirectUri: string,
  overrides?: { oauthClientId?: string },
): { url: string; flow: OAuthFlowState } {
  const config = OAUTH_PROVIDERS[providerId];
  if (!config) {
    throw new Error(`No OAuth config for provider: ${providerId}`);
  }

  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex');

  const clientId = overrides?.oauthClientId ?? config.clientId;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    scope: config.scopes.join(' '),
  });

  if (config.extraAuthParams) {
    for (const [key, value] of Object.entries(config.extraAuthParams)) {
      params.set(key, value);
    }
  }

  const url = `${config.authorizationUrl}?${params.toString()}`;

  return {
    url,
    flow: { providerId, codeVerifier, state, redirectUri },
  };
}

export async function exchangeCode(
  providerId: string,
  code: string,
  flow: OAuthFlowState,
): Promise<OAuthTokens> {
  const config = OAUTH_PROVIDERS[providerId];
  if (!config) {
    throw new Error(`No OAuth config for provider: ${providerId}`);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: flow.codeVerifier,
    redirect_uri: flow.redirectUri,
    client_id: config.clientId,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; error_description?: string };
    throw new Error(
      `Token exchange failed: ${error.error_description ?? error.error ?? 'Unknown error'}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type,
    scope: data.scope,
    idToken: data.id_token,
  };
}

export async function refreshAccessToken(
  providerId: string,
  refreshToken: string,
): Promise<OAuthTokens> {
  const config = OAUTH_PROVIDERS[providerId];
  if (!config) {
    throw new Error(`No OAuth config for provider: ${providerId}`);
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; error_description?: string };
    throw new Error(
      `Token refresh failed: ${error.error_description ?? error.error ?? 'Unknown error'}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

export async function getValidAccessToken(providerId: string): Promise<string | null> {
  const tokens = getProviderTokens(providerId);
  if (!tokens) return null;

  // No expiry info — assume valid
  if (!tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Token is still valid (outside buffer window)
  if (Date.now() < tokens.expiresAt - EXPIRY_BUFFER_MS) {
    return tokens.accessToken;
  }

  // Token expired or within buffer — try refresh
  if (tokens.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(providerId, tokens.refreshToken);
      setProviderTokens(providerId, refreshed);
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return null;
}
