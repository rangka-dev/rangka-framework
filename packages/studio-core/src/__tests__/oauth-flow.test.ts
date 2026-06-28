import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from 'node:crypto';

vi.mock('../oauth/tokens.js', () => ({
  getProviderTokens: vi.fn(),
  setProviderTokens: vi.fn(),
  clearProviderTokens: vi.fn(),
}));

describe('oauth/flow', () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePKCE', () => {
    it('generates a code verifier of 43-128 characters', async () => {
      const { generatePKCE } = await import('../oauth/flow.js');
      const { codeVerifier } = generatePKCE();
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
    });

    it('generates a base64url-encoded code challenge', async () => {
      const { generatePKCE } = await import('../oauth/flow.js');
      const { codeChallenge } = generatePKCE();
      // base64url: no +, /, or = characters
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('code challenge is SHA-256 of verifier', async () => {
      const { generatePKCE } = await import('../oauth/flow.js');
      const { codeVerifier, codeChallenge } = generatePKCE();
      const expected = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      expect(codeChallenge).toBe(expected);
    });

    it('generates unique values on each call', async () => {
      const { generatePKCE } = await import('../oauth/flow.js');
      const a = generatePKCE();
      const b = generatePKCE();
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
      expect(a.codeChallenge).not.toBe(b.codeChallenge);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('returns a valid URL with PKCE params for anthropic', async () => {
      const { buildAuthorizationUrl } = await import('../oauth/flow.js');
      const redirectUri = 'http://localhost:4800/oauth/callback';
      const { url, flow } = buildAuthorizationUrl('anthropic', redirectUri);

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://console.anthropic.com');
      expect(parsed.pathname).toBe('/oauth/authorize');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('rangka-studio-anthropic');
      expect(parsed.searchParams.get('redirect_uri')).toBe(redirectUri);
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('code_challenge')).toBeTruthy();
      expect(parsed.searchParams.get('state')).toBeTruthy();
      expect(parsed.searchParams.get('scope')).toBe('models:read messages:write');

      expect(flow.providerId).toBe('anthropic');
      expect(flow.codeVerifier).toBeTruthy();
      expect(flow.state).toBe(parsed.searchParams.get('state'));
      expect(flow.redirectUri).toBe(redirectUri);
    });

    it('includes extra auth params for gemini', async () => {
      const { buildAuthorizationUrl } = await import('../oauth/flow.js');
      const { url } = buildAuthorizationUrl('gemini', 'http://localhost:4800/oauth/callback');

      const parsed = new URL(url);
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('prompt')).toBe('consent');
    });

    it('uses custom clientId from overrides when provided', async () => {
      const { buildAuthorizationUrl } = await import('../oauth/flow.js');
      const { url } = buildAuthorizationUrl('anthropic', 'http://localhost:4800/oauth/callback', {
        oauthClientId: 'my-custom-client',
      });

      const parsed = new URL(url);
      expect(parsed.searchParams.get('client_id')).toBe('my-custom-client');
    });

    it('throws for unknown provider', async () => {
      const { buildAuthorizationUrl } = await import('../oauth/flow.js');
      expect(() =>
        buildAuthorizationUrl('unknown-provider', 'http://localhost:4800/oauth/callback'),
      ).toThrow('No OAuth config for provider: unknown-provider');
    });
  });

  describe('exchangeCode', () => {
    it('exchanges authorization code for tokens', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'models:read messages:write',
      };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { exchangeCode } = await import('../oauth/flow.js');
      const flow = {
        providerId: 'anthropic',
        codeVerifier: 'test-verifier-string-that-is-long-enough-for-pkce',
        state: 'test-state',
        redirectUri: 'http://localhost:4800/oauth/callback',
      };

      const tokens = await exchangeCode('anthropic', 'auth-code-123', flow);

      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.refreshToken).toBe('new-refresh-token');
      expect(tokens.tokenType).toBe('Bearer');
      expect(tokens.expiresAt).toBeGreaterThan(Date.now());

      // Verify fetch was called with correct params
      const [url, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe('https://console.anthropic.com/oauth/token');
      expect(options?.method).toBe('POST');
      const body = new URLSearchParams(options?.body as string);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('code_verifier')).toBe(flow.codeVerifier);
      expect(body.get('redirect_uri')).toBe(flow.redirectUri);
      expect(body.get('client_id')).toBe('rangka-studio-anthropic');
    });

    it('throws on non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant', error_description: 'Code expired' }),
      } as Response);

      const { exchangeCode } = await import('../oauth/flow.js');
      const flow = {
        providerId: 'openai',
        codeVerifier: 'test-verifier',
        state: 'test-state',
        redirectUri: 'http://localhost:4800/oauth/callback',
      };

      await expect(exchangeCode('openai', 'bad-code', flow)).rejects.toThrow(
        'Token exchange failed: Code expired',
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('refreshes token using refresh_token grant', async () => {
      const mockResponse = {
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh',
        expires_in: 7200,
        token_type: 'Bearer',
      };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { refreshAccessToken } = await import('../oauth/flow.js');
      const tokens = await refreshAccessToken('anthropic', 'old-refresh-token');

      expect(tokens.accessToken).toBe('refreshed-token');
      expect(tokens.refreshToken).toBe('new-refresh');

      const [url, options] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe('https://console.anthropic.com/oauth/token');
      const body = new URLSearchParams(options?.body as string);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('old-refresh-token');
      expect(body.get('client_id')).toBe('rangka-studio-anthropic');
    });

    it('throws on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_grant', error_description: 'Token revoked' }),
      } as Response);

      const { refreshAccessToken } = await import('../oauth/flow.js');
      await expect(refreshAccessToken('openai', 'revoked-token')).rejects.toThrow(
        'Token refresh failed: Token revoked',
      );
    });
  });

  describe('getValidAccessToken', () => {
    it('returns null when no tokens stored', async () => {
      const { getProviderTokens } = await import('../oauth/tokens.js');
      vi.mocked(getProviderTokens).mockReturnValue(null);

      const { getValidAccessToken } = await import('../oauth/flow.js');
      const token = await getValidAccessToken('anthropic');
      expect(token).toBeNull();
    });

    it('returns access token when not expired', async () => {
      const { getProviderTokens } = await import('../oauth/tokens.js');
      vi.mocked(getProviderTokens).mockReturnValue({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
      });

      const { getValidAccessToken } = await import('../oauth/flow.js');
      const token = await getValidAccessToken('anthropic');
      expect(token).toBe('valid-token');
    });

    it('refreshes token when within 5 minute buffer', async () => {
      const { getProviderTokens, setProviderTokens } = await import('../oauth/tokens.js');
      vi.mocked(getProviderTokens).mockReturnValue({
        accessToken: 'expiring-token',
        refreshToken: 'my-refresh',
        expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes from now (within 5min buffer)
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'fresh-token',
          refresh_token: 'fresh-refresh',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      } as Response);

      const { getValidAccessToken } = await import('../oauth/flow.js');
      const token = await getValidAccessToken('anthropic');
      expect(token).toBe('fresh-token');
      expect(vi.mocked(setProviderTokens)).toHaveBeenCalled();
    });

    it('returns access token when no expiresAt is set', async () => {
      const { getProviderTokens } = await import('../oauth/tokens.js');
      vi.mocked(getProviderTokens).mockReturnValue({
        accessToken: 'no-expiry-token',
      });

      const { getValidAccessToken } = await import('../oauth/flow.js');
      const token = await getValidAccessToken('anthropic');
      expect(token).toBe('no-expiry-token');
    });

    it('returns null when expired and no refresh token', async () => {
      const { getProviderTokens } = await import('../oauth/tokens.js');
      vi.mocked(getProviderTokens).mockReturnValue({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // already expired
      });

      const { getValidAccessToken } = await import('../oauth/flow.js');
      const token = await getValidAccessToken('anthropic');
      expect(token).toBeNull();
    });
  });
});
